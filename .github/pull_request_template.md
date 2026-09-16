<!-- Title must follow Conventional Commits: type(scope): summary -->

## What

<!-- One or two sentences. Link the issue/ADR/screen spec if any. -->

## Why

<!-- The problem this solves. If this changes architecture, link the ADR. -->

## How to verify

<!-- Commands or steps a reviewer can run. `task check` is assumed; list anything extra. -->

## Checklist (contracts that tooling cannot enforce)

### Always

- [ ] `task check` passes locally.
- [ ] Unit tests added or updated for every behavior change (`04-testing.md`).
- [ ] No secrets, tokens, or `.env` files committed; new config keys added to `.env.example`.
- [ ] No PII or secrets in log statements (`05-security.md`).
- [ ] No lint rule disabled, coverage threshold lowered, or `nolint`/`eslint-disable` added (or an ADR is linked).
- [ ] Diff is scoped to the task; unrelated refactors are in a separate PR.

### If an HTTP endpoint changed

- [ ] `api/openapi.yaml` updated and generated code regenerated (`06-api-design.md`).
- [ ] Errors use `application/problem+json`; input validated at the edge.

### If an architectural choice was made

- [ ] ADR added under `docs/adr/` and linked above.

### If UI changed (`12-design-ui-ux.md`)

- [ ] Screen spec exists at `docs/design/screens/<app>/<screen>.md`.
- [ ] Loading, empty, error, and success states are all implemented.
- [ ] Only design tokens used (no raw colors, spacing, or font sizes).
- [ ] Keyboard-only walkthrough done: every action reachable, focus visible, no traps.
- [ ] Dark mode checked.
- [ ] Destructive actions confirm and are not the default button.

### If a dependency was added

- [ ] Not on the banned list; license acceptable; justified in the PR body.
