# 사이트 저장본 분석 (2026-10-02)

저장본: `sites/{claude,chatgpt,gemini}/` (빈 새 채팅 화면, Chrome "웹페이지, 전체").

| 사이트 | 입력창 | 에디터 | 발송 버튼 |
|--------|--------|--------|-----------|
| claude.ai | `div[contenteditable][role=textbox][data-testid="chat-input"]` | Tiptap(ProseMirror) | `button[data-testid="chat-input-send"]` (저장본에 존재) |
| chatgpt.com | `div.ProseMirror[contenteditable][role=textbox]` (aria-label "ChatGPT에게 물어보세요") | ProseMirror | 빈 화면이라 저장본에 없음. 알려진 셀렉터 `#composer-submit-button`, `button[data-testid="send-button"]` 사용 |
| gemini.google.com | `rich-textarea .ql-editor[contenteditable]` (aria-label "Gemini 프롬프트 입력") | Quill | 빈 화면이라 버튼 미노출. 번들에 `send-button` 클래스 다수 → `button.send-button` |

## 처리 방식 (세 사이트 공통)

- `window` capture `keydown` 리스너를 document_start 에 등록해 사이트 핸들러보다 먼저 판정한다.
- Enter 단독: 가로챈 뒤 입력창에 합성 Shift+Enter 를 보내 각 에디터 고유의 줄바꿈 처리를 태운다. 에디터가 처리하지 않으면 `execCommand("insertLineBreak")` 로 대체.
- Ctrl/Cmd+Enter: 발송 버튼이 있고 활성이면 클릭, 없으면 합성 Enter(수식키 없음)를 보내 사이트 기본 발송을 태운다.
- IME 조합 중(isComposing, keyCode 229), Shift+Enter, Alt+Enter 는 통과.
- 합성 이벤트는 WeakSet 으로 표시해 자기 리스너가 다시 가로채지 않는다.

## 한계

- 저장본은 정적 HTML 이라 에디터가 초기화되지 않으므로 실제 동작은 브라우저에서만 확인 가능.
- 사이트 UI 개편으로 셀렉터가 바뀌면 `extension/content/sites.js` 를 갱신한다. `scripts/check.sh` 의 저장본 셀렉터 검사는 새 저장본을 넣으면 다시 확인된다.
- 메시지 편집(기존 메시지 수정) 입력창은 대상이 아니다.
