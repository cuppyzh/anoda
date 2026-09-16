# 06 — API design

Every Go service exposes a REST API described by **one OpenAPI 3.1 document** at `api/openapi.yaml`.
The spec is the contract between services and UIs; code is generated from it, not the other way round.
Decision record: ADR 0007.

## Spec-first workflow

| Rule | Level | Enforced by |
|---|---|---|
| Change `api/openapi.yaml` first, then run `go generate ./...` (`oapi-codegen` → `internal/adapters/http/gen`), then implement. | MUST | review, CI regen diff |
| The spec validates (`openapi.yaml` lint via `redocly lint` or `spectral`) and every operation has `operationId`, `summary`, tags, and documented `4xx`/`5xx` responses. | MUST | CI (added with the first service) |
| UIs consume a generated TypeScript client (`openapi-typescript`) from the same file; no hand-written response types. | MUST | review |
| Request validation uses the generated OpenAPI middleware (`oapi-codegen` + `kin-openapi`) plus explicit domain checks. | MUST | review |
| Breaking changes bump the path version (`/v2`); `/v1` keeps working until an ADR retires it. | MUST | review |

## URLs and methods

| Rule | Level | Enforced by |
|---|---|---|
| Paths: `/v{n}/<plural-resource>[/{id}[/<sub-resource>]]`, lower-case, kebab-case, no trailing slash, no verbs. | MUST | spec review |
| Verbs map to methods: `GET` read, `POST` create or non-idempotent action, `PUT` full replace, `PATCH` partial update (JSON Merge Patch), `DELETE` remove. | MUST | spec review |
| Actions that are not CRUD are `POST /v1/<resource>/{id}:<verb>` (e.g. `:publish`). | MAY | spec review |
| IDs are UUIDv7 strings; never expose database serial integers. | MUST | review |
| Query parameters are `snake_case`; JSON fields are `camelCase`. | MUST | spec review |

## Requests and responses

| Rule | Level | Enforced by |
|---|---|---|
| Content type is `application/json; charset=utf-8`. Timestamps are RFC 3339 UTC strings. Money is `{ "amount": "12.34", "currency": "IDR" }` with string amounts. | MUST | spec review |
| Every response object is a top-level JSON object, never a bare array or scalar. | MUST | spec review |
| Collections: `{ "items": [...], "nextCursor": "opaque-or-null" }`. Cursor pagination; `limit` query param, default 20, max 100. No offset pagination. | MUST | spec review |
| Successful create returns `201` with the resource and a `Location` header. `DELETE` returns `204`. | MUST | spec review |
| Idempotency: `POST` operations that create resources accept an `Idempotency-Key` header (UUID) and replay the original response for 24h. | SHOULD | review |
| Partial responses / field selection are not supported; design smaller resources instead. | MUST NOT | spec review |

## Errors (RFC 9457)

| Rule | Level | Enforced by |
|---|---|---|
| All error responses are `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, and `requestId`. | MUST | handler tests |
| `type` is a stable URN, e.g. `urn:anoda:problem:validation`, `urn:anoda:problem:not-found`, `urn:anoda:problem:conflict`, `urn:anoda:problem:unauthorized`, `urn:anoda:problem:forbidden`, `urn:anoda:problem:rate-limited`, `urn:anoda:problem:internal`. | MUST | shared list in each service's `http/problem.go` |
| Validation errors add `errors: [{ "field": "title", "message": "must not be empty" }]`. | MUST | handler tests |
| `5xx` `detail` is generic ("something went wrong"); internals go to logs with the `requestId`. | MUST | tests |
| Domain error → HTTP mapping happens in one place per service (`http/problem.go`). Handlers never build status codes ad hoc. | MUST | review |

```json
{
  "type": "urn:anoda:problem:validation",
  "title": "Request is invalid",
  "status": 400,
  "detail": "One or more fields are invalid.",
  "instance": "/v1/books",
  "requestId": "01J8Z...",
  "errors": [{ "field": "title", "message": "must not be empty" }]
}
```

## Headers

| Rule | Level | Enforced by |
|---|---|---|
| `X-Request-ID`: accepted from trusted callers, generated otherwise, echoed on every response, propagated to downstream calls and logs. | MUST | middleware, tests |
| `Authorization: Bearer <internal token>` on every non-public route (05-security.md). | MUST | middleware |
| Rate-limited responses carry `Retry-After`. | MUST | middleware |
| Caching: `Cache-Control: no-store` by default on APIs. | MUST | middleware |

## Service-to-service

| Rule | Level | Enforced by |
|---|---|---|
| Services call each other over HTTP using the callee's generated client, with a timeout, the propagated request ID, and the internal bearer token. | MUST | review |
| No shared database between services. Data another service needs is exposed through its API. | MUST NOT | review, compose |
| Retries only on idempotent operations, with exponential backoff and jitter, max 3. | MUST | review |

## Versioning and deprecation

| Rule | Level | Enforced by |
|---|---|---|
| Additive changes (new optional field, new endpoint) do not bump the version. Removing or changing meaning does. | MUST | spec review |
| Deprecated operations are marked `deprecated: true` in the spec and return a `Deprecation` header. | SHOULD | review |
