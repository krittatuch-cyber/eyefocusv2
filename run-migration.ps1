# run-migration.ps1
Set-Location 'C:\Users\kritt\EyefocusV2'

# Load .env.local
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^([^=#]+)=(.+)$') {
    $key = $matches[1].Trim()
    $val = $matches[2].Trim()
    [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
  }
}

Write-Host "DATABASE_URL loaded: $($env:DATABASE_URL.Substring(0,40))..."
Write-Host "Running drizzle-kit push..."

npx drizzle-kit push
