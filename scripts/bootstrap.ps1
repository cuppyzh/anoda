<#
.SYNOPSIS
  Installs or verifies the developer toolchain for the anoda monorepo on Windows, then installs git hooks.
.DESCRIPTION
  Idempotent. Run from the repo root:  pwsh -NoProfile -File scripts/bootstrap.ps1   (or `task setup`)
  Requires: Go, Node.js (>= 22), Docker Desktop already installed. Everything else is installed via `go install`
  or `corepack`. Go-installed binaries land in $(go env GOPATH)\bin, which must be on PATH.
#>
[CmdletBinding()]
param(
  [switch]$SkipHooks
)
$ErrorActionPreference = "Stop"

function Test-Cmd([string]$name) { return $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }
function Step([string]$msg) { Write-Host ("==> " + $msg) -ForegroundColor Cyan }
function Ok([string]$msg) { Write-Host ("    ok  " + $msg) -ForegroundColor Green }
function Warn([string]$msg) { Write-Host ("    !!  " + $msg) -ForegroundColor Yellow }

# ---- prerequisites we do not install ----
Step "Checking prerequisites"
foreach ($p in @("go", "node", "docker", "git")) {
  if (-not (Test-Cmd $p)) { throw "$p is required but not on PATH. Install it and re-run." }
}
Ok ("go   " + (go version))
Ok ("node " + (node --version))
Ok ("docker " + (docker --version))

$goBin = Join-Path (go env GOPATH) "bin"
if (-not (($env:PATH -split ";") -contains $goBin)) {
  Warn "$goBin is not on PATH. Adding for this session; add it permanently via System Environment Variables."
  $env:PATH = "$goBin;$env:PATH"
}

# ---- Go-installed tools ----
$goTools = [ordered]@{
  "task"          = "github.com/go-task/task/v3/cmd/task@latest"
  "golangci-lint" = "github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest"
  "govulncheck"   = "golang.org/x/vuln/cmd/govulncheck@latest"
  "goimports"     = "golang.org/x/tools/cmd/goimports@latest"
  "sqlc"          = "github.com/sqlc-dev/sqlc/cmd/sqlc@latest"
  "oapi-codegen"  = "github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest"
  "migrate"       = "-tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"
  "lefthook"      = "github.com/evilmartians/lefthook@latest"
  "gitleaks"      = "github.com/zricethezav/gitleaks/v8@latest"
  "actionlint"    = "github.com/rhysd/actionlint/cmd/actionlint@latest"
}
Step "Installing Go-based tools (skips ones already present)"
foreach ($kv in $goTools.GetEnumerator()) {
  $name = $kv.Key
  if (Test-Cmd $name) { Ok "$name already installed"; continue }
  Write-Host "    installing $name ..."
  $argsList = $kv.Value -split " "
  & go install @argsList
  if ($LASTEXITCODE -ne 0) { throw "go install failed for $name" }
  Ok $name
}

# ---- Node: pnpm via corepack ----
Step "Enabling pnpm via corepack"
if (-not (Test-Cmd "pnpm")) {
  corepack enable
  corepack prepare pnpm@latest --activate
}
Ok ("pnpm " + (pnpm --version))

# ---- env file ----
Step "Local environment file"
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Warn "Created .env from .env.example. Edit it with real local values (never commit it)."
} else { Ok ".env exists" }

# ---- git hooks ----
if (-not $SkipHooks) {
  Step "Installing git hooks (lefthook)"
  lefthook install
  Ok "hooks installed"
}

Step "Done. Try:  task --list   then   task check"
