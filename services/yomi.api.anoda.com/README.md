# `yomi.api.anoda.com`

| Field | Value |
|---|---|
| Stack | Go API (`docs/contracts/02-go-backend.md`) |
| Purpose | TBD. Fill in what this service owns and what it does **not** own before scaffolding. |
| Owner | @Cuppyzh |
| Status | Planned |
| Exposure | Internal only (Go APIs are never served or funneled via Tailscale) |
| Depends on | Postgres (own database), TBD |
| API contract | `api/openapi.yaml` (to be created) |
| Task alias | `yomi-api` (`task yomi-api:test`, `task yomi-api:lint`, `task yomi-api:run`) |
| Host port | `${YOMI_API_PORT:-8081}` |

## Run locally

```bash
task yomi-api:test
task yomi-api:lint
task yomi-api:run
curl -s localhost:8081/healthz
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `HTTP_ADDR` | no | `:8080` (container) | Listen address |
| `APP_ENV` | no | `local` | `local`, `production` |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn`, `error` |
| `DATABASE_URL` | yes | — | Postgres DSN |

## Endpoints

| Method + path | Purpose | Auth |
|---|---|---|
| `GET /healthz` | liveness | none (internal) |
| `GET /readyz` | readiness (DB ping) | none (internal) |
| `GET /metrics` | Prometheus | none (internal) |

## Architecture notes

Not scaffolded yet. Follow `services/README.md` → "Adding a service".

## Runbook

- Health: `curl localhost:8081/readyz`
- Logs: `task logs` (filter `service=yomi.api.anoda.com`)
