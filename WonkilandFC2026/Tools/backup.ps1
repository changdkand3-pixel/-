# 단계별 백업 (Windows PowerShell): Backups\WonkilandFC2026_<날짜시간>_<라벨>.zip
param([string]$Label = "manual")
$root = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = Join-Path $root "Backups\WonkilandFC2026_${stamp}_${Label}.zip"
$items = Get-ChildItem $root -Exclude "Backups", "node_modules" | ForEach-Object { $_.FullName }
Compress-Archive -Path $items -DestinationPath $dest -Force
Write-Host "Backup created: $dest"
