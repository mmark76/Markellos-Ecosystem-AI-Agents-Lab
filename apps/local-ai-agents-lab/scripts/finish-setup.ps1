[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$LabRoot
)

$ErrorActionPreference = 'Stop'

try {
    $root = [System.IO.Path]::GetFullPath($LabRoot)
    . (Join-Path $PSScriptRoot 'get-lab-version.ps1')
    $version = Get-LabVersion $root
    $dataDir = Join-Path $root 'data'
    $preferencesFile = Join-Path $dataDir 'setup-preferences.json'

    if (Test-Path -LiteralPath $preferencesFile -PathType Leaf) {
        $saved = Get-Content -LiteralPath $preferencesFile -Raw | ConvertFrom-Json
        if ($saved.schema -ne 1 -or $saved.desktopShortcut -isnot [bool]) {
            throw 'The saved setup preferences are invalid. Preserve or repair data\setup-preferences.json before starting the Lab.'
        }
        exit 0
    }

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "AI Training Lab v$version - Finish setup"
    $form.StartPosition = 'CenterScreen'
    $form.ClientSize = New-Object System.Drawing.Size(540, 265)
    $form.MinimumSize = New-Object System.Drawing.Size(460, 305)
    $form.FormBorderStyle = 'Sizable'
    $form.MaximizeBox = $false
    $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
    $form.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Font

    $title = New-Object System.Windows.Forms.Label
    $title.Text = "AI Training Lab v$version is ready"
    $title.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 17)
    $title.Location = New-Object System.Drawing.Point(24, 18)
    $title.Size = New-Object System.Drawing.Size(490, 38)
    $title.Anchor = 'Top, Left, Right'
    $form.Controls.Add($title)

    $description = New-Object System.Windows.Forms.Label
    $description.Text = 'Final setup step - Optional Windows shortcut. Choose whether you want an icon on your Desktop. Your choice will be remembered for this Lab folder.'
    $description.Location = New-Object System.Drawing.Point(26, 70)
    $description.Size = New-Object System.Drawing.Size(485, 60)
    $description.Anchor = 'Top, Left, Right'
    $form.Controls.Add($description)

    $desktop = New-Object System.Windows.Forms.CheckBox
    $desktop.Text = "Create a Desktop shortcut: AI Training Lab v$version"
    $desktop.Checked = $true
    $desktop.Location = New-Object System.Drawing.Point(26, 141)
    $desktop.Size = New-Object System.Drawing.Size(470, 34)
    $desktop.Anchor = 'Top, Left, Right'
    $desktop.AccessibleDescription = 'Optional shortcut for launching AI Training Lab from the Windows Desktop.'
    $form.Controls.Add($desktop)

    $finish = New-Object System.Windows.Forms.Button
    $finish.Text = 'Finish & Start'
    $finish.Location = New-Object System.Drawing.Point(300, 202)
    $finish.Size = New-Object System.Drawing.Size(125, 44)
    $finish.Anchor = 'Bottom, Right'
    $finish.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.Controls.Add($finish)

    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Cancel'
    $cancel.Location = New-Object System.Drawing.Point(435, 202)
    $cancel.Size = New-Object System.Drawing.Size(80, 44)
    $cancel.Anchor = 'Bottom, Right'
    $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($cancel)

    $form.AcceptButton = $finish
    $form.CancelButton = $cancel
    $result = $form.ShowDialog()
    $createShortcut = [bool]$desktop.Checked
    $form.Dispose()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK) { exit 1 }

    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    $settings = @{ schema = 1; desktopShortcut = $createShortcut } | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText($preferencesFile, $settings + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
    exit 0
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    $dialogTitle = if ($version) { "AI Training Lab v$version - Setup" } else { 'AI Training Lab - Setup' }
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, $dialogTitle, 'OK', 'Error') | Out-Null
    exit 1
}
