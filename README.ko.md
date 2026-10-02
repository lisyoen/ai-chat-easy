<p align="center"><img src="assets/icon.svg" width="96" alt="AI Chat Easy"></p>

<h1 align="center">AI Chat Easy</h1>

<p align="center">AI 챗봇용 스위스 아미 나이프. Claude, ChatGPT, Gemini 를 더 편하게 쓰게 해 주는 작은 Chrome 확장입니다.</p>

<p align="center"><a href="README.md">English</a> · <b>한국어</b></p>

## 도구

| 도구 | 하는 일 | 기본 키 |
|------|---------|---------|
| Enter = 줄바꿈 | Enter 는 줄바꿈만 하므로 긴 프롬프트를 실수로 보내지 않습니다. 발송은 Ctrl+Enter (macOS Cmd+Enter). 한글 등 입력기 조합 중 Enter 는 건드리지 않습니다. | Enter / Ctrl+Enter |
| 명령 팔레트 | 프롬프트 스니펫과 빠른 동작을 검색해서 실행합니다. | Alt+/ |
| 프롬프트 스니펫 | 자주 쓰는 프롬프트를 커서 위치에 넣습니다. 설정 페이지에서 편집합니다. | 팔레트에서 |
| 다른 AI에게 묻기 | 쓰고 있던 프롬프트를 다른 챗봇 새 대화에 채워서 엽니다. | 팔레트에서 |
| 입력창으로 이동 | 페이지 어디에서든 채팅 입력창에 포커스합니다. | Alt+I |
| 빠른 동작 | 지금 프롬프트 복사, 입력창 비우기. | 팔레트에서 |

툴바 팝업에서 도구별, 사이트별로 켜고 끌 수 있습니다.

지원 사이트: `claude.ai`, `chatgpt.com` (`chat.openai.com`), `gemini.google.com`

## 설치

아직 Chrome 웹 스토어에는 없습니다. 아래 두 방법 중 하나를 쓰세요.

### A. Git clone (권장, 원클릭 업데이트)

1. 저장소 clone: `git clone https://github.com/lisyoen/ai-chat-easy.git`
2. `chrome://extensions` 에서 **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드** → clone 한 폴더 안의 `extension` 폴더 선택
3. 업데이트 도우미를 한 번만 등록
   - Windows: `updater\install-updater.bat` 더블클릭
   - macOS / Linux: `bash updater/install-updater.sh`

새 버전이 나오면 툴바 아이콘에 **NEW** 배지가 뜹니다. 아이콘을 클릭하면 확장이 업데이트를 받고 스스로 다시 로드합니다.

### B. 릴리스 zip

[Releases](https://github.com/lisyoen/ai-chat-easy/releases/latest) 에서 `ai-chat-easy-vX.Y.Z.zip` 을 받아 압축을 풀고 **압축해제된 확장 프로그램을 로드**로 불러옵니다. 업데이트가 있으면 **NEW** 배지는 똑같이 뜨고, 클릭하면 릴리스 페이지가 열려 새 zip 을 받을 수 있습니다.

Chrome, Edge 등 Chromium 계열 브라우저에서 동작합니다.

## 개인정보

AI Chat Easy 는 서버가 없고 아무것도 수집하지 않습니다. 설정과 스니펫은 `chrome.storage.sync` 로 사용자 브라우저 프로필에만 저장됩니다. 확장이 하는 네트워크 요청은 이 저장소의 `publish/latest.json` 버전 확인 하나뿐입니다. [PRIVACY.md](PRIVACY.md) 참고.

## 개발

- `extension/` 이 확장 그 자체이며 빌드 단계가 없습니다.
- `bash scripts/check.sh` : manifest·다국어 키 점검, 저장 페이지 셀렉터 점검, 단위 테스트
- `tests/e2e/run.mjs` : Playwright 로 Chromium 에 확장을 올려 대역 채팅 페이지에서 동작 확인
- `scripts/release.sh <버전>` : 버전 갱신, `publish/latest.json` 갱신, zip 생성, 태그, GitHub 릴리스 발행
- 사이트 셀렉터는 `extension/content/sites.js` 에 있습니다. 새 챗봇 추가는 [docs/analysis.md](docs/analysis.md), [CONTRIBUTING.md](CONTRIBUTING.md) 참고.

챗봇 사이트는 화면 구조가 자주 바뀝니다. 어떤 사이트에서 도구가 안 되면 사이트 이름과 누른 키를 적어 이슈로 남겨 주세요.

## 라이선스

[MIT](LICENSE)
