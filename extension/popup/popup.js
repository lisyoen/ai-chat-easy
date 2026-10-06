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

// One row always: state text on the left, "Update now" on the right (enabled only when newer).
function setRow(text, state) {
  const row = document.getElementById("update");
  row.classList.toggle("latest", state === "latest");
  row.classList.toggle("error", state === "error");
  document.getElementById("updateText").textContent = text;
  document.getElementById("updateBtn").disabled = state !== "newer";
}

async function showUpdate() {
  const current = chrome.runtime.getManifest().version;
  const { latestVersion, checkedAt, checkError, helperMissing } =
    await chrome.storage.local.get(["latestVersion", "checkedAt", "checkError", "helperMissing"]);
  if (checkedAt) document.getElementById("checked").textContent = t("lastChecked", [new Date(checkedAt).toLocaleString()]);
  // Compare against the running version every time; a stored flag may be from an older install.
  const newer = A.isNewer(latestVersion, current);
  if (newer) setRow(t("updateAvailable", [latestVersion]), "newer");
  else if (checkError) setRow(t("checkFailed", [checkError]), "error");
  else setRow(t("upToDateVersion", [current]), "latest");
  document.getElementById("helper").hidden = !(newer && helperMissing);
}

document.getElementById("updateBtn").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = t("updating");
  // On success the extension reloads itself and this popup closes; otherwise show why.
  const r = await chrome.runtime.sendMessage({ type: "runUpdate" });
  btn.textContent = t("updateNow");
  await showUpdate();
  if (r && !r.ok && !r.missing) setRow(t("updateFailed", [String(r.message || "").slice(-200)]), "error");
});
document.getElementById("check").addEventListener("click", async (e) => {
  e.preventDefault();
  const a = e.currentTarget;
  a.textContent = t("checking");
  await chrome.runtime.sendMessage({ type: "checkUpdate" });
  a.textContent = t("checkUpdates");
  await showUpdate();
});
document.getElementById("options").addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });

render();
// Show the stored state at once, then refresh it from the server so the popup is never stale.
showUpdate().then(() => chrome.runtime.sendMessage({ type: "checkUpdate" })).then(showUpdate);
