// Shared ESLint flat config for every *.ui.anoda.com app.
// A service's eslint.config.mjs re-exports this: `export { default } from "../../tooling/node/eslint.config.mjs";`
// Rules mirror docs/contracts/03-nextjs-frontend.md and 12-design-ui-ux.md. Do not weaken without an ADR.
//
// Peer deps a service must install (dev):
//   eslint typescript-eslint @eslint/js eslint-config-next eslint-plugin-react eslint-plugin-react-hooks
//   eslint-plugin-jsx-a11y eslint-plugin-import-x eslint-plugin-tailwindcss eslint-plugin-testing-library
//   eslint-plugin-vitest eslint-config-prettier globals

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importX from "eslint-plugin-import-x";
import tailwind from "eslint-plugin-tailwindcss";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "eslint-plugin-vitest";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import globals from "globals";

/** Import specifiers banned across the app (03-nextjs-frontend.md §Dependencies, 12-design-ui-ux.md §Foundation). */
const bannedImports = [
  { name: "moment", message: "Use date-fns." },
  { name: "lodash", message: "Use es-toolkit or native array/object methods." },
  { name: "lodash-es", message: "Use es-toolkit or native array/object methods." },
  { name: "axios", message: "Use fetch via lib/fetcher.ts." },
  { name: "styled-components", message: "Tailwind only." },
  { name: "@emotion/react", message: "Tailwind only." },
  { name: "@emotion/styled", message: "Tailwind only." },
  { name: "@mui/material", message: "shadcn/ui + Radix only." },
  { name: "@chakra-ui/react", message: "shadcn/ui + Radix only." },
  { name: "@mantine/core", message: "shadcn/ui + Radix only." },
  { name: "antd", message: "shadcn/ui + Radix only." },
  { name: "react-icons", message: "lucide-react only." },
  { name: "@heroicons/react", message: "lucide-react only." },
  { name: "redux", message: "TanStack Query + local state; zustand only with an ADR." },
  { name: "react-redux", message: "TanStack Query + local state; zustand only with an ADR." },
  { name: "mobx", message: "TanStack Query + local state; zustand only with an ADR." },
  { name: "jquery", message: "No." },
];

export default tseslint.config(
  // ---------- ignores ----------
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "coverage/**",
      "next-env.d.ts",
      "**/*.gen.ts",
      "**/gen/**",
      "components/ui/**", // shadcn copies are vendored; wrap, don't edit (12-design-ui-ux.md)
    ],
  },

  // ---------- base ----------
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      react: { version: "detect" },
      tailwindcss: {
        callees: ["cn", "cva", "clsx", "twMerge"],
        config: "tailwind.config.ts",
        whitelist: [], // no custom class names outside the preset
      },
      "import-x/resolver": { typescript: true, node: true },
    },
  },

  // ---------- React / Next / a11y ----------
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "@next/next": nextPlugin,
      "import-x": importX,
      tailwindcss: tailwind,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.strict.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...tailwind.configs["flat/recommended"].at(-1).rules,

      // --- TypeScript strictness (03 §TypeScript) ---
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],

      // --- React (03 §Components) ---
      "react/prop-types": "off",
      "react/no-array-index-key": "error",
      "react/no-danger": "error",
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary", "coerce"] }],
      "react/self-closing-comp": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/function-component-definition": ["error", { namedComponents: "function-declaration" }],
      "react/forbid-dom-props": ["error", { forbid: [{ propName: "style", message: "Use Tailwind tokens; dynamic values via CSS variables." }] }],
      "react-hooks/exhaustive-deps": "error",

      // --- Tailwind (12 §Design tokens) ---
      "tailwindcss/no-arbitrary-value": "error",
      "tailwindcss/no-custom-classname": "error",
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/enforces-shorthand": "warn",
      "tailwindcss/no-contradicting-classname": "error",

      // --- Imports (03 §Layout, 07 §D) ---
      "import-x/no-default-export": "error",
      "import-x/no-cycle": "error",
      "import-x/no-duplicates": "error",
      "import-x/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            { target: "./lib", from: "./app", message: "lib/ is framework-agnostic; it must not import from app/." },
            { target: "./lib", from: "./features", message: "lib/ must not depend on features." },
            { target: "./lib", from: "./components", message: "lib/ must not depend on components." },
            { target: "./features", from: "./app", message: "features must not import from app/ routes." },
            {
              target: "./features/*",
              from: "./features/*/!(index).{ts,tsx}",
              except: ["./index.ts"],
              message: "Import another feature only through its index.ts public surface.",
            },
          ],
        },
      ],
      "no-restricted-imports": ["error", { paths: bannedImports, patterns: ["lodash/*", "@mui/*", "@chakra-ui/*", "@mantine/*"] }],

      // --- Environment & globals (03 §Environment) ---
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
          message: "Read environment only through lib/env.ts.",
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use the typed fetcher in lib/fetcher.ts." },
      ],
      "no-console": ["error", { allow: [] }],

      // --- Readability ---
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true }],
      "no-nested-ternary": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
    },
  },

  // ---------- lib/ is framework-agnostic ----------
  {
    files: ["lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...bannedImports,
            { name: "react", message: "lib/ must not import React." },
            { name: "next", message: "lib/ must not import Next.js." },
          ],
          patterns: ["react/*", "next/*", "lodash/*"],
        },
      ],
    },
  },
  // lib/env.ts and lib/fetcher.ts are the only places allowed to touch process.env / fetch
  {
    files: ["lib/env.ts", "lib/fetcher.ts", "lib/logger.ts"],
    rules: { "no-restricted-syntax": "off", "no-restricted-globals": "off", "no-console": "off" },
  },

  // ---------- Next.js requires default exports in routing/config files ----------
  {
    files: [
      "app/**/page.tsx",
      "app/**/layout.tsx",
      "app/**/loading.tsx",
      "app/**/error.tsx",
      "app/**/not-found.tsx",
      "app/**/template.tsx",
      "app/**/default.tsx",
      "app/**/route.ts",
      "middleware.ts",
      "next.config.{ts,mjs}",
      "tailwind.config.ts",
      "vitest.config.ts",
      "eslint.config.mjs",
      "postcss.config.{mjs,js}",
    ],
    rules: { "import-x/no-default-export": "off" },
  },

  // ---------- tests ----------
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    plugins: { "testing-library": testingLibrary, vitest },
    rules: {
      ...testingLibrary.configs["flat/react"].rules,
      ...vitest.configs.recommended.rules,
      "testing-library/prefer-screen-queries": "error",
      "testing-library/prefer-user-event": "error",
      "testing-library/no-node-access": "error",
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "expect*"] }],
      "max-lines-per-function": "off",
      "@typescript-eslint/unbound-method": "off",
      "no-restricted-globals": "off",
    },
  },

  // prettier last: disables formatting rules that conflict
  prettier,
);
