# 08 — Observability

Every runtime service is debuggable from its logs, health endpoints, and metrics alone, without SSH.

## Logging

| Rule | Level | Enforced by |
|---|---|---|
| Structured logs only: Go `log/slog` (JSON handler in non-local envs); Next.js `lib/logger.ts` emitting JSON lines. Write to stdout/stderr, never to files. | MUST | `forbidigo`, `no-console` |
| Every log line has: `time`, `level`, `msg`, `service`, `version`, `env`, and `request_id` when inside a request. | MUST | slog handler setup, review |
| Levels: `DEBUG` local noise, `INFO` state changes worth knowing in prod, `WARN` recoverable anomalies, `ERROR` failed operations needing attention. No `FATAL` outside `main`. | MUST | review |
| Attribute keys are `snake_case` and stable (`user_id`, `book_id`, `duration_ms`, `status`). | MUST | `sloglint` (`key-naming-case`) |
| Log once per failure at the boundary that handles it; don't log and also return the error. | SHOULD | review |
| Never log PII or secrets (05-security.md). Request logs include method, path template (not raw path), status, duration, request ID, and hashed client IP if at all. | MUST NOT | review |
| Log level is set by `LOG_LEVEL` env var; default `info`. | MUST | `config.Load` |

## Request ID and correlation

| Rule | Level | Enforced by |
|---|---|---|
| The first middleware assigns or accepts `X-Request-ID` (UUIDv7), stores it in `context`, echoes it in the response, and includes it in every log line and `problem+json` body. | MUST | middleware, tests |
| Next.js server-side calls to Go APIs forward the request ID; browser requests get one generated in the route handler. | MUST | `lib/fetcher.ts` |
| Outbound calls (other services, LLM providers, DB) log `duration_ms` and outcome at `DEBUG`, errors at `WARN`/`ERROR`. | SHOULD | review |

## Health endpoints

| Endpoint | Meaning | Rule |
|---|---|---|
| `GET /healthz` | Liveness: the process is running. Returns `200 {"status":"ok"}` with no dependency checks. | MUST exist on every service |
| `GET /readyz` | Readiness: can serve traffic. Checks DB ping (≤1s timeout) and required config. `503` with a JSON list of failing checks otherwise. | MUST exist on every service |
| `GET /metrics` | Prometheus exposition format. | MUST exist on Go services; SHOULD on Next.js |

Health endpoints are unauthenticated but only exposed on the internal network; they never include secrets or hostnames.

## Metrics (Prometheus)

| Rule | Level | Enforced by |
|---|---|---|
| Go services expose `http_requests_total{method,route,status}`, `http_request_duration_seconds{method,route}` (histogram), `db_query_duration_seconds{query}`, and Go runtime metrics. | MUST | middleware, review |
| Route labels use the pattern (`/v1/books/{id}`), never the raw path (cardinality). | MUST | review |
| LLM calls expose `llm_requests_total{provider,model,outcome}`, `llm_tokens_total{provider,model,direction}`, `llm_request_duration_seconds`. | MUST | 10-ai-integration.md |
| Business metrics are added when a use case needs monitoring; named `<domain>_<noun>_<unit>`. | MAY | review |

## Tracing

| Rule | Level | Enforced by |
|---|---|---|
| OpenTelemetry SDK with OTLP exporter behind `OTEL_EXPORTER_OTLP_ENDPOINT`; disabled when unset. | SHOULD | review |
| When enabled, HTTP server, HTTP client, and pgx are instrumented; trace and span IDs are added to log lines. | SHOULD | review |

## Errors and panics

| Rule | Level | Enforced by |
|---|---|---|
| Recoverer middleware converts panics into `500 problem+json`, logs the stack at `ERROR` with the request ID, and increments `http_panics_total`. | MUST | middleware, test |
| Next.js `error.tsx` boundaries log the error with a digest via `lib/logger.ts` and show the design-system error state. | MUST | review |

## Local developer experience

| Rule | Level | Enforced by |
|---|---|---|
| In `APP_ENV=local`, Go uses `slog.TextHandler` with colors off and `LOG_LEVEL=debug` by default. | SHOULD | `config.Load` |
| `task logs` tails the compose stack; each service's README says how to reach its `/healthz`. | MUST | Taskfile, README template |
