@echo off
rem Interview Prep launcher: one terminal running the server (logs visible), then the default browser. Double-click it — that's the whole design.
cd /d %~dp0
set PORT=1000
start "" cmd /k node server\proxy-server.js
ping -n 4 127.0.0.1 >nul
start http://localhost:1000
