@echo off
echo ========================================
echo Starting Frontend Development Server
echo ========================================
echo.

cd frontend

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting Vite development server...
echo.
call npm run dev

pause
