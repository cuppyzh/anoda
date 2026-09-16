# ADR 0002 — Go backend on stdlib net/http + chi, Postgres via pgx and sqlc

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `02-go-backend.md`, `06-api-design.md`, `07-design-patterns.md` |

## Context

Backend services need an HTTP stack and persistence layer that stay readable for years, are easy to unit test,
and give AI agents few ways to go wrong. Heavy frameworks and ORMs add magic that hides control flow and
makes SOLID boundaries harder to see.

## Decision

We will build Go services on the standard library `net/http` (Go 1.22+ method routing) with `chi` for
grouping and middleware, Postgres accessed through `pgx/v5` with `sqlc`-generated typed queries, migrations via
`golang-migrate`, and OpenAPI-generated server types via `oapi-codegen`. Services follow hexagonal architecture
(`domain` → `app` → `ports` ← `adapters`). ORMs and full frameworks are banned via `depguard`.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: stdlib + chi + pgx + sqlc** | Minimal deps, explicit code, SQL stays SQL, compile-time typed queries, trivially mockable ports | Slightly more boilerplate than a framework |
| Gin/Echo + GORM | Fast to start, many examples | Framework-specific handler signatures, ORM hides queries, harder to test cleanly, N+1 traps |
| gRPC everywhere | Strong typing across services | UIs need a gateway; more tooling; overkill for a small tailnet-hosted system |

## Consequences

- Positive: code reads top-to-bottom; every query is visible; ports make unit tests natural.
- Negative: agents must write handlers and mapping by hand (mitigated by `oapi-codegen`).
- Tooling: `tooling/go/.golangci.yml` `depguard` allow/deny lists; `tooling/taskfiles/go.yml`.
