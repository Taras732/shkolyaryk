# Decrypt secrets/dev.env (SOPS+age) -> .env at repo root (Windows).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not $env:SOPS_AGE_KEY_FILE) {
  $env:SOPS_AGE_KEY_FILE = Join-Path $env:APPDATA "sops\age\keys.txt"
}
if (-not (Test-Path $env:SOPS_AGE_KEY_FILE)) {
  Write-Error "age key not found at $env:SOPS_AGE_KEY_FILE"
}

sops -d "$root\secrets\dev.env" | Out-File -FilePath "$root\.env" -Encoding ascii -NoNewline
Write-Output "OK: .env generated from secrets/dev.env"
