#!/usr/bin/env bash
# Usage: scripts/build-zip.sh <out.zip>
# Release zip layout: extension files at the root (load this folder unpacked) + updater/ helper,
# so a zip install can update itself in place with the updater helper.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="$(realpath -m "${1:?output zip path required}")"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp -r extension/. "$STAGE/"
mkdir -p "$STAGE/updater"
cp updater/host.bat updater/host.ps1 updater/host.py updater/install-updater.bat updater/install-updater.sh "$STAGE/updater/"
mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
(cd "$STAGE" && zip -qrX "$OUT" .)
echo "$OUT"
