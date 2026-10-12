@echo off
setlocal
cd /d "%~dp0"
rem Create or refresh the local shortcut only. This script never installs software or downloads models.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create-desktop-shortcut.ps1" -LabRoot "%~dp0" >nul 2>&1
echo ==========================================
echo Markellos AI Agents University Lab - Local
echo Open: http://127.0.0.1:8765/
echo Close this window or press Ctrl+C to stop.
echo ==========================================
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 server.py
) else (
  python server.py
)
pause
endlocal
