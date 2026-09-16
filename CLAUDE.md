# CLAUDE.md — agent entrypoint for `anoda`

You are working in a microservices monorepo. Most code here is written by AI agents.
This file is short on purpose: it tells you **what is non-negotiable** and **where the rules live**.
Read the relevant contract in `docs/contracts/` before writing code. Contracts win over your habits.

## Repo map

| Path | What it is |
|---|---|
| `ONBOARDING.md` | What/where/progress. Read this if you have no memory of prior sessions here |
| `START.md` | Copy-paste guide to run everything locally |
| `services/<name>.api.anoda.com/` | Go backend service (stdlib `net/http` + chi, Postgres, sqlc, OpenAPI) |
| `services/<name>.ui.anoda.com/` | Next.js frontend (App Router, TypeScript strict, Tailwind + shadcn/ui) |
| `docs/contracts/` | **Binding rules.** Numbered; start at `00-overview.md` |
| `docs/adr/` | Architecture Decision Records: *why* a rule exists |
| `docs/design/` | Design system notes and per-screen specs |
| `tooling/` | Shared lint/test/docker/task/design configs that services copy or import |
| `scripts/` | Bootstrap and maintenance scripts (`bootstrap.ps1` / `bootstrap.sh`) |
| `deploy/` | Compose today, Kubernetes later |
| `Taskfile.yml` | Task runner. `task check` is the gate everything must pass |

## Non-negotiables

1. **Tests are mandatory.** Every behavior change ships with unit tests in the same PR. No test, no merge. See `docs/contracts/04-testing.md`.
2. **`task check` must pass** before you report a task as done. It runs format, lint, tests, and security scans. Never bypass hooks (`--no-verify` is forbidden).
3. **No secrets in the repo.** Config comes from environment variables. `.env` is git-ignored; `.env.example` documents keys with fake values.
4. **Never weaken a gate to make it pass.** Do not disable a lint rule, lower a coverage threshold, or add `// nolint` / `eslint-disable` without an ADR that justifies it.
5. **Keep diffs scoped.** Do what the task asks. Refactors and drive-by fixes go in their own PR.
6. **Contracts first.** If a contract does not cover your case, follow the closest rule, state your assumption in the PR, and propose a contract change via ADR.
7. **Security by default.** Validate all input at the edge, parameterize all queries, never log PII or secrets. See `docs/contracts/05-security.md`.
8. **UI work needs a screen spec** in `docs/design/screens/` before implementation, and must handle loading, empty, error, and success states. See `docs/contracts/12-design-ui-ux.md`.

## Which contract do I read?

| I am about to... | Read |
|---|---|
| Touch anything | `00-overview.md`, `01-repository.md`, `11-ai-agent-workflow.md` |
| Write Go | `02-go-backend.md`, `06-api-design.md`, `07-design-patterns.md`, `08-observability.md` |
| Write Next.js / React | `03-nextjs-frontend.md`, `12-design-ui-ux.md`, `07-design-patterns.md` |
| Write tests | `04-testing.md` |
| Handle auth, input, secrets, cookies, headers | `05-security.md` |
| Add a Dockerfile, compose entry, or deploy config | `09-containers-and-deploy.md` |
| Call an LLM from product code | `10-ai-integration.md` |
| Make an architectural choice | `docs/adr/template.md` and write an ADR |

## Definition of done

A task is done only when **all** of these are true:

- [ ] Code follows the contracts for its stack.
- [ ] Unit tests added or updated; coverage gate still passes.
- [ ] `task check` passes locally.
- [ ] OpenAPI spec updated if any HTTP endpoint changed.
- [ ] Screen spec exists and all four UI states are handled, if UI changed.
- [ ] No new secrets, no PII in logs, no disabled lint rules.
- [ ] Commit messages follow Conventional Commits and end with the required attribution trailer.
- [ ] You have reported what you did, what you verified, and anything you left out.

## Forbidden

- `git commit --no-verify`, `git push --force` to `master`.
- Committing `.env`, credentials, tokens, or private keys, even "temporarily".
- Editing files under `components/ui/` (shadcn) without the documented customization header.
- Adding a dependency that is on the banned list in `02-go-backend.md` or `03-nextjs-frontend.md`.
- Introducing a new framework, ORM, or architectural layer without an ADR.
- Hard-coding colors, spacing, or font sizes in UI code; use design tokens.

## Working style

- Plan briefly, then implement. Prefer small, verifiable steps.
- Write the test first when the behavior is clear.
- When you are unsure, prefer the boring, explicit option and say so.
- Report faithfully: failing tests are reported as failing, skipped steps as skipped.
