# Vyapar Verse (VSS AI) - PowerShell Startup Script
$Host.UI.RawUI.WindowTitle = "Vyapar Verse (VSS AI) - Business Operating System"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Vyapar Verse (VSS AI) - AI Business Operating System" -ForegroundColor Yellow
Write-Host "  Your Business. One System. One Intelligent Sarthi." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Clean up lingering processes on 8000 and 3000
Write-Host "[1/3] Checking and freeing ports 8000 and 3000..." -ForegroundColor White
$ports = @(8000, 3000)
foreach ($port in $ports) {
    try {
        $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        if ($pids) {
            foreach ($p in $pids) {
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

# 2. Start Node.js backend
Write-Host "[2/3] Starting Node.js Authentication Backend (Port 3000)..." -ForegroundColor White
$backendDir = Join-Path $PSScriptRoot "backend"
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -WindowStyle Hidden

# 3. Launch browser in background after 3 seconds
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:8000/app/"
} | Out-Null

# 4. Start Python FastAPI Core
Write-Host "[3/3] Launching VSS AI Intelligence Backend Core (Port 8000)..." -ForegroundColor White
$pybackendDir = Join-Path $PSScriptRoot "pybackend"
$anacondaPy = "D:\env files\New folder\anaconda\envs\py310\python.exe"
$pythonExe = if (Test-Path $anacondaPy) { $anacondaPy } else { "python" }

Write-Host "Using Python Engine: $pythonExe" -ForegroundColor Green
Write-Host "Server running at http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Browser will open automatically." -ForegroundColor Yellow
Write-Host ""

Set-Location $pybackendDir
& $pythonExe main.py
