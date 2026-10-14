@echo off
echo.
echo  ===============================
echo   BakerBliss - Cake Shop Server
echo  ===============================
echo.
echo  Starting backend server...
cd /d "%~dp0backend"
node server.js
pause
