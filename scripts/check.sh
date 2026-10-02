#!/usr/bin/env bash
# manifest 유효성, 참조 파일 존재, 저장본 셀렉터 매칭, 단위 테스트
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - << 'PY'
import json, os, sys
m = json.load(open("extension/manifest.json"))
assert m["manifest_version"] == 3
files = list(m["icons"].values()) + [j for cs in m["content_scripts"] for j in cs["js"]]
missing = [f for f in files if not os.path.isfile(os.path.join("extension", f))]
if missing: sys.exit(f"missing: {missing}")
print(f"manifest OK v{m['version']} ({len(files)} files)")
PY
for f in extension/content/*.js; do node --check "$f"; done
echo "syntax OK"
python3 scripts/selector_check.py
node --test tests/
