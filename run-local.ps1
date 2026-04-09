$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8124
$url = "http://127.0.0.1:$port/"

Write-Host ""
Write-Host "Starting local server for Launch Tracker Dashboard..." -ForegroundColor Cyan
Write-Host "Folder: $projectRoot"
Write-Host "Open:   $url"
Write-Host "Press Ctrl+C to stop the server."
Write-Host ""

Set-Location $projectRoot
python -m http.server $port
