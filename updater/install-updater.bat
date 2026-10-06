@echo off
rem AI Chat Easy one-click updater registration (Windows, current user only).
chcp 65001 > nul
setlocal
set "HOST_NAME=io.github.lisyoen.ai_chat_easy"
set "HOST_PATH=%~dp0host.bat"
set "MANIFEST_PATH=%~dp0host-manifest.json"
set "JSON_HOST_PATH=%HOST_PATH:\=\\%"

rem Git is only needed for a git clone; a release-zip folder updates itself by download.
if exist "%~dp0..\.git" (
  where git > nul 2>&1
  if errorlevel 1 (
    echo [!] Git is not installed or not in PATH. / Git 이 설치되어 있지 않습니다.
    pause
    exit /b 1
  )
)

> "%MANIFEST_PATH%" echo {"name":"%HOST_NAME%","description":"AI Chat Easy one-click updater","type":"stdio","path":"%JSON_HOST_PATH%","allowed_origins":["chrome-extension://emkjegjjbdcpllicplemgbpnmfhbocde/"]}

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\%HOST_NAME%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\%HOST_NAME%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul
if errorlevel 1 (
  echo [!] Registration failed. / 등록 실패.
) else (
  echo [OK] Updater registered. / 업데이트 도우미 등록 완료.
  echo      %MANIFEST_PATH%
)
pause
