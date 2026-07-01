@echo off
REM Quick start script for Sewcut Billing System (Windows)

echo.
echo Starting Sewcut Billing System...
echo.

REM Check if we're in the right directory
if not exist "sewcut-backend" (
    echo Error: sewcut-backend directory not found
    echo Please run this script from the 'Sewcut Billing System' directory
    pause
    exit /b 1
)

if not exist "sewcut-frontend" (
    echo Error: sewcut-frontend directory not found
    echo Please run this script from the 'Sewcut Billing System' directory
    pause
    exit /b 1
)

echo Starting Backend (Django)...
start "Sewcut Backend" cmd /k "cd sewcut-backend && python manage.py runserver"

echo Starting Celery Worker...
start "Sewcut Celery Worker" cmd /k "cd sewcut-backend && celery -A sewcut worker -l info --pool=solo"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend (React)...
start "Sewcut Frontend" cmd /k "cd sewcut-frontend && npm run dev"

echo.
echo ========================================
echo   Sewcut Billing System Started!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo Admin:    http://127.0.0.1:8000/admin
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo Close the terminal windows to stop the servers.
echo.
pause
