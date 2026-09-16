# ADR 0004 — Docker Compose first, Kubernetes-ready images

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `09-containers-and-deploy.md`, `08-observability.md` |

## Context

The system runs on the owner's local machine and is exposed through Tailscale. Kubernetes is attractive later
but adds setup cost now with no user-facing benefit.

## Decision

We will use Docker Compose for local hosting today and require every image to satisfy Kubernetes-readiness
rules from day one (12-factor config, stateless, `/healthz` + `/readyz`, SIGTERM drain, non-root, read-only FS,
digest-pinned bases, SHA tags). `deploy/k8s/` is reserved for Kustomize manifests.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: Compose now, K8s-ready** | Fast start, no migration pain later | Two deploy descriptions eventually |
| Kubernetes from day one (k3s/kind) | No later move | Slower start; YAML volume; little benefit for one host |
| Bare processes / systemd | Simplest | No isolation, no parity with future deploy |

## Consequences

- Positive: moving to k3s is writing manifests, not changing code.
- Negative: compose security settings must be maintained by hand.
- Tooling: compose templates in `docker-compose.yml`, Dockerfiles in `tooling/docker/`.
