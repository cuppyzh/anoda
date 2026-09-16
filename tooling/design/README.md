# tooling/design

Shared design system plumbing for every `*.ui.anoda.com` app. Rules: `docs/contracts/12-design-ui-ux.md`.
Inventory and screen specs: `docs/design/README.md`.

| File | Purpose |
|---|---|
| `tokens.json` | Single source of truth: semantic colors (light + dark, HSL triplets), radius, type scale, fonts, shadows, motion, z-index, breakpoints, container |
| `tokens.schema.json` | JSON Schema for editor validation of `tokens.json` |
| `globals.css` | CSS variables for both themes + base styles (focus ring, reduced motion, skip link). Must match `tokens.json` |
| `tailwind.preset.ts` | Tailwind 3.x preset built from tokens. Removes the default palette so only token colors compile |
| `components.json` | shadcn/ui config to copy into each app |
| `check-contrast.mjs` | CI gate: validates tokens, WCAG AA contrast for declared pairs in both themes, and `globals.css` drift |
| `tsconfig.json` | Type-checks the preset in isolation |

## Adopting the preset in a UI app

1. Install: `pnpm add tailwindcss@3 postcss autoprefixer tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react`
   and dev: `prettier-plugin-tailwindcss eslint-plugin-tailwindcss`.
2. `tailwind.config.ts`:

   ```ts
   import type { Config } from "tailwindcss";
   import { anodaPreset } from "../../tooling/design/tailwind.preset";

   export default {
     presets: [anodaPreset],
     content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
   } satisfies Config;
   ```

3. `styles/globals.css`: `@import "../../tooling/design/globals.css";`
4. Copy `components.json` to the app root; add components with `task <svc>:shadcn:add -- button dialog ...`.
5. `app/layout.tsx`: load fonts with `next/font` into `--font-sans` / `--font-mono`, add the no-flash theme script, set `<html lang="en" suppressHydrationWarning>`.
6. `lib/cn.ts`: `export const cn = (...i: ClassValue[]) => twMerge(clsx(i));`

## Changing tokens

1. Write a design ADR (`docs/adr/`) explaining the change.
2. Edit `tokens.json` **and** the matching variables in `globals.css`.
3. Run `node tooling/design/check-contrast.mjs --verbose`. Every declared pair must pass in both themes.
4. Update the inventory table in `docs/design/README.md`.

## Why Tailwind 3.x

`eslint-plugin-tailwindcss` (which enforces "tokens only" via `no-arbitrary-value` / `no-custom-classname`) and the
JS preset mechanism target Tailwind 3. Moving to Tailwind 4's CSS-first config is an explicit ADR once the lint story
is equivalent.
