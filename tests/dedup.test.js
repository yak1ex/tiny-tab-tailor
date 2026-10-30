"use strict";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldIgnoreUrl,
  groupTabsByUrl,
  findDuplicates,
  collectRemovals,
  keeperForUrl,
} from "../src/dedup.js";

test("shouldIgnoreUrl ignores missing, invalid, and privileged urls", () => {
  assert.equal(shouldIgnoreUrl(undefined), true);
  assert.equal(shouldIgnoreUrl(""), true);
  assert.equal(shouldIgnoreUrl("chrome://settings"), true);
  assert.equal(shouldIgnoreUrl("chrome-extension://abc/index.html"), true);
  assert.equal(shouldIgnoreUrl("about:blank"), true);
  assert.equal(shouldIgnoreUrl("not a url"), true);
});

test("shouldIgnoreUrl keeps http and https urls", () => {
  assert.equal(shouldIgnoreUrl("https://example.com/a"), false);
  assert.equal(shouldIgnoreUrl("http://example.com"), false);
});

test("groupTabsByUrl groups non-ignored urls only", () => {
  const tabs = [
    { id: 1, url: "https://example.com/a" },
    { id: 2, url: "https://example.com/a" },
    { id: 3, url: "https://example.com/b" },
    { id: 4, url: "chrome://newtab" },
    { id: 5 },
  ];
  const groups = groupTabsByUrl(tabs);
  assert.equal(groups.size, 2);
  assert.equal(groups.get("https://example.com/a").length, 2);
  assert.equal(groups.has("chrome://newtab"), false);
});

test("findDuplicates keeps the lowest id and lists the rest", () => {
  const tabs = [
    { id: 5, url: "https://example.com/a" },
    { id: 2, url: "https://example.com/a" },
    { id: 9, url: "https://example.com/a" },
  ];
  const duplicates = findDuplicates(groupTabsByUrl(tabs));
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].keep.id, 2);
  assert.deepEqual(
    duplicates[0].toRemove.map((t) => t.id),
    [5, 9]
  );
});

test("findDuplicates does not mutate the input array order", () => {
  const tabs = [
    { id: 5, url: "https://example.com/a" },
    { id: 2, url: "https://example.com/a" },
  ];
  findDuplicates(groupTabsByUrl(tabs));
  assert.deepEqual(
    tabs.map((t) => t.id),
    [5, 2]
  );
});

test("collectRemovals returns ids of all duplicate tabs to close", () => {
  const tabs = [
    { id: 1, url: "https://example.com/a" },
    { id: 2, url: "https://example.com/a" },
    { id: 3, url: "https://example.com/b" },
    { id: 4, url: "https://example.com/b" },
    { id: 7, url: "https://example.com/c" },
  ];
  const { duplicates, tabIdsToRemove } = collectRemovals(tabs);
  assert.equal(duplicates.length, 2);
  assert.deepEqual(
    [...tabIdsToRemove].sort((a, b) => a - b),
    [2, 4]
  );
});

test("keeperForUrl returns the oldest tab for a duplicated url", () => {
  const tabs = [
    { id: 8, url: "https://example.com/a", windowId: 1 },
    { id: 4, url: "https://example.com/a", windowId: 2 },
  ];
  assert.equal(keeperForUrl(tabs, "https://example.com/a").id, 4);
});

test("keeperForUrl returns null when no non-ignored tab has the url", () => {
  const tabs = [
    { id: 1, url: "https://example.com/a" },
    { id: 2, url: "chrome://settings" },
  ];
  assert.equal(keeperForUrl(tabs, "https://example.com/b"), null);
});
