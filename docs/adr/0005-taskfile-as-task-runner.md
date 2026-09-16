# ADR 0005 — Taskfile (go-task) as the single task runner

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `01-repository.md`, `11-ai-agent-workflow.md` |

## Context

Development happens on Windows (PowerShell and Git Bash) and CI runs on Linux. The same gate must run identically
in all three, and agents need one obvious command.

## Decision

We will use Taskfile (`go-task`) with a root `Taskfile.yml` that includes per-service taskfiles from
`tooling/taskfiles/`. `task check` is the single gate mirrored by lefthook hooks and CI.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: Taskfile** | Single binary, cross-platform shell interpreter, YAML, includes with `dir:` | Another tool to install (bootstrap handles it) |
| Makefile | Ubiquitous | Needs `make` on Windows; shell quirks; tabs |
| npm scripts / go run scripts | Already present per stack | Two different systems for two stacks |
| just | Simple | Less common in Go/Node ecosystems |

## Consequences

- Positive: `task check` means the same thing everywhere.
- Negative: contributors run `task setup` once.
- Tooling: `Taskfile.yml`, `tooling/taskfiles/*.yml`, `scripts/bootstrap.*`.
