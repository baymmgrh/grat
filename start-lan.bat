@echo off
echo ========================================
echo   PT. Gratia Makmur Sentosa - ERP System
echo   Starting LAN Server...
echo ========================================

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)
:found

echo.
echo Server akan berjalan di:
echo - Backend:  http://%LOCAL_IP%:5000
echo - Frontend: http://%LOCAL_IP%:3000
echo.
echo Komputer lain di LAN bisa akses dengan IP: %LOCAL_IP%
echo.

REM Start backend
echo Starting Backend Server...
start "ERP Backend" cmd /k "cd /d backend && python app.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting Frontend Server...
start "ERP Frontend" cmd /k "cd /d frontend && npm run dev-lan"

echo.
echo ========================================
echo   Servers started successfully!
echo   Backend:  http://%LOCAL_IP%:5000
echo   Frontend: http://%LOCAL_IP%:3000
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
