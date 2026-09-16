#!/usr/bin/env bash
# Per-package coverage gate for Go services.
#
# Usage: coverage-gate.sh <coverage.out> <min-percent> [exempt-file]
#
# - Fails (exit 1) if any package's statement coverage is below <min-percent>.
# - <exempt-file> (default .coverage-exempt) lists package import paths (or prefixes ending in /...)
#   that are excluded, one per line, each followed by " # reason". Blank lines and comments ignored.
# - Packages with zero statements (e.g. only types) are skipped.
# - Generated dirs (/gen, /gen/...) and cmd/ are always exempt (docs/contracts/04-testing.md).
#
# Requires: go, awk. Runs under bash (Git Bash on Windows, bash in CI).
set -euo pipefail

profile="${1:-coverage.out}"
min="${2:-80}"
exempt_file="${3:-.coverage-exempt}"

if [[ ! -f "$profile" ]]; then
  echo "coverage-gate: profile '$profile' not found (run go test -coverprofile first)" >&2
  exit 1
fi

# Build exemption list.
exempt=()
if [[ -f "$exempt_file" ]]; then
  while IFS= read -r line; do
    line="${line%%#*}"          # strip comment
    line="${line//[[:space:]]/}" # strip whitespace
    [[ -z "$line" ]] && continue
    exempt+=("$line")
  done < "$exempt_file"
fi

is_exempt() {
  local pkg="$1"
  [[ "$pkg" == */cmd/* || "$pkg" == */gen || "$pkg" == */gen/* ]] && return 0
  local e
  for e in "${exempt[@]:-}"; do
    [[ -z "$e" ]] && continue
    if [[ "$e" == */... ]]; then
      local prefix="${e%/...}"
      [[ "$pkg" == "$prefix" || "$pkg" == "$prefix"/* ]] && return 0
    elif [[ "$pkg" == "$e" ]]; then
      return 0
    fi
  done
  return 1
}

# Aggregate covered / total statements per package from the profile.
# Profile lines: file.go:startLine.startCol,endLine.endCol numStmts count
# `go list` maps file → package, but we derive the package as the directory of the file path, which for
# module-relative paths equals the import path.
declare -A total covered
while IFS=' ' read -r block stmts count; do
  [[ "$block" == mode:* ]] && continue
  file="${block%%:*}"
  pkg="${file%/*}"
  total["$pkg"]=$(( ${total["$pkg"]:-0} + stmts ))
  if (( count > 0 )); then
    covered["$pkg"]=$(( ${covered["$pkg"]:-0} + stmts ))
  fi
done < "$profile"

# Collect rows first (a `for ... | sort` pipeline would run in a subshell and lose $fail).
fail=0
rows=()
for pkg in "${!total[@]}"; do
  t=${total["$pkg"]}
  c=${covered["$pkg"]:-0}
  (( t == 0 )) && continue
  pct=$(awk -v c="$c" -v t="$t" 'BEGIN { printf "%.1f", (c/t)*100 }')
  if is_exempt "$pkg"; then
    rows+=("$(printf "%-70s %8s %8s  (exempt)" "$pkg" "$pct" "-")")
    continue
  fi
  below=$(awk -v p="$pct" -v m="$min" 'BEGIN { print (p+0 < m+0) ? 1 : 0 }')
  if (( below == 1 )); then
    rows+=("$(printf "%-70s %8s %8s  FAIL" "$pkg" "$pct" "$min")")
    fail=1
  else
    rows+=("$(printf "%-70s %8s %8s" "$pkg" "$pct" "$min")")
  fi
done

printf "%-70s %8s %8s\n" "package" "cover%" "min%"
if (( ${#rows[@]} > 0 )); then
  printf "%s\n" "${rows[@]}" | sort
fi

if (( fail == 1 )); then
  echo
  echo "coverage-gate: one or more packages are below ${min}%. Add tests, or add an exemption with a reason to ${exempt_file}." >&2
  exit 1
fi
echo "coverage-gate: all packages >= ${min}%"
