# 11 — AI agent workflow

How an agent (Claude Code or any other) works in this repository. Humans follow the same flow.
The goal is that any agent, starting cold, can pick up a task and land a compliant, tested change.

## Before writing code

| Step | Rule | Level |
|---|---|---|
| 1 | Read `CLAUDE.md`, then the contracts listed for your stack in its "Which contract do I read?" table. | MUST |
| 2 | Read the service `README.md` and, for UI work, the screen spec in `docs/design/screens/`. If the spec does not exist, write it first from `tooling/templates/screen-spec.md`. | MUST |
| 3 | Look for existing code to reuse: ports, adapters, components, hooks, test fakes. Do not re-implement what exists. | MUST |
| 4 | State a short plan: files to touch, tests to add, contracts that apply. For anything architectural, draft an ADR. | SHOULD |
| 5 | Ask only when different readings would produce materially different work. Otherwise choose the boring option, state the assumption, and continue. | SHOULD |

## While writing code

| Rule | Level |
|---|---|
| Write or extend the test first when the behavior is clear; otherwise write it immediately after, in the same change. | MUST |
| Work in small, verifiable steps; run the relevant `task <svc>:test` often. | SHOULD |
| Keep the diff scoped to the task. Unrelated fixes get their own branch and PR. | MUST |
| Never weaken a gate to pass it: no lowered thresholds, no disabled rules, no deleted tests, no `nolint`/`eslint-disable` without an ADR. | MUST NOT |
| Never bypass hooks (`--no-verify`) or push to `master` directly. | MUST NOT |
| Never commit secrets, `.env`, or real data. Fixtures use obviously fake values. | MUST NOT |
| Never add a dependency, framework, layer, or shared module without checking the banned lists and, if new, justifying it (ADR for architectural ones). | MUST |
| If a contract blocks a reasonable solution, follow the contract, deliver, and propose the change in an ADR. Do not silently deviate. | MUST |
| Update `.env.example`, `api/openapi.yaml`, README, and screen spec when your change affects them. | MUST |

## Before reporting done

| Check | How |
|---|---|
| Gate passes | `task check` locally (or `task <svc>:lint <svc>:test` plus root `lint:docs` and `security:secrets` when tooling is partial). |
| Tests exist and are meaningful | They fail if the behavior is reverted. |
| Definition of done | Every box in `CLAUDE.md` → "Definition of done" is true. |
| Report | Say what you changed, what you verified (with the command), what you skipped and why. Failing checks are reported as failing. |

## Commits and PRs

| Rule | Level |
|---|---|
| Conventional Commits with the scope of the service or area (01-repository.md). | MUST |
| Commit message body explains *why*; footer carries the attribution trailer required by the session and `BREAKING CHANGE:` when applicable. | MUST |
| PR uses the template; the checklist is answered truthfully, including "not applicable". | MUST |
| One PR = one concern. Large tasks are split into a sequence of PRs that each pass CI. | SHOULD |

## Using AI tooling inside the repo

| Rule | Level |
|---|---|
| Agent-specific config (`.claude/`, editor AI settings) is committed only if it contains no secrets and helps every contributor; otherwise it is git-ignored. | SHOULD |
| Skills or prompts committed to the repo live under `.claude/` (or the tool's equivalent) and follow the same review as code. | MUST |
| Agents do not run destructive commands (`down:clean`, `git reset --hard`, data deletion) without explicit instruction in the current task. | MUST NOT |
| Agents record non-obvious project facts they learn in `docs/` (ADR or README), not only in their private memory. | SHOULD |

## Handling uncertainty

- Contract unclear → follow the closest rule, note the assumption in the PR, propose a clarification.
- Requirement unclear → do everything that does not depend on the answer, then ask one precise question.
- Tooling missing locally → run what you can, say exactly which gates were not run.
- Bug found outside scope → note it in the PR body or open an issue; do not fix it in the same PR unless it blocks you.
