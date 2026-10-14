@echo off
echo.
echo  ======================================================
echo     BakerBliss - Live Cake Shop Public Server
echo  ======================================================
echo.
echo  Starting backend server...
start /b cmd /c "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak >nul

echo  Starting public tunnel...
echo  Your website will be accessible on any phone, tablet, or PC!
ssh -o StrictHostKeyChecking=no -R 80:localhost:5000 nokey@localhost.run
pause
