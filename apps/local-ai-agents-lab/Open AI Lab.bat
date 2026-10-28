@echo off
setlocal
cd /d "%~dp0"
rem Reuse the same local Open action as the public dashboard's Quick Start.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch-from-dashboard.ps1" -Action Open
if errorlevel 1 (
  echo AI Lab could not be opened. Run "Start AI Training Lab.bat" and review any setup messages.
  pause
  exit /b 1
)
endlocal
exit /b 0
