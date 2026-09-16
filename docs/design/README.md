# Design system

The rules are in [`docs/contracts/12-design-ui-ux.md`](../contracts/12-design-ui-ux.md). This page is the living
inventory: which tokens exist, which shared components exist, what has been customized, and where the screen specs are.
Update it in the same PR as any change to those things.

## Tokens

Source of truth: [`tooling/design/tokens.json`](../../tooling/design/tokens.json). Consumed through
`tooling/design/globals.css` (CSS variables) and `tooling/design/tailwind.preset.ts` (Tailwind theme).
Contrast is checked by `node tooling/design/check-contrast.mjs` in CI.

| Group | Tokens | Notes |
|---|---|---|
| Color roles | `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`, `border`, `input`, `ring` | Each role has `DEFAULT` + `foreground` where text sits on it; light and dark values. HSL triplets so Tailwind opacity modifiers work. |
| Radius | `sm`, `md`, `lg`, `xl`, `full` | Base `--radius: 0.5rem` |
| Spacing | Tailwind default scale (4px grid) | No half-steps beyond the scale |
| Type scale | `xs 12/16`, `sm 14/20`, `base 16/24`, `lg 18/28`, `xl 20/28`, `2xl 24/32`, `3xl 30/36`, `4xl 36/40` | Body is `base` |
| Font families | `sans` (Inter via `next/font`), `mono` (JetBrains Mono) | Two families max |
| Shadows | `sm`, `md`, `lg` | Subtle; dark mode reduces opacity |
| Motion | `duration-fast 150ms`, `duration-normal 250ms`, `duration-slow 400ms`; easing `standard` | Disabled under `prefers-reduced-motion` |
| Breakpoints | Tailwind defaults `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536` | Mobile-first from 360px |
| Z-index | `dropdown 1000`, `sticky 1100`, `overlay 1200`, `modal 1300`, `popover 1400`, `toast 1500` | Only via tokens |

## Shared components (`components/shared/`)

Each UI app MUST provide these, built from shadcn/ui primitives. They are the vocabulary screen specs use.

| Component | Use it for | Never for |
|---|---|---|
| `PageShell` | Max width, gutters, vertical rhythm for every page | Nested inside another shell |
| `PageHeader` | `h1`, optional description, primary action slot, breadcrumbs | Section headings (`h2`+) |
| `EmptyState` | No data yet: icon, title, explanation, primary action | Error conditions |
| `ErrorState` | Failed load: plain-language message, retry, optional details disclosure | Form validation errors |
| `LoadingSkeleton` | Content-shaped placeholders for lists, cards, tables | Button pending state (use `Button loading`) |
| `ConfirmDialog` | Destructive or irreversible actions; names the object; destructive variant not default-focused | Informational messages |
| `DataTable` | Tabular data with sorting, pagination (cursor), row actions | Layout |
| `FormField` | Label + control + description + error, wired with `aria-describedby` | Bare inputs |

## shadcn/ui customizations

None yet. When a file in `components/ui/` is customized, list it here: app, component, reason, date.

## Screen specs

Specs live in `screens/<app>/<screen>.md` and are created from `tooling/templates/screen-spec.md` before implementation.

| App | Screen | Spec | Status |
|---|---|---|---|
| — | — | — | No screens yet |
