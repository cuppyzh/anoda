# 01 — Repository

## Layout

```text
.
├── CLAUDE.md / AGENTS.md      # agent entrypoint (identical)
├── Taskfile.yml               # task runner; `task check` is the gate
├── lefthook.yml               # git hooks
├── docker-compose.yml         # local stack
├── .env.example               # every config key, fake values
├── .github/                   # CI workflows, PR template
├── docs/
│   ├── contracts/             # binding rules (this folder)
│   ├── adr/                   # architecture decision records
│   └── design/                # design system notes, screen specs
├── tooling/                   # shared configs: go, node, docker, taskfiles, design, templates
├── scripts/                   # bootstrap and maintenance scripts
├── deploy/                    # compose helpers now; k8s later
└── services/
    ├── <name>.api.anoda.com/  # Go service
    └── <name>.ui.anoda.com/   # Next.js app
```

| Rule | Level | Enforced by |
|---|---|---|
| A service lives in exactly one folder under `services/` and owns everything it needs to build and test itself. | MUST | review |
| Service folders are named `<name>.api.anoda.com` (Go) or `<name>.ui.anoda.com` (Next.js), lower-case, dots as separators. | MUST | CI path filters, `services/README.md` |
| Shared configuration lives in `tooling/` and is copied or imported by services; services MUST NOT redefine shared rules. | MUST | review |
| Cross-service shared code is not allowed until an ADR defines a shared module. Duplicate small helpers instead. | MUST | review |
| Every new service is registered in `Taskfile.yml`, `docker-compose.yml`, and `.github/workflows/ci.yml` in the PR that creates it. | MUST | review, `services/README.md` checklist |
| Generated code is committed, marked `linguist-generated` in `.gitattributes`, and never hand-edited. | MUST | `.gitattributes`, review |

## Branching

| Rule | Level | Enforced by |
|---|---|---|
| Trunk-based: `master` is always releasable. | MUST | CI required checks |
| Work happens on short-lived branches named `<type>/<scope>-<summary>`, e.g. `feat/yomi-api-list-books`. | MUST | review |
| Branches are merged by squash or rebase; no merge commits on `master`. | MUST | repo settings |
| Force-pushing `master` is forbidden. | MUST | branch protection |

## Commits

| Rule | Level | Enforced by |
|---|---|---|
| Conventional Commits: `type(scope): summary`. Types: `feat fix docs style refactor perf test build ci chore revert security`. | MUST | commitlint (hook + CI) |
| Scope is the service short name or area: `api`, `yomi-api`, `portal-ui`, `yomi-ui`, `tooling`, `contracts`, `ci`, `deps`. | MUST | commitlint `scope-case`, review |
| Subject is imperative, lower-case, no trailing period, ≤100 chars total header. | MUST | commitlint |
| Body explains *why* when the diff does not make it obvious. | SHOULD | review |
| Breaking changes use `!` after the scope and a `BREAKING CHANGE:` footer. | MUST | commitlint |
| Commits made by an agent end with the attribution trailer required by the session (e.g. `Co-Authored-By: ...`). | MUST | review |
| Never bypass hooks with `--no-verify`. | MUST NOT | CLAUDE.md, CI re-runs the checks |

## Pull requests

| Rule | Level | Enforced by |
|---|---|---|
| PR title follows Conventional Commits (it becomes the squash commit). | MUST | commitlint on PR commits |
| PR body uses the template and completes the checklist honestly. | MUST | template, review |
| One concern per PR. Prefer under ~400 changed lines excluding generated code and lockfiles. | SHOULD | review |
| All CI jobs green before merge. Red CI is never "fixed" by weakening a gate. | MUST | branch protection |
| A PR that changes behavior includes tests in the same PR. | MUST | coverage gate, review |

## Files every service MUST have

| File | Purpose |
|---|---|
| `README.md` | From `tooling/templates/service-readme.md`: purpose, owner, how to run, env vars |
| `Dockerfile` + `.dockerignore` | From `tooling/docker/` |
| Stack config | Go: `go.mod`, `.golangci.yml` → points to shared; Node: `package.json`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.ts` extending `tooling/node/*` |
| `.coverage-exempt` (Go) | Explicit list of packages exempt from the coverage gate, with a reason per line |

## Documentation

| Rule | Level | Enforced by |
|---|---|---|
| Markdown passes `markdownlint` with `.markdownlint.yaml`. | MUST | lefthook, CI `docs` job |
| Architectural decisions are recorded as ADRs before or with the code that implements them. | MUST | review |
| Comments explain *why*, not *what*. Delete commented-out code. | SHOULD | review |
