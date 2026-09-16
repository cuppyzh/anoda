// Shared Prettier config. A service's prettier.config.mjs re-exports this.
// Tailwind plugin sorts class names consistently (12-design-ui-ux.md).
/** @type {import("prettier").Config} */
export default {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva", "clsx", "twMerge"],
  overrides: [
    { files: "*.md", options: { proseWrap: "preserve" } },
    { files: "*.{yml,yaml}", options: { singleQuote: false } },
  ],
};
