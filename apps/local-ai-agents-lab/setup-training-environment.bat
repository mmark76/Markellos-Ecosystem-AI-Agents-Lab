@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-training.ps1"
set "training_result=%ERRORLEVEL%"
if "%training_result%"=="0" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\show-training-setup-result.ps1" -Result Completed
) else (
  if "%training_result%"=="10" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\show-training-setup-result.ps1" -Result Cancelled
  ) else (
    echo Training setup did not complete. Review the message above.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\show-training-setup-result.ps1" -Result Failed
  )
)
if errorlevel 1 (
  echo Press any key to close this window.
  pause >nul
)
exit /b %training_result%
