@echo off
setlocal
cd /d "%~dp0"
for /f "usebackq delims=" %%V in ("%~dp0VERSION") do set "LAB_VERSION=%%V"
if /I not "%~1"=="--launch-server" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\easy-start.ps1" -LabRoot "%~dp0."
  if errorlevel 1 (
    echo Easy Start did not complete. No unapproved installation was performed.
    pause
    exit /b 1
  )
  powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\finish-setup.ps1" -LabRoot "%~dp0."
  if errorlevel 1 (
    echo Setup was cancelled or could not save your preferences.
    pause
    exit /b 1
  )
  call "%~f0" --launch-server
  exit /b %errorlevel%
)
rem Confirm ownership before replacing a local server on port 8765.
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\prepare-local-server.ps1" -LabRoot "%~dp0."
if errorlevel 1 (
  echo The local server was not started. Review the message above.
  pause
  exit /b 1
)
rem Dashboard handlers are independent of the optional Desktop shortcut.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\register-dashboard-protocols.ps1" -LabRoot "%~dp0."
if errorlevel 1 echo Warning: Dashboard launch actions could not be registered.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create-desktop-shortcut.ps1" -LabRoot "%~dp0."
if errorlevel 1 echo Warning: Desktop shortcut preference could not be applied.
echo ==========================================
echo AI Training Lab v%LAB_VERSION%
echo Open: http://127.0.0.1:8765/
echo Close this window or press Ctrl+C to stop.
echo ==========================================
where py >nul 2>&1
if exist "%~dp0.openai-connection-venv\Scripts\python.exe" (
  "%~dp0.openai-connection-venv\Scripts\python.exe" "%~dp0server.py"
) else if %errorlevel%==0 (
  py -3 "%~dp0server.py"
) else (
  python "%~dp0server.py"
)
pause
endlocal
