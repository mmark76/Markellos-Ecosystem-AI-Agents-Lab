[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$LabRoot
)

$ErrorActionPreference = 'Stop'

try {
    $root = [IO.Path]::GetFullPath($LabRoot)
    $serverScript = Join-Path $root 'server.py'
    if (-not (Test-Path -LiteralPath $serverScript -PathType Leaf)) {
        throw 'The Local Lab server.py was not found.'
    }

    $python = Join-Path $root '.openai-connection-venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
        if (Get-Command py.exe -ErrorAction SilentlyContinue) {
            $python = (& py.exe -3 -c 'import sys; print(sys.executable)' | Select-Object -Last 1)
        } else {
            $python = (& python.exe -c 'import sys; print(sys.executable)' | Select-Object -Last 1)
        }
        if ($LASTEXITCODE -ne 0) { throw 'A working Python 3 interpreter is required.' }
    }
    $python = [string]$python
    if (-not (Test-Path -LiteralPath $python -PathType Leaf)) {
        throw 'The selected Python interpreter was not found.'
    }

    $logs = Join-Path $root 'data\logs'
    New-Item -Path $logs -ItemType Directory -Force | Out-Null
    # WMI's DETACHED_PROCESS (8) guarantees that Python inherits no console
    # pipes from the caller. Start-Process -WindowStyle Hidden alone can leave
    # the launcher's parent waiting for Python to exit (confirmed by Windows CI).
    # Startup failures and bounded API metadata are written by server.py.
    $startup = ([wmiclass]'Win32_ProcessStartup').CreateInstance()
    $startup.ShowWindow = 0
    $startup.CreateFlags = 8
    $command = '"' + $python + '" -u "' + $serverScript + '"'
    $launch = ([wmiclass]'Win32_Process').Create($command, $root, $startup)
    if ($launch.ReturnValue -ne 0 -or -not $launch.ProcessId) {
        throw "Cannot start the detached server (Windows code $($launch.ReturnValue))."
    }
    $serverPid = [int]$launch.ProcessId
    for ($attempt = 0; $attempt -lt 120; $attempt++) {
        Start-Sleep -Milliseconds 250
        $listeners = @(Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue)
        if ($listeners.Count -eq 1 -and $listeners[0].LocalAddress -eq '127.0.0.1' -and [int]$listeners[0].OwningProcess -eq $serverPid) {
            Write-Host "AI Lab server started in background (PID $serverPid)."
            exit 0
        }
        if (-not (Get-Process -Id $serverPid -ErrorAction SilentlyContinue)) { throw 'AI Lab server exited during startup. Check data\logs\server-errors.log.' }
    }
    throw 'AI Lab server startup timed out. Check data\logs\server-errors.log.'
} catch {
    Write-Host ("Background server startup: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
