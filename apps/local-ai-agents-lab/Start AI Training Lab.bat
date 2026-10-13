@echo off
setlocal
cd /d "%~dp0"
call "%~dp0start-windows.bat"
exit /b %errorlevel%
