# 10 — AI integration (LLM calls in product code)

Applies to any code that calls a Large Language Model. LLM calls are slow, expensive, non-deterministic, and
send data to a third party. The rules below keep them swappable, bounded, testable, and private.

> When implementing the first provider adapter, load the `claude-api` skill (or read the provider's current docs)
> for model IDs, pricing, and SDK details. Do not hard-code model names from memory.

## Architecture

| Rule | Level | Enforced by |
|---|---|---|
| All LLM access goes through one port per service: `ports.LLMClient` with a small interface (`Complete(ctx, Request) (Response, error)`, optionally `Stream`). Use cases depend on the port, never on a vendor SDK. | MUST | `depguard` (vendor SDKs allowed only in `internal/adapters/llm/**`) |
| One adapter per provider in `internal/adapters/llm/<provider>/`. Provider and model are chosen by config (`LLM_PROVIDER`, `LLM_MODEL`), not by code. | MUST | review |
| Decorators wrap the client for cross-cutting concerns in this order: `budget → retry → timeout → metrics → logging → provider`. | MUST | review |
| The UI never calls an LLM provider directly; it calls our Go API. | MUST NOT | review |
| Prompts are code: stored as versioned files in `internal/prompts/<name>/v<N>.tmpl` rendered with `text/template`, with a `CHANGELOG.md` per prompt. Never inline prompt strings in Go code. | MUST | review |
| Every prompt template declares its expected input struct and output schema next to it. | MUST | review |

## Bounds

| Rule | Level | Enforced by |
|---|---|---|
| Every call has a context timeout (`LLM_REQUEST_TIMEOUT_SECONDS`, default 30s; streaming ≤120s). | MUST | timeout decorator, test |
| `max_tokens` is always set (`LLM_MAX_OUTPUT_TOKENS`, default 2048). | MUST | review |
| A daily spend budget (`LLM_DAILY_BUDGET_USD`) is enforced by the budget decorator using provider-reported usage; exceeding it returns `domain.ErrBudgetExceeded` → `429` with `Retry-After`. | MUST | budget decorator, test |
| Retries: max 3, exponential backoff with jitter, only on `429`/`5xx`/timeouts, never on `4xx` validation errors. | MUST | retry decorator, test |
| Per-caller rate limiting on endpoints that trigger LLM calls. | MUST | 05-security.md |
| Input is truncated or rejected above a documented size (default 32k characters) before it reaches the provider. | MUST | review, test |

## Output handling

| Rule | Level | Enforced by |
|---|---|---|
| Structured output is requested via the provider's tool/JSON mode and **validated** against a schema (Go struct + validation, or JSON Schema). Invalid output is retried once with the error appended, then fails with `domain.ErrLLMInvalidOutput`. | MUST | tests |
| Model output is untrusted input: never executed, never used to build SQL/paths/URLs, always escaped when rendered. | MUST | review |
| Model output shown to users is labeled as AI-generated in the UI. | MUST | 12-design-ui-ux.md |
| Prompt-injection surface: user-provided text is placed in clearly delimited data sections of the prompt, never concatenated into instructions. | MUST | prompt review |

## Privacy and secrets

| Rule | Level | Enforced by |
|---|---|---|
| API keys come from env (`ANTHROPIC_API_KEY`, etc.), never logged, never in prompts. | MUST | `gitleaks`, review |
| No PII (emails, names, addresses) is sent to a provider unless an ADR approves it for that use case and the prompt redacts what it can. | MUST | review, ADR |
| Provider data retention/training settings are set to the most private option available and documented in the adapter README. | MUST | adapter README |
| Prompts and completions are logged only at `DEBUG` in `APP_ENV=local`, truncated to 500 chars, never in production. | MUST | logging decorator, test |

## Observability

| Rule | Level | Enforced by |
|---|---|---|
| Metrics: `llm_requests_total{provider,model,outcome}`, `llm_tokens_total{provider,model,direction}`, `llm_request_duration_seconds`, `llm_cost_usd_total{provider,model}`. | MUST | metrics decorator |
| Each call logs at `INFO`: `prompt_name`, `prompt_version`, `provider`, `model`, `input_tokens`, `output_tokens`, `duration_ms`, `outcome`, `request_id`. No content. | MUST | logging decorator |

## Testing

| Rule | Level | Enforced by |
|---|---|---|
| Unit tests use a fake `LLMClient` returning canned responses; provider SDKs are never called in unit tests. | MUST | 04-testing.md |
| Each provider adapter has tests against **recorded fixtures** (`testdata/*.json`) of real responses, including error shapes. Recording requires a real key and runs behind `//go:build record`. | MUST | review |
| Each prompt has an eval test: a small table of inputs with assertions on the validated output structure (not exact wording). Evals run against fixtures in CI; a `//go:build live` variant MAY run against the real model manually. | MUST | review |
| Decorators (timeout, retry, budget) are tested with a fake clock and fake client. | MUST | tests |

## Model choice

| Rule | Level | Enforced by |
|---|---|---|
| Default to the most capable current model for quality-critical paths and a small/fast model for classification or routing; both are config values. | SHOULD | config |
| Changing the default model is a config change plus a rerun of the prompt evals, recorded in the prompt's `CHANGELOG.md`. | MUST | review |
