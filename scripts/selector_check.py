"""sites/ 저장본에서 입력창 셀렉터의 핵심 속성이 실제로 존재하는지 확인한다."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent / "sites"
checks = {
    "claude": [r'data-testid="chat-input"', r'data-testid="chat-input-send"'],
    "chatgpt": [r'class="ProseMirror"[^>]*|contenteditable="true"[^>]*class="ProseMirror"', r'role="textbox"'],
    "gemini": [r'<rich-textarea', r'class="ql-editor[^"]*"[^>]*contenteditable="true"'],
}
bad = 0
for site, pats in checks.items():
    html = next((root / site).glob("*.html"), None)
    if not html:
        print(f"{site}: 저장본 없음 (skip)"); continue
    text = html.read_text(encoding="utf-8", errors="ignore")
    for p in pats:
        ok = re.search(p, text) is not None
        bad += not ok
        print(f"{site}: {'OK ' if ok else 'NG '} {p}")
sys.exit(1 if bad else 0)
