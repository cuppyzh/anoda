/**
 * Conventional Commits enforced at commit time (lefthook) and in CI.
 * See docs/contracts/01-repository.md §Commits.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert", "security"],
    ],
    // Scope is the service or area, e.g. feat(yomi.api): ..., chore(tooling): ...
    "scope-case": [2, "always", "kebab-case"],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 120],
  },
};
