@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

if not exist "venv\Lib\site-packages\flask" (
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo Starting Flask server...
echo.
python app.py

pause
