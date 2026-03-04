@echo off
echo ============================================
echo    ERP FLASK - Starting Production Server
echo ============================================
echo.

REM Set environment variables
set FLASK_HOST=0.0.0.0
set FLASK_PORT=5000
set FLASK_THREADS=4

REM Activate virtual environment if exists
if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)

REM Change to backend directory
cd backend

REM Run the server
echo Starting backend server on port %FLASK_PORT%...
python run_server.py

pause
