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
    $errors = Join-Path $logs 'server-errors.log'
    $arguments = @('-u', ('"' + $serverScript + '"'))
    # This is a detached Windows process with no visible terminal window.
    # Its API metadata is logged to data\logs\api.log by server.py.
    $process = Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardError $errors -PassThru
    for ($attempt = 0; $attempt -lt 120; $attempt++) {
        Start-Sleep -Milliseconds 250
        $listeners = @(Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue)
        if ($listeners.Count -eq 1 -and $listeners[0].LocalAddress -eq '127.0.0.1' -and [int]$listeners[0].OwningProcess -eq $process.Id) {
            Write-Host "AI Lab server started in background (PID $($process.Id))."
            exit 0
        }
        if ($process.HasExited) { throw "AI Lab server exited during startup. Check data\logs\server-errors.log." }
    }
    throw 'AI Lab server startup timed out. Check data\logs\server-errors.log.'
} catch {
    Write-Host ("Background server startup: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
