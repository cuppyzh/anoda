// Shared Tailwind preset generated from tokens.json (docs/contracts/12-design-ui-ux.md).
// A service's tailwind.config.ts:
//   import type { Config } from "tailwindcss";
//   import { anodaPreset } from "../../tooling/design/tailwind.preset";
//   export default { presets: [anodaPreset], content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] } satisfies Config;
//
// Design choices enforced here:
//   - Tailwind's default color palette is REMOVED. Only semantic token colors exist, so `bg-blue-500` is a build error
//     and eslint-plugin-tailwindcss flags it as a custom class name.
//   - Dark mode uses the `class` strategy.
//   - Type scale, radii, shadows, z-index, motion come from tokens; spacing is Tailwind's 4px grid.
// Pinned to Tailwind CSS 3.x (JS config + presets). Moving to v4's CSS-first config is an ADR.

import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

import tokens from "./tokens.json";

type ColorRoles = Record<string, string>;
type Theme = NonNullable<Config["theme"]>;

/** Turns { primary, "primary-foreground", ... } into Tailwind's nested { primary: { DEFAULT, foreground } } shape, each bound to a CSS variable. */
function colorsFromRoles(roles: ColorRoles): Record<string, string | Record<string, string>> {
  const out: Record<string, string | Record<string, string>> = {};
  for (const role of Object.keys(roles)) {
    if (role.endsWith("-foreground")) {
      const base = role.slice(0, -"-foreground".length);
      const existing = out[base];
      out[base] = { ...(typeof existing === "object" ? existing : { DEFAULT: `hsl(var(--${base}) / <alpha-value>)` }), foreground: `hsl(var(--${role}) / <alpha-value>)` };
    } else {
      const existing = out[role];
      out[role] = typeof existing === "object" ? { ...existing, DEFAULT: `hsl(var(--${role}) / <alpha-value>)` } : `hsl(var(--${role}) / <alpha-value>)`;
    }
  }
  return out;
}

export const anodaPreset = {
  darkMode: ["class"],
  theme: {
    // Replace (not extend) the default palette: only tokens exist.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      ...colorsFromRoles(tokens.color.light),
    },
    fontFamily: tokens.fontFamily,
    fontSize: tokens.fontSize as unknown as NonNullable<Theme["fontSize"]>,
    borderRadius: {
      none: "0",
      sm: tokens.radius.sm,
      md: tokens.radius.md,
      lg: tokens.radius.lg,
      xl: tokens.radius.xl,
      full: tokens.radius.full,
    },
    boxShadow: {
      none: "none",
      ...tokens.boxShadow,
    },
    screens: tokens.screens,
    extend: {
      zIndex: tokens.zIndex,
      transitionDuration: tokens.motion.duration,
      transitionTimingFunction: tokens.motion.easing,
      maxWidth: {
        container: tokens.container.maxWidth,
        prose: "75ch",
      },
      spacing: {
        "gutter": tokens.container.gutter.base,
        "gutter-sm": tokens.container.gutter.sm,
        "gutter-lg": tokens.container.gutter.lg,
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down var(--duration-normal) var(--ease-standard)",
        "accordion-up": "accordion-up var(--duration-normal) var(--ease-standard)",
      },
    },
  },
  plugins: [animate],
} satisfies Partial<Config>;

export default anodaPreset;
