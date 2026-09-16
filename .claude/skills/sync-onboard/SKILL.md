---
name: sync-onboard
description: Regenerate the auto-synced sections of ONBOARDING.md from the actual state of the anoda repo — service scaffolding status, contracts index, ADR list, recent commits, and gate status. Use when asked to "sync onboarding", "update the onboarding doc", "/sync-onboard", or after a milestone (a service scaffolded, a contract or ADR added/changed, purposes decided) that would make ONBOARDING.md stale. Never invents content — every fact comes from reading the repo, never from memory of a past session.
---

# Sync onboarding document

`ONBOARDING.md` at the repo root is the single "what is this, where are we" document for anyone arriving cold —
a new developer, or the same agent in a future session with no memory of this one. This skill keeps it truthful
by regenerating it from the repo's actual state, never from assumption or from what a previous conversation
claimed was done.

## Ground rule

**Only write what you can verify by reading a file or running a command in this repo.** If something is
unclear or contradictory (e.g. a service's `README.md` says "Active" but it has no `go.mod`), report the
discrepancy in your summary to the user instead of guessing which one is right.

## What this skill may and may not touch

`ONBOARDING.md` has HTML comment anchors marking auto-synced regions:

```html
<!-- sync-onboard:status:start -->
...
<!-- sync-onboard:status:end -->
```

| Region | May edit? |
|---|---|
| `sync-onboard:status` | Yes — rewrite entirely from evidence |
| `sync-onboard:services` | Yes — rewrite entirely from evidence |
| `sync-onboard:contracts` | Yes — rewrite entirely from evidence |
| `sync-onboard:decisions` | Yes — rewrite entirely from evidence |
| Everything else (prose sections, "Open questions") | **No.** These are human-owned narrative. Leave byte-for-byte unless the user explicitly asks you to change the prose in this same request. |

If `ONBOARDING.md` doesn't exist yet, or is missing anchors, stop and tell the user — do not invent a new
structure. (If asked to create it from scratch, use the current `ONBOARDING.md` in this repo, if present in
git history, as the template; otherwise ask.)

## Steps

### 1. Collect ground truth

Run the collector script from the repo root:

```bash
bash .claude/skills/sync-onboard/scripts/collect-status.sh
```

This is read-only and prints: current date, branch, HEAD commit, working-tree cleanliness, recent commits, one
line per service (stack detected from `go.mod`/`package.json`, whether it has a `Dockerfile`/`api/openapi.yaml`,
and the `Purpose`/`Status` fields from its `README.md` table), one line per file in `docs/contracts/` with its
title, one line per ADR with its title and status, a best-effort `task check` run, and a shallow directory tree.

If the script fails (e.g. not a git repo, `task` not installed), note what couldn't be checked and proceed with
whatever it did produce — partial ground truth is better than none, but say so in the final summary.

### 2. Cross-check with direct reads

The script's per-file title/status extraction is a grep and can miss non-standard formatting. For anything the
script's output looks off for (missing title, empty purpose, unexpected status), `Read` that file directly and
use what's actually there.

Also `Read`:

- `docs/contracts/00-overview.md` — confirm the contract index table there is what `ONBOARDING.md` should mirror
  (same numbers, same titles, same one-line "applies to").
- `docs/adr/README.md` — confirm the ADR table there matches what `ONBOARDING.md` should mirror.
- Each `services/*/README.md` — confirm `Purpose`, `Status`, and task alias.

### 3. Rewrite the auto-synced sections

Using `Edit` on `ONBOARDING.md`, replace the content **between** each pair of anchors (keep the anchor comments
themselves) with freshly generated content:

- **`status`**: a small table (Last synced = today's date from the script; Repo HEAD at sync time; Phase —
  describe honestly, e.g. "Foundation" if no service has code yet, or name the services that do; Services
  scaffolded = `N / total`; Gate status = pass/fail from the script's `task check` run, or "not run — task not
  installed" if skipped; Working tree = clean/dirty) followed by a fenced `text` block with the last 5–10
  commits from `git log --oneline`.
- **`services`**: one row per folder under `services/`, with its stack (Go API / Next.js UI / unknown),
  `Purpose` and `Status` exactly as found in its README (do not paraphrase into something rosier than what's
  written), and its task alias (cross-reference `Taskfile.yml`'s `includes:` block for the alias if the README
  doesn't state one).
- **`contracts`**: mirror `docs/contracts/00-overview.md`'s index table exactly — same rows, same order. If a
  contract was added or removed, this table changes accordingly.
- **`decisions`**: mirror `docs/adr/README.md`'s table exactly — same rows, same order, same status values.

Do not touch anything outside these four regions.

### 4. Update narrative only if it's now factually wrong

The prose sections ("What anoda is", "Architecture at a glance", "How to run it", etc.) are human-owned, but if
ground truth directly contradicts a factual claim there — e.g. "no service has code" while a service clearly
does now — flag it in your summary and ask whether to update that sentence. Do not silently rewrite prose.

### 5. Validate

```bash
npx --yes markdownlint-cli2 "ONBOARDING.md"
```

Fix any lint error your edit introduced (usually table formatting) before finishing.

### 6. Report

Tell the user, briefly:

- What changed in each of the four auto-synced sections (one line each: "no change" or a short description).
- Any discrepancy you found between a file's claimed status and its actual state (e.g. README says "Active"
  but no `go.mod` exists).
- Whether `task check` passed, failed, or wasn't run.
- If you skipped updating stale prose because it's human-owned, name the sentence and ask if they want it fixed.

Do not print the full regenerated document in chat — the user can open the file.
