import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { decideAction, matchShortcut, filterItems } = require("../extension/content/keys.js");
const { siteForHost, handoffUrl, readHandoff, SITES } = require("../extension/content/sites.js");
const { compareVersions } = require("../extension/lib/version.js");
const S = require("../extension/lib/settings.js");

const E = (o = {}) => ({ key: "Enter", code: "Enter", keyCode: 13, isComposing: false, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...o });

test("Enter alone = newline", () => assert.equal(decideAction(E(), true), "newline"));
test("Ctrl+Enter = send", () => assert.equal(decideAction(E({ ctrlKey: true }), true), "send"));
test("Cmd+Enter = send", () => assert.equal(decideAction(E({ metaKey: true }), true), "send"));
test("Shift+Enter passes", () => assert.equal(decideAction(E({ shiftKey: true }), true), "pass"));
test("Alt+Enter passes", () => assert.equal(decideAction(E({ altKey: true }), true), "pass"));
test("IME composing Enter passes", () => assert.equal(decideAction(E({ isComposing: true }), true), "pass"));
test("keyCode 229 passes", () => assert.equal(decideAction(E({ keyCode: 229 }), true), "pass"));
test("outside the input passes", () => assert.equal(decideAction(E(), false), "pass"));
test("other keys pass", () => assert.equal(decideAction(E({ key: "a", keyCode: 65 }), true), "pass"));

test("shortcuts", () => {
  assert.equal(matchShortcut({ code: "Slash", altKey: true }), "palette");
  assert.equal(matchShortcut({ code: "KeyI", altKey: true }), "focusInput");
  assert.equal(matchShortcut({ code: "Slash", altKey: true, ctrlKey: true }), null);
  assert.equal(matchShortcut({ code: "Slash" }), null);
  assert.equal(matchShortcut({ code: "KeyI", altKey: true, isComposing: true }), null);
});

test("palette filter", () => {
  const items = [{ label: "Summarize", detail: "5 bullets" }, { label: "Ask ChatGPT" }, { label: "코드 리뷰" }];
  assert.equal(filterItems(items, "").length, 3);
  assert.deepEqual(filterItems(items, "chat").map((i) => i.label), ["Ask ChatGPT"]);
  assert.deepEqual(filterItems(items, "bullets").map((i) => i.label), ["Summarize"]);
  assert.deepEqual(filterItems(items, "리뷰").map((i) => i.label), ["코드 리뷰"]);
});

test("host mapping", () => {
  assert.equal(siteForHost("claude.ai").id, "claude");
  assert.equal(siteForHost("chatgpt.com").id, "chatgpt");
  assert.equal(siteForHost("chat.openai.com").id, "chatgpt");
  assert.equal(siteForHost("gemini.google.com").id, "gemini");
  assert.equal(siteForHost("example.com"), null);
});

test("prompt handoff round trip", () => {
  const text = "줄 1\n line 2 & #hash = ok?";
  for (const s of SITES) {
    const url = new URL(handoffUrl(s, text));
    assert.equal(readHandoff(url.hash), text);
  }
  assert.equal(readHandoff("#other=1"), null);
});

test("version compare", () => {
  assert.equal(compareVersions("0.2.0", "0.1.0"), 1);
  assert.equal(compareVersions("0.10.0", "0.9.9"), 1);
  assert.equal(compareVersions("1.0", "1.0.0"), 0);
  assert.equal(compareVersions("0.1.9", "0.2.0"), -1);
});

test("settings merge keeps user values and adds new tools", () => {
  const m = S.merge({ tools: { enterNewline: false }, snippets: [] }, (k) => k);
  assert.equal(m.tools.enterNewline, false);
  assert.equal(m.tools.palette, true);
  assert.equal(m.sites.gemini, true);
  assert.deepEqual(m.snippets, []);
  assert.equal(S.merge({}, (k) => k).snippets.length, 4);
});

test("locales en/ko have identical keys and placeholders", () => {
  const en = JSON.parse(readFileSync(new URL("../extension/_locales/en/messages.json", import.meta.url)));
  const ko = JSON.parse(readFileSync(new URL("../extension/_locales/ko/messages.json", import.meta.url)));
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ko).sort());
  for (const k of Object.keys(en)) assert.deepEqual(en[k].placeholders, ko[k].placeholders, k);
});

test("manifest version matches publish/latest.json not ahead", () => {
  const m = JSON.parse(readFileSync(new URL("../extension/manifest.json", import.meta.url)));
  const l = JSON.parse(readFileSync(new URL("../publish/latest.json", import.meta.url)));
  assert.ok(compareVersions(l.version, m.version) <= 0, "latest.json must never announce a version newer than the code");
});
