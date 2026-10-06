#!/usr/bin/env python3
"""AI Chat Easy native messaging host (macOS/Linux).

Two install layouts are supported:
  git clone   : <repo>/updater/host.py, extension in <repo>/extension -> git pull --ff-only
  release zip : <folder>/updater/host.py, manifest.json in <folder>    -> download the latest
                release zip from GitHub and replace the files in place.
Afterwards the extension reloads itself (same as the reload button on chrome://extensions).
"""
import io, json, os, re, shutil, struct, subprocess, sys, time, urllib.request, zipfile

REPO = "lisyoen/ai-chat-easy"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LATEST_URL = os.environ.get("AICE_LATEST_URL", f"https://raw.githubusercontent.com/{REPO}/main/publish/latest.json")
DOWNLOAD_BASE = os.environ.get("AICE_DOWNLOAD_BASE", f"https://github.com/{REPO}/releases/download")
KEEP = {"updater", ".aice-update"}
VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")


def read_message():
    raw = sys.stdin.buffer.read(4)
    if len(raw) < 4:
        sys.exit(0)
    length = struct.unpack("<I", raw)[0]
    return json.loads(sys.stdin.buffer.read(length).decode("utf-8"))


def send(msg):
    data = json.dumps(msg).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(data)) + data)
    sys.stdout.buffer.flush()


def git(*args):
    p = subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()


def update_git():
    code, before = git("rev-parse", "--short", "HEAD")
    if code:
        return {"ok": False, "upToDate": False, "mode": "git", "message": before}
    code, out = git("pull", "--ff-only")
    if code:
        return {"ok": False, "upToDate": False, "mode": "git", "before": before, "after": before, "message": out}
    _, after = git("rev-parse", "--short", "HEAD")
    return {"ok": True, "upToDate": before == after, "mode": "git", "before": before, "after": after, "message": out}


def vtuple(v):
    return tuple(int(x) for x in v.split("."))


def manifest_version(folder):
    with open(os.path.join(folder, "manifest.json"), encoding="utf-8") as f:
        return str(json.load(f)["version"])


def fetch(url):
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "ai-chat-easy-updater"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def update_release(requested):
    before = manifest_version(ROOT)
    latest = requested if VERSION_RE.match(requested or "") else ""
    if not latest:
        latest = str(json.loads(fetch(f"{LATEST_URL}?t={int(time.time())}"))["version"])
    if not VERSION_RE.match(latest):
        raise ValueError(f"Invalid version from server: {latest}")
    if vtuple(latest) <= vtuple(before):
        return {"ok": True, "upToDate": True, "mode": "zip", "before": before, "after": before, "message": f"Already v{before}"}

    stage = os.path.join(ROOT, ".aice-update")
    shutil.rmtree(stage, ignore_errors=True)
    new_dir, old_dir = os.path.join(stage, "new"), os.path.join(stage, "old")
    os.makedirs(new_dir)
    os.makedirs(old_dir)
    url = f"{DOWNLOAD_BASE}/v{latest}/ai-chat-easy-v{latest}.zip"
    with zipfile.ZipFile(io.BytesIO(fetch(url))) as z:
        z.extractall(new_dir)
    if not os.path.isfile(os.path.join(new_dir, "manifest.json")):
        raise ValueError(f"manifest.json not found in {url}")
    got = manifest_version(new_dir)
    if got != latest:
        raise ValueError(f"Downloaded package is v{got}, expected v{latest}")

    moved = []
    try:
        for name in os.listdir(ROOT):
            if name in KEEP:
                continue
            shutil.move(os.path.join(ROOT, name), os.path.join(old_dir, name))
            moved.append(name)
        for name in os.listdir(new_dir):
            if name == "updater":
                continue
            src, dst = os.path.join(new_dir, name), os.path.join(ROOT, name)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)
    except Exception as e:
        for name in os.listdir(ROOT):
            if name in KEEP:
                continue
            p = os.path.join(ROOT, name)
            shutil.rmtree(p, ignore_errors=True) if os.path.isdir(p) else os.remove(p)
        for name in moved:
            shutil.move(os.path.join(old_dir, name), os.path.join(ROOT, name))
        raise RuntimeError(f"Update rolled back: {e}")

    new_updater = os.path.join(new_dir, "updater")
    if os.path.isdir(new_updater):
        for name in os.listdir(new_updater):
            src = os.path.join(new_updater, name)
            if os.path.isfile(src):
                try:
                    shutil.copy2(src, os.path.join(ROOT, "updater", name))
                except OSError:
                    pass
        try:
            os.chmod(os.path.join(ROOT, "updater", "host.py"), 0o755)
        except OSError:
            pass
    shutil.rmtree(stage, ignore_errors=True)
    return {"ok": True, "upToDate": False, "mode": "zip", "before": before, "after": latest, "message": f"Updated v{before} -> v{latest}"}


def main():
    msg = read_message()
    if msg.get("action") != "update":
        send({"ok": False, "upToDate": False, "message": "Unknown action."})
        return
    if os.path.exists(os.path.join(ROOT, ".git")):
        send(update_git())
    elif os.path.isfile(os.path.join(ROOT, "manifest.json")):
        send(update_release(str(msg.get("version") or "")))
    else:
        send({"ok": False, "upToDate": False, "message": f"Neither a git clone nor a release folder: {ROOT}"})


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # report instead of crashing silently
        send({"ok": False, "upToDate": False, "message": str(e)})
