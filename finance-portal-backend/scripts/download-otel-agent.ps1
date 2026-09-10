# ============================================================================
#  OpenTelemetry Java Agent indirir (v2.4.0) -> otel-agent\opentelemetry-javaagent.jar
#
#  Bu jar gitignore'da; her geliştirici bir kez çalıştırır:
#      .\scripts\download-otel-agent.ps1
#
#  run-dev.ps1 backend'i bu agent ile (-javaagent) başlatır.
# ============================================================================
$ErrorActionPreference = "Stop"

$version = "2.4.0"
$url = "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v$version/opentelemetry-javaagent.jar"
$destDir = Join-Path $PSScriptRoot "..\otel-agent"
$dest = Join-Path $destDir "opentelemetry-javaagent.jar"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

if (Test-Path $dest) {
    Write-Host "OTel Java Agent zaten var: $dest" -ForegroundColor Yellow
    Write-Host "Yeniden indirmek icin once dosyayi sil." -ForegroundColor Yellow
    exit 0
}

Write-Host "OTel Java Agent v$version indiriliyor..." -ForegroundColor Cyan
Write-Host "  $url"
Invoke-WebRequest -Uri $url -OutFile $dest

Write-Host "Tamam -> $dest" -ForegroundColor Green
