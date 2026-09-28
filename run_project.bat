@echo off
title Finance Advisory Runner

echo ===================================================
echo   Starting Finance Advisory Project Services
echo ===================================================

echo [1/3] Launching Python Machine Learning Service...
start "Finance ML Service" /D "%~dp0smart-finance-ml" cmd /k .\venv\Scripts\python.exe app.py

echo [2/3] Launching Node.js Backend API...
start "Finance Backend Service" /D "%~dp0smart-finance-backend" cmd /k npm run dev

echo [3/3] Launching Vite Frontend...
start "Finance Frontend" /D "%~dp0smart-finance-advisory" cmd /k npm run dev

echo ===================================================
echo   All services are launching in separate windows!
echo   - ML Service: http://localhost:8000
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:3000
echo ===================================================
pause
