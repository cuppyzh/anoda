# 09 — Containers and deploy

Local hosting today is Docker Compose on the owner's machine, exposed through Tailscale. Every image is built so
that moving to Kubernetes (k3s/kind) is only a manifest-writing exercise. Decision record: ADR 0004.

## Images

| Rule | Level | Enforced by |
|---|---|---|
| Every service has a multi-stage `Dockerfile` derived from `tooling/docker/Dockerfile.go` or `Dockerfile.next`, plus a `.dockerignore` from `tooling/docker/.dockerignore`. | MUST | review |
| Go runtime stage is `gcr.io/distroless/static-debian12:nonroot` with a `CGO_ENABLED=0`, `-trimpath`, `-ldflags "-s -w"` static binary. | MUST | Dockerfile template |
| Next.js runtime stage is `node:<lts>-alpine` running the `standalone` output as user `node`. | MUST | Dockerfile template |
| Base images are pinned by digest (`image:tag@sha256:...`) and refreshed at least monthly. | MUST | review, Trivy |
| Images run as non-root (`USER nonroot` / `USER node`), have a read-only root filesystem, and drop all capabilities at runtime. | MUST | Dockerfile, compose, review |
| No secrets, `.env` files, `.git`, tests, or dev dependencies in the final image. | MUST NOT | `.dockerignore`, Trivy secret scan |
| Images have OCI labels: `org.opencontainers.image.source`, `.revision` (git SHA), `.created`. | SHOULD | Dockerfile template |
| Images are tagged `anoda/<service>:<git-sha>`; `latest` is for local only, never referenced in deploy configs. | MUST | Taskfile, review |
| Trivy scan passes with no fixable HIGH/CRITICAL findings. | MUST | CI |
| Health check uses the binary itself (`/server healthcheck` for Go; `node healthcheck.js` for Next) because distroless/alpine images have no `curl`. | MUST | compose template |

## 12-factor readiness (Kubernetes-ready)

| Rule | Level | Enforced by |
|---|---|---|
| All configuration via environment variables; no config files in images; no env-specific builds. | MUST | `config.Load`, `lib/env.ts` |
| Stateless processes: no local state that must survive a restart; only `/tmp` is writable. | MUST | `read_only: true` in compose |
| Port binding: services listen on `HTTP_ADDR`/`PORT`; no hard-coded ports. | MUST | review |
| Graceful shutdown on `SIGTERM` within 20s; readiness flips to `503` first so load balancers drain. | MUST | review, test |
| Logs to stdout/stderr only (08-observability.md). | MUST | review |
| Migrations run as a separate step (`migrate` job/container) before the new version starts, never on service boot in prod. Local compose MAY run them on boot via a `migrate` service. | MUST | compose, review |
| Backing services (Postgres, other APIs) are addressed by URL from env; never by hard-coded hostnames. | MUST | review |

## Docker Compose (local)

| Rule | Level | Enforced by |
|---|---|---|
| `docker-compose.yml` at the root is the only compose file committed; `docker-compose.override.yml` is git-ignored for personal tweaks. | MUST | `.gitignore` |
| Every service entry sets `restart: unless-stopped`, `read_only: true`, `tmpfs: [/tmp]`, `security_opt: [no-new-privileges:true]`, `cap_drop: [ALL]`, and a `healthcheck`. | MUST | compose template, review |
| Dependencies use `depends_on: condition: service_healthy`. | MUST | review |
| Only UIs (and Postgres on localhost for dev tools) publish host ports. Go APIs are internal-only. | MUST | review |
| Secrets come from `.env`; required ones use `${VAR:?message}` so a missing value fails fast. | MUST | compose |
| `docker compose config -q` passes in CI. | MUST | CI |

## Tailscale exposure

| Rule | Level | Enforced by |
|---|---|---|
| Services are reached over the tailnet via `tailscale serve` (HTTPS with Tailscale certs) pointing at the UI's published port. | MUST | owner runbook in service README |
| `tailscale funnel` (public internet) is enabled only for a service whose README documents why, and only for a UI that implements 05-security.md auth. | MUST | review |
| Go APIs and Postgres are never served or funneled. | MUST NOT | review |

## Kubernetes (when it comes)

| Rule | Level | Enforced by |
|---|---|---|
| Manifests live in `deploy/k8s/` as Kustomize base + overlays; one `Deployment` + `Service` per app, `ConfigMap` for non-secret config, `Secret` from an external source (never committed). | MUST | review |
| Every `Deployment` sets resource requests/limits, `livenessProbe: /healthz`, `readinessProbe: /readyz`, `securityContext` (non-root, read-only FS, drop ALL), and `terminationGracePeriodSeconds: 30`. | MUST | review |
| Ingress is the Tailscale Kubernetes operator. | SHOULD | ADR when adopted |

## Local runbook (per service README)

Each service README MUST include: how to build the image, how to run it in compose, how to check `/healthz`,
which env vars it reads, and how it is exposed (or not) via Tailscale.
