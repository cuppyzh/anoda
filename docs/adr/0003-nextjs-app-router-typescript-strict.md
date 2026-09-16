# ADR 0003 — Next.js App Router with strict TypeScript

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| Deciders | Repository owner |
| Contracts affected | `03-nextjs-frontend.md`, `04-testing.md` |

## Context

Frontends must be maintainable by agents, secure by default (no secrets in the browser), and consistent across apps.

## Decision

We will build UIs with Next.js App Router, Server Components by default, TypeScript in `strict` mode with
`noUncheckedIndexedAccess`, `zod` at every boundary, `react-hook-form` for forms, TanStack Query for client data,
`pnpm` as package manager, and Vitest + Testing Library for tests. The browser never calls Go APIs directly;
route handlers and Server Actions proxy with server-side credentials.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Chosen: Next.js App Router** | Server-side data and auth, standalone Docker output, one framework for pages and BFF | Learning curve for RSC boundaries |
| Vite SPA + separate BFF | Simple mental model | Two deployables per UI, more auth plumbing |
| Remix / SvelteKit | Good DX | Smaller ecosystem for shadcn/agent familiarity |

## Consequences

- Positive: secrets stay on the server; typed boundaries catch agent mistakes early.
- Negative: RSC/client boundary rules must be enforced by review.
- Tooling: `tooling/node/*` configs; `tooling/taskfiles/node.yml`.
