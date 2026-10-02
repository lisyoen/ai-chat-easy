// Content script entry: wires the tools to the current chat site.
(function () {
  "use strict";
  const A = globalThis.AICE;
  const site = A.siteForHost(location.hostname);
  if (!site) return;

  // A newer copy of this script (after an extension update) takes over; the old one goes quiet.
  let alive = true;
  window.dispatchEvent(new CustomEvent("aice:takeover"));
  window.addEventListener("aice:takeover", () => { alive = false; }, { once: true });
  const contextValid = () => {
    try { return alive && !!chrome.runtime && !!chrome.runtime.id; } catch (_e) { return false; }
  };

  const t = (k, s) => A.i18n(k, s);
  let cfg = A.merge({}, t);
  let lastEditor = null;

  function enabled(tool) { return cfg.sites[site.id] !== false && cfg.tools[tool] !== false; }

  async function refresh() {
    if (!contextValid()) return;
    try { cfg = await A.settings.load(); } catch (_e) { /* keep defaults */ }
  }
  refresh();
  try {
    chrome.storage.onChanged.addListener(() => refresh());
  } catch (_e) { /* ignore */ }

  function currentEditor() {
    const active = document.activeElement;
    return A.editor.findComposer(site, active) || A.editor.anyComposer(site);
  }

  function paletteItems() {
    const items = [];
    for (const s of cfg.snippets) {
      items.push({
        group: t("groupSnippets"), label: s.title, detail: s.text.replace(/\s+/g, " ").slice(0, 90),
        run: () => { const ed = lastEditor || currentEditor(); if (ed) A.editor.insertText(ed, s.text); },
      });
    }
    const act = t("groupActions");
    if (enabled("askOthers")) {
      for (const other of A.SITES) {
        if (other.id === site.id) continue;
        items.push({
          group: act, label: t("actionAskIn", [other.name]),
          run: () => {
            const ed = lastEditor || currentEditor();
            const text = ed ? A.editor.getText(ed) : "";
            if (!text) { A.palette.toast(t("emptyPrompt")); return; }
            window.open(A.handoffUrl(other, text), "_blank", "noopener");
          },
        });
      }
    }
    items.push({ group: act, label: t("actionFocus"), run: () => { const ed = currentEditor(); if (ed) A.editor.focusEnd(ed); } });
    items.push({
      group: act, label: t("actionCopyPrompt"),
      run: async () => {
        const ed = lastEditor || currentEditor();
        const text = ed ? A.editor.getText(ed) : "";
        if (!text) { A.palette.toast(t("emptyPrompt")); return; }
        await navigator.clipboard.writeText(text);
        A.palette.toast(t("copied"));
      },
    });
    items.push({ group: act, label: t("actionClear"), run: () => { const ed = lastEditor || currentEditor(); if (ed) A.editor.clear(ed); } });
    return items;
  }

  function openPalette() {
    lastEditor = currentEditor();
    A.palette.open(paletteItems(),
      { placeholder: t("toolPalette"), hint: t("paletteHint"), empty: t("paletteEmpty") },
      () => { if (lastEditor) lastEditor.focus(); });
  }

  window.addEventListener("keydown", (e) => {
    if (!contextValid() || A.editor.isSynthetic(e) || A.palette.isOpen()) return;

    const shortcut = A.matchShortcut(e);
    if (shortcut === "palette" && enabled("palette")) {
      e.preventDefault(); e.stopImmediatePropagation(); openPalette(); return;
    }
    if (shortcut === "focusInput" && enabled("focusInput")) {
      const ed = currentEditor();
      if (ed) { e.preventDefault(); e.stopImmediatePropagation(); A.editor.focusEnd(ed); }
      return;
    }

    if (!enabled("enterNewline")) return;
    const editor = A.editor.findComposer(site, e.target);
    const action = A.decideAction(e, !!editor);
    if (action === "pass") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (action === "newline") A.editor.insertNewline(editor);
    else A.editor.send(site, editor);
  }, true);

  // Prompt handed over from another chatbot (#aice-prompt=...): fill the input once it appears.
  const handoff = A.readHandoff(location.hash);
  if (handoff) {
    history.replaceState(null, "", location.pathname + location.search);
    const started = Date.now();
    const timer = setInterval(() => {
      const ed = A.editor.anyComposer(site);
      if (ed) {
        clearInterval(timer);
        setTimeout(() => A.editor.insertText(ed, handoff), 300);
      } else if (Date.now() - started > 20000) {
        clearInterval(timer);
      }
    }, 250);
  }
})();
