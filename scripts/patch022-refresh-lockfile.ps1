[CmdletBinding()]
param(
  [Parameter()]
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,

  [Parameter()]
  [switch]$SkipFullVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RecommendedNode = 'v22.22.3'
$SupportedNodeRange = '^22.22.3 || ^24.15.0 || >=26.0.0'
$ExpectedPnpm = '10.34.5'
$ExpectedPackageVersion = '0.6.2'
$PermanentMinimumReleaseAge = 20160

function Invoke-NativeStrict {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter()]
    [string[]]$ArgumentList = @()
  )

  & $FilePath @ArgumentList
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "Native command failed ($exitCode): $FilePath $($ArgumentList -join ' ')"
  }
}

function ConvertTo-NodeVersionParts {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Version
  )

  $match = [regex]::Match($Version, '^v?(\d+)\.(\d+)\.(\d+)')
  if (-not $match.Success) {
    throw "Unable to parse Node.js version: $Version"
  }

  return [pscustomobject]@{
    Major = [int]$match.Groups[1].Value
    Minor = [int]$match.Groups[2].Value
    Patch = [int]$match.Groups[3].Value
  }
}

function Test-Patch022NodeVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Version
  )

  $parts = ConvertTo-NodeVersionParts -Version $Version

  if ($parts.Major -eq 22) {
    return (($parts.Minor -gt 22) -or (($parts.Minor -eq 22) -and ($parts.Patch -ge 3)))
  }

  if ($parts.Major -eq 24) {
    return ($parts.Minor -ge 15)
  }

  return ($parts.Major -ge 26)
}

function Get-Sha256Hex {
  param(
    [Parameter(Mandatory = $true)]
    [byte[]]$Bytes
  )

  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant()
  }
  finally {
    $sha.Dispose()
  }
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$PackageJsonPath = Join-Path $ProjectRoot 'package.json'
$WorkspacePath = Join-Path $ProjectRoot 'pnpm-workspace.yaml'
$LockfilePath = Join-Path $ProjectRoot 'pnpm-lock.yaml'

if (-not (Test-Path -LiteralPath $PackageJsonPath -PathType Leaf)) {
  throw "package.json not found under ProjectRoot: $ProjectRoot"
}
if (-not (Test-Path -LiteralPath $WorkspacePath -PathType Leaf)) {
  throw "pnpm-workspace.yaml not found under ProjectRoot: $ProjectRoot"
}

$PackageJson = Get-Content -Raw -LiteralPath $PackageJsonPath | ConvertFrom-Json
if ([string]$PackageJson.name -ne '@vevedh/feathers-nitro') {
  throw "Unexpected package: $($PackageJson.name)"
}
if ([string]$PackageJson.version -ne $ExpectedPackageVersion) {
  throw "Patch022 expects package version $ExpectedPackageVersion, got $($PackageJson.version)."
}

Push-Location $ProjectRoot
try {
  $nodeVersion = (& node --version).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to execute node --version.'
  }

  if (-not (Test-Patch022NodeVersion -Version $nodeVersion)) {
    throw "Patch022 requires Node $SupportedNodeRange for Nuxt 4.6.2 lockfile certification; current: $nodeVersion."
  }

  Write-Host "[Patch022] Node runtime accepted: $nodeVersion (supported: $SupportedNodeRange)."
  if ($nodeVersion -ne $RecommendedNode) {
    Write-Warning "Patch022 CI remains pinned to $RecommendedNode for minimum-floor certification; local lockfile refresh is allowed on compatible $nodeVersion."
  }

  Invoke-NativeStrict -FilePath 'corepack' -ArgumentList @('prepare', "pnpm@$ExpectedPnpm", '--activate')

  $pnpmVersion = (& pnpm --version).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to execute pnpm --version.'
  }
  if ($pnpmVersion -ne $ExpectedPnpm) {
    throw "Patch022 requires pnpm $ExpectedPnpm; current: $pnpmVersion."
  }

  $workspaceBytes = [System.IO.File]::ReadAllBytes($WorkspacePath)
  $workspaceHash = Get-Sha256Hex -Bytes $workspaceBytes
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $workspaceText = $utf8.GetString($workspaceBytes)

  $minimumAgePattern = '(?m)^minimumReleaseAge:\s*20160\s*$'
  if (-not [regex]::IsMatch($workspaceText, $minimumAgePattern)) {
    throw "Patch022 expects permanent minimumReleaseAge: $PermanentMinimumReleaseAge in pnpm-workspace.yaml."
  }

  $temporaryWorkspaceText = [regex]::Replace(
    $workspaceText,
    $minimumAgePattern,
    'minimumReleaseAge: 0',
    1
  )

  Write-Warning 'Patch022 migration mode: minimumReleaseAge is temporarily set to 0 only while regenerating pnpm-lock.yaml.'
  Write-Warning 'The committed pnpm-workspace.yaml policy remains 20160 minutes (14 days) and will be restored byte-for-byte before certification.'

  [System.IO.File]::WriteAllText($WorkspacePath, $temporaryWorkspaceText, $utf8)

  try {
    Write-Host '[Patch022] Regenerating pnpm-lock.yaml for the coordinated Nuxt 4.6.2 train...'
    Invoke-NativeStrict -FilePath 'pnpm' -ArgumentList @('install', '--no-frozen-lockfile')
  }
  finally {
    [System.IO.File]::WriteAllBytes($WorkspacePath, $workspaceBytes)
  }

  $restoredBytes = [System.IO.File]::ReadAllBytes($WorkspacePath)
  $restoredHash = Get-Sha256Hex -Bytes $restoredBytes
  if ($restoredHash -ne $workspaceHash) {
    throw "pnpm-workspace.yaml restore integrity failure: expected SHA-256 $workspaceHash, got $restoredHash."
  }

  if (-not (Test-Path -LiteralPath $LockfilePath -PathType Leaf)) {
    throw 'pnpm-lock.yaml was not generated.'
  }

  Write-Host "[Patch022] Permanent supply-chain policy restored (minimumReleaseAge=$PermanentMinimumReleaseAge; workspace SHA-256 $restoredHash)."
  Write-Host '[Patch022] Verifying the regenerated lockfile is reproducible with the permanent policy...'
  Invoke-NativeStrict -FilePath 'pnpm' -ArgumentList @('install', '--frozen-lockfile')

  Write-Host '[Patch022] Validating focused migration gates...'
  foreach ($gate in @('check:runtime', 'check:nitro-api', 'check:nuxt-stack', 'check:portability')) {
    Invoke-NativeStrict -FilePath 'pnpm' -ArgumentList @($gate)
  }

  if (-not $SkipFullVerify) {
    Write-Host '[Patch022] Running the complete verification chain...'
    Invoke-NativeStrict -FilePath 'pnpm' -ArgumentList @('verify')
  }
  else {
    Write-Warning 'Full pnpm verify was skipped. Do not tag or publish 0.6.2 until pnpm verify and pnpm release:certify pass.'
  }

  Write-Host '[Patch022] Lockfile refresh completed under controlled migration mode.'
  Write-Host '[Patch022] Future installs must use pnpm install --frozen-lockfile.'
}
finally {
  Pop-Location
}
