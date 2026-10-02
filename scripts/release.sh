#!/usr/bin/env bash
# Usage: scripts/release.sh <version>
# Bumps the manifest, refreshes publish/latest.json, builds the zip, commits, tags, pushes and creates the GitHub release.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:?version required, e.g. 0.2.1}"
NOTES="${2:-}"
[ -z "$(git status --porcelain)" ] || { echo "working tree not clean"; exit 1; }

python3 - "$VERSION" << 'PY'
import json, sys, datetime
v = sys.argv[1]
p = "extension/manifest.json"
m = json.load(open(p, encoding="utf-8")); m["version"] = v
open(p, "w", encoding="utf-8").write(json.dumps(m, ensure_ascii=False, indent=2) + "\n")
latest = {"version": v,
          "releaseUrl": f"https://github.com/lisyoen/ai-chat-easy/releases/tag/v{v}",
          "publishedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")}
open("publish/latest.json", "w", encoding="utf-8").write(json.dumps(latest, indent=2) + "\n")
PY
bash scripts/check.sh > /dev/null
mkdir -p dist
ZIP="dist/ai-chat-easy-v${VERSION}.zip"
rm -f "$ZIP"
(cd extension && zip -qr "../$ZIP" .)
git add -A
git commit -qm "release: v${VERSION}"
git tag "v${VERSION}"
git push -q origin main "v${VERSION}"
if [ -n "$NOTES" ]; then
  gh release create "v${VERSION}" "$ZIP" --title "v${VERSION}" --notes-file "$NOTES"
else
  gh release create "v${VERSION}" "$ZIP" --title "v${VERSION}" --generate-notes
fi
echo "released v${VERSION}"
