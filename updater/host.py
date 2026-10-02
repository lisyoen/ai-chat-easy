#!/usr/bin/env python3
"""AI Chat Easy native messaging host (macOS/Linux): runs `git pull --ff-only` in this clone."""
import json, os, struct, subprocess, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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
    p = subprocess.run(["git", "-C", REPO, *args], capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()

def main():
    msg = read_message()
    if msg.get("action") != "update":
        send({"ok": False, "upToDate": False, "message": "Unknown action."})
        return
    code, before = git("rev-parse", "--short", "HEAD")
    if code:
        send({"ok": False, "upToDate": False, "message": before})
        return
    code, out = git("pull", "--ff-only")
    if code:
        send({"ok": False, "upToDate": False, "before": before, "after": before, "message": out})
        return
    _, after = git("rev-parse", "--short", "HEAD")
    send({"ok": True, "upToDate": before == after, "before": before, "after": after, "message": out})

if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # report instead of crashing silently
        send({"ok": False, "upToDate": False, "message": str(e)})
