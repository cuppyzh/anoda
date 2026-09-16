# ADR 0001 — Record architecture decisions

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `docs/contracts/00-overview.md` |

## Context

Most code in this repository will be written by AI agents across many sessions. Decisions made in one session
are invisible to the next unless written down. Contracts state *what* the rules are; something must record *why*.

## Decision

We will record every architecturally significant decision as an Architecture Decision Record (ADR) in
`docs/adr/`, numbered sequentially, using `template.md` (MADR-style). Contracts link to the ADR that justifies them.
Changing a contract requires an ADR in the same PR.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: lightweight ADRs in-repo** | Versioned with code, greppable by agents, low ceremony | Requires discipline |
| Wiki / external docs | Rich formatting | Drifts from code, invisible to agents |
| No records | Zero effort | Decisions relitigated every session |

## Consequences

- Positive: agents and humans can find the reasoning behind any rule.
- Negative: small overhead per decision.
- Tooling: `markdownlint` covers ADRs; PR template asks for an ADR link on architectural changes.
