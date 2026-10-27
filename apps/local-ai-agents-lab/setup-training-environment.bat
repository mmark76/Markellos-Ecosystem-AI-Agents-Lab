@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-training.ps1"
set "result=%ERRORLEVEL%"
if not "%result%"=="0" echo Training setup did not complete. Review the message above.
pause
exit /b %result%
