"use strict";

const IGNORED_PROTOCOLS = ["chrome:", "chrome-extension:", "about:", "edge:"];

function shouldIgnoreUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return IGNORED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return true;
  }
}

async function getAllTabs() {
  return chrome.tabs.query({});
}

function groupTabsByUrl(tabs) {
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

function findDuplicates(groups) {
  const duplicates = [];
  for (const [url, tabs] of groups) {
    if (tabs.length > 1) {
      const sorted = tabs.sort((a, b) => (a.id - b.id));
      const [keep, ...toRemove] = sorted;
      duplicates.push({ url, keep, toRemove });
    }
  }
  return duplicates;
}

async function closeDuplicateTabs() {
  const tabs = await getAllTabs();
  const groups = groupTabsByUrl(tabs);
  const duplicates = findDuplicates(groups);

  const tabIdsToRemove = duplicates.flatMap(d => d.toRemove.map(t => t.id));

  if (tabIdsToRemove.length > 0) {
    await chrome.tabs.remove(tabIdsToRemove);
  }

  return { closedCount: tabIdsToRemove.length, duplicateGroups: duplicates.length };
}

async function handleNewTab(tab) {
  if (shouldIgnoreUrl(tab.url)) return;
  if (!tab.url) return;

  const allTabs = await getAllTabs();
  const existingTab = allTabs.find(t =>
    t.id !== tab.id &&
    t.url === tab.url &&
    !shouldIgnoreUrl(t.url)
  );

  if (existingTab) {
    await chrome.tabs.remove(tab.id);
    await chrome.tabs.update(existingTab.id, { active: true });
    await chrome.windows.update(existingTab.windowId, { focused: true });
  }
}

chrome.action.onClicked.addListener(async () => {
  const result = await closeDuplicateTabs();
  console.log(`TinyTabTailor: Closed ${result.closedCount} duplicate tabs in ${result.duplicateGroups} groups`);
});

chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    await handleNewTab(tab);
  } catch (error) {
    console.error("TinyTabTailor: Error handling new tab:", error);
  }
});
