# Screen: `<App> / <Screen name>`

| Field | Value |
|---|---|
| App | `<name>.ui.anoda.com` |
| Route | `/path/[param]` |
| Status | Draft / Approved / Implemented |
| Author / date | @handle, YYYY-MM-DD |
| Related | ADRs, API operations (`operationId`s), other screens |

## Goal

One sentence: what the user comes here to accomplish.

## Primary action

The single most important thing on this screen (one `Button variant="default"`). Secondary actions listed below it.

## Entry points and navigation

- From: `<screen>` via `<link/button>`
- To: `<screen>` after success; back behavior.
- Breadcrumb: Home / Section / This

## Data

| Data | Source (`operationId`) | Cached? | Notes |
|---|---|---|---|
| List of X | `listX` (cursor paginated) | Query, 30s stale | |

## States (all four are mandatory)

| State | What the user sees | Component |
|---|---|---|
| Loading | Skeleton shaped like the list/card/table | `LoadingSkeleton` |
| Empty | "No X yet" + explanation + primary action | `EmptyState` |
| Error | Plain-language message + Retry | `ErrorState` |
| Success | The content | — |

## Layout (optional ASCII or image)

```text
+--------------------------------------------------+
| PageHeader: h1 "Title"                [Primary]  |
+--------------------------------------------------+
| Filters (secondary)                              |
| DataTable / Cards                                |
| Pagination (Load more)                           |
+--------------------------------------------------+
```

## Form fields (if any)

| Field | Type | Validation (zod) | Error copy |
|---|---|---|---|
| Title | text | `min(1).max(120)` | "Enter a title (max 120 characters)." |

## Copy

Key strings in sentence case, verbs on buttons. List them so implementation does not invent wording.

## Accessibility notes

- Heading order, landmark regions, focus target after navigation/action.
- Live region for async results.
- Anything non-standard (drag and drop, custom shortcuts) and its keyboard equivalent.

## Open questions

- [ ] ...
