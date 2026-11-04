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

    # The Python server uses this console, so closing the Windows Terminal
    # closes its attached processes instead of leaving a detached server.
    Push-Location -LiteralPath $root
    try {
        & $python -u $serverScript
        $serverExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    exit $serverExitCode
} catch {
    Write-Host ('Console server startup: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
