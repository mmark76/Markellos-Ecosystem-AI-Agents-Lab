@echo off
cd /d "%~dp0"
echo ==========================================
echo Markellos Ecosystem AI Agents Lab - Local
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
