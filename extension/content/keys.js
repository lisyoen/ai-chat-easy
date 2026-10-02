// Pure key decision logic. Loaded by the content script and by node tests.
(function (root) {
  "use strict";

  /**
   * Enter handling inside the chat input.
   * @returns {"newline"|"send"|"pass"}
   */
  function decideAction(ev, inComposer) {
    if (!inComposer) return "pass";
    if (ev.key !== "Enter") return "pass";
    // Enter while an IME (Korean, Japanese, ...) is composing confirms the syllable. Never touch it.
    if (ev.isComposing || ev.keyCode === 229) return "pass";
    if (ev.altKey || ev.shiftKey) return "pass";
    if (ev.ctrlKey || ev.metaKey) return "send";
    return "newline";
  }

  // Global shortcuts. Matched by physical key (code) so they work on any keyboard layout.
  const SHORTCUTS = {
    palette: { code: "Slash", alt: true },
    focusInput: { code: "KeyI", alt: true },
  };

  function matchShortcut(ev) {
    if (ev.isComposing || ev.keyCode === 229) return null;
    for (const [name, s] of Object.entries(SHORTCUTS)) {
      if (ev.code === s.code && !!ev.altKey === !!s.alt && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) return name;
    }
    return null;
  }

  // Fuzzy-ish filter for the palette: every whitespace-separated term must appear.
  function filterItems(items, query) {
    const terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items.slice();
    return items.filter((it) => {
      const hay = (it.label + " " + (it.detail || "")).toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  const api = { decideAction, matchShortcut, filterItems, SHORTCUTS };
  root.AICE = Object.assign(root.AICE || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
