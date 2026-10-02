// 키 가로채기. document_start 에 window capture 리스너를 먼저 걸어
// 사이트 자체 Enter 처리보다 앞서 판정한다.
(function () {
  "use strict";
  const { decideAction, siteForHost } = globalThis.AICE;
  const site = siteForHost(location.hostname);
  if (!site) return;

  const synthetic = new WeakSet();

  function findComposer(target) {
    return target instanceof Element ? target.closest(site.composer) : null;
  }

  function findSendButton() {
    for (const sel of site.sendButtons) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true") return btn;
    }
    return null;
  }

  // 합성 Enter 를 입력창에 보내 사이트 에디터의 기본 처리를 태운다.
  // 반환값: 에디터가 처리(preventDefault)했는지
  function fireEnter(editor, shift) {
    const ev = new KeyboardEvent("keydown", {
      key: "Enter", code: "Enter", keyCode: 13, which: 13,
      shiftKey: shift, bubbles: true, cancelable: true, composed: true,
    });
    synthetic.add(ev);
    editor.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  function insertNewline(editor) {
    if (fireEnter(editor, true)) return;
    // 에디터가 Shift+Enter 를 처리하지 않은 경우의 대체 경로
    document.execCommand("insertLineBreak");
  }

  function send(editor) {
    const btn = findSendButton();
    if (btn) { btn.click(); return; }
    fireEnter(editor, false);
  }

  window.addEventListener("keydown", (e) => {
    if (synthetic.has(e)) return;
    const editor = findComposer(e.target);
    const action = decideAction(e, !!editor);
    if (action === "pass") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (action === "newline") insertNewline(editor);
    else send(editor);
  }, true);
})();
