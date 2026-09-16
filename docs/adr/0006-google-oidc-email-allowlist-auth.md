# ADR 0006 — Google Sign-In with an email allowlist as the only authentication

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `05-security.md`, `03-nextjs-frontend.md` |

## Context

Exactly one application needs authentication, and its only legitimate users are the owner's own Google
account(s). Building a user system (passwords, registration, reset) would be pure attack surface.

## Decision

We will authenticate with Google OpenID Connect (authorization code + PKCE) inside the Next.js app's route
handlers, verify the ID token server-side, and accept only emails listed in `ALLOWED_EMAILS`. The app issues its
own opaque, server-side session in a `__Host-` cookie. Go APIs trust a short-lived internal token minted by the
Next.js server and are never exposed to browsers. No passwords are stored anywhere.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: Google OIDC + allowlist** | No credentials to protect, MFA inherited from Google, tiny code surface | Depends on Google availability |
| Self-hosted OIDC issuer (own JWTs, JWKS) | Full control | Large surface for a single user |
| External IdP (Auth0/Clerk/Keycloak) | Feature-rich | Extra dependency and cost for one user |
| Tailscale identity only | Zero code | Not portable if a UI is funneled publicly |

## Consequences

- Positive: minimal auth code, easy to test with fixture tokens.
- Negative: adding a second user is a config change; adding roles would need a new ADR.
- Tooling: `.env.example` keys `ALLOWED_EMAILS`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`.
