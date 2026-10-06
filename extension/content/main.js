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

  // Broadcast: a message sent here also goes to the chatbots checked in the popup.
  let lastBroadcast = { text: "", at: 0 };
  function broadcastTargets() {
    if (cfg.sites[site.id] === false) return [];
    return A.SITES.filter((s) => s.id !== site.id && cfg.broadcast && cfg.broadcast[s.id]).map((s) => s.id);
  }
  function broadcast(editor) {
    const targets = broadcastTargets();
    if (!targets.length) return;
    const ed = editor || currentEditor();
    const text = ed ? A.editor.getText(ed) : "";
    if (!text) return;
    // One send can be seen twice (key + button click); send it once.
    if (text === lastBroadcast.text && Date.now() - lastBroadcast.at < 3000) return;
    lastBroadcast = { text, at: Date.now() };
    try {
      chrome.runtime.sendMessage({ type: "aice:broadcast", targets, text }).then((r) => {
        if (!r || !r.results) return;
        const ok = r.results.filter((x) => x.ok).map((x) => x.name);
        const bad = r.results.filter((x) => !x.ok).map((x) => x.name);
        if (ok.length) A.palette.toast(t("broadcastSent", [ok.join(", ")]));
        if (bad.length) A.palette.toast(t("broadcastFailed", [bad.join(", ")]));
      }).catch(() => {});
    } catch (_e) { /* extension reloaded */ }
  }

  // Native sends: a real click on the site's send button (our own clicks are untrusted and skipped).
  document.addEventListener("click", (e) => {
    if (!contextValid() || !e.isTrusted || !(e.target instanceof Element)) return;
    if (e.target.closest(site.sendButtons.join(","))) broadcast();
  }, true);

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

    const editor = A.editor.findComposer(site, e.target);
    if (!enabled("enterNewline")) {
      // The site's own Enter sends; broadcast the text before it clears the input.
      if (editor && A.decideAction(e, true) === "newline") broadcast(editor);
      return;
    }
    const action = A.decideAction(e, !!editor);
    if (action === "pass") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (action === "newline") A.editor.insertNewline(editor);
    else { broadcast(editor); A.editor.send(site, editor); }
  }, true);

  // Delivery from a broadcast started in another chatbot tab.
  try {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (!contextValid() || !msg || msg.type !== "aice:deliver") return false;
      A.editor.fillAndSend(site, msg.text).then(sendResponse);
      return true;
    });
  } catch (_e) { /* ignore */ }

  // Prompt handed over in a new tab (#aice-prompt=...[&aice-send=1]): fill it in, and send if asked.
  const handoff = A.readHandoff(location.hash);
  if (handoff) {
    const autoSend = A.readHandoffSend(location.hash);
    history.replaceState(null, "", location.pathname + location.search);
    A.editor.waitFor(() => A.editor.anyComposer(site), 20000).then((ed) => {
      if (!ed) return;
      setTimeout(() => {
        if (autoSend) A.editor.fillAndSend(site, handoff);
        else A.editor.insertText(ed, handoff);
      }, 500);
    });
  }
})();
