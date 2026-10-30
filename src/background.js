"use strict";

import {
  shouldIgnoreUrl,
  collectRemovals,
  keeperForUrl,
} from "./dedup.js";

async function getAllTabs() {
  return chrome.tabs.query({});
}

async function closeDuplicateTabs() {
  const { duplicates, tabIdsToRemove } = collectRemovals(await getAllTabs());
  if (tabIdsToRemove.length > 0) {
    await chrome.tabs.remove(tabIdsToRemove);
  }
  return { closedCount: tabIdsToRemove.length, duplicateGroups: duplicates.length };
}

async function handleTabUrl(tab, url) {
  if (shouldIgnoreUrl(url)) return;

  const keeper = keeperForUrl(await getAllTabs(), url);
  if (!keeper || keeper.id === tab.id) return;

  const wasActive = tab.active === true;
  await chrome.tabs.remove(tab.id);
  if (wasActive) {
    await chrome.tabs.update(keeper.id, { active: true });
    await chrome.windows.update(keeper.windowId, { focused: true });
  }
}

function flashBadge(count) {
  chrome.action.setBadgeBackgroundColor({ color: "#1a73e8" });
  chrome.action.setBadgeText({ text: String(count) });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
}

chrome.action.onClicked.addListener(async () => {
  const result = await closeDuplicateTabs();
  flashBadge(result.closedCount);
  console.log(
    `TinyTabTailor: closed ${result.closedCount} duplicate tabs in ${result.duplicateGroups} groups`
  );
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  try {
    await handleTabUrl(tab, changeInfo.url);
  } catch (error) {
    console.error("TinyTabTailor: error handling tab:", error);
  }
});
