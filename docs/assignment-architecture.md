# Assignment Feature Architecture

## Technical decisions

- The assignment workflow now lives in `scripts/ui/assignments.js` instead of being embedded inside `teacher-app.js`.
- `teacher-app.js` remains the shell/router owner: navigation, breadcrumbs, class pages, student pages, and app initialization.
- The assignment module owns assignment-specific state, derived rows, filters, detail rendering, learner table rendering, and assignment event handlers.
- Assignment identity is stable using `subjectId::classId::assignmentId`, so the same deployed assignment can be opened from the main Assignments page or from a class assignment table.

## Tradeoff analysis

- Kept the existing vanilla JavaScript stack instead of introducing a framework. This avoids build tooling and reduces risk for the current prototype.
- Used a feature-module boundary rather than a full domain/application/infrastructure rewrite. This improves maintainability now without changing product behavior.
- Used cached derived assignment rows because assignments are read-only mock data today. If the backend later becomes live, call `invalidateCache()` after mutations.

## Recommended architecture

```text
scripts/
  teacher-app.js              # App shell, routing, shared teacher dashboard views
  modal.js                    # Shared modal engine (same file as the admin app's)
  data/
    mock-data.js              # Canonical mock store (also feeds the admin app)
    student-profile.js        # Student profile derivation
  ui/
    assignments.js            # Assignment list, filters, reports, learner performance
    modals.js                 # Teacher modal UI
    mobile-profile.js         # Mobile header profile dropdown
  utils/
    ui-state.js               # Button/action helpers
    table-utils.js            # Shared table pagination
styles/
  tmain.css                   # Teacher UI styles, including assignment feature styles
```

See the repository README for the full two-portal structure and conventions.

## Performance improvements

- Derived assignment rows are cached instead of rebuilt on every lookup.
- Assignment lookup uses a `Map` for constant-time detail resolution.
- Select dropdown DOM is only updated when its HTML actually changes.
- Search input is debounced to avoid re-rendering the table on every keystroke under fast typing.
- Event delegation is used for dynamic tables, avoiding per-row listeners.

## Scaling risks to watch

- Large assignment tables should eventually use pagination or virtualized rows.
- Filters should be backed by indexed API queries once assignments come from the backend.
- Learner performance should be real backend data, not deterministic mock derivation.
- CSS should be split by feature when the app moves to a build pipeline.

## Implementation plan

1. Keep the current vanilla JS module split stable.
2. Move shared helpers into `scripts/shared/` when a build step or import map is introduced.
3. Add backend assignment endpoints with server-side filtering.
4. Add pagination for assignment and learner tables.
5. Add automated browser smoke tests for assignment routing and filtering.
