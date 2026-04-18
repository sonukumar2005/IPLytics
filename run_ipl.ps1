# IPL Analytics Dashboard - Start All Services
# This script starts the ML service, Backend, and Frontend in separate windows.

Write-Host "🚀 Starting IPL Analytics Dashboard..." -ForegroundColor Cyan

# 1. Start ML Service
Write-Host "Starting ML Service (Port 5000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ipl-ml; pip install -r requirements.txt; python app.py"

# 2. Start Spring Boot Backend
Write-Host "Starting Backend Service (Port 8080)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ipl-backend; mvn spring-boot:run"

# 3. Start React Frontend
Write-Host "Starting Frontend (Port 5173)..."
# Try to find npm/node if not in path
$npmPath = "npm"
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
        $npmPath = "C:\Program Files\nodejs\npm.cmd"
    }
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ipl-frontend; & '$npmPath' install; & '$npmPath' run dev"

Write-Host "✅ All processes initiated. Please check the new windows for status." -ForegroundColor Green
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend: http://localhost:8080"
Write-Host "- ML Service: http://localhost:5000"
