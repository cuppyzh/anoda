# syntax=docker/dockerfile:1.7
# Reference Dockerfile for Go services. Copy to services/<name>.api.anoda.com/Dockerfile.
# Rules: docs/contracts/09-containers-and-deploy.md
#
# Pin base images by DIGEST before first real use and refresh monthly:
#   docker buildx imagetools inspect golang:1.26-alpine | grep Digest
#   docker buildx imagetools inspect gcr.io/distroless/static-debian12:nonroot | grep Digest

ARG GO_VERSION=1.26
ARG GIT_SHA=dev
ARG BUILD_DATE=unknown

# ---------- build ----------
FROM golang:${GO_VERSION}-alpine AS build
# TODO(pin): FROM golang:1.26-alpine@sha256:<digest> AS build
WORKDIR /src

# Cache modules separately from source.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w -X main.version=${GIT_SHA}" -o /out/server ./cmd/server

# Optional: run the migrations binary from the same image (`/server migrate up`) instead of a second image.

# ---------- runtime ----------
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
# TODO(pin): FROM gcr.io/distroless/static-debian12:nonroot@sha256:<digest> AS runtime
ARG GIT_SHA
ARG BUILD_DATE
LABEL org.opencontainers.image.source="https://github.com/<owner>/anoda" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}"

COPY --from=build /out/server /server
# Migrations are embedded via `embed` in the binary; if you ship them as files instead:
# COPY --from=build /src/migrations /migrations

USER nonroot:nonroot
EXPOSE 8080
ENV HTTP_ADDR=:8080 APP_ENV=production

# distroless has no shell/curl: the binary implements `healthcheck` (02-go-backend.md §Module and identity).
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 CMD ["/server", "healthcheck"]

ENTRYPOINT ["/server"]
