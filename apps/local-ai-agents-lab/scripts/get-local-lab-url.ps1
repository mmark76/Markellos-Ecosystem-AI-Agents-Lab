. (Join-Path $PSScriptRoot 'get-local-listeners.ps1')

function Get-LocalLabUrl {
    param([Parameter(Mandatory = $true)][string]$LabRoot)
    try {
        $root = [IO.Path]::GetFullPath($LabRoot)
        $path = Join-Path $root 'data\runtime.json'
        $file = Get-Item -LiteralPath $path -ErrorAction Stop
        if ($file.Length -gt 1024) { return $null }
        $state = Get-Content -LiteralPath $path -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        $port = 0; $serverPid = 0
        if (-not [int]::TryParse("$($state.port)", [ref]$port) -or $port -lt 1 -or $port -gt 65535) { return $null }
        if (-not [int]::TryParse("$($state.pid)", [ref]$serverPid) -or $serverPid -lt 1) { return $null }
        if ("$($state.nonce)" -notmatch '^[0-9a-f]{32}$') { return $null }
        $listeners = @(Get-LocalListeners -Port $port)
        if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1' -or [int]$listeners[0].OwningProcess -ne $serverPid) { return $null }
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$serverPid" -ErrorAction Stop
        if (-not $process) { return $null }
        $identity = Get-LabServerIdentity -Process $process -CurrentRoot $root
        if ($identity.Kind -ne 'CURRENT_LAB') { return $null }
        return "http://127.0.0.1:$port/"
    } catch { return $null }
}
