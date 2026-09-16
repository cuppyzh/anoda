# services

One folder per deployable. Names are `<name>.api.anoda.com` (Go, `docs/contracts/02-go-backend.md`) or
`<name>.ui.anoda.com` (Next.js, `docs/contracts/03-nextjs-frontend.md`).

| Service | Stack | Purpose | Status |
|---|---|---|---|
| [`api.anoda.com`](api.anoda.com/README.md) | Go API | TBD | Planned |
| [`yomi.api.anoda.com`](yomi.api.anoda.com/README.md) | Go API | TBD | Planned |
| [`portal.ui.anoda.com`](portal.ui.anoda.com/README.md) | Next.js UI | TBD | Planned |
| [`yomi.ui.anoda.com`](yomi.ui.anoda.com/README.md) | Next.js UI | TBD | Planned |

## Adding a service (checklist)

Do all of these in the PR that creates the service. The PR title is `feat(<short-name>): scaffold service`.

1. Create `services/<name>.<api|ui>.anoda.com/` following the layout in the stack contract.
2. `README.md` from `tooling/templates/service-readme.md`, fully filled (purpose, env vars, endpoints, runbook).
3. Copy `tooling/docker/Dockerfile.<go|next>` → `Dockerfile` and `tooling/docker/.dockerignore` → `.dockerignore`. Pin base image digests.
4. Go: `go.mod` with module path `anoda/<name>.api`; `.coverage-exempt` (may be empty); `api/openapi.yaml`; `sqlc.yaml`; `migrations/`.
   Node: `package.json` (pnpm), `tsconfig.json` extending `tooling/node/tsconfig.base.json`, `eslint.config.mjs`, `prettier.config.mjs`,
   `vitest.config.ts` re-exporting the shared configs; `tailwind.config.ts` with the preset; `components.json`; `tests/setup.ts`; `healthcheck.js`.
5. Register the service:
   - `Taskfile.yml` → new `includes:` entry (alias, taskfile, `dir`, `SERVICE` var) and add it to the aggregate `fmt/lint/test/security` tasks.
   - `docker-compose.yml` → uncomment/copy the matching template block; add ports and env to `.env.example`.
   - `.github/workflows/ci.yml` → add the folder to the `go`/`node`/`docker` matrix.
   - `services/README.md` (this table).
6. Implement `/healthz`, `/readyz`, `/metrics` (Go) or `/healthz` (Next) before any feature.
7. Add the first unit test and confirm `task <alias>:test` and `task check` pass.

## Cross-service rules

- No shared database. No shared Go module or npm package until an ADR defines one.
- Services talk only via their OpenAPI-described HTTP APIs (`docs/contracts/06-api-design.md`).
- UIs never call Go APIs from the browser; they proxy via route handlers with server-side credentials.
