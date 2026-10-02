<p align="center"><img src="assets/icon.svg" width="96" alt="AI Chat Easy"></p>

<h1 align="center">AI Chat Easy</h1>

<p align="center">A Swiss-army knife for AI chatbots. One small Chrome extension that makes Claude, ChatGPT and Gemini nicer to use.</p>

<p align="center"><b>English</b> · <a href="README.ko.md">한국어</a></p>

## Tools

| Tool | What it does | Default key |
|------|--------------|-------------|
| Enter = new line | Enter adds a line break, so long prompts are never sent by accident. Send with Ctrl+Enter (Cmd+Enter on macOS). IME composition (Korean, Japanese, Chinese) is left untouched. | Enter / Ctrl+Enter |
| Command palette | Searchable list of your prompt snippets and quick actions. | Alt+/ |
| Prompt snippets | Reusable prompts inserted at the cursor. Edit them in the options page. | from the palette |
| Ask other AIs | Opens another chatbot with the prompt you are writing, ready to send. | from the palette |
| Jump to input | Focuses the chat input from anywhere on the page. | Alt+I |
| Quick actions | Copy the current prompt, clear the input. | from the palette |

Every tool and every site can be switched on or off from the toolbar popup.

Supported sites: `claude.ai`, `chatgpt.com` (`chat.openai.com`), `gemini.google.com`.

## Install

The extension is not on the Chrome Web Store yet. Pick one of the two ways below.

### A. Git clone (recommended, one-click updates)

1. Clone the repository: `git clone https://github.com/lisyoen/ai-chat-easy.git`
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and choose the `extension` folder inside the clone.
3. Register the updater helper once:
   - Windows: double-click `updater\install-updater.bat`
   - macOS / Linux: `bash updater/install-updater.sh`

When a new version is published the toolbar icon shows a **NEW** badge. Click the icon and the extension pulls the update and reloads itself.

### B. Release zip

Download `ai-chat-easy-vX.Y.Z.zip` from [Releases](https://github.com/lisyoen/ai-chat-easy/releases/latest), unzip it, and load the folder with **Load unpacked**. The **NEW** badge still tells you when an update exists; clicking it opens the release page so you can download the new zip.

Works in Chrome, Edge and other Chromium browsers.

## Privacy

AI Chat Easy has no server and collects nothing. Your settings and snippets are stored with `chrome.storage.sync` in your own browser profile. The only network request the extension makes is a version check against `publish/latest.json` in this repository. See [PRIVACY.md](PRIVACY.md).

## Development

- `extension/` is the extension itself. There is no build step.
- `bash scripts/check.sh` runs manifest/i18n checks, selector checks against saved pages and unit tests.
- `tests/e2e/run.mjs` loads the extension in Chromium with Playwright and drives a stand-in chat page.
- `scripts/release.sh <version>` bumps the version, updates `publish/latest.json`, builds the zip, tags and publishes a GitHub release.
- Site selectors live in `extension/content/sites.js`. See [docs/analysis.md](docs/analysis.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for adding a new chatbot.

Chat sites change their markup often. If a tool stops working on a site, please open an issue with the site name and what you pressed.

## License

[MIT](LICENSE)
