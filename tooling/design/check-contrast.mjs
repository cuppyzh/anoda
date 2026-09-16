#!/usr/bin/env node
// Validates tooling/design/tokens.json and enforces WCAG 2.2 AA contrast (docs/contracts/12-design-ui-ux.md).
//
//   node tooling/design/check-contrast.mjs            # exit 1 on any failure
//   node tooling/design/check-contrast.mjs --verbose  # print every pair
//
// Checks:
//   1. Schema-ish validation: every color role exists in both themes, values are HSL triplets, names are kebab-case.
//   2. Contrast: each pair in tokens.contrast.text >= 4.5:1 and tokens.contrast.ui >= 3:1, in both themes.
//   3. Drift: globals.css defines every role as a CSS variable with the same value for :root (light) and .dark.
// No dependencies (runs in CI's `docs` job and `task lint:design`).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));
const css = readFileSync(join(here, "globals.css"), "utf8");
const verbose = process.argv.includes("--verbose");

const HSL = /^(\d{1,3}(?:\.\d+)?) (\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/;
const NAME = /^[a-z]+(-[a-z]+)*$/;
const TEXT_MIN = 4.5;
const UI_MIN = 3.0;

const failures = [];
const fail = (msg) => failures.push(msg);

// ---------- 1. structure ----------
const themes = ["light", "dark"];
for (const t of themes) {
  if (!tokens.color?.[t]) fail(`color.${t} is missing`);
}
const roles = new Set([...Object.keys(tokens.color.light ?? {}), ...Object.keys(tokens.color.dark ?? {})]);
for (const role of roles) {
  if (!NAME.test(role)) fail(`role "${role}" is not kebab-case`);
  for (const t of themes) {
    const v = tokens.color[t]?.[role];
    if (v === undefined) fail(`role "${role}" is missing in ${t} theme`);
    else if (!HSL.test(v)) fail(`color.${t}.${role} = "${v}" is not an HSL triplet "H S% L%"`);
  }
}
for (const [role, v] of Object.entries(tokens.zIndex ?? {})) {
  if (!/^\d+$/.test(v)) fail(`zIndex.${role} must be an integer string`);
}

// ---------- 2. contrast ----------
function hslToRgb(triplet) {
  const [, h, s, l] = triplet.match(HSL).map(Number);
  const S = s / 100;
  const L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [C, X, 0];
  else if (h < 120) [r, g, b] = [X, C, 0];
  else if (h < 180) [r, g, b] = [0, C, X];
  else if (h < 240) [r, g, b] = [0, X, C];
  else if (h < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  return [r + m, g + m, b + m];
}
function luminance([r, g, b]) {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const la = luminance(hslToRgb(a));
  const lb = luminance(hslToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const rows = [];
for (const [kind, min] of [
  ["text", TEXT_MIN],
  ["ui", UI_MIN],
]) {
  for (const [fg, bg] of tokens.contrast?.[kind] ?? []) {
    for (const t of themes) {
      const a = tokens.color[t]?.[fg];
      const b = tokens.color[t]?.[bg];
      if (!a || !b) {
        fail(`contrast.${kind}: unknown role in pair [${fg}, ${bg}] for ${t}`);
        continue;
      }
      const r = ratio(a, b);
      const ok = r >= min;
      rows.push({ t, kind, fg, bg, r: r.toFixed(2), min, ok });
      if (!ok) fail(`${t}: ${fg} on ${bg} = ${r.toFixed(2)}:1, needs >= ${min}:1 (${kind})`);
    }
  }
}

// ---------- 3. drift between tokens.json and globals.css ----------
function cssBlock(selector) {
  const re = new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "m");
  const m = css.match(re);
  return m ? m[1] : null;
}
const lightBlock = cssBlock(":root");
const darkBlock = cssBlock(".dark");
if (!lightBlock) fail("globals.css: no :root block");
if (!darkBlock) fail("globals.css: no .dark block");
for (const role of roles) {
  for (const [t, block] of [
    ["light", lightBlock],
    ["dark", darkBlock],
  ]) {
    if (!block) continue;
    const expected = tokens.color[t][role];
    const re = new RegExp(`--${role}:\\s*([^;]+);`);
    const m = block.match(re);
    if (!m) fail(`globals.css ${t}: missing --${role}`);
    else if (m[1].trim() !== expected) fail(`globals.css ${t}: --${role} is "${m[1].trim()}", tokens.json says "${expected}"`);
  }
}
if (lightBlock && !new RegExp(`--radius:\\s*${tokens.radius.base.replace(".", "\\.")};`).test(lightBlock)) {
  fail(`globals.css: --radius must equal tokens.radius.base (${tokens.radius.base})`);
}

// ---------- report ----------
if (verbose || failures.length) {
  const width = Math.max(...rows.map((x) => `${x.fg} on ${x.bg}`.length), 20);
  for (const x of rows) {
    if (!verbose && x.ok) continue;
    console.log(`${x.t.padEnd(5)} ${x.kind.padEnd(4)} ${`${x.fg} on ${x.bg}`.padEnd(width)} ${x.r.padStart(6)}:1  min ${x.min}  ${x.ok ? "ok" : "FAIL"}`);
  }
}
if (failures.length) {
  console.error(`\ncheck-contrast: ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`check-contrast: ${roles.size} roles x 2 themes, ${rows.length} contrast pairs OK, globals.css in sync`);
