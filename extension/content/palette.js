// Command palette overlay, isolated in a shadow root so site CSS cannot break it.
(function (root) {
  "use strict";
  const { filterItems } = root.AICE;
  let host = null;

  const CSS = `
  :host { all: initial; }
  .backdrop { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,.25);
    display: flex; justify-content: center; align-items: flex-start; padding-top: 14vh;
    font-family: system-ui, -apple-system, "Segoe UI", "Malgun Gothic", sans-serif; }
  .box { width: min(560px, 92vw); background: #fff; color: #1f1f1f; border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,.28); overflow: hidden; }
  @media (prefers-color-scheme: dark) {
    .box { background: #26262a; color: #ececec; }
    .item.active { background: #3a3a42 !important; }
    input { color: #ececec !important; border-color: #3a3a42 !important; }
    .group, .hint, .detail { color: #9a9aa3 !important; }
  }
  input { width: 100%; box-sizing: border-box; border: 0; border-bottom: 1px solid #e5e5e5;
    padding: 14px 16px; font-size: 15px; outline: none; background: transparent; color: inherit; }
  .list { max-height: 50vh; overflow-y: auto; padding: 6px 0; }
  .group { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #888; padding: 8px 16px 4px; }
  .item { padding: 8px 16px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
  .item.active { background: #fdecef; }
  .label { font-size: 14px; }
  .detail { font-size: 12px; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hint { font-size: 11px; color: #999; padding: 8px 16px; border-top: 1px solid rgba(128,128,128,.2); }
  .empty { padding: 14px 16px; color: #999; font-size: 13px; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    background: #1f1f1f; color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 13px;
    font-family: system-ui, sans-serif; }`;

  function close() {
    if (host) { host.remove(); host = null; }
  }

  function isOpen() { return !!host; }

  /**
   * @param {Array<{group:string,label:string,detail?:string,run:Function}>} items
   * @param {{placeholder:string, hint:string, empty:string}} text
   * @param {Function} onClose called after close (e.g. to refocus the editor)
   */
  function open(items, text, onClose) {
    close();
    host = document.createElement("aice-palette");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${CSS}</style>
      <div class="backdrop"><div class="box">
        <input type="text" spellcheck="false" autocomplete="off">
        <div class="list"></div><div class="hint"></div>
      </div></div>`;
    document.documentElement.appendChild(host);

    const input = shadow.querySelector("input");
    const list = shadow.querySelector(".list");
    shadow.querySelector(".hint").textContent = text.hint;
    input.placeholder = text.placeholder;
    let shown = [];
    let active = 0;

    function render() {
      shown = filterItems(items, input.value);
      active = Math.min(active, Math.max(shown.length - 1, 0));
      list.textContent = "";
      if (!shown.length) {
        const e = document.createElement("div");
        e.className = "empty"; e.textContent = text.empty; list.appendChild(e);
        return;
      }
      let lastGroup = null;
      shown.forEach((it, i) => {
        if (it.group !== lastGroup) {
          const g = document.createElement("div");
          g.className = "group"; g.textContent = it.group; list.appendChild(g);
          lastGroup = it.group;
        }
        const el = document.createElement("div");
        el.className = "item" + (i === active ? " active" : "");
        const l = document.createElement("div"); l.className = "label"; l.textContent = it.label;
        el.appendChild(l);
        if (it.detail) { const d = document.createElement("div"); d.className = "detail"; d.textContent = it.detail; el.appendChild(d); }
        el.addEventListener("mousedown", (e) => { e.preventDefault(); choose(i); });
        list.appendChild(el);
        if (i === active) el.scrollIntoView({ block: "nearest" });
      });
    }

    function finish() { close(); if (onClose) onClose(); }

    function choose(i) {
      const it = shown[i];
      finish();
      if (it) setTimeout(() => it.run(), 0);
    }

    input.addEventListener("input", () => { active = 0; render(); });
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active); }
      else if (e.key === "Escape") { e.preventDefault(); finish(); }
    });
    shadow.querySelector(".backdrop").addEventListener("mousedown", (e) => {
      if (e.target === e.currentTarget) { e.preventDefault(); finish(); }
    });
    render();
    input.focus();
  }

  function toast(message) {
    const t = document.createElement("aice-toast");
    const s = t.attachShadow({ mode: "open" });
    s.innerHTML = `<style>${CSS}</style><div class="toast"></div>`;
    s.querySelector(".toast").textContent = message;
    document.documentElement.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  root.AICE = Object.assign(root.AICE || {}, { palette: { open, close, isOpen, toast } });
})(globalThis);
