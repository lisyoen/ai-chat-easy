// Editor operations that work across ProseMirror/Tiptap (Claude, ChatGPT) and Quill (Gemini).
(function (root) {
  "use strict";
  const synthetic = new WeakSet();

  function isSynthetic(ev) { return synthetic.has(ev); }

  function findComposer(site, from) {
    if (from instanceof Element) {
      const hit = from.closest(site.composer);
      if (hit) return hit;
    }
    return null;
  }

  function anyComposer(site) { return document.querySelector(site.composer); }

  function findSendButton(site) {
    for (const sel of site.sendButtons) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true") return btn;
    }
    return null;
  }

  // Send a synthetic Enter to the editor so the site's own key handling runs.
  function fireEnter(editor, shift) {
    const ev = new KeyboardEvent("keydown", {
      key: "Enter", code: "Enter", keyCode: 13, which: 13,
      shiftKey: !!shift, bubbles: true, cancelable: true, composed: true,
    });
    synthetic.add(ev);
    editor.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  function insertNewline(editor) {
    if (fireEnter(editor, true)) return;
    document.execCommand("insertLineBreak");
  }

  function send(site, editor) {
    const btn = findSendButton(site);
    if (btn) { btn.click(); return; }
    fireEnter(editor, false);
  }

  function focusEnd(editor) {
    editor.focus();
    const sel = window.getSelection();
    if (sel && !editor.contains(sel.anchorNode)) {
      const r = document.createRange();
      r.selectNodeContents(editor);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }

  // Insert plain text at the cursor. A synthetic paste keeps multi-line text intact in both editors.
  function insertText(editor, text) {
    editor.focus();
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
    editor.dispatchEvent(ev);
    if (!ev.defaultPrevented) document.execCommand("insertText", false, text);
  }

  function getText(editor) {
    return (editor.innerText || "").replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function clear(editor) {
    editor.focus();
    document.execCommand("selectAll");
    document.execCommand("delete");
  }

  function waitFor(fn, timeoutMs) {
    return new Promise((resolve) => {
      const started = Date.now();
      (function tick() {
        const v = fn();
        if (v) resolve(v);
        else if (Date.now() - started > timeoutMs) resolve(null);
        else setTimeout(tick, 200);
      })();
    });
  }

  // Fill the composer with text and submit it, as if the user typed and pressed send.
  async function fillAndSend(site, text) {
    const editor = await waitFor(() => anyComposer(site), 30000);
    if (!editor) return { ok: false, message: "composer not found" };
    editor.focus();
    if (getText(editor)) clear(editor);
    insertText(editor, text);
    // The site enables its send button after it has seen the new text.
    await waitFor(() => getText(editor) && findSendButton(site), 5000);
    send(site, editor);
    return { ok: true };
  }

  const api = { editor: { isSynthetic, waitFor, fillAndSend, findComposer, anyComposer, findSendButton, insertNewline, send, focusEnd, insertText, getText, clear } };
  root.AICE = Object.assign(root.AICE || {}, api);
})(globalThis);
