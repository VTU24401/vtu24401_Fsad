@echo off
echo Inventory System Setup Helper
echo ============================
echo.

echo Checking XAMPP installation...
if not exist "c:\xampp" (
    echo ERROR: XAMPP not found in c:\xampp
    echo Please install XAMPP first
    pause
    exit /b 1
)

echo ✓ XAMPP found
echo.

echo Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
echo ✓ Directories created
echo.

echo Starting Apache and MySQL...
cd /d c:\xampp
start /b apache_start.bat
start /b mysql_start.bat
timeout /t 3 >nul
echo ✓ Services starting...
echo.

echo Opening setup page in browser...
start http://localhost/inventory_system/quick_setup.php

echo.
echo Setup Instructions:
echo 1. Wait for services to start (10-15 seconds)
echo 2. In the browser, run the quick setup
echo 3. Delete quick_setup.php when done
echo 4. Access application at http://localhost/inventory_system/
echo.
echo Default login: admin / admin123
echo.
pause
