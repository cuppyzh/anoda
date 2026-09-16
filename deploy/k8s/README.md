# deploy/k8s (reserved)

Kubernetes manifests are **not written yet**; local hosting uses Docker Compose (`task up`).
This folder exists so the move to Kubernetes (k3s or kind, exposed through Tailscale) is a
manifest-writing exercise, not a refactor. See ADR 0004.

## Every image MUST already satisfy these rules

They are enforced by `docs/contracts/09-containers-and-deploy.md` and the reference Dockerfiles in `tooling/docker/`.

- 12-factor: all config via environment variables; no config files baked into images.
- Stateless: no local disk state that must survive a restart. Writable paths are `/tmp` only.
- Health: `GET /healthz` (liveness) and `GET /readyz` (readiness) on every HTTP service.
- Shutdown: handle `SIGTERM`, stop accepting connections, drain in-flight requests within 20s.
- Security: run as non-root UID, read-only root filesystem, no capabilities, pinned base image digest.
- Observability: JSON logs to stdout/stderr only; Prometheus metrics at `/metrics`.
- Tagging: images are tagged with the git SHA; `latest` is for local use only.

## Planned layout

```text
deploy/k8s/
  base/            # Kustomize base: one Deployment + Service per app, shared ConfigMap
  overlays/local/  # k3s/kind overrides, Tailscale operator ingress
```
