# Site analysis / 사이트 분석

Source: saved "new chat" pages of each site (Chrome "Webpage, Complete"), 2026-10-02. Saved pages are not committed.

| Site | Chat input | Editor | Send button |
|------|-----------|--------|-------------|
| claude.ai | `div[contenteditable][role=textbox][data-testid="chat-input"]` | Tiptap (ProseMirror) | `button[data-testid="chat-input-send"]` |
| chatgpt.com | `#prompt-textarea` or `div.ProseMirror[contenteditable][role=textbox]` | ProseMirror | `#composer-submit-button`, `button[data-testid="send-button"]` (only rendered when text exists) |
| gemini.google.com | `rich-textarea .ql-editor[contenteditable]` | Quill | `button.send-button` (only rendered when text exists) |

## How the tools talk to the editors

- A capture-phase `keydown` listener on `window` is registered at `document_start`, so it runs before the site's own handlers.
- **New line**: the real Enter is cancelled and a synthetic Shift+Enter is dispatched to the editor, so each editor uses its own line-break logic. If nothing handles it, `execCommand("insertLineBreak")` is the fallback.
- **Send**: click the send button when it is present and enabled; otherwise dispatch a synthetic plain Enter.
- **Insert text** (snippets, prompt hand-off): a synthetic `paste` event with a `DataTransfer`, which both ProseMirror and Quill handle and which keeps line breaks. Fallback: `execCommand("insertText")`.
- Synthetic events are tracked in a `WeakSet` so the listener never intercepts its own events.
- IME composition (`isComposing`, keyCode 229) is never intercepted.
- **Send to all** (broadcast): when a message is sent (our Ctrl+Enter, the site's own Enter, or a trusted click on the send button) the content script reads the input and asks the background to deliver it to each checked chatbot. The background messages the most recently used tab of that site (`aice:deliver` → fill + send) or, with none open, opens `<new chat url>#aice-prompt=<encoded>&aice-send=1` in a background tab, which fills and sends once the input appears. Our own synthetic clicks are untrusted, so a delivered message is never broadcast again.
- After an extension update the background re-injects the content scripts into open chat tabs; the old copy receives an `aice:takeover` event and stops.
