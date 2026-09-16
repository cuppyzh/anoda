# ADR 0008 — Tailwind CSS + shadcn/ui with shared design tokens

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `12-design-ui-ux.md`, `03-nextjs-frontend.md` |

## Context

Several Next.js apps must look and behave like one product, be accessible, and be buildable by agents that
otherwise invent their own colors, spacing, and widgets on every screen.

## Decision

We will style with Tailwind CSS through a shared preset generated from `tooling/design/tokens.json`, use
shadcn/ui (Radix primitives) copied into each app as the only source of interactive components, ban raw and
arbitrary values via ESLint, require light and dark values for every token, check WCAG AA contrast in CI, and
require a short screen spec before any new screen.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: Tailwind + shadcn + tokens** | Accessible primitives, full control, tokens enforce consistency, agents know the kit well | Components are copied, so upgrades are manual |
| Tailwind only, hand-built components | Maximum control | Agents re-invent primitives; a11y burden on every PR |
| MUI / Mantine / Chakra | Fast, consistent | Heavy runtime, harder to customize, CSS-in-JS |

## Consequences

- Positive: one visual language; a11y and contrast are checked, not hoped for.
- Negative: token changes are deliberate ADR-level events.
- Tooling: `tooling/design/*`, ESLint tailwind + jsx-a11y plugins, `vitest-axe`.
