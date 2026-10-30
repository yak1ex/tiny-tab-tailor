"use strict";

export const IGNORED_PROTOCOLS = ["chrome:", "chrome-extension:", "about:", "edge:"];

export function shouldIgnoreUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return IGNORED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return true;
  }
}

export function groupTabsByUrl(tabs) {
  const groups = new Map();
  for (const tab of tabs) {
    if (shouldIgnoreUrl(tab.url)) continue;
    if (!groups.has(tab.url)) {
      groups.set(tab.url, []);
    }
    groups.get(tab.url).push(tab);
  }
  return groups;
}

export function findDuplicates(groups) {
  const duplicates = [];
  for (const [url, tabs] of groups) {
    if (tabs.length > 1) {
      const sorted = [...tabs].sort((a, b) => a.id - b.id);
      const [keep, ...toRemove] = sorted;
      duplicates.push({ url, keep, toRemove });
    }
  }
  return duplicates;
}

export function collectRemovals(tabs) {
  const duplicates = findDuplicates(groupTabsByUrl(tabs));
  const tabIdsToRemove = duplicates.flatMap((d) => d.toRemove.map((t) => t.id));
  return { duplicates, tabIdsToRemove };
}

export function keeperForUrl(tabs, url) {
  const group = groupTabsByUrl(tabs).get(url);
  if (!group) return null;
  return [...group].sort((a, b) => a.id - b.id)[0];
}
