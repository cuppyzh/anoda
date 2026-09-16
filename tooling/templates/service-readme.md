# `<name>.<api|ui>.anoda.com`

| Field | Value |
|---|---|
| Stack | Go API (02-go-backend.md) / Next.js UI (03-nextjs-frontend.md) |
| Purpose | One or two sentences. What this service owns and what it does **not** own. |
| Owner | @handle |
| Status | Planned / Active / Deprecated |
| Exposure | Internal only / `tailscale serve` / `tailscale funnel` (reason and ADR link required) |
| Depends on | Postgres `<db-name>`, `<other-service>` API, `<LLM provider>` |
| API contract | `api/openapi.yaml` (Go services) |

## Run locally

```bash
task <alias>:test       # unit tests + coverage gate
task <alias>:lint
task <alias>:run        # Go: go run ./cmd/server   |  UI: task <alias>:dev
task up                 # whole stack via docker compose
curl -s localhost:<port>/healthz
```

## Configuration

Every variable this service reads. Keep in sync with `.env.example` and `internal/config` / `lib/env.ts`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `HTTP_ADDR` / `PORT` | no | `:8080` / `3000` | Listen address |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn`, `error` |
| `DATABASE_URL` | yes | — | Postgres DSN |

## Endpoints (Go) / Routes (UI)

| Method + path | Purpose | Auth |
|---|---|---|
| `GET /healthz` | liveness | none (internal) |
| `GET /readyz` | readiness (DB ping) | none (internal) |
| `GET /metrics` | Prometheus | none (internal) |

## Architecture notes

Anything a newcomer must know that the contracts do not already say: domain concepts, non-obvious decisions (link ADRs),
background jobs, external integrations.

## Runbook

- Health: `curl localhost:<port>/readyz`
- Logs: `task logs` (filter by `service=<name>`)
- Migrations: `task <alias>:migrate:up` (Go services)
- Tailscale: `tailscale serve --bg --https=443 http://localhost:<port>` (UI only; never for APIs)

## Coverage exemptions (Go)

See `.coverage-exempt`. Each line needs a reason.
