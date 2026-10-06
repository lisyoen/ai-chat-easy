// Settings schema, defaults and storage helpers (chrome.storage.sync).
(function (root) {
  "use strict";

  const TOOL_IDS = ["enterNewline", "palette", "focusInput"];
  const SITE_IDS = ["claude", "chatgpt", "gemini"];

  function defaultSnippets(msg) {
    const m = msg || ((k) => k);
    return [1, 2, 3, 4].map((n) => ({
      id: "default-" + n,
      title: m("defSnip" + n + "Title"),
      text: m("defSnip" + n + "Text"),
    }));
  }

  function defaults(msg) {
    return {
      tools: Object.fromEntries(TOOL_IDS.map((id) => [id, true])),
      sites: Object.fromEntries(SITE_IDS.map((id) => [id, true])),
      // Chatbots that also receive every message sent from another chatbot (off by default).
      broadcast: Object.fromEntries(SITE_IDS.map((id) => [id, false])),
      snippets: defaultSnippets(msg),
    };
  }

  // Merge stored values over defaults so new tools/sites appear enabled after an update.
  function merge(stored, msg) {
    const d = defaults(msg);
    const s = stored || {};
    return {
      tools: Object.fromEntries(TOOL_IDS.map((id) => [id, (s.tools || {})[id] !== undefined ? s.tools[id] : d.tools[id]])),
      sites: Object.assign({}, d.sites, s.sites || {}),
      broadcast: Object.assign({}, d.broadcast, s.broadcast || {}),
      snippets: Array.isArray(s.snippets) ? s.snippets : d.snippets,
    };
  }

  function i18n(key, subs) {
    try {
      if (typeof chrome !== "undefined" && chrome.i18n) return chrome.i18n.getMessage(key, subs) || key;
    } catch (_e) { /* orphaned context */ }
    return key;
  }

  async function load() {
    const stored = await chrome.storage.sync.get(["tools", "sites", "broadcast", "snippets"]);
    return merge(stored, i18n);
  }

  async function save(partial) {
    await chrome.storage.sync.set(partial);
  }

  const api = { TOOL_IDS, SITE_IDS, defaults, defaultSnippets, merge, i18n, settings: { load, save } };
  root.AICE = Object.assign(root.AICE || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
