param([Parameter(Mandatory=$true)][string]$LabRoot)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $LabRoot).Path
$requirements = Join-Path $root 'openai-connection-requirements.txt'
$venv = Join-Path $root '.openai-connection-venv'
$venvPython = Join-Path $venv 'Scripts\python.exe'

Write-Host ''
Write-Host 'Optional Sign in with ChatGPT security component' -ForegroundColor Cyan
Write-Host 'This installs PyJWT[crypto] into a venv inside this extracted Lab folder.'
Write-Host 'It is required to validate the OpenAI identity-token signature after browser approval.'
Write-Host 'It does not send a prompt, start inference, or create a charge.'
$answer = Read-Host 'Install this optional component now? [y/N]'
if ($answer -notmatch '^(?i:y|yes)$') {
  Write-Host 'No component was installed.' -ForegroundColor Yellow
  Read-Host 'Press Enter to close'
  exit 1
}
if (-not (Test-Path -LiteralPath $requirements)) { throw 'The pinned connection requirements file is missing.' }
if (-not (Get-Command py -ErrorAction SilentlyContinue)) { throw 'Python launcher (py) is required. Run Easy Start first.' }
if (-not (Test-Path -LiteralPath $venvPython)) { & py -3 -m venv $venv }
& $venvPython -m pip install --disable-pip-version-check -r $requirements
& $venvPython -c "import jwt; print('ChatGPT connection security component ready:', jwt.__version__)"
Write-Host 'Setup complete. Close this window, then restart the Local Lab before choosing Continue with ChatGPT.' -ForegroundColor Green
Read-Host 'Press Enter to close'
