# ADR 0007 — OpenAPI-first REST as the inter-service and UI contract

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `06-api-design.md`, `02-go-backend.md`, `03-nextjs-frontend.md` |

## Context

Services and UIs are written by different agents at different times. Without a machine-readable contract,
request and response shapes drift and bugs surface only at runtime.

## Decision

We will describe every Go service's HTTP API in one OpenAPI 3.1 file (`api/openapi.yaml`), generate Go server
types and request validation with `oapi-codegen`, generate TypeScript clients with `openapi-typescript`, use
RFC 9457 `problem+json` errors, cursor pagination, and path versioning.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: OpenAPI-first REST** | Human-readable, generates both sides, UIs consume directly | Spec discipline required |
| gRPC + protobuf | Strong typing, streaming | Needs a gateway for browsers; heavier toolchain |
| Code-first REST (annotations) | Less upfront | Spec drifts from intent; UIs get types late |
| GraphQL | Flexible queries | Over-fetch controls, N+1, caching complexity for a small system |

## Consequences

- Positive: shape mismatches fail at compile time on both sides.
- Negative: every endpoint change starts in YAML.
- Tooling: `go generate` wiring, spec lint added with the first service.
