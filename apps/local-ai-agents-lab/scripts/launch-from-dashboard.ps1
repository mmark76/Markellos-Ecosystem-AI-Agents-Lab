[CmdletBinding()]
param(
    [ValidateSet('Open', 'Refresh', 'Stop')]
    [string]$Action = 'Open'
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$launcher = Join-Path $root 'Start Local Server.bat'
function Test-LocalLab {
    try {
        $localUrl = Get-LocalLabUrl -LabRoot $root
        if (-not $localUrl) { return $false }
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
. (Join-Path $PSScriptRoot 'prepare-local-server.ps1') -PolicyOnly
. (Join-Path $PSScriptRoot 'get-local-lab-url.ps1')
if ($Action -eq 'Refresh' -or -not (Test-LocalLab)) {
    Start-Process -FilePath $launcher -WorkingDirectory $root
    for ($attempt = 0; $attempt -lt 240; $attempt++) {
        Start-Sleep -Seconds 1
        if (Test-LocalLab) { break }
    }
}
if (Test-LocalLab) {
    if ($Action -eq 'Open') {
        $localUrl = Get-LocalLabUrl -LabRoot $root
        if (-not $localUrl) { exit 1 }
        Start-Process $localUrl
    }
    exit 0
}
exit 1
