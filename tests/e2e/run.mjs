// End-to-end smoke test: loads the unpacked extension in Chromium and drives a fixture page served as claude.ai.
// Requires Playwright (not a project dependency): NODE_PATH=/path/to/node_modules node tests/e2e/run.mjs
import { chromium } from "playwright";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ext = path.resolve("extension");
const fixture = readFileSync("tests/e2e/fixture.html", "utf8");
const ctx = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), "aice-")), {
  headless: true,
  channel: "chromium",
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
await ctx.route("https://claude.ai/**", (r) => r.fulfill({ contentType: "text/html", body: fixture }));
const fixtureGpt = readFileSync("tests/e2e/fixture-chatgpt.html", "utf8");
await ctx.route(/^https:\/\/chatgpt\.com\//, (r) => r.fulfill({ contentType: "text/html", body: fixtureGpt }));
await ctx.route("https://raw.githubusercontent.com/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ version: "9.9.9" }) }));

let sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent("serviceworker");
const id = sw.url().split("/")[2];
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name} ${extra}`); };
check("extension id is fixed", id === "emkjegjjbdcpllicplemgbpnmfhbocde", id);

const page = await ctx.newPage();
await page.goto("https://claude.ai/new");
await page.click('[data-testid="chat-input"]');
await page.keyboard.type("hello");
await page.keyboard.press("Enter");
await page.keyboard.press("Enter");
let ev = await page.evaluate(() => window.events.slice());
check("Enter inserts newline, never sends", ev.filter((e) => e === "newline").length === 2 && !ev.some((e) => e.includes("send")), JSON.stringify(ev));
await page.keyboard.press("Control+Enter");
ev = await page.evaluate(() => window.events.slice());
check("Ctrl+Enter clicks send", ev.at(-1) === "button-send", JSON.stringify(ev));
await page.keyboard.press("Shift+Enter");
ev = await page.evaluate(() => window.events.slice());
check("Shift+Enter left to the site", ev.at(-1) === "newline");

await page.keyboard.press("Alt+Slash");
const paletteOpen = await page.locator("aice-palette").count();
check("Alt+/ opens palette", paletteOpen === 1);
await page.keyboard.type("Summar");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
ev = await page.evaluate(() => window.events.slice());
const text = await page.locator('[data-testid="chat-input"]').innerText();
check("snippet inserted via paste", ev.at(-1) === "paste" && /5/.test(text), JSON.stringify(text.slice(0, 60)));

const popup = await ctx.newPage();
await popup.goto(`chrome-extension://${id}/popup/popup.html`);
await popup.waitForTimeout(300);
const toggles = await popup.locator("#tools input[type=checkbox]").count();
check("popup renders 3 tool toggles", toggles === 3, String(toggles));
await popup.locator("#tools input[type=checkbox]").first().evaluate((el) => { el.click(); });
await popup.waitForTimeout(300);
await page.bringToFront();
await page.click('[data-testid="chat-input"]');
await page.keyboard.press("Enter");
ev = await page.evaluate(() => window.events.slice());
check("disabling the tool restores site Enter", ev.at(-1) === "enter-send", ev.at(-1));

// Broadcast: check ChatGPT in the popup, send from Claude with Ctrl+Enter.
await popup.bringToFront();
await popup.locator("#tools input[type=checkbox]").first().evaluate((el) => { el.click(); }); // Enter newline back on
await popup.locator("#broadcast input[type=checkbox]").nth(1).evaluate((el) => { el.click(); });
await popup.waitForTimeout(1000);
await page.bringToFront();
await page.evaluate(() => { document.querySelector('[data-testid="chat-input"]').textContent = ""; });
await page.click('[data-testid="chat-input"]');
await page.keyboard.type("broadcast one");
// Tabs opened by the extension bypass Playwright routing, so check the URL it opens with.
await sw.evaluate(() => { globalThis.__created = []; chrome.tabs.onCreated.addListener((t) => globalThis.__created.push(t.pendingUrl || t.url)); });
const newTab = ctx.waitForEvent("page", { timeout: 10000 });
await page.keyboard.press("Control+Enter");
(await newTab).close();
const created = await sw.evaluate(() => globalThis.__created);
check("broadcast with no ChatGPT tab opens a new chat that auto-sends", created.length === 1 && created[0] === "https://chatgpt.com/#aice-prompt=broadcast%20one&aice-send=1", JSON.stringify(created));

const gpt = await ctx.newPage();
await gpt.goto("https://chatgpt.com/#aice-prompt=" + encodeURIComponent("첫 질문\n둘째 줄") + "&aice-send=1");
await gpt.waitForFunction(() => window.sent && window.sent.length > 0, null, { timeout: 15000 }).catch(() => {});
let sent = await gpt.evaluate(() => window.sent || []);
check("handoff with aice-send fills and sends", sent.length === 1 && sent[0] === "첫 질문\n둘째 줄", JSON.stringify(sent));

await page.bringToFront();
await page.evaluate(() => { document.querySelector('[data-testid="chat-input"]').textContent = ""; }); // fixture does not clear on send
await page.click('[data-testid="chat-input"]');
await page.keyboard.type("broadcast two");
await page.keyboard.press("Control+Enter");
await gpt.waitForFunction(() => window.sent.length > 1, null, { timeout: 15000 }).catch(() => {});
sent = await gpt.evaluate(() => window.sent);
const pages = ctx.pages().filter((p) => p.url().startsWith("https://chatgpt.com")).length;
check("broadcast sends into the open ChatGPT tab", sent.at(-1) === "broadcast two" && pages === 1, JSON.stringify({ sent, pages }));
const claudeEv = await page.evaluate(() => window.events.slice());
check("source send still happens once", claudeEv.filter((e) => e === "button-send").length === 3, JSON.stringify(claudeEv));

const upd = await sw.evaluate(async () => { await new Promise((r) => setTimeout(r, 500)); return [await chrome.action.getBadgeText({}), await chrome.action.getPopup({}), (await chrome.storage.local.get("latestVersion")).latestVersion]; });
check("update badge shown and icon click switches to update", upd[0] === "NEW" && upd[1] === "" && upd[2] === "9.9.9", JSON.stringify(upd));

await ctx.close();
const failed = results.filter((r) => !r).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
