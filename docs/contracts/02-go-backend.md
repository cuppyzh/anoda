# 02 — Go backend

Applies to every `services/*.api.anoda.com`. Stack: Go (current stable, see `.github/workflows/ci.yml`),
`net/http` with Go 1.22+ method-pattern routing, `chi` for routing groups and middleware, Postgres via `pgx`,
`sqlc` for typed queries, `golang-migrate` for migrations, `oapi-codegen` from `api/openapi.yaml`.
Decision record: ADR 0002.

## Layout (hexagonal / ports and adapters)

```text
services/<name>.api.anoda.com/
├── cmd/server/main.go            # wiring only: config → adapters → app → http server
├── api/openapi.yaml              # THE API contract (06-api-design.md)
├── internal/
│   ├── domain/                   # entities, value objects, domain errors. Zero external deps.
│   ├── app/                      # use cases. Depends on domain + ports only.
│   ├── ports/                    # interfaces the app needs (repos, clocks, LLM, mailer)
│   ├── adapters/
│   │   ├── http/                 # handlers, middleware, request/response mapping, generated server types
│   │   ├── postgres/             # sqlc output + repository implementations of ports
│   │   └── <provider>/           # other outbound adapters (llm, email, ...)
│   ├── config/                   # Load() from env into one struct; validation
│   └── prompts/                  # versioned LLM prompt files (10-ai-integration.md), if any
├── migrations/                   # NNNN_name.up.sql / .down.sql
├── sqlc.yaml
├── Dockerfile / .dockerignore
├── .coverage-exempt
└── README.md
```

| Rule | Level | Enforced by |
|---|---|---|
| Dependency direction is `adapters → app → domain`, `adapters → ports`. `domain` imports nothing from this module; `app` imports only `domain` and `ports`. | MUST | `depguard` in `.golangci.yml`, review |
| Interfaces live in `ports/` (or next to the consumer) and are defined by the consumer, not the implementer. | MUST | review |
| `cmd/server/main.go` contains wiring and graceful shutdown only, no business logic. | MUST | review |
| No package named `util`, `utils`, `common`, `helpers`, `misc`. Name packages by what they provide. | MUST NOT | `revive` (`var-naming`), review |
| All non-`main` code lives under `internal/`. | MUST | review |

## Code style

| Rule | Level | Enforced by |
|---|---|---|
| Code is `gofmt`'d and `goimports`'d with `-local anoda`. | MUST | `task fmt:check`, hook, CI |
| Line length ≤120. | SHOULD | `lll` |
| Functions ≤60 lines / ≤40 statements; cyclomatic complexity ≤15. Split, don't suppress. | SHOULD | `funlen`, `gocyclo` |
| Exported identifiers have doc comments that start with the identifier name and end with a period. | MUST | `revive` (`exported`), `godot` |
| Package names are short, lower-case, singular, no underscores. | MUST | `revive` |
| Receiver names are 1–2 letters and consistent within a type. | MUST | `revive` (`receiver-naming`) |
| No global mutable state. No `init()` functions except in generated code. | MUST NOT | `gochecknoglobals`, `gochecknoinits` |
| Accept interfaces, return concrete types. Keep interfaces small (1–3 methods). | SHOULD | review |
| Constructors are `NewX(deps...) (*X, error)`; dependencies are explicit parameters, never fetched from globals. | MUST | review |
| `context.Context` is the first parameter of every function that does I/O or may block, and is never stored in a struct. | MUST | `noctx`, `containedctx`, review |
| Named return values only when they clarify; never naked `return` in functions longer than a few lines. | SHOULD | `nakedret` |
| Enums are typed constants with a `String()`; `switch` statements over enums are exhaustive. | MUST | `exhaustive` |

## Errors

| Rule | Level | Enforced by |
|---|---|---|
| Every error is handled or returned. Never `_ = err` without a comment explaining why it is safe. | MUST | `errcheck` |
| Wrap with context on the way up: `fmt.Errorf("load user %s: %w", id, err)`. Never `%v` for errors. | MUST | `wrapcheck`, `errorlint` |
| Compare with `errors.Is` / `errors.As`, never `==` or type switches on error values. | MUST | `errorlint` |
| Domain errors are sentinel values or types in `domain/` (`ErrNotFound`, `ValidationError`). Adapters map them to HTTP problem types. | MUST | review |
| Error strings are lower-case, no trailing punctuation, no "failed to" prefix (the wrap chain already says that). | SHOULD | `revive` (`error-strings`) |
| Never `panic` in library code; `panic` only in `main` for impossible startup states. | MUST NOT | `forbidigo`, review |
| `log.Fatal` is allowed only in `cmd/server/main.go`. | MUST | `forbidigo` |

## Logging, config, time

| Rule | Level | Enforced by |
|---|---|---|
| Logging uses `log/slog` only; JSON handler in production, text in local. No `fmt.Print*`, no `log.Print*`. | MUST | `forbidigo`, `depguard` |
| Log with structured attributes, never string interpolation: `slog.Info("user created", "user_id", id)`. | MUST | `sloglint` |
| Never log secrets, tokens, passwords, full request bodies, or PII (email, name, IP) at any level. | MUST NOT | review, `gitleaks` for literals |
| Configuration is read once in `config.Load()` from environment variables into a validated struct. Nothing else calls `os.Getenv`. | MUST | `forbidigo` (`os.Getenv` outside `internal/config`) |
| Every config key has a documented default or is required; missing required keys fail startup with a clear message. | MUST | review, `.env.example` |
| Time comes from an injected `ports.Clock`; no `time.Now()` in `app/` or `domain/`. | SHOULD | review |

## HTTP layer

| Rule | Level | Enforced by |
|---|---|---|
| Routes use Go 1.22 method patterns (`mux.HandleFunc("GET /v1/books/{id}", ...)`) grouped with `chi`. | MUST | review |
| Middleware order: `RequestID → RealIP → Recoverer → Logger → SecurityHeaders → Timeout → CORS → Auth → RateLimit → handler`. | MUST | review |
| Handlers are thin: decode + validate → call app use case → map result/error → encode. No business logic. | MUST | review |
| Request bodies are size-limited (`http.MaxBytesReader`, default 1 MiB) and decoded with `DisallowUnknownFields`. | MUST | review |
| Every response body is closed; every outbound `http.Request` has a context. | MUST | `bodyclose`, `noctx` |
| Server has `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout` set. | MUST | `gosec` (G112), review |
| Graceful shutdown on `SIGINT`/`SIGTERM` with a 20s drain. | MUST | review |
| `/healthz`, `/readyz`, `/metrics` exist on every service (08-observability.md). | MUST | review |

## Database

| Rule | Level | Enforced by |
|---|---|---|
| Queries are written in SQL under `internal/adapters/postgres/queries/*.sql` and compiled with `sqlc`. No string-built SQL. | MUST | `sqlc`, `gosec` (G201/G202), review |
| Driver is `pgx/v5` with `pgxpool`. No ORM. | MUST | `depguard` |
| Migrations are versioned `NNNN_name.up.sql` / `.down.sql`, forward-only in `master`, applied by `golang-migrate` at deploy time, never at request time. | MUST | review |
| Every table has `id`, `created_at`, `updated_at`; timestamps are `timestamptz`. | SHOULD | review |
| Transactions are scoped in `app/` via a `ports.TxManager`, not in handlers or repositories. | SHOULD | review |
| Repository implementations map `pgx.ErrNoRows` to `domain.ErrNotFound`. | MUST | review |

## Dependencies

| Rule | Level | Enforced by |
|---|---|---|
| Prefer the standard library. A new dependency needs a one-line justification in the PR. | SHOULD | review |
| Allowed core: `github.com/go-chi/chi/v5`, `github.com/jackc/pgx/v5`, `github.com/golang-migrate/migrate/v4`, `github.com/oapi-codegen/*`, `github.com/stretchr/testify`, `golang.org/x/*`, `github.com/google/uuid`, `github.com/prometheus/client_golang`, `go.opentelemetry.io/*`, `github.com/coreos/go-oidc/v3`, `golang.org/x/oauth2`. | MAY | `depguard` allowlist |
| Banned: ORMs (`gorm.io/*`, `github.com/jinzhu/gorm`, `entgo.io/*`, `github.com/uptrace/bun`), `github.com/gin-gonic/*`, `github.com/labstack/echo/*`, `github.com/gofiber/*`, `github.com/sirupsen/logrus`, `go.uber.org/zap`, `github.com/rs/zerolog`, `github.com/pkg/errors`, `github.com/spf13/viper`, `github.com/lib/pq`, `github.com/dgrijalva/jwt-go`. | MUST NOT | `depguard` |
| `go.mod` uses the current stable Go and `go.sum` is committed. `govulncheck` passes. | MUST | CI |
| Generated code (`sqlc`, `oapi-codegen`) is regenerated via `go generate ./...` and committed. | MUST | review, CI diff |

## Module and identity

| Rule | Level | Enforced by |
|---|---|---|
| Module path is `anoda/<name>.api` (e.g. `anoda/yomi.api`). | MUST | review |
| The binary is `cmd/server`; version is injected via `-ldflags -X main.version=<git sha>`. | MUST | `tooling/taskfiles/go.yml` |
| The binary supports a `healthcheck` subcommand that hits its own `/readyz`, for distroless container health checks. | MUST | review, compose template |
