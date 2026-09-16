# `api.anoda.com`

| Field | Value |
|---|---|
| Stack | Go API (`docs/contracts/02-go-backend.md`) |
| Purpose | TBD. Fill in what this service owns and what it does **not** own before scaffolding. |
| Owner | @Cuppyzh |
| Status | Planned |
| Exposure | Internal only (Go APIs are never served or funneled via Tailscale) |
| Depends on | Postgres (own database), TBD |
| API contract | `api/openapi.yaml` (to be created) |
| Task alias | `api` (`task api:test`, `task api:lint`, `task api:run`) |
| Host port | `${API_PORT:-8080}` |

## Run locally

```bash
task api:test
task api:lint
task api:run
curl -s localhost:8080/healthz
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `HTTP_ADDR` | no | `:8080` | Listen address |
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

- Health: `curl localhost:8080/readyz`
- Logs: `task logs` (filter `service=api.anoda.com`)
