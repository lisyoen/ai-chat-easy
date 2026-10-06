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
| Send to all | The moment you send in one chatbot (Enter, Ctrl+Enter or the send button), the same message is sent to the other chatbots you checked: into the open tab's conversation, or a new background tab. | check chatbots in the popup |
| Jump to input | Focuses the chat input from anywhere on the page. | Alt+I |
| Quick actions | Copy the current prompt, clear the input. | from the palette |

Every tool and every site can be switched on or off from the toolbar popup.

Supported sites: `claude.ai`, `chatgpt.com` (`chat.openai.com`), `gemini.google.com`.

## Install

The extension is not on the Chrome Web Store yet. Pick one of the two ways below. Either way, register the updater helper once; after that, when a new version is published, clicking the **NEW** badge on the toolbar icon downloads the new files, replaces them and reloads the extension (the same as the reload button on `chrome://extensions`).

### A. Release zip (no Git needed)

1. Download `ai-chat-easy-vX.Y.Z.zip` from [Releases](https://github.com/lisyoen/ai-chat-easy/releases/latest) and unzip it into a folder (e.g. `C:\ai-chat-easy`).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and choose that folder.
3. Register the updater helper once:
   - Windows: double-click `updater\install-updater.bat` inside the folder
   - macOS / Linux: `bash updater/install-updater.sh`

On update the helper downloads the new zip from GitHub Releases and replaces the files in the same folder. Behind a corporate proxy it uses the Windows system proxy settings.

### B. Git clone

1. Clone the repository: `git clone https://github.com/lisyoen/ai-chat-easy.git`
2. **Load unpacked** the `extension` folder inside the clone.
3. Register the updater helper: Windows `updater\install-updater.bat`, macOS / Linux `bash updater/install-updater.sh`

Updates are then pulled with `git pull`.

The popup says "You have the latest version" when you are up to date, or shows an "Update now" button when a newer version exists. If the helper is not registered yet, clicking update explains how to register it.

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
