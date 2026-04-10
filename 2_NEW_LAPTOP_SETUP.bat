@echo off
color 0B
echo ===================================================
echo      ZENSAR SKILL NAVIGATOR - LAPTOP RESTORE
echo ===================================================
echo.
echo This script will automatically set up the project
echo on your new laptop.
echo.

:: Check Node.js installation
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  color 0C
  echo [ERROR] Node.js is NOT installed! 
  echo Please install Node.js from https://nodejs.org/ first.
  pause
  exit /b
) ELSE (
  echo [OK] Node.js found.
)

:: Ensure .env exists
IF NOT EXIST ".env" (
  echo [WARN] .env file not found.
  IF EXIST ".env.example" (
    echo Creating .env from .env.example...
    copy .env.example .env
  ) ELSE (
    echo DB_HOST=localhost > .env
    echo DB_PORT=1234 >> .env
    echo DB_USER=postgres >> .env
    echo DB_PASSWORD=Hmw@81323 >> .env
    echo DB_NAME=skillmatrix >> .env
    echo ENCRYPTION_KEY=zensar_secret_key_32_chars_long!! >> .env
    echo Created new default .env file.
  )
) ELSE (
  echo [OK] .env file found.
)

echo.
echo Step 1: Installing Required Dependencies...
echo This might take a few minutes. Please wait...
call npm install --legacy-peer-deps

IF %ERRORLEVEL% NEQ 0 (
  color 0E
  echo.
  echo [WARN] npm install finished with some errors or warnings.
  echo It might still work, but if it crashes, re-run this file.
) ELSE (
  color 0A
  echo.
  echo [SUCCESS] Dependencies Installed!
)

echo.
color 0B
echo ===================================================
echo SETUP COMPLETE!
echo.
echo Have you imported the 'skillmatrix_backup.sql'
echo into pgAdmin4 yet? If yes, you are good to go!
echo.
echo Double-click 'START_ALL.bat' to launch the app!
echo ===================================================
pause
