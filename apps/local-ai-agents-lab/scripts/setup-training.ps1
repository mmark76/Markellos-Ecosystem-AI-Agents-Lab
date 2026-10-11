[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $appRoot 'training\.venv'
$requirements = Join-Path $appRoot 'training\requirements.txt'
$python = $null

function Find-CompatiblePython {
  foreach ($version in @('3.12', '3.11')) {
    & py "-$version" --version 2>$null
    if ($LASTEXITCODE -eq 0) { return @('py', "-$version") }
  }
  return $null
}

function Invoke-VenvPython([string[]]$Arguments) {
  $venvPython = Join-Path $venv 'Scripts\python.exe'
  & $venvPython @Arguments
  if ($LASTEXITCODE -ne 0) { throw "The training environment command failed: python $($Arguments -join ' ')" }
}

Write-Host ''
Write-Host 'Markellos Ecosystem AI Agents Lab - Training Setup Wizard' -ForegroundColor Cyan
Write-Host 'This optional wizard configures only local Python training libraries.'
Write-Host 'It does not change Ollama, LM Studio, vLLM, SQLite data, models, or datasets.'

$freeGiB = [math]::Round(((Get-PSDrive -Name ([IO.Path]::GetPathRoot($appRoot).TrimEnd(':','\'))).Free / 1GB), 1)
Write-Host "Available disk space: $freeGiB GiB"
if ($freeGiB -lt 8) { throw 'At least 8 GiB of free disk space is recommended for the optional CPU training environment.' }

$python = Find-CompatiblePython
if (-not $python) {
  Write-Host 'Python 3.11 or 3.12 was not found.' -ForegroundColor Yellow
  Write-Host 'Install one of those versions from python.org, enable the Python launcher, then run this wizard again.'
  Write-Host 'Python 3.14 is not supported by this release''s pinned training packages.'
  exit 2
}
Write-Host "Using: $(& $python[0] $python[1] --version)"

$mode = Read-Host 'Select training compute: [1] CPU, [2] NVIDIA CUDA, [Q] Quit'
if ($mode -match '^[Qq]$') { exit 0 }
if ($mode -notin @('1','2')) { throw 'Choose 1, 2, or Q.' }

if ($mode -eq '2') {
  $gpu = Get-Command nvidia-smi -ErrorAction SilentlyContinue
  if (-not $gpu) {
    Write-Host 'No NVIDIA driver utility was detected. CUDA setup cannot continue safely.' -ForegroundColor Yellow
    Write-Host 'Install/update the NVIDIA driver first, then use the official PyTorch selector for your CUDA build.'
    exit 3
  }
  & nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
  Write-Host 'CUDA requires a PyTorch build matched to this driver.' -ForegroundColor Yellow
  Write-Host 'This wizard will create and verify the environment, but does not install drivers or guess a CUDA wheel.'
  Start-Process 'https://pytorch.org/get-started/locally/'
  Read-Host 'Install the selected CUDA PyTorch command in another PowerShell window, then press Enter to verify it'
}

if (Test-Path (Join-Path $venv 'Scripts\python.exe')) {
  $reuse = Read-Host 'A training environment already exists. [R]euse it or [Q]uit'
  if ($reuse -notmatch '^[Rr]$') { exit 0 }
} else {
  Write-Host 'Creating isolated training environment...'
  & $python[0] $python[1] -m venv $venv
  if ($LASTEXITCODE -ne 0) { throw 'Could not create training\.venv.' }
}

if ($mode -eq '1') {
  Write-Host 'The following pinned packages will be downloaded into training\.venv only:'
  Get-Content $requirements | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object { Write-Host "  $_" }
  $confirm = Read-Host 'Install these CPU training libraries now? [Y/N]'
  if ($confirm -notmatch '^[Yy]$') { Write-Host 'No packages were installed.'; exit 0 }
  Invoke-VenvPython @('-m','pip','install','--upgrade','pip')
  Invoke-VenvPython @('-m','pip','install','-r',$requirements)
}

Write-Host 'Running local training health check...'
Invoke-VenvPython @('-c', "import torch, transformers, peft, trl; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')")
if ($mode -eq '2') {
  $cuda = & (Join-Path $venv 'Scripts\python.exe') -c "import torch; print('yes' if torch.cuda.is_available() else 'no')"
  if ($cuda -ne 'yes') { throw 'CUDA was selected but PyTorch does not report a compatible CUDA GPU. No CPU fallback was made.' }
}

Write-Host 'Training setup is ready.' -ForegroundColor Green
Write-Host 'Next: put a local model in models\ and a JSONL file in training-data\, then restart the Lab.'
