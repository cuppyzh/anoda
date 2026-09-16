# anoda

A microservices monorepo: Go APIs (`net/http` + chi, Postgres, sqlc, OpenAPI) and Next.js UIs (App Router, TypeScript
strict, Tailwind + shadcn/ui), run locally with Docker Compose and exposed through Tailscale. Most code is written by AI
agents under a set of binding **engineering contracts** enforced by tooling.

## Start here

| If you are... | Read |
|---|---|
| New here, or forgot where things stand | [`ONBOARDING.md`](ONBOARDING.md) |
| Just want to run it locally | [`START.md`](START.md) |
| An AI agent about to change code | [`CLAUDE.md`](CLAUDE.md) (or `AGENTS.md`) |
| A human wanting the rules | [`docs/contracts/00-overview.md`](docs/contracts/00-overview.md) |
| Wondering *why* a rule exists | [`docs/adr/`](docs/adr/README.md) |
| Designing a screen | [`docs/design/`](docs/design/README.md) and `docs/contracts/12-design-ui-ux.md` |
| Adding a service | [`services/README.md`](services/README.md) |

## Prerequisites

Go (current stable), Node.js 22+, Docker Desktop, Git. Everything else is installed by the bootstrap script.
Full copy-paste guide: [`START.md`](START.md).

## Setup

```bash
# Windows (PowerShell)
pwsh -NoProfile -File scripts/bootstrap.ps1
# Linux / macOS / Git Bash
bash scripts/bootstrap.sh

task --list        # see all tasks
task check         # THE gate: format check + lint + tests + security scans
task up            # local stack (Postgres + services) via docker compose
```

`task check` runs the same checks as the git hooks (lefthook) and CI (`.github/workflows/ci.yml`).

## Layout

```text
CLAUDE.md, AGENTS.md    agent entrypoint
ONBOARDING.md           what/where/progress — kept current by the /sync-onboard skill
START.md                copy-paste guide to run everything locally
Taskfile.yml            task runner (root); per-service tasks in tooling/taskfiles/
lefthook.yml            git hooks
docker-compose.yml      local stack; .env.example lists every config key
docs/contracts/         binding rules (00–12)
docs/adr/               architecture decision records
docs/design/            design system inventory + screen specs
tooling/                shared configs: go, node, docker, design tokens, templates
scripts/                bootstrap scripts
deploy/                 compose helpers now, Kubernetes later
services/               one folder per deployable
.claude/skills/         project-local skills, e.g. sync-onboard
```

## Services

| Service | Stack | Purpose |
|---|---|---|
| `services/api.anoda.com` | Go API | TBD |
| `services/yomi.api.anoda.com` | Go API | TBD |
| `services/portal.ui.anoda.com` | Next.js UI | TBD |
| `services/yomi.ui.anoda.com` | Next.js UI | TBD |

## Non-negotiables (summary)

Unit tests with every change and an 80% coverage gate. `task check` green before a PR. No secrets in the repo. No
weakening of lint or coverage gates without an ADR. Hexagonal architecture and SOLID on the backend, feature modules and
Server Components by default on the frontend. WCAG 2.2 AA and design tokens only in UIs. Full text in `docs/contracts/`.
