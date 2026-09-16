#!/usr/bin/env bash
# Ground-truth collector for the /sync-onboard skill. Read-only; makes no changes.
# Prints facts about the repo's current state so the skill updates ONBOARDING.md from evidence,
# not from memory or assumption. Run from anywhere inside the repo.
#
# Usage: bash .claude/skills/sync-onboard/scripts/collect-status.sh
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

hr() { printf '\n----- %s -----\n' "$1"; }

hr "meta"
echo "date: $(date +%Y-%m-%d)"
echo "root: $ROOT"
echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '(none)')"
echo "head: $(git rev-parse --short HEAD 2>/dev/null || echo '(no commits)')"
echo "head_subject: $(git log -1 --pretty=%s 2>/dev/null || echo '(no commits)')"
if git status --short 2>/dev/null | grep -q .; then
  echo "working_tree: dirty ($(git status --short | wc -l | tr -d ' ') changed/untracked paths)"
else
  echo "working_tree: clean"
fi

hr "recent commits (last 10)"
git log --oneline -10 2>/dev/null || echo "(no commits yet)"

hr "services"
if [[ -d services ]]; then
  for svc in services/*/; do
    [[ -d "$svc" ]] || continue
    name="$(basename "$svc")"
    stack="unknown"
    scaffolded="no"
    if [[ -f "$svc/go.mod" ]]; then stack="go"; scaffolded="yes"; fi
    if [[ -f "$svc/package.json" ]]; then stack="node"; scaffolded="yes"; fi
    has_dockerfile="no"; [[ -f "$svc/Dockerfile" ]] && has_dockerfile="yes"
    has_openapi="no"; [[ -f "$svc/api/openapi.yaml" ]] && has_openapi="yes"
    purpose="TBD"
    status_field="Planned"
    if [[ -f "$svc/README.md" ]]; then
      # Pull the "| Purpose |" and "| Status |" table rows if present.
      p="$(grep -m1 -E '^\| ?Purpose ?\|' "$svc/README.md" | sed -E 's/^\|[^|]*\|[[:space:]]*//; s/[[:space:]]*\|[[:space:]]*$//' || true)"
      s="$(grep -m1 -E '^\| ?Status ?\|' "$svc/README.md" | sed -E 's/^\|[^|]*\|[[:space:]]*//; s/[[:space:]]*\|[[:space:]]*$//' || true)"
      [[ -n "$p" ]] && purpose="$p"
      [[ -n "$s" ]] && status_field="$s"
    fi
    echo "name=$name stack=$stack scaffolded=$scaffolded dockerfile=$has_dockerfile openapi=$has_openapi status_field=\"$status_field\" purpose=\"$purpose\""
  done
else
  echo "(no services/ directory)"
fi

hr "contracts (docs/contracts)"
if [[ -d docs/contracts ]]; then
  for f in docs/contracts/*.md; do
    [[ -f "$f" ]] || continue
    title="$(grep -m1 -E '^# ' "$f" | sed -E 's/^# //')"
    echo "$(basename "$f"): $title"
  done
else
  echo "(no docs/contracts directory)"
fi

hr "ADRs (docs/adr)"
if [[ -d docs/adr ]]; then
  for f in docs/adr/[0-9]*.md; do
    [[ -f "$f" ]] || continue
    title="$(grep -m1 -E '^# ' "$f" | sed -E 's/^# ADR [0-9]+ — //')"
    status="$(grep -m1 -E '^\| ?Status ?\|' "$f" | sed -E 's/^\|[^|]*\|[[:space:]]*//; s/[[:space:]]*\|[[:space:]]*$//' || echo 'Unknown')"
    echo "$(basename "$f"): title=\"$title\" status=\"$status\""
  done
else
  echo "(no docs/adr directory)"
fi

hr "gate status (best-effort; skip if tools aren't installed)"
if command -v task >/dev/null 2>&1; then
  if task check >/tmp/sync-onboard-check.log 2>&1; then
    echo "task check: PASS"
  else
    echo "task check: FAIL (see below)"
    tail -20 /tmp/sync-onboard-check.log
  fi
else
  echo "task: not installed, skipped"
fi

hr "top-level tree (depth 2, noise excluded)"
find . -maxdepth 2 \
  -not -path '*/node_modules*' -not -path '*/.next*' -not -path '*/.git*' \
  -not -path '*/bin*' -not -path '*/dist*' -not -path '*/coverage*' \
  -not -path '*/.task*' -not -path './.env' \
  | sort

hr "done"
