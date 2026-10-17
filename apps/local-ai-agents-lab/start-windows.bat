@echo off
setlocal
cd /d "%~dp0"
if /I not "%~1"=="--launch-server" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\easy-start.ps1" -LabRoot "%~dp0."
  if errorlevel 1 (
    echo Easy Start did not complete. No unapproved installation was performed.
    pause
    exit /b 1
  )
  call "%~f0" --launch-server
  exit /b %errorlevel%
)
rem Easy Start completed; create or refresh the local shortcut before opening the local server.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create-desktop-shortcut.ps1" -LabRoot "%~dp0." >nul 2>&1
echo ==========================================
echo Markellos Ecosystem AI Lab
echo Open: http://127.0.0.1:8765/
echo Close this window or press Ctrl+C to stop.
echo ==========================================
where py >nul 2>&1
if exist "%~dp0.openai-connection-venv\Scripts\python.exe" (
  "%~dp0.openai-connection-venv\Scripts\python.exe" server.py
) else if %errorlevel%==0 (
  py -3 server.py
) else (
  python server.py
)
pause
endlocal
