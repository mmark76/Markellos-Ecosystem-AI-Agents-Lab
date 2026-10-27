function Get-LabVersion([string]$Root) {
    $file = Join-Path $Root 'VERSION'
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw 'AI Training Lab VERSION file is missing.'
    }
    $version = [System.IO.File]::ReadAllText($file).Trim()
    if ($version -notmatch '^\d+\.\d+\.\d+$') {
        throw 'AI Training Lab VERSION file is invalid.'
    }
    return $version
}
