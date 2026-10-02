"use strict";
importScripts("lib/version.js", "lib/settings.js");

const REPO = "lisyoen/ai-chat-easy";
const LATEST_URL = "https://raw.githubusercontent.com/" + REPO + "/main/publish/latest.json";
const RELEASES_URL = "https://github.com/" + REPO + "/releases/latest";
const NATIVE_HOST = "io.github.lisyoen.ai_chat_easy";
const ALARM = "aice-update-check";
const CONTENT_FILES = chrome.runtime.getManifest().content_scripts[0].js;
const SITE_PATTERNS = chrome.runtime.getManifest().content_scripts[0].matches;
const t = (k, s) => chrome.i18n.getMessage(k, s) || k;

function currentVersion() { return chrome.runtime.getManifest().version; }

async function setUpdateState(latest) {
  const newer = latest && AICE.compareVersions(latest, currentVersion()) > 0;
  await chrome.storage.local.set({ latestVersion: latest || null, updateAvailable: !!newer, checkedAt: Date.now() });
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
  return { latest, newer: !!newer };
}

async function checkForUpdate() {
  try {
    const res = await fetch(LATEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const remote = await res.json();
    return await setUpdateState(remote.version);
  } catch (err) {
    console.warn("AI Chat Easy update check failed:", err);
    return { error: String(err) };
  }
}

function notify(message) {
  chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title: t("extName"), message });
}

function nativeUpdate() {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST, { action: "update" }, (response) => {
      if (chrome.runtime.lastError) resolve({ ok: false, missing: true, message: chrome.runtime.lastError.message });
      else resolve(response || { ok: false, message: "no response" });
    });
  });
}

async function runUpdate() {
  await chrome.action.setBadgeText({ text: "..." });
  const r = await nativeUpdate();
  if (r.missing) {
    notify(t("updateHelperMissing"));
    chrome.tabs.create({ url: RELEASES_URL });
    await checkForUpdate();
    return r;
  }
  if (!r.ok) {
    notify(t("updateFailed", [String(r.message || "").slice(-200)]));
    await checkForUpdate();
    return r;
  }
  if (r.upToDate) {
    await checkForUpdate();
    return r;
  }
  // Files on disk changed: reload the unpacked extension so the new version runs.
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
  chrome.alarms.create(ALARM, { periodInMinutes: 360 });
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

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: 360 });
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
