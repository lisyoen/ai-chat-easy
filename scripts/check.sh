#!/usr/bin/env bash
# Static checks + unit tests. Run before every commit.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - << 'PY'
import json, os, re, sys
m = json.load(open("extension/manifest.json", encoding="utf-8"))
assert m["manifest_version"] == 3
files = list(m["icons"].values()) + [m["background"]["service_worker"], m["action"]["default_popup"], m["options_page"]]
files += [j for cs in m["content_scripts"] for j in cs["js"]]
missing = [f for f in files if not os.path.isfile(os.path.join("extension", f))]
if missing: sys.exit(f"missing: {missing}")
used = set()
for root, _, names in os.walk("extension"):
    for n in names:
        if n.endswith((".js", ".html", ".json")):
            s = open(os.path.join(root, n), encoding="utf-8").read()
            used |= set(re.findall(r'__MSG_(\w+)__', s))
            used |= set(re.findall(r'data-i18n="(\w+)"', s))
            used |= set(re.findall(r'\bt\("(\w+)"', s))
en = json.load(open("extension/_locales/en/messages.json", encoding="utf-8"))
undefined = sorted(k for k in used if k not in en)
if undefined: sys.exit(f"undefined i18n keys: {undefined}")
print(f"manifest OK v{m['version']} ({len(files)} files, {len(used)} i18n keys used)")
PY
for f in $(find extension -name '*.js') updater/host.py; do
  case "$f" in *.py) python3 -m py_compile "$f";; *) node --check "$f";; esac
done
echo "syntax OK"
python3 scripts/selector_check.py
node --test tests/
python3 tests/updater_zip_test.py
