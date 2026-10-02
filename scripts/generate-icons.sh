#!/usr/bin/env bash
# Regenerate extension icons from assets/icon.svg (requires rsvg-convert).
set -euo pipefail
cd "$(dirname "$0")/.."
for s in 16 32 48 128; do rsvg-convert -w "$s" -h "$s" assets/icon.svg -o "extension/icons/icon$s.png"; done
echo "icons regenerated"
