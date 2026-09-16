# `yomi.ui.anoda.com`

| Field | Value |
|---|---|
| Stack | Next.js UI (`docs/contracts/03-nextjs-frontend.md`, `12-design-ui-ux.md`) |
| Purpose | TBD. Fill in what this app is for and who uses it before scaffolding. |
| Owner | @Cuppyzh |
| Status | Planned |
| Exposure | TBD: `tailscale serve` (tailnet only) or `tailscale funnel` (requires Google Sign-In + allowlist, `05-security.md`, and an ADR) |
| Depends on | `yomi.api.anoda.com` (server-side only), TBD |
| Task alias | `yomi-ui` (`task yomi-ui:test`, `task yomi-ui:lint`, `task yomi-ui:dev`) |
| Host port | `${YOMI_UI_PORT:-3001}` |

## Run locally

```bash
task yomi-ui:install
task yomi-ui:test
task yomi-ui:lint
task yomi-ui:dev
curl -s localhost:3001/healthz
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `3000` (container) | Listen port |
| `API_BASE_URL` | yes | — | Server-side base URL of `yomi.api.anoda.com` (never `NEXT_PUBLIC_`) |
| `SESSION_SECRET` | if auth | — | 32+ random bytes, base64 |
| `ALLOWED_EMAILS` | if auth | — | Comma-separated allowlist |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | if auth | — | Google OIDC client |

## Routes

| Route | Purpose | Auth |
|---|---|---|
| `GET /healthz` | liveness (route handler) | none |

## Design

Screen specs: `docs/design/screens/yomi.ui.anoda.com/`. Shared components per `docs/design/README.md`.

## Runbook

- Health: `curl localhost:3001/healthz`
- Tailscale: `tailscale serve --bg --https=443 http://localhost:3001`
