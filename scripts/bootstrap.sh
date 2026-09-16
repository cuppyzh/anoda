#!/usr/bin/env bash
# Installs or verifies the developer toolchain for the anoda monorepo on Linux/macOS (and Git Bash), then installs git hooks.
# Idempotent. Run from the repo root:  bash scripts/bootstrap.sh   (or `task setup`)
# Requires: Go, Node.js (>= 22), Docker already installed. Everything else is installed via `go install` or `corepack`.
set -euo pipefail

step() { printf '\033[36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32mok\033[0m  %s\n' "$*"; }
warn() { printf '    \033[33m!!\033[0m  %s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

step "Checking prerequisites"
for p in go node docker git; do
  have "$p" || { echo "$p is required but not on PATH. Install it and re-run." >&2; exit 1; }
done
ok "$(go version)"
ok "node $(node --version)"
ok "$(docker --version)"

GOBIN_DIR="$(go env GOPATH)/bin"
case ":$PATH:" in
  *":$GOBIN_DIR:"*) ;;
  *) warn "$GOBIN_DIR is not on PATH; adding for this session. Add it to your shell profile permanently."
     export PATH="$GOBIN_DIR:$PATH" ;;
esac

step "Installing Go-based tools (skips ones already present)"
install_go_tool() {
  local name="$1"; shift
  if have "$name"; then ok "$name already installed"; return; fi
  echo "    installing $name ..."
  go install "$@"
  ok "$name"
}
install_go_tool task          github.com/go-task/task/v3/cmd/task@latest
install_go_tool golangci-lint github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest
install_go_tool govulncheck   golang.org/x/vuln/cmd/govulncheck@latest
install_go_tool goimports     golang.org/x/tools/cmd/goimports@latest
install_go_tool sqlc          github.com/sqlc-dev/sqlc/cmd/sqlc@latest
install_go_tool oapi-codegen  github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest
install_go_tool migrate       -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
install_go_tool lefthook      github.com/evilmartians/lefthook@latest
install_go_tool gitleaks      github.com/zricethezav/gitleaks/v8@latest
install_go_tool actionlint    github.com/rhysd/actionlint/cmd/actionlint@latest

step "Enabling pnpm via corepack"
if ! have pnpm; then
  corepack enable
  corepack prepare pnpm@latest --activate
fi
ok "pnpm $(pnpm --version)"

step "Local environment file"
if [[ ! -f .env ]]; then
  cp .env.example .env
  warn "Created .env from .env.example. Edit it with real local values (never commit it)."
else
  ok ".env exists"
fi

if [[ "${1:-}" != "--skip-hooks" ]]; then
  step "Installing git hooks (lefthook)"
  lefthook install
  ok "hooks installed"
fi

step "Done. Try:  task --list   then   task check"
