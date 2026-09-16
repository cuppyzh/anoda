# 05 — Security

Baseline: OWASP ASVS Level 1 for everything, Level 2 for anything that handles auth or personal data.
Decision record for auth: ADR 0006.

## Threat model in one paragraph

Services run on a home host and are reachable only through the owner's Tailscale tailnet, except any app deliberately
exposed with Tailscale Funnel. The single authenticated app uses Google Sign-In and accepts **only the owner's
allow-listed Google account(s)**. Attack surface that matters: leaked secrets in the repo, vulnerable dependencies,
injection through inputs, session theft, and misconfigured exposure. Every rule below targets one of those.

## Authentication (Google Sign-In, email allowlist)

| Rule | Level | Enforced by |
|---|---|---|
| Sign-in is Google OpenID Connect (authorization code flow with PKCE) implemented in the Next.js app's route handlers; the browser never receives Google tokens. | MUST | review |
| The Google `id_token` is verified server-side against Google's JWKS: signature, `iss` ∈ {`https://accounts.google.com`, `accounts.google.com`}, `aud` = our client ID, `exp`, `iat`, `nonce` matches, `email_verified == true`. | MUST | review, unit tests with fixture tokens |
| The `email` claim, lower-cased, MUST be in `ALLOWED_EMAILS` (comma-separated env). Any other account gets `403` and a log line **without** the email. | MUST | review, unit test |
| On success, the app issues its **own** session: an opaque random ID (≥32 bytes) stored server-side (Postgres or signed cookie with `SESSION_SECRET`), never the Google token. | MUST | review |
| Session cookie attributes: `HttpOnly; Secure; SameSite=Lax; Path=/`, name prefixed `__Host-`. Lifetime ≤7 days, idle timeout ≤24h, rotated on privilege change. | MUST | review, unit test |
| Sign-out invalidates the server-side session and clears the cookie. | MUST | review |
| Go APIs receive the caller's identity from the Next.js server via a short-lived internal token (HS256/EdDSA, ≤5 min, `SESSION_SECRET`-derived key) in `Authorization: Bearer`; they never accept Google tokens directly. | MUST | review |
| Go APIs are never reachable from the browser; compose/k8s expose them only on the internal network. | MUST | compose, review |
| No passwords are stored anywhere. Ever. | MUST NOT | review |

## Authorization

| Rule | Level | Enforced by |
|---|---|---|
| Deny by default: every route is protected unless explicitly listed as public (`/healthz`, `/readyz`, `/metrics` on the internal network, sign-in routes). | MUST | middleware order, review |
| Authorization is checked in `app/` use cases (Go) or the route handler (Next), never only in the UI. | MUST | review |
| Object-level checks: a request for `/v1/things/{id}` verifies the caller may access **that** id. | MUST | review, tests |

## Input handling

| Rule | Level | Enforced by |
|---|---|---|
| Validate at every trust boundary with a schema: OpenAPI-generated validators + explicit checks (Go), zod (TS). Reject unknown fields. | MUST | review |
| Bodies are size-limited (1 MiB default); collections are paginated with a max page size. | MUST | review |
| SQL is only via `sqlc`-generated, parameterized queries. | MUST | `sqlc`, `gosec` |
| Output encoding is left to the framework (React escaping, `encoding/json`). `dangerouslySetInnerHTML` and `template.HTML` are banned without an ADR. | MUST NOT | `react/no-danger`, `gosec` |
| File paths from input are never joined into filesystem paths. | MUST NOT | `gosec` (G304), review |
| Redirect targets are allow-listed relative paths only (prevents open redirect after sign-in). | MUST | review, test |

## Web hardening (Next.js)

| Rule | Level | Enforced by |
|---|---|---|
| Security headers on every response: `Content-Security-Policy` (nonce-based, no `unsafe-inline` scripts), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`). | MUST | `next.config.ts` headers, review |
| CSRF: state-changing route handlers verify `Origin`/`Sec-Fetch-Site` and use `SameSite=Lax` cookies; Server Actions rely on Next's built-in origin check plus our header check. | MUST | review, test |
| CORS: Go APIs allow only the internal UI origins from config; no `*`. | MUST | review |
| Rate limiting on sign-in and any expensive endpoint (token bucket per IP + per session). | MUST | review |
| `poweredByHeader: false`; no server version banners. | MUST | review |

## Secrets and configuration

| Rule | Level | Enforced by |
|---|---|---|
| Secrets exist only in environment variables (local `.env`, git-ignored). Never in code, tests, fixtures, docs, or images. | MUST | `gitleaks` (hook + CI), `.gitignore` |
| Every secret has a fake placeholder in `.env.example`. | MUST | review |
| Secrets are never logged, never included in error messages, never sent to an LLM. | MUST NOT | review, `sloglint` |
| Rotation: `SESSION_SECRET` and OAuth client secret rotate at least yearly and immediately after any suspected leak. | SHOULD | owner |
| A leaked secret is treated as compromised: rotate first, then clean history. | MUST | owner |

## Dependencies and supply chain

| Rule | Level | Enforced by |
|---|---|---|
| `govulncheck` (Go) and `pnpm audit --audit-level=high` (Node) pass in CI. | MUST | CI |
| Container images are scanned with Trivy; HIGH/CRITICAL fixable findings fail the build. | MUST | CI |
| Lockfiles are committed and installs are frozen. | MUST | CI |
| Base images are pinned by digest and refreshed monthly. | MUST | Dockerfiles, review |
| GitHub Actions are pinned to a major tag at minimum; third-party actions SHOULD be pinned to a SHA. | SHOULD | review |
| New dependencies are checked for maintenance status and license (MIT/Apache-2.0/BSD/ISC allowed; GPL needs an ADR). | MUST | review |

## Containers and runtime

| Rule | Level | Enforced by |
|---|---|---|
| Containers run as non-root, read-only root FS, `cap_drop: [ALL]`, `no-new-privileges`. | MUST | Dockerfiles, compose, review |
| No SSH, shells, or package managers in production images (distroless / minimal). | MUST | Dockerfiles |
| Postgres is not exposed outside the compose network except on localhost for local dev. | MUST | compose |
| Tailscale: only the intended UI is served (`tailscale serve`); Funnel is enabled only with a written reason in the service README. | MUST | review |

## Logging and privacy

| Rule | Level | Enforced by |
|---|---|---|
| Never log: secrets, tokens, cookies, `Authorization` headers, full request/response bodies, emails, names, IPs (hash if needed for rate limiting). | MUST NOT | review |
| Log security events: sign-in success/failure (with allowlist result but no email), sign-out, 401/403, rate-limit hits. | MUST | review |
| Error responses never leak stack traces, SQL, or internal paths (`problem+json` with a generic `detail` for 5xx). | MUST | review, tests |

## Process

| Rule | Level | Enforced by |
|---|---|---|
| Any PR touching auth, sessions, cookies, headers, or secrets carries the `security` commit type and is reviewed with `/security-review` or equivalent. | MUST | review |
| Security-relevant decisions get an ADR. | MUST | review |
