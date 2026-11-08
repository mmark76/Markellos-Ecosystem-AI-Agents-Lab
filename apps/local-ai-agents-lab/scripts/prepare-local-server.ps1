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

    $absolute = [regex]::Match($command, '(?i)(?:^|\s)(?:"(?<quoted>[a-z]:\\[^"]+\\server\.py)"|(?<plain>[a-z]:\\[^\s"]+\\server\.py))\s*$')
    if ($absolute.Success) {
        $script = if ($absolute.Groups['quoted'].Success) { $absolute.Groups['quoted'].Value } else { $absolute.Groups['plain'].Value }
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
    . (Join-Path $PSScriptRoot 'get-local-listeners.ps1')
    $root = [IO.Path]::GetFullPath($LabRoot)
    . (Join-Path $PSScriptRoot 'get-lab-version.ps1')
    $version = Get-LabVersion $root
    # Inspect loopback listeners and accept only absolute-path Lab identities.
    # An unrelated or unverified listener is never stopped, even with consent.
    $labListeners = @()
    $listeners = @(Get-LocalListeners | Where-Object { $_.LocalAddress -eq '127.0.0.1' })
    $pythonProcesses = @(Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='pythonw.exe'" -ErrorAction Stop)
    foreach ($listener in $listeners) {
        $candidatePid = [int]$listener.OwningProcess
        try {
            $candidate = $pythonProcesses | Where-Object { [int]$_.ProcessId -eq $candidatePid } | Select-Object -First 1
            if (-not $candidate) { continue }
            $candidateIdentity = Get-LabServerIdentity -Process $candidate -CurrentRoot $root
            if ($candidateIdentity.Kind -in @('CURRENT_LAB', 'OLDER_LAB')) {
                if ($StopOnly -and $candidateIdentity.Kind -ne 'CURRENT_LAB') { continue }
                $labListeners += [PSCustomObject]@{ Listener=$listener; Owner=$candidate; Identity=$candidateIdentity }
            }
        } catch { continue }
    }
    if ($labListeners.Count -eq 0) {
        if ($StopOnly) { Write-Host 'AI Lab server is already stopped.' }
        exit 0
    }
    if ($labListeners.Count -ne 1) { throw 'Multiple verified Lab listeners were found. No process was stopped.' }
    $listener = $labListeners[0].Listener
    $owner = $labListeners[0].Owner
    $identity = $labListeners[0].Identity
    $ownerPid = [int]$listener.OwningProcess
    $port = [int]$listener.LocalPort

    Add-Type -AssemblyName System.Windows.Forms
    $description = if ($identity.Kind -eq 'CURRENT_LAB') { 'this AI Training Lab installation' } else { 'an older AI Training Lab installation' }
    $finalQuestion = if ($StopOnly) { 'Stop it without restarting?' } else { 'Close it and start this copy?' }
    $message = "PID $ownerPid belongs to $description.`r`n`r`nScript: $($identity.ScriptPath)`r`n`r`nStopping the server interrupts any active agent run. $finalQuestion"
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
    $fresh = @(Get-LocalListeners -Port $port)
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
        $remaining = @(Get-LocalListeners -Port $port)
        if ($remaining.Count -eq 0) {
            Write-Host "AI Lab server PID $ownerPid stopped; port $port is free."
            exit 0
        }
    }
    if ($StopOnly) { throw "The Lab process stopped, but port $port is still occupied by another listener." }
    throw "The old process was stopped, but port $port is still occupied. New server startup was blocked."
} catch {
    Write-Host ("Local server preflight: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
