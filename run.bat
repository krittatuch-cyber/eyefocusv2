@echo off
title Eye Focus Control Panel
:menu
cls
echo ===================================================
echo   Eye Focus - Optical Shop Management System
echo ===================================================
echo.
echo   [1] Run Local Development Server (Port 3001)
echo   [2] Run Cloudflare Preview (Local emulation)
echo   [3] Deploy to Cloudflare Pages/Workers (eyeforcusv2)
echo   [4] Install/Update Dependencies (npm install)
echo   [5] Exit
echo.
echo *Note: Please pause Google Drive Sync before running option [4]*
echo.
set /p opt="Select an option (1-5): "

if "%opt%"=="1" goto run_dev
if "%opt%"=="2" goto run_preview
if "%opt%"=="3" goto run_deploy
if "%opt%"=="4" goto install_deps
if "%opt%"=="5" exit
goto menu

:run_dev
echo.
echo Starting local dev server on port 3001...
call npm run dev
pause
goto menu

:run_preview
echo.
echo Building and running Cloudflare preview...
call npm run preview
pause
goto menu

:run_deploy
echo.
echo Deploying to Cloudflare (Project: eyeforcusv2)...
echo.
echo *Make sure you have logged in to Cloudflare first by running:*
echo   npx wrangler login
echo.
call npm run deploy
pause
goto menu

:install_deps
echo.
echo Installing dependencies...
echo (If this fails with EBADF/EPERM, make sure Google Drive Sync is PAUSED)
echo.
call npm install --no-audit --no-fund
pause
goto menu
