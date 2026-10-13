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
