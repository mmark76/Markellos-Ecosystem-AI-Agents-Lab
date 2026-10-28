[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Completed', 'Cancelled', 'Failed')]
    [string]$Result
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$message = switch ($Result) {
    'Completed' { 'Setup completed. Press any key to close this window.' }
    'Cancelled' { 'Setup cancelled. Press any key to close this window.' }
    'Failed' { 'Setup did not complete. Review the console output, then press any key to close this window.' }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'AI Lab - Training Setup'
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.ClientSize = New-Object System.Drawing.Size(540, 164)
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.KeyPreview = $true
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$label = New-Object System.Windows.Forms.Label
$label.Location = New-Object System.Drawing.Point(24, 20)
$label.Size = New-Object System.Drawing.Size(492, 75)
$label.TextAlign = 'MiddleCenter'
$label.Text = $message
$form.Controls.Add($label)

$close = New-Object System.Windows.Forms.Button
$close.Text = 'Close'
$close.Size = New-Object System.Drawing.Size(100, 34)
$close.Location = New-Object System.Drawing.Point(220, 112)
$close.Add_Click({ $form.Close() })
$form.Controls.Add($close)
$form.AcceptButton = $close
$form.CancelButton = $close
$form.Add_KeyDown({ $form.Close() })

try {
    [void]$form.ShowDialog()
} finally {
    $form.Dispose()
}
