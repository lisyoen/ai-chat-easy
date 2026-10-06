# AI Chat Easy native messaging host (Windows).
# Two install layouts are supported:
#   git clone   : <repo>\updater\host.ps1, extension in <repo>\extension  -> git pull --ff-only
#   release zip : <folder>\updater\host.ps1, manifest.json in <folder>     -> download the latest
#                 release zip from GitHub and replace the files in place.
# Afterwards the extension reloads itself (same as the reload button on chrome://extensions).
# Keep this file ASCII only (Windows PowerShell 5.1 reads BOM-less files as ANSI).
$ErrorActionPreference = 'Stop'
$Repo = 'lisyoen/ai-chat-easy'
$LatestUrl = if ($env:AICE_LATEST_URL) { $env:AICE_LATEST_URL } else { "https://raw.githubusercontent.com/$Repo/main/publish/latest.json" }
$DownloadBase = if ($env:AICE_DOWNLOAD_BASE) { $env:AICE_DOWNLOAD_BASE } else { "https://github.com/$Repo/releases/download" }

function Read-Exact {
    param([System.IO.Stream]$Stream, [int]$Count)
    $buffer = New-Object byte[] $Count
    $offset = 0
    while ($offset -lt $Count) {
        $read = $Stream.Read($buffer, $offset, $Count - $offset)
        if ($read -eq 0) { throw 'Unexpected end of native messaging input.' }
        $offset += $read
    }
    return $buffer
}

function Write-NativeMessage {
    param([hashtable]$Message)
    $payload = [System.Text.Encoding]::UTF8.GetBytes(($Message | ConvertTo-Json -Compress))
    $length = [System.BitConverter]::GetBytes([int]$payload.Length)
    $stdout = [Console]::OpenStandardOutput()
    $stdout.Write($length, 0, $length.Length)
    $stdout.Write($payload, 0, $payload.Length)
    $stdout.Flush()
}

function Invoke-Git {
    param([string]$RepoRoot, [string]$Arguments)
    $result = & cmd /d /c "git -C `"$RepoRoot`" $Arguments 2>&1"
    return @{ exitCode = $LASTEXITCODE; output = (($result | Out-String).Trim()) }
}

function Update-GitClone {
    param([string]$RepoRoot)
    $b = Invoke-Git -RepoRoot $RepoRoot -Arguments 'rev-parse --short HEAD'
    if ($b.exitCode -ne 0) { throw $b.output }
    $pull = Invoke-Git -RepoRoot $RepoRoot -Arguments 'pull --ff-only'
    if ($pull.exitCode -ne 0) {
        return @{ ok = $false; upToDate = $false; mode = 'git'; before = $b.output; after = $b.output; message = $pull.output }
    }
    $a = Invoke-Git -RepoRoot $RepoRoot -Arguments 'rev-parse --short HEAD'
    if ($a.exitCode -ne 0) { throw $a.output }
    return @{ ok = $true; upToDate = ($b.output -eq $a.output); mode = 'git'; before = $b.output; after = $a.output; message = $pull.output }
}

function Get-ManifestVersion {
    param([string]$Path)
    return [string]((Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json).version)
}

function Test-Version {
    param([string]$Value)
    return ($Value -match '^\d+\.\d+\.\d+$')
}

function Initialize-Web {
    # Windows PowerShell 5.1 defaults: enable TLS 1.2 and let the system (corporate) proxy authenticate.
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $proxy = [System.Net.WebRequest]::DefaultWebProxy
    if ($proxy) { $proxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials }
}

function Update-ReleaseFolder {
    param([string]$Root, [string]$Requested)
    $before = Get-ManifestVersion (Join-Path $Root 'manifest.json')
    Initialize-Web
    $latest = $Requested
    if (-not (Test-Version $latest)) {
        $info = Invoke-RestMethod -Uri ($LatestUrl + '?t=' + [DateTime]::UtcNow.Ticks) -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' }
        $latest = [string]$info.version
    }
    if (-not (Test-Version $latest)) { throw "Invalid version from server: $latest" }
    if ([version]$latest -le [version]$before) {
        return @{ ok = $true; upToDate = $true; mode = 'zip'; before = $before; after = $before; message = "Already v$before" }
    }

    $stage = Join-Path $Root '.aice-update'
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
    $newDir = Join-Path $stage 'new'
    $oldDir = Join-Path $stage 'old'
    New-Item -ItemType Directory -Path $newDir, $oldDir -Force | Out-Null

    $zip = Join-Path $stage 'package.zip'
    $url = "$DownloadBase/v$latest/ai-chat-easy-v$latest.zip"
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    Expand-Archive -LiteralPath $zip -DestinationPath $newDir -Force
    $newManifest = Join-Path $newDir 'manifest.json'
    if (-not (Test-Path -LiteralPath $newManifest)) { throw "manifest.json not found in $url" }
    $got = Get-ManifestVersion $newManifest
    if ($got -ne $latest) { throw "Downloaded package is v$got, expected v$latest" }

    # Swap everything except the updater folder (it is running) and the staging folder.
    $moved = @()
    try {
        foreach ($item in Get-ChildItem -LiteralPath $Root -Force) {
            if ($item.Name -in @('updater', '.aice-update')) { continue }
            Move-Item -LiteralPath $item.FullName -Destination (Join-Path $oldDir $item.Name)
            $moved += $item.Name
        }
        foreach ($item in Get-ChildItem -LiteralPath $newDir -Force) {
            if ($item.Name -eq 'updater') { continue }
            Copy-Item -LiteralPath $item.FullName -Destination (Join-Path $Root $item.Name) -Recurse -Force
        }
    } catch {
        $err = $_.Exception.Message
        foreach ($item in Get-ChildItem -LiteralPath $Root -Force) {
            if ($item.Name -in @('updater', '.aice-update')) { continue }
            Remove-Item -LiteralPath $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        foreach ($name in $moved) {
            Move-Item -LiteralPath (Join-Path $oldDir $name) -Destination (Join-Path $Root $name) -ErrorAction SilentlyContinue
        }
        throw "Update rolled back: $err"
    }

    # Refresh the updater scripts file by file; a locked file is not fatal.
    $newUpdater = Join-Path $newDir 'updater'
    if (Test-Path -LiteralPath $newUpdater) {
        foreach ($f in Get-ChildItem -LiteralPath $newUpdater -File) {
            try { Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $Root "updater\$($f.Name)") -Force } catch { }
        }
    }
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    return @{ ok = $true; upToDate = $false; mode = 'zip'; before = $before; after = $latest; message = "Updated v$before -> v$latest" }
}

try {
    $stdin = [Console]::OpenStandardInput()
    $lengthBytes = Read-Exact -Stream $stdin -Count 4
    $messageLength = [System.BitConverter]::ToInt32($lengthBytes, 0)
    if ($messageLength -lt 0) { throw 'Invalid native messaging payload length.' }
    $message = ([System.Text.Encoding]::UTF8.GetString((Read-Exact -Stream $stdin -Count $messageLength))) | ConvertFrom-Json

    if ($message.action -ne 'update') {
        Write-NativeMessage @{ ok = $false; upToDate = $false; message = 'Unknown action.' }
        exit 0
    }
    $root = Split-Path -Parent $PSScriptRoot
    if (Test-Path -LiteralPath (Join-Path $root '.git')) {
        Write-NativeMessage (Update-GitClone -RepoRoot $root)
    } elseif (Test-Path -LiteralPath (Join-Path $root 'manifest.json')) {
        Write-NativeMessage (Update-ReleaseFolder -Root $root -Requested ([string]$message.version))
    } else {
        throw "Neither a git clone nor a release folder: $root"
    }
} catch {
    Write-NativeMessage @{ ok = $false; upToDate = $false; message = $_.Exception.Message }
}
