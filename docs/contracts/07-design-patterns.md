# 07 — Design patterns (SOLID, applied)

SOLID is the yardstick. This contract translates each principle into concrete, checkable rules for Go and TypeScript,
then lists the anti-patterns that most often violate them. The architecture that makes SOLID natural here is
**hexagonal (ports and adapters)** on the backend and **feature modules** on the frontend.

## S — Single responsibility

| Rule | Go | TypeScript / React |
|---|---|---|
| A unit has one reason to change. | One use case per `app` function or small struct; one adapter per external system. | One component renders one thing; one hook owns one behavior; one feature folder per domain concept. |
| Handlers/components do not contain business rules. | Handler: decode → validate → call `app` → encode. | Component: render props and call handlers. Logic in hooks or `features/*/api`. |
| Packages/folders are named for what they provide, never `util`/`common`/`helpers`. | `revive`, review | review |
| Size limits are a smell detector, not a target. | func ≤60 lines, file ≤500 lines | component ≤150 lines, file ≤300 lines |

## O — Open/closed

| Rule | Go | TypeScript / React |
|---|---|---|
| Extend behavior by adding an implementation, not by editing a `switch` in the core. | New adapter implements an existing port. | New variant via `cva` variants or a new component composed from primitives. |
| Enumerations that grow get a registry or polymorphism, not longer `switch`es (small exhaustive switches over closed enums are fine). | `exhaustive` linter guards the closed ones. | Discriminated unions with exhaustive `switch` + `never` check. |
| shadcn components are not edited; they are wrapped. | n/a | 12-design-ui-ux.md |

## L — Liskov substitution

| Rule | Go | TypeScript / React |
|---|---|---|
| Any implementation of a port is a drop-in for any other, including test fakes. | Contract tests run the same suite against the fake and the real adapter where feasible. | MSW handlers honor the same OpenAPI schema as the real API. |
| Implementations do not panic, return `nil` collections where the interface promises empty, or ignore `context` cancellation. | review, `nilnil` | review |
| A component that accepts `...props` of a primitive forwards them faithfully (`ref`, `aria-*`, `className`). | n/a | review |

## I — Interface segregation

| Rule | Go | TypeScript / React |
|---|---|---|
| Interfaces are small (1–3 methods) and defined by the **consumer** in `ports/` or next to the use case. | `interfacebloat` (max 5) | Props types include only what the component uses; no passing whole domain objects "just in case". |
| Do not create one giant `Repository` interface; split by use (`BookReader`, `BookWriter`). | review | Split hooks: `useBooks()`, `useCreateBook()`, not `useBookEverything()`. |
| Accept the narrowest type you need (`io.Reader`, not `*os.File`). | review | Accept `ReactNode` / callbacks rather than concrete component types. |

## D — Dependency inversion

| Rule | Go | TypeScript / React |
|---|---|---|
| High-level code (`domain`, `app`) never imports low-level code (`adapters`). | `depguard` | `features/*` never import from `app/`; `lib/` never imports React/Next. |
| Dependencies are injected through constructors in `cmd/server/main.go`. No service locators, no global singletons, no `init()` registration. | `gochecknoglobals`, `gochecknoinits`, review | Context providers at the root for cross-cutting deps (Query client, session); components receive data via props/hooks. |
| Frameworks are details: `chi`, `pgx`, `next` appear only in adapters / route files. | `depguard` allowlist per package | `no-restricted-imports` |

## Patterns we use (and when)

| Pattern | Use it for | Do not use it for |
|---|---|---|
| Hexagonal / ports & adapters | Every Go service. | — |
| Repository | Persistence behind a port. One per aggregate. | Wrapping a single sqlc query with no behavior. |
| Use case (application service) | One public method per user intent, orchestrating domain + ports. | Anemic pass-through to a repository. |
| Functional options | Constructors with ≥3 optional settings. | Required dependencies (those are positional). |
| Middleware / decorator | Cross-cutting HTTP concerns; wrapping a port with logging/metrics/retries. | Business logic. |
| Strategy | Swappable algorithms behind a port (e.g. `LLMClient`). | Two branches of an `if`. |
| Result/state as a discriminated union | UI async state, parser results. | Replacing errors in Go (Go returns `error`). |
| Composition (children, slots) | React UI reuse. | Inheritance; there is none. |
| Custom hooks | Reusable behavior with state/effects. | Pure functions (just write a function). |
| Feature module | Cohesive UI domain: components + hooks + api + tests. | A single component (put it in `components/shared`). |

## Anti-patterns (blockers in review)

- **God package / god component**: knows about everything; the file everyone edits.
- **`utils` dumping ground**: unrelated helpers in one file or package.
- **Stringly typed code**: `map[string]interface{}` / `Record<string, unknown>` crossing internal boundaries; status as free-form strings.
- **Business logic in handlers, controllers, `page.tsx`, or JSX**.
- **Hidden dependencies**: globals, singletons, `os.Getenv` in the middle of code, `process.env` outside `lib/env.ts`.
- **Boolean parameters** that switch behavior (`Save(ctx, u, true)`): use separate functions or an options type.
- **Prop drilling more than two levels** where composition or a provider would do.
- **Premature abstraction**: an interface with one implementation and no test fake; a generic "framework" for one use.
- **Leaky abstractions**: `pgx` types or `sqlc` structs escaping the postgres adapter; Google token shapes in domain code.
- **Copy-paste divergence**: two near-identical functions drifting apart. Duplicate deliberately and briefly, or extract.
- **Comments that restate code**; commented-out code; TODOs without an issue link.
- **`useEffect` as a state synchronizer** for derived data.

## Readability rules that apply everywhere

- Name things for what they are in the domain, not how they are implemented (`activeBooks`, not `filteredArr`).
- Positive booleans (`enabled`, not `notDisabled`). Functions that return booleans start with `is/has/can/should`.
- Early return over nested `if`. Happy path at the lowest indentation.
- One level of abstraction per function: either orchestrate or do, not both.
- Prefer explicit over clever. If a reviewer needs a comment to follow it, rewrite it.
- Delete dead code; version control remembers it.
