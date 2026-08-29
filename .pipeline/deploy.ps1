<#
.SYNOPSIS
    Builds and deploys keystone-coop to Azure App Service.

.DESCRIPTION
    Runs `npm run build`, zips the resulting dist/ output (using forward-slash
    zip entry names, since Windows' Compress-Archive writes backslashes that
    break the Linux-based App Service deploy backend), and pushes it with
    `az webapp deploy`.

.PARAMETER ResourceGroup
    Azure resource group containing the web app. Defaults to rg-keystone-coop.

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

    Write-Host "==> Packaging dist/ into deploy.zip" -ForegroundColor Cyan
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

    # Build the zip by hand via System.IO.Compression so entry names use
    # forward slashes. Compress-Archive on Windows writes backslash-separated
    # paths for nested folders, which Kudu's rsync step on Linux App Service
    # rejects (rsync: failed to stat ".../assets\file.js": Invalid argument).
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -Path $DistPath -Recurse -File | ForEach-Object {
            $relativePath = $_.FullName.Substring($DistPath.Length + 1).Replace('\', '/')
            $entry = $zip.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $entry.Open()
            try {
                $fileStream = [System.IO.File]::OpenRead($_.FullName)
                try {
                    $fileStream.CopyTo($entryStream)
                } finally {
                    $fileStream.Close()
                }
            } finally {
                $entryStream.Close()
            }
        }
    } finally {
        $zip.Dispose()
    }

    Write-Host "==> Deploying to Azure Web App '$AppName' (resource group '$ResourceGroup')" -ForegroundColor Cyan
    az webapp deploy `
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
