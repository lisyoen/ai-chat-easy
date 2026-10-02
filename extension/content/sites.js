// 사이트별 어댑터: 입력창 셀렉터와 발송 버튼 셀렉터.
// 근거는 docs/analysis.md (sites/ 저장본 분석).
(function (root) {
  "use strict";

  const SITES = [
    {
      id: "claude",
      hosts: ["claude.ai"],
      composer: '[data-testid="chat-input"]',
      sendButtons: ['button[data-testid="chat-input-send"]'],
    },
    {
      id: "chatgpt",
      hosts: ["chatgpt.com", "chat.openai.com"],
      composer: '#prompt-textarea, div.ProseMirror[contenteditable="true"][role="textbox"]',
      sendButtons: ['#composer-submit-button', 'button[data-testid="send-button"]'],
    },
    {
      id: "gemini",
      hosts: ["gemini.google.com"],
      composer: 'rich-textarea .ql-editor[contenteditable="true"]',
      sendButtons: ['button.send-button'],
    },
  ];

  function siteForHost(host) {
    return SITES.find((s) => s.hosts.some((h) => host === h || host.endsWith("." + h))) || null;
  }

  const api = { SITES, siteForHost };
  root.AICE = Object.assign(root.AICE || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
