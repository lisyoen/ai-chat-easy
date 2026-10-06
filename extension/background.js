"use strict";
importScripts("lib/version.js", "lib/settings.js");

const REPO = "lisyoen/ai-chat-easy";
const LATEST_URL = "https://raw.githubusercontent.com/" + REPO + "/main/publish/latest.json";
const NATIVE_HOST = "io.github.lisyoen.ai_chat_easy";
const ALARM = "aice-update-check";
const CHECK_MINUTES = 1; // update check interval
const CONTENT_FILES = chrome.runtime.getManifest().content_scripts[0].js;
const SITE_PATTERNS = chrome.runtime.getManifest().content_scripts[0].matches;
const t = (k, s) => chrome.i18n.getMessage(k, s) || k;

function currentVersion() { return chrome.runtime.getManifest().version; }

// Badge, title and popup always follow the comparison against the running version,
// never a flag stored by an earlier install.
async function applyUpdateState(latest, extra) {
  const newer = AICE.isNewer(latest, currentVersion());
  await chrome.storage.local.set(Object.assign({ latestVersion: latest || null, updateAvailable: newer }, extra || {}));
  if (newer) {
    await chrome.action.setBadgeText({ text: "NEW" });
    await chrome.action.setBadgeBackgroundColor({ color: "#E8364F" });
    await chrome.action.setTitle({ title: t("badgeTitleUpdate", [latest]) });
    // While an update is pending, one click on the icon performs the update.
    await chrome.action.setPopup({ popup: "" });
  } else {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: t("extName") });
    await chrome.action.setPopup({ popup: "popup/popup.html" });
  }
  return { latest, current: currentVersion(), newer };
}

async function refreshFromStorage() {
  const { latestVersion } = await chrome.storage.local.get("latestVersion");
  return applyUpdateState(latestVersion);
}

async function checkForUpdate() {
  try {
    const res = await fetch(LATEST_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const remote = await res.json();
    return await applyUpdateState(remote.version, { checkedAt: Date.now(), checkError: null });
  } catch (err) {
    console.warn("AI Chat Easy update check failed:", err);
    const r = await refreshFromStorage();
    await chrome.storage.local.set({ checkError: String(err && err.message || err) });
    return Object.assign(r, { error: String(err && err.message || err) });
  }
}

function notify(message) {
  chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title: t("extName"), message });
}

function nativeUpdate(version) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST, { action: "update", version: version || "" }, (response) => {
      if (chrome.runtime.lastError) resolve({ ok: false, missing: true, message: chrome.runtime.lastError.message });
      else resolve(response || { ok: false, message: "no response" });
    });
  });
}

async function runUpdate() {
  await chrome.action.setBadgeText({ text: "..." });
  const { latestVersion } = await chrome.storage.local.get("latestVersion");
  const r = await nativeUpdate(latestVersion);
  if (r.missing) {
    await chrome.storage.local.set({ helperMissing: true });
    notify(t("updateHelperMissing"));
    await refreshFromStorage();
    return r;
  }
  await chrome.storage.local.set({ helperMissing: false });
  if (!r.ok) {
    notify(t("updateFailed", [String(r.message || "").slice(-200)]));
    await refreshFromStorage();
    return r;
  }
  // Files on disk may already be newer than the running code (e.g. a zip unpacked over the
  // folder without pressing reload). Then the helper has nothing to download, but a reload is due.
  if (r.upToDate && !(r.mode === "zip" && AICE.isNewer(r.after, currentVersion()))) {
    await checkForUpdate();
    return r;
  }
  // New files are on disk: reload the unpacked extension so the new version runs
  // (same as pressing the reload button on chrome://extensions).
  await chrome.storage.local.set({ justUpdatedFrom: currentVersion() });
  chrome.runtime.reload();
  return r;
}

// Re-inject content scripts into tabs that were open before an install/update.
async function reinjectContentScripts() {
  const tabs = await chrome.tabs.query({ url: SITE_PATTERNS });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: CONTENT_FILES });
    } catch (_e) { /* tab not ready or not allowed */ }
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.alarms.create(ALARM, { periodInMinutes: CHECK_MINUTES });
  // Clear a stale "update available" left by the previous version before anything else.
  await refreshFromStorage();
  if (details.reason === "install") {
    await chrome.storage.sync.set(AICE.merge(await chrome.storage.sync.get(null), t));
  }
  const { justUpdatedFrom } = await chrome.storage.local.get("justUpdatedFrom");
  if (justUpdatedFrom && justUpdatedFrom !== currentVersion()) {
    notify(t("updatedTo", [currentVersion()]));
  }
  await chrome.storage.local.remove("justUpdatedFrom");
  await reinjectContentScripts();
  await checkForUpdate();
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create(ALARM, { periodInMinutes: CHECK_MINUTES });
  await refreshFromStorage();
  checkForUpdate();
});

chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARM) checkForUpdate(); });

// Only fires while no popup is set, i.e. when an update is pending.
chrome.action.onClicked.addListener(() => { runUpdate(); });

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "checkUpdate") { checkForUpdate().then(sendResponse); return true; }
  if (msg && msg.type === "runUpdate") { runUpdate().then(sendResponse); return true; }
  return false;
});
