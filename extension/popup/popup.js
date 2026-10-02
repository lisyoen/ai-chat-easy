"use strict";
const A = globalThis.AICE;
const t = (k, s) => chrome.i18n.getMessage(k, s) || k;
const TOOL_TEXT = {
  enterNewline: ["toolEnterNewline", "toolEnterNewlineDesc"],
  palette: ["toolPalette", "toolPaletteDesc"],
  focusInput: ["toolFocus", "toolFocusDesc"],
  askOthers: ["toolAskOthers", "toolAskOthersDesc"],
};
const SITE_NAMES = { claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini" };

document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;

function toggle(checked, onChange) {
  const label = document.createElement("label");
  label.className = "switch";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  label.append(input, document.createElement("span"));
  return label;
}

async function render() {
  const cfg = await A.settings.load();
  const tools = document.getElementById("tools");
  tools.textContent = "";
  for (const id of A.TOOL_IDS) {
    const row = document.createElement("div");
    row.className = "row";
    const text = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = t(TOOL_TEXT[id][0]);
    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = t(TOOL_TEXT[id][1]);
    text.append(title, desc);
    row.append(text, toggle(cfg.tools[id], (v) => A.settings.save({ tools: Object.assign({}, cfg.tools, { [id]: v }) }).then(render)));
    tools.appendChild(row);
  }
  const sites = document.getElementById("sites");
  sites.textContent = "";
  for (const id of A.SITE_IDS) {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = cfg.sites[id];
    cb.addEventListener("change", () => A.settings.save({ sites: Object.assign({}, cfg.sites, { [id]: cb.checked }) }).then(render));
    label.append(cb, document.createTextNode(SITE_NAMES[id]));
    sites.appendChild(label);
  }
}

async function showUpdate() {
  const { latestVersion, updateAvailable, checkedAt } = await chrome.storage.local.get(["latestVersion", "updateAvailable", "checkedAt"]);
  if (checkedAt) document.getElementById("checked").textContent = t("lastChecked", [new Date(checkedAt).toLocaleString()]);
  const box = document.getElementById("update");
  box.hidden = !updateAvailable;
  if (updateAvailable) document.getElementById("updateText").textContent = t("updateAvailable", [latestVersion]);
}

document.getElementById("updateBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "runUpdate" });
  window.close();
});
document.getElementById("check").addEventListener("click", async (e) => {
  e.preventDefault();
  const a = e.currentTarget;
  a.textContent = t("checking");
  const r = await chrome.runtime.sendMessage({ type: "checkUpdate" });
  a.textContent = r && r.newer ? t("updateAvailable", [r.latest]) : (r && r.error ? r.error : t("upToDate"));
  showUpdate();
});
document.getElementById("options").addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });

render();
showUpdate();
