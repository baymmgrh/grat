@echo off
echo ============================================================
echo   PT. Gratia Makmur Sentosa - ERP System
echo   Starting LAN Servers
echo ============================================================
echo.

echo Starting Backend Server...
cd /d "%~dp0backend"
start "ERP Backend" cmd /k "python app.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
cd /d "%~dp0frontend"
start "ERP Frontend" cmd /k "npm run dev-lan"

echo.
echo ============================================================
echo   Servers are starting...
echo   
echo   Backend:  http://192.168.0.75:5000
echo   Frontend: http://192.168.0.75:3000
echo   
echo   Access from other computers using these URLs
echo ============================================================
echo.
pause
