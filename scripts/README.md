# scripts

Repo-level scripts. Anything a service needs belongs in that service's Taskfile tasks instead.

| Script | Purpose | Run |
|---|---|---|
| `bootstrap.ps1` | Windows: verify Go/Node/Docker, `go install` the toolchain (task, golangci-lint, govulncheck, goimports, sqlc, oapi-codegen, migrate, lefthook, gitleaks, actionlint), enable pnpm, create `.env`, install git hooks | `pwsh -NoProfile -File scripts/bootstrap.ps1` or `task setup` |
| `bootstrap.sh` | Same for Linux/macOS/Git Bash | `bash scripts/bootstrap.sh` or `task setup` |

Both scripts are idempotent and skip tools that are already on `PATH`. Pass `-SkipHooks` / `--skip-hooks` to skip `lefthook install`.

## Conventions

- PowerShell scripts: `Set-StrictMode`-friendly, `$ErrorActionPreference = "Stop"`, CRLF line endings (see `.gitattributes`).
- Bash scripts: `set -euo pipefail`, LF line endings, run under Git Bash on Windows.
- Scripts never contain secrets or machine-specific paths; read from `.env` or arguments.
