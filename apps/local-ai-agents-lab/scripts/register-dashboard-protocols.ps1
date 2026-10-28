[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$LabRoot
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($LabRoot)
. (Join-Path $PSScriptRoot 'get-lab-version.ps1')
$version = Get-LabVersion $root

# The dashboard actions work independently of the optional Desktop shortcut.
# Registration is scoped to the current Windows user and takes no URL arguments.
$handler = Join-Path $root 'scripts\launch-from-dashboard.ps1'
if (-not (Test-Path -LiteralPath $handler -PathType Leaf)) { throw 'The dashboard handler was not found.' }
$quotedHandler = '"' + $handler + '"'
foreach ($registration in @(
    @{ Name = 'markellos-ai-training-lab'; Description = "URL:AI Training Lab v$version Protocol"; Action = 'Open' },
    @{ Name = 'markellos-ai-training-lab-refresh'; Description = "URL:AI Training Lab v$version Server Refresh Protocol"; Action = 'Refresh' },
    @{ Name = 'markellos-ai-training-lab-stop'; Description = "URL:AI Training Lab v$version Server Stop Protocol"; Action = 'Stop' }
)) {
    $protocolKey = 'HKCU:\Software\Classes\' + $registration.Name
    $commandKey = Join-Path $protocolKey 'shell\open\command'
    New-Item -Path $protocolKey -Force | Out-Null
    Set-Item -Path $protocolKey -Value $registration.Description
    New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
    New-Item -Path $commandKey -Force | Out-Null
    $launchCommand = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File ' + $quotedHandler + ' -Action ' + $registration.Action
    Set-Item -Path $commandKey -Value $launchCommand
}
