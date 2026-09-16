# 04 — Testing

**Unit tests are mandatory.** A change to behavior without a test is incomplete and is not merged.
Tests are the primary way an agent proves its work; they are also the specification the next agent reads.

## Universal rules

| Rule | Level | Enforced by |
|---|---|---|
| Every PR that changes behavior adds or updates unit tests in the same PR. | MUST | coverage gate, review |
| Coverage gate: **80% statements per package (Go) / per file group (Node)**. New code SHOULD be ≥90%. | MUST | `coverage-gate.sh`, `vitest` thresholds |
| Exemptions are explicit: Go `.coverage-exempt` (one package path + reason per line); Node `coverage.exclude` in the service's `vitest.config.ts` with a comment. Generated code, `cmd/`, and `main` wiring are the only pre-approved exemptions. | MUST | files are reviewed |
| Tests are deterministic: no real network, no real clock, no sleeping, no shared mutable state, no order dependence. | MUST | `-shuffle=on`, review |
| Test names describe behavior: `TestBookService_Create_RejectsEmptyTitle`, `it("shows an empty state when there are no books")`. | MUST | review |
| Arrange–Act–Assert with a blank line between sections. One behavior per test case. | SHOULD | review |
| Mocks are hand-written or generated implementations of **your own interfaces** (ports). Never monkey-patch, never mock what you don't own beyond the boundary adapter. | MUST | review |
| Test data comes from small factory functions with sensible defaults and overrides, not from giant fixtures. | SHOULD | review |
| A bug fix starts with a failing test that reproduces it. | MUST | review |
| Skipped or focused tests (`t.Skip`, `it.only`, `describe.skip`) are not committed. | MUST NOT | `vitest` `allowOnly: false`, review |
| Flaky tests are fixed or deleted the same day, never retried into green. | MUST | review |

## Test pyramid for this repo

| Layer | What | Where | Speed | Required? |
|---|---|---|---|---|
| Unit | Pure functions, use cases with mocked ports, components with mocked network | Next to the code (`*_test.go`, `*.test.tsx`) | ms | **Yes, always** |
| Integration | Repository against a real Postgres (testcontainers), HTTP handler through the router | `internal/adapters/**`, tagged `//go:build integration` | s | Yes for every repository and handler |
| Contract | Generated OpenAPI types compile; responses validate against `openapi.yaml` | `internal/adapters/http` | ms | Yes for every endpoint |
| E2E (smoke) | Playwright: sign-in, one happy path per app | `services/*.ui/e2e` | min | Deferred; rule reserved |

## Go

| Rule | Level | Enforced by |
|---|---|---|
| Standard `testing` package. `testify/require` and `testify/assert` are allowed; `require` for preconditions, `assert` for checks. | MAY | `testifylint` |
| Table-driven tests for any function with more than two meaningful input classes. Each case has a `name`. | SHOULD | review |
| `t.Parallel()` on every top-level test and sub-test that does not share state. | SHOULD | `paralleltest`, `tparallel` |
| Always run with `-race -shuffle=on -count=1`. | MUST | Taskfile, CI |
| Use `t.Helper()` in helpers, `t.Cleanup` instead of `defer` for teardown, `t.TempDir()` for files. | MUST | `thelper`, `usetesting` |
| Tests for package `x` live in package `x_test` (black-box) unless testing unexported internals is unavoidable. | SHOULD | review |
| HTTP handlers are tested with `httptest` through the real router and middleware chain, asserting status, `problem+json` body, and headers. | MUST | review |
| Repositories are tested against a real Postgres via `testcontainers-go`, behind `//go:build integration`, run in CI with the `integration` tag. | MUST | CI |
| Golden files (`testdata/*.golden`) are updated only via an explicit `-update` flag, never by hand. | SHOULD | review |
| Domain and app packages have no test dependencies on adapters. | MUST | `depguard` |

Minimal example shape:

```go
func TestCreateBook_RejectsEmptyTitle(t *testing.T) {
    t.Parallel()

    repo := &fakeBookRepo{}
    svc := app.NewBookService(repo, clock.Fixed(time.Unix(0, 0)))

    _, err := svc.Create(context.Background(), app.CreateBookInput{Title: ""})

    var verr *domain.ValidationError
    require.ErrorAs(t, err, &verr)
    assert.Equal(t, "title", verr.Field)
    assert.Empty(t, repo.saved)
}
```

## Next.js / TypeScript

| Rule | Level | Enforced by |
|---|---|---|
| Vitest with `jsdom` (or `happy-dom`) environment; config extends `tooling/node/vitest.config.base.ts`. | MUST | Taskfile, CI |
| Components are tested with Testing Library: query by role/label/text as a user would, never by class or test-id unless there is no accessible alternative. | MUST | `testing-library/prefer-screen-queries`, review |
| User interaction uses `@testing-library/user-event`, not `fireEvent`. | SHOULD | `testing-library/prefer-user-event` |
| Network is mocked with MSW handlers in `tests/msw/`; no `vi.mock` of `fetch`. | MUST | review |
| Every component with markup has at least one `expect(await axe(container)).toHaveNoViolations()` assertion. | MUST | `vitest-axe`, review |
| Hooks are tested through a component or `renderHook`; use cases and schemas are tested as plain functions. | SHOULD | review |
| Snapshot tests are not used for components (they test nothing and rot). Inline snapshots MAY be used for serializers. | MUST NOT | review |
| Server Components with data are tested by testing the feature function they call; route files (`page.tsx`) are excluded from coverage. | MAY | `vitest` config |
| Coverage thresholds: 80% lines/statements/functions/branches, enforced in config. | MUST | `vitest.config.base.ts` |

Minimal example shape:

```tsx
it("shows an empty state when there are no books", async () => {
  server.use(http.get("/api/books", () => HttpResponse.json({ items: [], nextCursor: null })));

  const { container } = render(<BookList />, { wrapper: QueryWrapper });

  expect(await screen.findByRole("heading", { name: /no books yet/i })).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});
```

## What is NOT a substitute for unit tests

- Manual testing in the browser.
- "I ran it and it worked."
- Type checking alone.
- A screenshot.

These are welcome as *additional* evidence in the PR body, but the PR still needs tests.
