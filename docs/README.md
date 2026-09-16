# docs

| Folder | What lives here |
|---|---|
| [`contracts/`](contracts/00-overview.md) | The binding engineering rules. Start at `00-overview.md`. |
| [`adr/`](adr/README.md) | Architecture Decision Records: the reasoning behind each contract. |
| [`design/`](design/README.md) | Design system overview and per-screen specs (`design/screens/<app>/<screen>.md`). |

Agents: `CLAUDE.md` at the repo root tells you which contract to read for the task at hand.

## Writing docs

- Markdown, linted by `markdownlint` (`.markdownlint.yaml`). Run `task lint:docs`.
- Contracts are rules; ADRs are reasons; READMEs are how-tos. Do not mix them.
- Prefer tables for rule lists and short imperative sentences.
