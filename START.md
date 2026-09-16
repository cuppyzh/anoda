# Start — run anoda locally

Copy-paste guide. For what the project is and where things stand, see [`ONBOARDING.md`](ONBOARDING.md).
For the rules code must follow, see [`CLAUDE.md`](CLAUDE.md).

## 1. Prerequisites

Install these yourself; everything else is installed for you in step 3.

| Tool | Version | Check |
|---|---|---|
| Go | current stable | `go version` |
| Node.js | 22+ | `node --version` |
| Docker Desktop | latest, running | `docker --version` |
| Git | any recent | `git --version` |

## 2. Clone

```bash
git clone <repo-url> anoda
cd anoda
```

## 3. Bootstrap the toolchain

Installs `task`, `golangci-lint`, `govulncheck`, `goimports`, `sqlc`, `oapi-codegen`, `migrate`, `lefthook`,
`gitleaks`, `actionlint` (via `go install`), enables `pnpm` via corepack, creates your local `.env` from
`.env.example`, and installs git hooks.

```powershell
# Windows (PowerShell)
pwsh -NoProfile -File scripts/bootstrap.ps1
```

```bash
# Linux / macOS / Git Bash
bash scripts/bootstrap.sh
```

Re-run anytime; it's idempotent and skips what's already installed. If Go-installed tools aren't found
afterward, add `$(go env GOPATH)/bin` to your `PATH` permanently (the script does this for the current
session only).

## 4. Set your local secrets

`scripts/bootstrap.*` already copied `.env.example` to `.env` if it didn't exist. Open `.env` and fill in
real local values — at minimum a Postgres password. `.env` is git-ignored; never commit it.

```bash
cat .env.example   # see every variable and what it's for
```

## 5. Verify everything is wired correctly

```bash
task --list   # see every available task
task check    # THE gate: format check + lint + tests + security scans
```

`task check` is expected to pass even before any service is scaffolded — every per-service task skips
gracefully when that service has no code yet. If it fails, something in the toolchain install is wrong; the
error will name which step (`gofmt`, `golangci-lint`, `pnpm`, `gitleaks`, ...) to fix.

## 6. Start the local stack

```bash
task up     # docker compose up -d --build
task ps     # see what's running
task logs   # tail logs (Ctrl+C to stop watching, containers keep running)
task down   # stop everything (keeps data)
```

Right now this only starts Postgres — no service has been scaffolded yet (see `ONBOARDING.md` → Current
status). Once a service exists, its block in `docker-compose.yml` is uncommented and `task up` starts it too.

```bash
docker compose ps                 # equivalent to `task ps`
curl -s localhost:5432 || true    # Postgres won't answer HTTP, but this confirms the port is open
```

## 7. Run a single service (once one exists)

Every service gets its own task alias (`api`, `yomi-api`, `portal-ui`, `yomi-ui`). See `Taskfile.yml` for the
current list, or `task --list`.

```bash
task <alias>:test    # unit tests + coverage gate
task <alias>:lint    # linter + typecheck
task <alias>:run     # Go: go run ./cmd/server
task <alias>:dev     # Next.js: next dev
```

Then check its health:

```bash
curl -s localhost:<port>/healthz
curl -s localhost:<port>/readyz
```

Each service's own `README.md` (`services/<name>/README.md`) documents its exact port, env vars, and
endpoints once it's scaffolded.

## 8. Expose a UI over Tailscale (optional)

Only for a UI you want to reach from another device on your tailnet. Never do this for a Go API or Postgres
(`docs/contracts/05-security.md`).

```bash
tailscale serve --bg --https=443 http://localhost:<ui-port>
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `pnpm: command not found` | corepack not enabled | `corepack enable && corepack prepare pnpm@latest --activate`, or re-run bootstrap |
| `golangci-lint` / `task` / `gitleaks` not found | `$(go env GOPATH)/bin` not on `PATH` | Add it to your shell profile / Windows environment variables permanently |
| `docker compose config` fails on a missing variable | `.env` is missing a required key | Compare against `.env.example`, fill in the missing key |
| `task up` fails to reach Docker | Docker Desktop isn't running | Start Docker Desktop, retry |
| `lefthook` didn't run on commit | hooks not installed in this clone | `lefthook install` (bootstrap does this too) |
| Commit rejected by commit-msg hook | message isn't Conventional Commits | Use `type(scope): summary`, see `docs/contracts/01-repository.md` |
| Commit rejected by gitleaks | a secret-shaped string is staged | Remove it; secrets live only in `.env`, never in committed files |

If none of these fit, `task check` output names the exact failing step — start there.
