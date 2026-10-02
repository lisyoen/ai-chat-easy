# ai-chat-easy

Claude, ChatGPT, Gemini 등 상용 AI 챗봇 웹 UI를 더 편하게 쓰게 해 주는 Chrome 확장(Manifest V3).

## 기능 (v0.1.0)

지원 사이트: claude.ai, chatgpt.com, gemini.google.com

| 키 | 동작 |
|----|------|
| Enter | 줄바꿈 |
| Ctrl+Enter (macOS Cmd+Enter) | 메시지 발송 |
| Shift+Enter, Alt+Enter | 사이트 기본 동작 그대로 |
| 한글 조합 중 Enter | 조합 확정 (가로채지 않음) |

## 설치

1. Chrome 주소창에 `chrome://extensions` 입력
2. 오른쪽 위 "개발자 모드" 켜기
3. "압축해제된 확장 프로그램을 로드" → `<clone 경로>\extension` 선택
4. 이미 열려 있던 claude.ai / ChatGPT / Gemini 탭은 새로고침

## 업데이트

`git pull` 후 `chrome://extensions` 의 AI Chat Easy 카드에서 새로고침(↻) 버튼을 누르고, 사이트 탭을 새로고침한다.

## 개발

- 소스: `extension/` (빌드 없음, 이 폴더가 그대로 설치본)
- 검증: `bash scripts/check.sh` (manifest, 문법, 저장본 셀렉터, 단위 테스트)
- 분석 기록: `docs/analysis.md`

## 설치

1. Chrome 주소창에 `chrome://extensions` 입력
2. 오른쪽 위 "개발자 모드" 켜기
3. "압축해제된 확장 프로그램을 로드" → `<clone 경로>\extension` 선택
4. 이미 열려 있던 claude.ai / ChatGPT / Gemini 탭은 새로고침

## 업데이트

`git pull` 후 `chrome://extensions` 의 AI Chat Easy 카드에서 새로고침(↻) 버튼을 누르고, 사이트 탭을 새로고침한다.

## 개발

- 소스: `extension/` (빌드 없음, 이 폴더가 그대로 설치본)
- 검증: `bash scripts/check.sh` (manifest, 문법, 저장본 셀렉터, 단위 테스트)
- 분석 기록: `docs/analysis.md`

## 폴더 구조

| 경로 | 용도 |
|------|------|
| `sites/claude/` | claude.ai 저장 페이지 (구조 분석용 원본) |
| `sites/chatgpt/` | chatgpt.com 저장 페이지 |
| `sites/gemini/` | gemini.google.com 저장 페이지 |

## 사이트 저장본 업로드 방법

1. Chrome 에서 대상 사이트의 채팅 화면(입력창이 보이는 상태)을 연다.
2. `Ctrl+S` → 형식 "웹페이지, 전체" 로 저장한다. `{이름}.html` 과 `{이름}_files/` 폴더가 생긴다.
3. 둘 다 해당 사이트 폴더(예: `sites/claude/`)에 넣고 commit·push 한다.

저장본에는 대화 내용·계정 이메일이 포함될 수 있으므로 레포는 private 으로 유지한다. 가능하면 새 대화(빈 채팅) 화면에서 저장한다.
