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
        if ($response.StatusCode -eq 200 -and $response.Content -match 'AI Lab') { return $localUrl }
        return $null
    } catch { return $null }
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) { exit 1 }
if ($Action -eq 'Stop') {
    $preflight = Join-Path $PSScriptRoot 'prepare-local-server.ps1'
    if (-not (Test-Path -LiteralPath $preflight -PathType Leaf)) { exit 1 }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File $preflight -LabRoot $root -StopOnly
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $offer = Join-Path $PSScriptRoot 'offer-preferred-port-stop.ps1'
    if (-not (Test-Path -LiteralPath $offer -PathType Leaf)) { exit 1 }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File $offer
    exit $LASTEXITCODE
}
. (Join-Path $PSScriptRoot 'prepare-local-server.ps1') -PolicyOnly
. (Join-Path $PSScriptRoot 'get-local-lab-url.ps1')
$localUrl = if ($Action -ne 'Refresh') { Test-LocalLab } else { $null }
if ($Action -eq 'Refresh' -or -not $localUrl) {
    Start-Process -FilePath $launcher -WorkingDirectory $root
    for ($attempt = 0; $attempt -lt 240; $attempt++) {
        Start-Sleep -Seconds 1
        $localUrl = Test-LocalLab
        if ($localUrl) { break }
    }
}
if ($localUrl) {
    if ($Action -eq 'Open') {
        Start-Process $localUrl
    }
    exit 0
}
exit 1
