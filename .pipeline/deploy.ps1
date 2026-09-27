<#
.SYNOPSIS
    Builds and deploys keystone-coop to Azure App Service.

.DESCRIPTION
    Runs `npm run build`, zips server/server.mjs plus the dist/ output as public/ (using forward-slash
    zip entry names, since Windows' Compress-Archive writes backslashes that
    break the Linux-based App Service deploy backend), and pushes it with
    `az webapp deploy`.

.PARAMETER ResourceGroup
    Azure resource group containing the web app. Defaults to rg-keystone-coop.

.PARAMETER Subscription
    Azure subscription holding the web app, so deploys work regardless of
    the CLI's default subscription.

.PARAMETER AppName
    Azure Web App name. Defaults to keystone-coop.

.PARAMETER SkipBuild
    Skip `npm run build` and deploy the existing dist/ folder as-is.

.PARAMETER CleanInstall
    Run `npm ci` before building instead of building with the existing
    node_modules. Off by default so the script doesn't need to touch
    node_modules (and any locked native binaries in it) on every deploy.

.EXAMPLE
    ./.pipeline/deploy.ps1

.EXAMPLE
    ./.pipeline/deploy.ps1 -ResourceGroup rg-keystone-coop -AppName keystone-coop
#>

param(
    [string]$ResourceGroup = "rg-keystone-coop",
    [string]$AppName = "keystone-coop",
    [string]$Subscription = "09b5a451-64bd-49be-8c7f-ba44d8259a39",
    [switch]$SkipBuild,
    [switch]$CleanInstall
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$DistPath = Join-Path $RepoRoot "dist"
$ZipPath = Join-Path $RepoRoot "deploy.zip"

Push-Location $RepoRoot
try {
    if (-not $SkipBuild) {
        if ($CleanInstall) {
            Write-Host "==> Installing dependencies (clean)" -ForegroundColor Cyan
            npm ci
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        }

        Write-Host "==> Building app" -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    }

    if (-not (Test-Path $DistPath)) {
        throw "dist/ not found at $DistPath. Run without -SkipBuild first."
    }

    Write-Host "==> Packaging server.mjs + dist/ (as public/) into deploy.zip" -ForegroundColor Cyan
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

    # Build the zip by hand via System.IO.Compression so entry names use
    # forward slashes. Compress-Archive on Windows writes backslash-separated
    # paths for nested folders, which Kudu's rsync step on Linux App Service
    # rejects (rsync: failed to stat ".../assets\file.js": Invalid argument).
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $level = [System.IO.Compression.CompressionLevel]::Optimal
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, (Join-Path $RepoRoot "server/server.mjs"), "server.mjs", $level) | Out-Null

        Get-ChildItem -Path $DistPath -Recurse -File | ForEach-Object {
            $relativePath = "public/" + $_.FullName.Substring($DistPath.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath, $level) | Out-Null
        }
    } finally {
        $zip.Dispose()
    }

    # The site is served by server.mjs (static files + reviews API) rather
    # than `pm2 serve`. Setting this every deploy keeps it idempotent.
    Write-Host "==> Ensuring startup command runs server.mjs" -ForegroundColor Cyan
    az webapp config set `
        --subscription $Subscription `
        --resource-group $ResourceGroup `
        --name $AppName `
        --startup-file "node /home/site/wwwroot/server.mjs" `
        --output none
    if ($LASTEXITCODE -ne 0) { throw "az webapp config set failed" }

    Write-Host "==> Deploying to Azure Web App '$AppName' (resource group '$ResourceGroup')" -ForegroundColor Cyan
    az webapp deploy `
        --subscription $Subscription `
        --resource-group $ResourceGroup `
        --name $AppName `
        --src-path $ZipPath `
        --type zip
    if ($LASTEXITCODE -ne 0) { throw "az webapp deploy failed" }

    Write-Host "==> Deployed: https://$AppName.azurewebsites.net" -ForegroundColor Green
}
finally {
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    Pop-Location
}
