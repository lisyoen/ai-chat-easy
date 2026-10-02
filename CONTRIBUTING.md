# Contributing

Issues and pull requests are welcome. 이슈와 PR 환영합니다 (한국어 OK).

## Adding a chatbot / 챗봇 추가

1. Save the site's chat page with Chrome **Save page as → Webpage, Complete** into `sites/<id>/` (the folder is git-ignored; never commit saved pages, they contain your account data).
2. Find the chat input (`contenteditable` or `textarea`) and the send button, and add an entry to `extension/content/sites.js`.
3. Add the site to `matches` and `host_permissions` in `extension/manifest.json` and to `SITE_IDS` in `extension/lib/settings.js`.
4. Add a selector check to `scripts/selector_check.py`.
5. Run `bash scripts/check.sh` and the e2e test.

## Adding a tool / 도구 추가

Tools are plain functions wired in `extension/content/main.js`. Add an id to `TOOL_IDS` in `extension/lib/settings.js`, its texts to both `_locales/en` and `_locales/ko`, and a row in `extension/popup/popup.js`. Pure logic goes in `extension/content/keys.js` (or a new file) with unit tests in `tests/`.

## Running the e2e test

```
npm i -g playwright   # or any local install
npx playwright install chromium
node tests/e2e/run.mjs
```

## Release

`bash scripts/release.sh <version> [notes.md]` — maintainers only.
