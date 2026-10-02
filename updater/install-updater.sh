#!/usr/bin/env bash
# AI Chat Easy one-click updater registration (macOS / Linux, current user only).
set -euo pipefail
HOST_NAME="io.github.lisyoen.ai_chat_easy"
DIR="$(cd "$(dirname "$0")" && pwd)"
HOST="$DIR/host.py"
chmod +x "$HOST"
command -v git >/dev/null || { echo "[!] git not found"; exit 1; }
command -v python3 >/dev/null || { echo "[!] python3 not found"; exit 1; }

if [ "$(uname)" = "Darwin" ]; then
  TARGETS=("$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
           "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
           "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts")
else
  TARGETS=("$HOME/.config/google-chrome/NativeMessagingHosts"
           "$HOME/.config/chromium/NativeMessagingHosts"
           "$HOME/.config/microsoft-edge/NativeMessagingHosts")
fi
for t in "${TARGETS[@]}"; do
  mkdir -p "$t"
  cat > "$t/$HOST_NAME.json" <<JSON
{"name":"$HOST_NAME","description":"AI Chat Easy one-click updater","type":"stdio","path":"$HOST","allowed_origins":["chrome-extension://emkjegjjbdcpllicplemgbpnmfhbocde/"]}
JSON
  echo "[OK] $t/$HOST_NAME.json"
done
