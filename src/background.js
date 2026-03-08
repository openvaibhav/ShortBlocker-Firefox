const BLOCKED_PATTERNS = [
  /youtube\.com\/shorts\//i,
  /instagram\.com\/reels\//i,
  /instagram\.com\/reel\//i,
];

const closingTabs = new Set();

function isBlocked(url) {
  if (!url) return false;
  return BLOCKED_PATTERNS.some((p) => p.test(url));
}

async function killTab(tabId, url) {
  if (!isBlocked(url)) return;
  if (closingTabs.has(tabId)) return;

  const data = await browser.storage.local.get("enabled");
  if (data.enabled === false) return;

  closingTabs.add(tabId);

  const s = await browser.storage.local.get("blockedCount");
  await browser.storage.local.set({
    blockedCount: (s.blockedCount || 0) + 1,
    lastBlocked: new Date().toISOString(),
  });

  browser.tabs.remove(tabId).finally(() => {
    closingTabs.delete(tabId);
  });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || (changeInfo.status === "loading" && tab.url);
  if (url) killTab(tabId, url);
});

browser.tabs.onCreated.addListener((tab) => {
  const url = tab.url || tab.pendingUrl;
  if (url) killTab(tab.id, url);
});

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.get("enabled").then((data) => {
    if (data.enabled === undefined) browser.storage.local.set({ enabled: true });
  });
});
