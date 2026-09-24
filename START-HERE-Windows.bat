@echo off
setlocal
title BIS Learn - running on this computer
cd /d "%~dp0"

echo.
echo  ==================================================
echo    BIS Learn - starting on this computer
echo  ==================================================
echo.

if not exist "package.json" goto :nofolder
if not exist "scripts\launch.mjs" goto :nofolder

where node >nul 2>nul
if errorlevel 1 goto :nonode

node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)"
if errorlevel 1 goto :oldnode

node scripts\launch.mjs
set "CODE=%ERRORLEVEL%"
if "%CODE%"=="10" goto :opened
if not "%CODE%"=="0" goto :failed

echo.
echo The site has stopped.
pause
exit /b 0

:opened
echo.
echo The site was already running, so it was opened in your browser.
timeout /t 5 >nul
exit /b 0

:nofolder
echo Could not find the project files next to this file.
echo First extract - unzip - the whole bis-learn folder,
echo then double-click START-HERE-Windows.bat inside that folder.
goto :end

:nonode
echo Node.js is not installed on this computer.
echo   1. Go to https://nodejs.org and download the LTS version.
echo   2. Install it with the default options.
echo   3. Double-click this file again.
goto :end

:oldnode
for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Your Node.js version is %NODEVER%, which is too old. Version 20.9 or newer is needed.
echo Download the LTS version from https://nodejs.org, install it, then double-click this file again.
goto :end

:failed
echo.
echo The site could not start. Read the message above, fix it and double-click this file again.
echo If it keeps failing, take a photo of this window and send it to the person helping you.
goto :end

:end
echo.
pause
exit /b 1
