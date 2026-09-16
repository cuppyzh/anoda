# 00 — How contracts work

Contracts are the binding engineering rules of this repository. They exist so that code written by
many agents and humans over time looks like it was written by one careful team.

## Reading a contract

- **MUST / MUST NOT**: mandatory. A PR that violates it is not merged.
- **SHOULD / SHOULD NOT**: the default. Deviating requires a one-line justification in the PR.
- **MAY**: allowed, at your discretion.

Each rule that tooling enforces names the tool in the **Enforced by** column. Rules with *review* in that column are
checked by the PR checklist in `.github/pull_request_template.md`.

## Precedence

1. A contract in this folder.
2. `CLAUDE.md` / `AGENTS.md` (which only summarize and link here).
3. A service's own `README.md` (may add rules, never relax them).
4. Ecosystem defaults (Effective Go, Next.js docs, WCAG).

If two contracts conflict, the more specific one wins and the conflict MUST be fixed in the same week via an ADR.

## Index

| # | Contract | Applies to |
|---|---|---|
| 01 | [Repository](01-repository.md) | Everyone: layout, branches, commits, PRs |
| 02 | [Go backend](02-go-backend.md) | `*.api.anoda.com` services |
| 03 | [Next.js frontend](03-nextjs-frontend.md) | `*.ui.anoda.com` services |
| 04 | [Testing](04-testing.md) | Everyone: unit tests are mandatory |
| 05 | [Security](05-security.md) | Everyone |
| 06 | [API design](06-api-design.md) | Every HTTP API |
| 07 | [Design patterns (SOLID)](07-design-patterns.md) | Everyone |
| 08 | [Observability](08-observability.md) | Every runtime service |
| 09 | [Containers and deploy](09-containers-and-deploy.md) | Every Dockerfile, compose, k8s manifest |
| 10 | [AI integration](10-ai-integration.md) | Any code that calls an LLM |
| 11 | [AI agent workflow](11-ai-agent-workflow.md) | Agents (and humans) writing code here |
| 12 | [Design, UI, UX](12-design-ui-ux.md) | Every user-facing screen |

## Changing a contract

1. Write an ADR in `docs/adr/` using `docs/adr/template.md` describing the decision and its consequences.
2. Change the contract text and any tooling that enforces it in the **same PR**.
3. The PR title is `docs(contracts): ...`. It is reviewed like code.

Contracts are living documents, but they change deliberately and with a written reason, never by silent drift.

## Style of contract text

- Short imperative sentences. One rule per bullet or row.
- Rationale goes in the ADR, not the contract. A contract MAY link the ADR.
- Examples are welcome when the rule is easy to misread. Keep them minimal.
