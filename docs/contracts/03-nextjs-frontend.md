# 03 — Next.js frontend

Applies to every `services/*.ui.anoda.com`. Stack: Next.js (App Router, current stable), React, TypeScript `strict`,
Tailwind CSS with the shared preset, shadcn/ui, `zod`, `react-hook-form`, TanStack Query for client data, Vitest + Testing Library.
Visual and interaction rules live in [12-design-ui-ux.md](12-design-ui-ux.md). Decision record: ADR 0003.

## Layout

```text
services/<name>.ui.anoda.com/
├── app/                         # routes only: layout.tsx, page.tsx, loading.tsx, error.tsx, not-found.tsx, route.ts
│   └── (group)/segment/page.tsx # pages compose features; they do not contain logic
├── features/<feature>/
│   ├── components/              # feature-specific components
│   ├── hooks/                   # feature-specific hooks
│   ├── api/                     # typed fetchers + zod schemas for this feature
│   └── index.ts                 # public surface of the feature
├── components/
│   ├── ui/                      # shadcn/ui copies; do not edit (12-design-ui-ux.md)
│   └── shared/                  # app-wide composed components (PageShell, EmptyState, ...)
├── lib/                         # framework-agnostic helpers: env.ts, fetcher.ts, t.ts, cn.ts
├── styles/globals.css           # imports tooling/design/globals.css tokens
├── tests/                       # test setup, MSW handlers, factories
├── public/
├── next.config.ts               # output: "standalone"
├── tailwind.config.ts           # presets: [anodaPreset]
├── tsconfig.json                # extends tooling/node/tsconfig.base.json
├── eslint.config.mjs            # re-exports tooling/node/eslint.config.mjs
├── vitest.config.ts             # merges tooling/node/vitest.config.base.ts
├── components.json              # shadcn config (from tooling/design)
├── Dockerfile / .dockerignore
└── README.md
```

| Rule | Level | Enforced by |
|---|---|---|
| `app/` contains routing files only. A `page.tsx` imports from `features/*` and composes; it holds no fetch logic, no state machines. | MUST | review, `no-restricted-imports` |
| Features do not import from other features' internals; only through `features/<x>/index.ts`. | MUST | `eslint-plugin-import` `no-restricted-paths` |
| `lib/` is framework-agnostic: no React, no Next imports. | MUST | `no-restricted-imports` |
| No `utils.ts` dumping ground; name files by what they do (`formatMoney.ts`, `parseCursor.ts`). | SHOULD | review |

## TypeScript

| Rule | Level | Enforced by |
|---|---|---|
| `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` are on. | MUST | `tooling/node/tsconfig.base.json` |
| `any` is banned; use `unknown` and narrow. Non-null assertions (`!`) are banned. | MUST NOT | `@typescript-eslint/no-explicit-any`, `no-non-null-assertion` |
| Data crossing a boundary (API response, form input, URL params, env, `localStorage`) is parsed with `zod` before use. Types are inferred from schemas (`z.infer`). | MUST | review |
| Prefer `type` aliases and discriminated unions for state (`{ status: "loading" } \| { status: "error"; error } \| ...`). No boolean soup (`isLoading && !isError`). | SHOULD | review |
| Exported functions have explicit return types. | SHOULD | `explicit-module-boundary-types` |
| `import type` for types; no default exports except where Next.js requires them (`page.tsx`, `layout.tsx`, config files). | MUST | `consistent-type-imports`, `import/no-default-export` with overrides |

## Components and rendering

| Rule | Level | Enforced by |
|---|---|---|
| Server Components by default. `"use client"` only on leaf components that need state, effects, or browser APIs. | MUST | review |
| No data fetching in Client Components except through TanStack Query hooks in `features/*/hooks`. | MUST | review |
| Server-side fetching uses a typed `fetcher` in `lib/fetcher.ts` that attaches the request ID, timeout, and parses with zod. No raw `fetch` in components. | MUST | `no-restricted-globals` (`fetch` outside `lib/`) |
| Components are small (≤150 lines) and single-purpose. Extract hooks for behavior, components for markup. | SHOULD | `max-lines` warn |
| Props are typed with an explicit `Props` type; no `React.FC`. Children typed as `React.ReactNode`. | SHOULD | review |
| Keys are stable IDs, never array indices. | MUST | `react/no-array-index-key` |
| No `useEffect` for derived state or data fetching; derive during render or use Query. `useEffect` is for syncing with external systems only. | MUST | `react-hooks/exhaustive-deps`, review |
| Every `loading.tsx`, `error.tsx`, and `not-found.tsx` exists for each route group. | MUST | review |

## Forms and validation

| Rule | Level | Enforced by |
|---|---|---|
| Forms use `react-hook-form` with a `zod` resolver; the same schema is reused server-side in the route handler or server action. | MUST | review |
| Server Actions or route handlers re-validate input; never trust client validation. | MUST | review |
| Mutations go through route handlers (`app/api/**/route.ts`) or Server Actions that call the backend with server-side credentials. The browser never talks to a Go API directly. | MUST | review, `05-security.md` |

## Environment and config

| Rule | Level | Enforced by |
|---|---|---|
| `lib/env.ts` parses `process.env` with zod once and exports typed `env`. Nothing else reads `process.env`. | MUST | `no-restricted-syntax` (`process.env` outside `lib/env.ts`) |
| `NEXT_PUBLIC_*` is for genuinely public values only (feature flags, public URLs). Secrets and internal URLs are never `NEXT_PUBLIC_`. | MUST | review, `gitleaks` |
| `next.config.ts` sets `output: "standalone"`, `reactStrictMode: true`, `poweredByHeader: false`, and the security headers from 05-security.md. | MUST | review |

## Dependencies

| Rule | Level | Enforced by |
|---|---|---|
| Package manager is `pnpm` with a committed `pnpm-lock.yaml`; installs use `--frozen-lockfile`. | MUST | Taskfile, CI |
| Allowed core: `next`, `react`, `react-dom`, `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*`, `lucide-react`, `sonner`, `date-fns`. | MAY | review |
| Banned: `moment`, `lodash` (use `es-toolkit` or native), `axios` (use `fetch`), `styled-components`/`@emotion/*` (Tailwind only), `redux`/`mobx` (use Query + `useState`/`zustand` only with ADR), `jquery`, any UI kit other than shadcn/Radix. | MUST NOT | `no-restricted-imports` |
| `pnpm audit --audit-level=high` passes. | MUST | Taskfile, CI |

## Performance and quality

| Rule | Level | Enforced by |
|---|---|---|
| Images use `next/image`; fonts use `next/font` (self-hosted, no external font requests at runtime). | MUST | `@next/next/no-img-element` |
| Heavy client-only components are loaded with `next/dynamic`. | SHOULD | review |
| No `console.log` in committed code; use the `logger` in `lib/logger.ts`. | MUST NOT | `no-console` |
| `eslint . --max-warnings=0`, `tsc --noEmit`, and `prettier --check` all pass. | MUST | Taskfile, hook, CI |
