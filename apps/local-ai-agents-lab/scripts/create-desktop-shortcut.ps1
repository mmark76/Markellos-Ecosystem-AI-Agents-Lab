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
$preferencesFile = Join-Path $root 'data\setup-preferences.json'

if (-not (Test-Path -LiteralPath $preferencesFile -PathType Leaf)) { throw 'Setup preferences are missing.' }
$preferences = Get-Content -LiteralPath $preferencesFile -Raw | ConvertFrom-Json
if ($preferences.schema -ne 1 -or $preferences.desktopShortcut -isnot [bool]) { throw 'Invalid Desktop shortcut preference.' }
if (-not $preferences.desktopShortcut) { exit 0 }
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
    throw 'The Local Lab launcher was not found.'
}
if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
    throw 'The Local Lab shortcut icon was not found.'
}

$shell = New-Object -ComObject WScript.Shell
$desktop = $shell.SpecialFolders('Desktop')
$shortcutPath = Join-Path $desktop 'Markellos Ecosystem AI Lab.lnk'
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = 'Set up and open the local Markellos AI Lab.'
$shortcut.Save()
