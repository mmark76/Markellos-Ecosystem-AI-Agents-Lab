[CmdletBinding()]
param(
    [ValidateSet('Open', 'Refresh', 'Stop')]
    [string]$Action = 'Open'
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$launcher = Join-Path $root 'Start AI Training Lab.bat'
$localUrl = 'http://127.0.0.1:8765/'
function Test-LocalLab {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $localUrl -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content -match 'AI Lab'
    } catch { return $false }
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) { exit 1 }
if ($Action -eq 'Stop') {
    $preflight = Join-Path $PSScriptRoot 'prepare-local-server.ps1'
    if (-not (Test-Path -LiteralPath $preflight -PathType Leaf)) { exit 1 }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File $preflight -LabRoot $root -StopOnly
    exit $LASTEXITCODE
}
if ($Action -eq 'Refresh' -or -not (Test-LocalLab)) {
    Start-Process -FilePath $launcher -WorkingDirectory $root
    for ($attempt = 0; $attempt -lt 240; $attempt++) {
        Start-Sleep -Seconds 1
        if (Test-LocalLab) { break }
    }
}
if (Test-LocalLab) {
    if ($Action -eq 'Open') { Start-Process $localUrl }
    exit 0
}
exit 1
