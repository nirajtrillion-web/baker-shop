@echo off
echo.
echo  ===============================
echo   BakerBliss - Cake Shop Server
echo  ===============================
echo.
echo  Starting server...
cd /d "%~dp0"
node api/index.js
pause
