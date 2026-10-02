"use strict";
const A = globalThis.AICE;
const t = (k, s) => chrome.i18n.getMessage(k, s) || k;
document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
document.title = t("optionsTitle");

const list = document.getElementById("snippets");
const status = document.getElementById("status");

function row(sn) {
  const wrap = document.createElement("div");
  wrap.className = "snippet";
  wrap.dataset.id = sn.id;
  const title = document.createElement("input");
  title.placeholder = t("snippetTitle");
  title.value = sn.title;
  const del = document.createElement("button");
  del.textContent = t("deleteSnippet");
  del.addEventListener("click", () => wrap.remove());
  const text = document.createElement("textarea");
  text.placeholder = t("snippetText");
  text.value = sn.text;
  wrap.append(title, del, text);
  return wrap;
}

function show(snippets) {
  list.textContent = "";
  snippets.forEach((s) => list.appendChild(row(s)));
}

function collect() {
  return [...list.querySelectorAll(".snippet")].map((w) => ({
    id: w.dataset.id,
    title: w.querySelector("input").value.trim(),
    text: w.querySelector("textarea").value,
  })).filter((s) => s.title || s.text.trim());
}

document.getElementById("add").addEventListener("click", () => {
  const r = row({ id: "s-" + Date.now(), title: "", text: "" });
  list.appendChild(r);
  r.querySelector("input").focus();
});
document.getElementById("reset").addEventListener("click", () => show(A.defaultSnippets(t)));
document.getElementById("save").addEventListener("click", async () => {
  await A.settings.save({ snippets: collect() });
  status.textContent = t("saved");
  setTimeout(() => { status.textContent = ""; }, 1500);
});

A.settings.load().then((cfg) => show(cfg.snippets));
