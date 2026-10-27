[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$LabRoot
)

$ErrorActionPreference = 'Stop'
$DefaultModel = 'qwen2.5:0.5b'
$MinimumFreeGiB = 3

function Get-CommandSource([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    return $null
}

function Get-PythonVersion {
    $launcher = Get-CommandSource 'py'
    if ($launcher) {
        $version = & $launcher -3 -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2>$null
        if ($LASTEXITCODE -eq 0 -and $version -match '^3\.(9|[1-9]\d)\.\d+$') { return $version.Trim() }
    }
    $python = Get-CommandSource 'python'
    if ($python) {
        $version = & $python -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2>$null
        if ($LASTEXITCODE -eq 0 -and $version -match '^3\.(9|[1-9]\d)\.\d+$') { return $version.Trim() }
    }
    return $null
}

function Get-OllamaStatus {
    try {
        $request = [System.Net.WebRequest]::Create('http://127.0.0.1:11434/api/tags')
        $request.Proxy = $null
        $request.Timeout = 4000
        $reader = $null
        $response = $request.GetResponse()
        try {
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $payload = $reader.ReadToEnd() | ConvertFrom-Json
        } finally {
            if ($reader) { $reader.Dispose() }
            $response.Dispose()
        }
        $models = @($payload.models | ForEach-Object { $_.name } | Where-Object { $_ -is [string] -and $_ -and $_ -notmatch 'cloud' })
        return [PSCustomObject]@{ Available = $true; Models = $models }
    } catch {
        return [PSCustomObject]@{ Available = $false; Models = @() }
    }
}

function Get-SetupStatus {
    $ollama = Get-OllamaStatus
    $python = Get-PythonVersion
    return [PSCustomObject]@{
        PythonVersion = $python
        OllamaCommand = Get-CommandSource 'ollama'
        OllamaRunning = $ollama.Available
        Models = $ollama.Models
        DefaultModelReady = $ollama.Models -contains $DefaultModel
    }
}

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

function Require-Approval([string]$Title, [string]$Message) {
    return [System.Windows.Forms.MessageBox]::Show(
        $Message, $Title,
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Warning,
        [System.Windows.Forms.MessageBoxDefaultButton]::Button2
    ) -eq [System.Windows.Forms.DialogResult]::Yes
}

function Install-WithWinget([string]$PackageId, [string]$DisplayName, [scriptblock]$SetStatus) {
    $winget = Get-CommandSource 'winget'
    if (-not $winget) {
        throw "Windows Package Manager (winget) is not available. Install it from Microsoft App Installer, then run Easy Start again."
    }
    & $SetStatus "Installing $DisplayName with Windows Package Manager…"
    $process = Start-Process -FilePath $winget -ArgumentList @(
        'install', '--id', $PackageId, '--exact', '--source', 'winget',
        '--accept-source-agreements', '--accept-package-agreements'
    ) -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "$DisplayName installation did not complete (exit code $($process.ExitCode))." }
    Refresh-Path
}

function Start-LocalOllama([string]$Ollama, [scriptblock]$SetStatus) {
    if ((Get-OllamaStatus).Available) { return }
    & $SetStatus 'Starting Ollama locally…'
    Start-Process -FilePath $Ollama -ArgumentList 'serve' -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Seconds 1
        if ((Get-OllamaStatus).Available) { return }
    }
    throw 'Ollama did not start on its local address. You can close this window and try again after checking Ollama.'
}

function Install-DefaultModel([scriptblock]$SetStatus, [System.Windows.Forms.ProgressBar]$Progress) {
    $request = [System.Net.WebRequest]::Create('http://127.0.0.1:11434/api/pull')
    $request.Proxy = $null
    $request.Method = 'POST'
    $request.ContentType = 'application/json'
    $request.Timeout = 15000
    $body = [Text.Encoding]::UTF8.GetBytes('{"name":"qwen2.5:0.5b","stream":true}')
    $request.ContentLength = $body.Length
    $stream = $request.GetRequestStream()
    try { $stream.Write($body, 0, $body.Length) } finally { $stream.Dispose() }
    & $SetStatus 'Downloading the initial local AI model…'
    $reader = $null
    $response = $request.GetResponse()
    try {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        try {
            while (($line = $reader.ReadLine()) -ne $null) {
                if (-not $line.Trim()) { continue }
                $event = $line | ConvertFrom-Json
                if ($event.status) { & $SetStatus "Model: $($event.status)" }
                if ($event.total -gt 0 -and $event.completed -ge 0) {
                    $Progress.Style = [System.Windows.Forms.ProgressBarStyle]::Continuous
                    $Progress.Value = [Math]::Min(100, [Math]::Floor(($event.completed / $event.total) * 100))
                }
                [System.Windows.Forms.Application]::DoEvents()
            }
        } finally { $reader.Dispose() }
    } finally { $response.Dispose() }
    if (-not ((Get-OllamaStatus).Models -contains $DefaultModel)) { throw 'The initial model was not available after the download finished.' }
    $Progress.Value = 100
}

function Assert-FreeSpace([string]$Root) {
    $drive = New-Object System.IO.DriveInfo([System.IO.Path]::GetPathRoot([System.IO.Path]::GetFullPath($Root)))
    if ($drive.AvailableFreeSpace -lt ($MinimumFreeGiB * 1GB)) {
        throw "At least $MinimumFreeGiB GiB of free disk space is required before Easy Start can continue."
    }
}

function Start-EasySetup([string]$Root) {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $initial = Get-SetupStatus
    if ($initial.PythonVersion -and $initial.OllamaRunning -and $initial.DefaultModelReady) { return $true }

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'AI Lab — Easy Start'
    $form.StartPosition = 'CenterScreen'
    $form.ClientSize = New-Object System.Drawing.Size(580, 355)
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

    $title = New-Object System.Windows.Forms.Label
    $title.Text = 'Set up AI Lab'
    $title.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 18)
    $title.Location = New-Object System.Drawing.Point(24, 20)
    $title.Size = New-Object System.Drawing.Size(530, 38)
    $form.Controls.Add($title)

    $description = New-Object System.Windows.Forms.Label
    $description.Text = 'Easy Start checks this Windows computer and prepares only the items that are missing. You will approve Python, Ollama, and the initial local model separately.'
    $description.Location = New-Object System.Drawing.Point(26, 67)
    $description.Size = New-Object System.Drawing.Size(530, 56)
    $form.Controls.Add($description)

    $details = New-Object System.Windows.Forms.Label
    $details.Location = New-Object System.Drawing.Point(26, 132)
    $details.Size = New-Object System.Drawing.Size(530, 82)
    $details.BorderStyle = 'FixedSingle'
    $details.Padding = New-Object System.Windows.Forms.Padding(10)
    $details.Text = "Python: $($(if($initial.PythonVersion){'ready (' + $initial.PythonVersion + ')'}else{'needs approval'}))`r`nOllama: $($(if($initial.OllamaRunning){'ready locally'}elseif($initial.OllamaCommand){'installed but needs approval to start'}else{'needs approval'}))`r`nInitial local model ($DefaultModel): $($(if($initial.DefaultModelReady){'ready'}else{'needs approval'}))"
    $form.Controls.Add($details)

    $status = New-Object System.Windows.Forms.Label
    $status.Location = New-Object System.Drawing.Point(26, 226)
    $status.Size = New-Object System.Drawing.Size(530, 28)
    $status.Text = 'No changes have been made.'
    $form.Controls.Add($status)

    $progress = New-Object System.Windows.Forms.ProgressBar
    $progress.Location = New-Object System.Drawing.Point(26, 258)
    $progress.Size = New-Object System.Drawing.Size(530, 20)
    $form.Controls.Add($progress)

    $start = New-Object System.Windows.Forms.Button
    $start.Text = 'Set Up & Start AI Lab'
    $start.Location = New-Object System.Drawing.Point(245, 298)
    $start.Size = New-Object System.Drawing.Size(220, 44)
    $start.DialogResult = [System.Windows.Forms.DialogResult]::None
    $form.Controls.Add($start)

    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Cancel'
    $cancel.Location = New-Object System.Drawing.Point(475, 298)
    $cancel.Size = New-Object System.Drawing.Size(81, 44)
    $cancel.Add_Click({ $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel; $form.Close() })
    $form.Controls.Add($cancel)

    $setStatus = { param([string]$Text) $status.Text = $Text; $form.Refresh(); [System.Windows.Forms.Application]::DoEvents() }
    $start.Add_Click({
        $start.Enabled = $false
        $cancel.Enabled = $false
        try {
            Assert-FreeSpace $Root
            $current = Get-SetupStatus
            if (-not $current.PythonVersion) {
                if (-not (Require-Approval 'Install Python?' 'Python 3.12 is missing. Easy Start can ask Windows Package Manager to install the official Python package. It may show a Windows confirmation. Install Python now?')) { throw 'Python installation was not approved. No further changes were made.' }
                Install-WithWinget 'Python.Python.3.12' 'Python 3.12' $setStatus
                $current = Get-SetupStatus
                if (-not $current.PythonVersion) { throw 'Python could not be detected after installation. Close Easy Start and run it again.' }
            }
            if (-not $current.OllamaCommand) {
                if (-not (Require-Approval 'Install Ollama?' 'Ollama is missing. Easy Start can ask Windows Package Manager to install the official Ollama package. It may show a Windows confirmation. Install Ollama now?')) { throw 'Ollama installation was not approved. No further changes were made.' }
                Install-WithWinget 'Ollama.Ollama' 'Ollama' $setStatus
                $current = Get-SetupStatus
                if (-not $current.OllamaCommand) { throw 'Ollama could not be detected after installation. Close Easy Start and run it again.' }
            }
            if (-not $current.OllamaRunning) {
                if (-not (Require-Approval 'Start Ollama locally?' 'Ollama is installed but is not running. Start its local service now at 127.0.0.1:11434?')) { throw 'Starting Ollama was not approved. No model download was started.' }
                Start-LocalOllama $current.OllamaCommand $setStatus
                $current = Get-SetupStatus
            }
            if (-not $current.DefaultModelReady) {
                if (-not (Require-Approval 'Download initial local model?' 'The local model qwen2.5:0.5b is missing. It is used for the first Trainer, Student, Evaluator, and Improver session. Download it through local Ollama now? This requires Internet access and disk space.')) { throw 'The initial model download was not approved. No model was downloaded.' }
                Install-DefaultModel $setStatus $progress
            }
            & $setStatus 'Setup is ready. Starting AI Lab…'
            $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
            $form.Close()
        } catch {
            $status.Text = $_.Exception.Message
            $start.Enabled = $true
            $cancel.Enabled = $true
        }
    })
    return $form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK
}

try {
    if (Start-EasySetup ([System.IO.Path]::GetFullPath($LabRoot))) { exit 0 }
    exit 1
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'AI Lab — Easy Start', 'OK', 'Error') | Out-Null
    exit 1
}
