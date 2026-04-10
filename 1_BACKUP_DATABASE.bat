@echo off
color 0B
echo ===================================================
echo     ZENSAR SKILL NAVIGATOR - DATABASE BACKUP
echo ===================================================
echo.
echo This script will backup your PostgreSQL database
echo so you can move it to your new laptop.
echo.
echo NOTE: Ensure you don't enter empty passwords if prompted.
echo.

set PGPASSWORD=Hmw@81323
set DB_PORT=1234
set DB_USER=postgres
set DB_NAME=skillmatrix

echo Exporting database '%DB_NAME%' on port %DB_PORT%...
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U %DB_USER% -p %DB_PORT% -c -F p %DB_NAME% > skillmatrix_backup.sql

IF %ERRORLEVEL% NEQ 0 (
  echo.
  color 0C
  echo [ERROR] The automated backup failed!
  echo Reason: Could not find Postgres v17 in the default C:\ folder OR database is offline.
  echo.
  echo Please open pgAdmin4 and backup the 'skillmatrix' database manually.
) ELSE (
  echo.
  color 0A
  echo [SUCCESS] Backup Complete! 
  echo The database backup has been saved as 'skillmatrix_backup.sql'.
  echo You can now copy this entire folder to your pendrive.
)

echo.
pause
