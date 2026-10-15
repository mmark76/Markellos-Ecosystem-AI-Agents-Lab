[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$LabRoot
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($LabRoot)
$launcher = Join-Path $root 'Start AI Training Lab.bat'
$icon = Join-Path $root 'assets\ai-training-lab.ico'

if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
    $launcher = Join-Path $root 'start-windows.bat'
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
    throw 'The Local Lab launcher was not found.'
}
if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
    throw 'The Local Lab shortcut icon was not found.'
}

$shell = New-Object -ComObject WScript.Shell
$desktop = $shell.SpecialFolders('Desktop')
$shortcutPath = Join-Path $desktop 'Markellos Ecosystem AI Training Lab.lnk'
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = 'Set up and open the local Markellos AI Training Lab.'
$shortcut.Save()

# Register an app-owned, fixed local launch handler for the public dashboard.
# Per-user only: no administrator privileges and no URL-supplied arguments.
$handler = Join-Path $root 'scripts\launch-from-dashboard.ps1'
if (Test-Path -LiteralPath $handler -PathType Leaf) {
    $protocolKey = 'HKCU:\Software\Classes\markellos-ai-training-lab'
    $commandKey = Join-Path $protocolKey 'shell\open\command'
    New-Item -Path $protocolKey -Force | Out-Null
    Set-Item -Path $protocolKey -Value 'URL:AI Training Lab Protocol'
    New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
    New-Item -Path $commandKey -Force | Out-Null
    $quotedHandler = '"' + $handler + '"'
    $launchCommand = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File ' + $quotedHandler
    Set-Item -Path $commandKey -Value $launchCommand
}
