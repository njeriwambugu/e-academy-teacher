# Assignment Feature Architecture

## Technical decisions

- The assignment workflow now lives in `scripts/teacher.assignments.js` instead of being embedded inside `teacher-app.js`.
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
  teacher.assignments.js      # Assignment list, filters, reports, learner performance
  teacher.modals.js           # Teacher modal UI
  student-profile.js          # Student profile derivation
  mock-data.js                # Mock data source
  subject-themes.js           # Subject/assignment visual themes
styles/
  tmain.css                   # Teacher UI styles, including assignment feature styles
```

Long term, split additional feature modules the same way:

```text
scripts/features/students/
scripts/features/classes/
scripts/features/assignments/
scripts/shared/dom.js
scripts/shared/formatters.js
scripts/shared/router.js
```

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
