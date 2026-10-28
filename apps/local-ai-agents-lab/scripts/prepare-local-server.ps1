[CmdletBinding()]
param(
    [string]$LabRoot,
    [switch]$PolicyOnly,
    [switch]$StopOnly
)

$ErrorActionPreference = 'Stop'

# Identification is deliberately strict for newer, absolute-path launchers.
# Older ZIPs passed only "server.py"; these remain unverified candidates.
function Get-LabServerIdentity {
    param(
        [Parameter(Mandatory = $true)]$Process,
        [Parameter(Mandatory = $true)][string]$CurrentRoot
    )

    $unknown = [PSCustomObject]@{ Kind = 'UNRELATED'; ScriptPath = $null }
    if ($Process.Name -notin @('python.exe', 'pythonw.exe')) { return $unknown }
    $command = [string]$Process.CommandLine
    if (-not $command) { return $unknown }

    $absolute = [regex]::Match($command, '(?i)(?:^|\s)"(?<script>[a-z]:\\[^"]+\\server\.py)"\s*$')
    if ($absolute.Success) {
        $script = $absolute.Groups['script'].Value
        if (-not (Test-Path -LiteralPath $script -PathType Leaf)) { return $unknown }
        $body = [IO.File]::ReadAllText($script)
        if (-not ($body.Contains('Markellos Ecosystem AI Lab') -and
                   $body.Contains('ThreadingHTTPServer') -and
                   $body.Contains('PORT = 8765'))) { return $unknown }
        $expected = [IO.Path]::GetFullPath((Join-Path $CurrentRoot 'server.py'))
        $actual = [IO.Path]::GetFullPath($script)
        $kind = if ([string]::Equals($actual, $expected, [StringComparison]::OrdinalIgnoreCase)) { 'CURRENT_LAB' } else { 'OLDER_LAB' }
        return [PSCustomObject]@{ Kind = $kind; ScriptPath = $script }
    }

    if ([regex]::IsMatch($command, '(?i)(?:^|\s)(?:"server\.py"|server\.py)\s*$')) {
        return [PSCustomObject]@{ Kind = 'LEGACY_CANDIDATE'; ScriptPath = $null }
    }
    return $unknown
}

if ($PolicyOnly) { return }

try {
    if (-not $LabRoot) { throw 'A LabRoot is required.' }
    if (-not (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue)) {
        throw 'Windows TCP ownership inspection is unavailable. The server was not changed.'
    }
    $root = [IO.Path]::GetFullPath($LabRoot)
    . (Join-Path $PSScriptRoot 'get-lab-version.ps1')
    $version = Get-LabVersion $root
    $listeners = @(Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue)
    if ($listeners.Count -eq 0) {
        if ($StopOnly) { Write-Host 'AI Lab server is already stopped.' }
        exit 0
    }

    if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1') {
        throw 'Port 8765 is already occupied by an unexpected listener. No process was stopped.'
    }

    $ownerPid = [int]$listeners[0].OwningProcess
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop
    if (-not $owner) { throw "Could not identify PID $ownerPid. No process was stopped." }

    $identity = Get-LabServerIdentity -Process $owner -CurrentRoot $root
    if ($identity.Kind -eq 'UNRELATED') {
        throw "PID $ownerPid owns port 8765 but cannot be verified as an AI Lab server. No process was stopped."
    }

    Add-Type -AssemblyName System.Windows.Forms
    if ($identity.Kind -eq 'LEGACY_CANDIDATE') {
        $finalQuestion = if ($StopOnly) { 'Stop this server without starting another?' } else { 'Force-stop it and start this copy?' }
        $message = "PID $ownerPid is a Python server.py process using AI Lab's port 8765. An older launcher did not record its full script path, so ownership cannot be proven.`r`n`r`nCommand: $($owner.CommandLine)`r`n`r`nOnly approve if this is your earlier AI Training Lab. Any current agent run may be interrupted. $finalQuestion"
    } else {
        $description = if ($identity.Kind -eq 'CURRENT_LAB') { 'this AI Training Lab installation' } else { 'an older AI Training Lab installation' }
        $finalQuestion = if ($StopOnly) { 'Stop it without restarting?' } else { 'Close it and start this copy?' }
        $message = "PID $ownerPid belongs to $description.`r`n`r`nScript: $($identity.ScriptPath)`r`n`r`nStopping the server interrupts any active agent run. $finalQuestion"
    }
    $choice = [System.Windows.Forms.MessageBox]::Show(
        $message, "AI Training Lab v$version - Local server $(if ($StopOnly) { 'stop' } else { 'replacement' })",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Warning,
        [System.Windows.Forms.MessageBoxDefaultButton]::Button2
    )
    if ($choice -ne [System.Windows.Forms.DialogResult]::Yes) {
        $declinedAction = if ($StopOnly) { 'stop' } else { 'replacement' }
        throw "Server $declinedAction was declined. The existing process was left running."
    }

    # Check ownership again immediately before stopping, to avoid targeting a reused PID.
    $fresh = @(Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue)
    if ($fresh.Count -ne 1 -or [int]$fresh[0].OwningProcess -ne $ownerPid -or $fresh[0].LocalAddress -ne '127.0.0.1') {
        throw 'Port ownership changed during confirmation. No process was stopped.'
    }
    $sameProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop
    if (-not $sameProcess -or $sameProcess.CreationDate -ne $owner.CreationDate -or $sameProcess.CommandLine -ne $owner.CommandLine) {
        throw 'Process identity changed during confirmation. No process was stopped.'
    }

    Stop-Process -Id $ownerPid -Force -ErrorAction Stop
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 200
        $remaining = @(Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue)
        if ($remaining.Count -eq 0) {
            Write-Host "AI Lab server PID $ownerPid stopped; port 8765 is free."
            exit 0
        }
    }
    if ($StopOnly) { throw 'The Lab process stopped, but port 8765 is still occupied by another listener.' }
    throw 'The old process was stopped, but port 8765 is still occupied. New server startup was blocked.'
} catch {
    Write-Host ("Local server preflight: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
