# 12 — Design, UI, UX

Every user-facing screen in every `*.ui.anoda.com` app follows this contract so the apps feel like one product,
are accessible by default, and can be built by an agent from a short spec. Decision record: ADR 0008.

## Foundation

| Rule | Level | Enforced by |
|---|---|---|
| Styling is Tailwind CSS using the shared preset `tooling/design/tailwind.preset.ts`. No CSS-in-JS, no CSS modules, no inline `style` except for truly dynamic values (e.g. a computed width) that go through a CSS variable. | MUST | `no-restricted-imports`, `react/forbid-dom-props` (`style`) |
| Components are shadcn/ui (Radix primitives) added via `task <svc>:shadcn:add -- <component>` into `components/ui/`. | MUST | `components.json` from `tooling/design` |
| Files in `components/ui/` are not edited, except: (a) a documented customization block at the top `// anoda: customized — <reason>` and (b) the change is mirrored in `docs/design/README.md`. Prefer wrapping in `components/shared/`. | MUST | review, CLAUDE.md |
| Icons come from `lucide-react` only, sized via tokens (`size-4`, `size-5`), with `aria-hidden` unless they carry meaning (then `aria-label`). | MUST | `no-restricted-imports` |
| Class names are composed with `cn()` (`clsx` + `tailwind-merge`); variants with `cva`. No string concatenation of classes. | MUST | review |

## Design tokens

Single source: `tooling/design/tokens.json`. Consumed as CSS variables (`tooling/design/globals.css`) and Tailwind theme values (the preset).

| Rule | Level | Enforced by |
|---|---|---|
| Only token-backed utilities are used: `bg-primary`, `text-muted-foreground`, `p-4`, `rounded-md`, `text-sm`, `shadow-sm`. | MUST | `eslint-plugin-tailwindcss` (`no-arbitrary-value`, `no-custom-classname`) |
| Banned in app code: raw hex/rgb/hsl colors, arbitrary values (`w-[13px]`, `text-[#333]`), `!important` (`!p-4`), Tailwind's default palette names (`bg-blue-500`, `text-gray-700`). | MUST NOT | ESLint tailwind plugin + preset `theme.colors` override removes default palette |
| Semantic color roles: `background/foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`, `border`, `input`, `ring`. Every role has light **and** dark values. | MUST | `tokens.json` schema check |
| Contrast: every `foreground`-on-`background` role pair is ≥4.5:1 (text) or ≥3:1 (large text, UI borders) in both themes. | MUST | `tooling/design/check-contrast.mjs` (CI) |
| Dark mode uses the `class` strategy (`<html class="dark">`), persisted preference + `prefers-color-scheme` default; no flash of wrong theme (inline script in `layout.tsx`). | MUST | review |
| Adding or changing a token is a design ADR + PR that updates `tokens.json`, regenerates `globals.css`, and passes the contrast check. | MUST | review |

## Layout and typography

| Rule | Level | Enforced by |
|---|---|---|
| 4px spacing grid via the Tailwind scale (`1` = 4px). No half-steps outside the scale. | MUST | preset `theme.spacing` |
| One page shell per app (`components/shared/PageShell`) defining max content width (`max-w-6xl`), gutters (`px-4 sm:px-6 lg:px-8`), and vertical rhythm. Pages never set their own. | MUST | review |
| Responsive-first: design for 360px, then `sm` (640), `md` (768), `lg` (1024), `xl` (1280). Nothing has a fixed width larger than the viewport. | MUST | review |
| Type scale from tokens only: `text-xs sm base lg xl 2xl 3xl 4xl`. Body text is `text-base` (16px) minimum; `text-xs` only for metadata, never for body or inputs. | MUST | preset, review |
| At most two font families (sans for UI, mono for code), loaded via `next/font` from the preset's `fontFamily`. | MUST | preset, review |
| Line length for reading content ≤75 characters (`max-w-prose`). | SHOULD | review |
| Headings are semantic (`h1`–`h6`) in order, exactly one `h1` per page. | MUST | `jsx-a11y/heading-has-content`, review |

## Component rules

| Rule | Level | Enforced by |
|---|---|---|
| Every interactive element is a shadcn/Radix primitive (`Button`, `Dialog`, `DropdownMenu`, `Select`, `Tabs`, ...) or wraps one. No hand-rolled dropdowns, modals, tooltips, or toggles. | MUST | review |
| Variants via `cva` with a closed set (`variant`, `size`); no conditional className branching in JSX. | MUST | review |
| States are explicit props typed as discriminated unions or enums (`status: "idle" \| "loading" \| "error"`), never booleans piled up. | SHOULD | review |
| Shared composed components live in `components/shared/` with these always present: `PageShell`, `PageHeader`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`, `DataTable`, `FormField`. | MUST | review |
| Touch targets are ≥44×44px on touch devices; clickable areas include padding, not just the text. | MUST | review |
| Buttons have a visible label; icon-only buttons have `aria-label` and a tooltip. | MUST | `jsx-a11y/control-has-associated-label` |

## UX principles (every screen)

| Rule | Level | Enforced by |
|---|---|---|
| **Four states**: every data-driven view implements loading, empty, error, and success. Loading uses skeletons shaped like the content (spinners only for button-level actions). | MUST | PR checklist, review |
| Empty states explain what would appear here and offer the primary action. | MUST | review |
| Error states say what happened in plain words and what to do next (retry, go back, contact). Technical details are behind a "details" disclosure and never include stack traces. | MUST | review |
| No layout shift when data arrives: reserve space with skeletons or fixed aspect ratios. | MUST | review |
| Async actions: the triggering control shows a pending state, is disabled only while pending, and the result is confirmed via a toast (`sonner`). Optimistic updates only with rollback on failure. | MUST | review |
| Destructive actions (delete, revoke, overwrite) require a `ConfirmDialog` that names the object, uses the `destructive` variant, and is never the default/focused button. | MUST | review |
| Forms: `react-hook-form` + `zod`; labels always visible (no placeholder-as-label); validate on blur, re-validate on change after first error; errors inline under the field, linked via `aria-describedby`; a summary at the top for ≥3 errors; submit stays enabled and shows all errors on click. | MUST | review, `jsx-a11y` |
| Keep users oriented: page title in `<title>` and `h1`, breadcrumbs for depth ≥2, active nav item marked with `aria-current`. | MUST | review |
| Motion respects `prefers-reduced-motion`; durations from tokens (`duration-fast 150ms`, `duration-normal 250ms`); no motion that is only decorative. | MUST | `globals.css`, review |
| AI-generated content is labeled ("Generated by AI") and offers a way to regenerate or dismiss. | MUST | 10-ai-integration.md |
| Progressive disclosure: advanced options behind a disclosure; primary action is obvious and singular per view. | SHOULD | review |

## Accessibility (WCAG 2.2 AA)

| Rule | Level | Enforced by |
|---|---|---|
| `eslint-plugin-jsx-a11y` strict config passes with zero warnings. | MUST | lint |
| Every component test includes an `axe` assertion with no violations. | MUST | `vitest-axe`, 04-testing.md |
| Full keyboard operability: logical tab order, visible focus ring (`ring` token, never `outline-none` without a replacement), no focus traps outside modals, `Escape` closes overlays, focus returns to the trigger. | MUST | Radix defaults, PR checklist walkthrough |
| Semantic HTML first: `button` for actions, `a` for navigation, lists for lists, tables for tabular data with `th scope`. `div` with `onClick` is banned. | MUST | `jsx-a11y/no-static-element-interactions`, `click-events-have-key-events` |
| Images have `alt` (empty for decorative); icons are `aria-hidden` unless meaningful. | MUST | `jsx-a11y/alt-text` |
| Color is never the only carrier of meaning (add icon or text). | MUST | review |
| Live regions announce async results and validation summaries (`role="status"` / `aria-live="polite"`). | MUST | review |
| Zoom to 200% and 320px-wide reflow do not lose content or function. | MUST | PR checklist |
| Language set on `<html lang>`; user-facing text passes through `t()` from `lib/t.ts` so localization stays possible. | MUST | review |

## Copy and content

| Rule | Level | Enforced by |
|---|---|---|
| Sentence case everywhere (titles, buttons, labels). | MUST | review |
| Buttons are verbs that name the outcome: "Save changes", "Delete book", not "OK"/"Submit"/"Yes". | MUST | review |
| Error copy = what happened + what to do: "We couldn't save your changes. Check your connection and try again." | MUST | review |
| No jargon or internal names in the UI; no exclamation marks; no blame ("You entered an invalid…" → "Enter a valid…"). | SHOULD | review |
| Dates are shown relative when recent ("2 hours ago") with the absolute date in a tooltip/`title`; numbers use locale formatting via `Intl`. | SHOULD | review |
| Strings live in the component's feature or `lib/strings.ts`, never inline-duplicated across components. | SHOULD | review |

## Screen specs (build to a spec, not a guess)

| Rule | Level | Enforced by |
|---|---|---|
| Every new screen or significant change has a spec at `docs/design/screens/<app>/<screen>.md` from `tooling/templates/screen-spec.md` **before** implementation. | MUST | PR checklist, CLAUDE.md |
| The spec lists: goal, primary action, entry points, data needed (API operations), the four states, form fields and validation, a11y notes, open questions. Wireframes are optional ASCII or an image. | MUST | template |
| Implementation deviating from the spec updates the spec in the same PR. | MUST | review |

## Design system documentation

`docs/design/README.md` describes the token set, the list of shared components with their intended use,
any shadcn customizations, and links to every screen spec. It is updated whenever any of those change.
