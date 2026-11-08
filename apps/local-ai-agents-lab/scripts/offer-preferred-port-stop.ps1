# Stop a single, safely identified current-user owner of the preferred port only
# after a separate explicit confirmation. No arbitrary port or PID is accepted.
param([switch]$PolicyOnly)
$ErrorActionPreference = 'Stop'
function Show-PortMessage {
    param([string]$Message, [switch]$Confirm, [switch]$Warning)
    Add-Type -AssemblyName System.Windows.Forms
    if ($Confirm) {
        return [System.Windows.Forms.MessageBox]::Show($Message, 'AI Lab - Close another application?', [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Warning, [System.Windows.Forms.MessageBoxDefaultButton]::Button2) -eq [System.Windows.Forms.DialogResult]::Yes
    }
    $icon = if ($Warning) { [System.Windows.Forms.MessageBoxIcon]::Warning } else { [System.Windows.Forms.MessageBoxIcon]::Information }
    [System.Windows.Forms.MessageBox]::Show($Message, 'AI Lab - Local server', [System.Windows.Forms.MessageBoxButtons]::OK, $icon) | Out-Null
}
function Invoke-PreferredPortStop {
try {
    . (Join-Path $PSScriptRoot 'get-local-listeners.ps1')
    $listeners = @(Get-LocalListeners -Port 8765)
    if ($listeners.Count -eq 0) {
        Show-PortMessage 'Port 8765 is available.'
        return 0
    }
    if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1') { throw 'Port 8765 is in use, but its owner cannot be identified safely. No other application was stopped.' }
    $ownerPid = [int]$listeners[0].OwningProcess
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop
    if (-not $owner -or -not $owner.CreationDate -or -not $owner.CommandLine -or -not $owner.ExecutablePath -or
        $owner.Name -notmatch '^[\w. -]{1,100}\.exe$' -or $owner.Name -like 'ollama*' -or $ownerPid -eq $PID -or
        $owner.Name -in @('explorer.exe','svchost.exe','services.exe','lsass.exe','csrss.exe','wininit.exe','winlogon.exe','dwm.exe','system.exe','ollama.exe')) {
        throw 'Port 8765 is in use, but its owner cannot be closed safely. No other application was stopped.'
    }
    $windowsDir = [IO.Path]::GetFullPath($env:SystemRoot).TrimEnd('\') + '\'
    if ([IO.Path]::GetFullPath($owner.ExecutablePath).StartsWith($windowsDir, [StringComparison]::OrdinalIgnoreCase)) { throw 'Port 8765 is held by a protected Windows process. No other application was stopped.' }
    $who = Invoke-CimMethod -InputObject $owner -MethodName GetOwner -ErrorAction Stop
    if ($who.ReturnValue -ne 0 -or -not $who.Domain -or -not $who.User -or
        -not [string]::Equals("$($who.Domain)\$($who.User)", [Security.Principal.WindowsIdentity]::GetCurrent().Name, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Port 8765 is in use by an unverifiable or different-user process. No other application was stopped.'
    }
    $message = "Port 8765 is used by $($owner.Name) (PID $ownerPid), which may be running in the background. AI Lab can use an alternative port. Close this application? The whole process and its other tasks will stop; unsaved work may be lost."
    $choice = Show-PortMessage $message -Confirm
    if (-not $choice) { return 0 }
    $fresh = @(Get-LocalListeners -Port 8765)
    $same = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop
    if ($fresh.Count -ne 1 -or $fresh[0].LocalAddress -ne '127.0.0.1' -or [int]$fresh[0].OwningProcess -ne $ownerPid -or
        -not $same -or $same.CreationDate -ne $owner.CreationDate -or $same.CommandLine -ne $owner.CommandLine -or $same.ExecutablePath -ne $owner.ExecutablePath) {
        throw 'The port owner changed during confirmation. No other application was stopped.'
    }
    $sameOwner = Invoke-CimMethod -InputObject $same -MethodName GetOwner -ErrorAction Stop
    if ($sameOwner.ReturnValue -ne 0 -or -not [string]::Equals("$($sameOwner.Domain)\$($sameOwner.User)", [Security.Principal.WindowsIdentity]::GetCurrent().Name, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'The process owner changed during confirmation. No other application was stopped.'
    }
    Stop-Process -Id $ownerPid -ErrorAction Stop
    $free = $false
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        Start-Sleep -Milliseconds 200
        if (@(Get-LocalListeners -Port 8765).Count -eq 0) { $free = $true; break }
    }
    if (-not $free) { throw 'The selected process was stopped, but port 8765 is still in use or could not be verified.' }
    Show-PortMessage 'The selected application stopped and port 8765 is available.'
    return 0
} catch {
    Show-PortMessage $_.Exception.Message -Warning
    return 1
}

}
if (-not $PolicyOnly) { exit (Invoke-PreferredPortStop) }
