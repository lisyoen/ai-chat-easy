// Site adapters: where the chat input and the send button live.
// Selectors come from saved pages of each site (see docs/analysis.md).
(function (root) {
  "use strict";

  const SITES = [
    {
      id: "claude",
      name: "Claude",
      hosts: ["claude.ai"],
      newChatUrl: "https://claude.ai/new",
      composer: '[data-testid="chat-input"]',
      sendButtons: ['button[data-testid="chat-input-send"]'],
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      hosts: ["chatgpt.com", "chat.openai.com"],
      newChatUrl: "https://chatgpt.com/",
      composer: '#prompt-textarea, div.ProseMirror[contenteditable="true"][role="textbox"]',
      sendButtons: ["#composer-submit-button", 'button[data-testid="send-button"]'],
    },
    {
      id: "gemini",
      name: "Gemini",
      hosts: ["gemini.google.com"],
      newChatUrl: "https://gemini.google.com/app",
      composer: 'rich-textarea .ql-editor[contenteditable="true"]',
      sendButtons: ["button.send-button"],
    },
  ];

  function siteForHost(host) {
    return SITES.find((s) => s.hosts.some((h) => host === h || host.endsWith("." + h))) || null;
  }

  // A prompt handed over from another chatbot travels in the URL hash.
  const HANDOFF_KEY = "aice-prompt";

  function handoffUrl(site, prompt) {
    return site.newChatUrl + "#" + HANDOFF_KEY + "=" + encodeURIComponent(prompt);
  }

  function readHandoff(hash) {
    const m = String(hash || "").match(new RegExp("[#&]" + HANDOFF_KEY + "=([^&]*)"));
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (_e) { return null; }
  }

  const api = { SITES, siteForHost, handoffUrl, readHandoff, HANDOFF_KEY };
  root.AICE = Object.assign(root.AICE || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
