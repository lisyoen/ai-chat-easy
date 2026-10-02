import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { decideAction } = require("../extension/content/keys.js");
const { siteForHost } = require("../extension/content/sites.js");

const E = (o = {}) => ({ key: "Enter", keyCode: 13, isComposing: false, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...o });

test("Enter 단독 = newline", () => assert.equal(decideAction(E(), true), "newline"));
test("Ctrl+Enter = send", () => assert.equal(decideAction(E({ ctrlKey: true }), true), "send"));
test("Cmd+Enter = send", () => assert.equal(decideAction(E({ metaKey: true }), true), "send"));
test("Shift+Enter = pass", () => assert.equal(decideAction(E({ shiftKey: true }), true), "pass"));
test("Alt+Enter = pass", () => assert.equal(decideAction(E({ altKey: true }), true), "pass"));
test("IME 조합 중 Enter = pass", () => assert.equal(decideAction(E({ isComposing: true }), true), "pass"));
test("keyCode 229 = pass", () => assert.equal(decideAction(E({ keyCode: 229 }), true), "pass"));
test("입력창 밖 Enter = pass", () => assert.equal(decideAction(E(), false), "pass"));
test("Enter 외 키 = pass", () => assert.equal(decideAction(E({ key: "a", keyCode: 65 }), true), "pass"));
test("호스트 매핑", () => {
  assert.equal(siteForHost("claude.ai").id, "claude");
  assert.equal(siteForHost("chatgpt.com").id, "chatgpt");
  assert.equal(siteForHost("chat.openai.com").id, "chatgpt");
  assert.equal(siteForHost("gemini.google.com").id, "gemini");
  assert.equal(siteForHost("example.com"), null);
});
