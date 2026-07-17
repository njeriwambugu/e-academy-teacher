# Teacher Portal

**Shared mock data.** The single source of truth for people and numbers is
[`scripts/data/mock-data.js`](scripts/data/mock-data.js) in this repo
(`teacherContext`: teacher + teaching assignments, classes, subjects,
students, per-subject scores). The admin app does **not** keep its own copy —
its `scripts/data/mock-data.js` is an *adapter* that imports this store over
a relative URL and reshapes it into the row formats the admin code has always
consumed. Change a student here and both portals update.

**Scoping model.** A teacher record carries `assignments:
[{ subjectId, classId, role }]`. Everything the teacher portal shows is
derived from that list (classes → students → assignments). The admin portal
reads the same entities unfiltered. When the backend arrives, this maps to
the API applying `WHERE teacher = me` on teacher endpoints and no filter on
admin endpoints — the frontends keep their shapes.

## Directory structure (both portals follow it)

```text
<portal>/
  index.html            # single page; views are <section class="view"> blocks
  assets/               # icons, images//changed the directory to scripts just for testing//
  styles/
    main.css            # base component library (shared design language)
    tmain.css           # portal overlay styles (admin uses main.css only)
  scripts/
    <entry>.js          # app shell: routing, views, event wiring
    modal.js            # shared modal engine (identical file in both portals)
    data/               # data layer — mock stores / derivations / adapters
    ui/                 # feature modules that render a screen or widget
    utils/              # small dependency-free helpers
  docs/                 # architecture notes
```

Teacher portal, concretely:

```text
scripts/
  teacher-app.js        # shell: hash router, nav, breadcrumbs, class pages,
                        # students view, deploy modal, floating back/FAB
  modal.js              # shared modal engine
  data/
    mock-data.js        # CANONICAL store (also imported by the admin adapter)
    student-profile.js  # derives a student's profile/performance rows
  ui/
    assignments.js      # assignments feature: list, cascade+date filter,
                        # detail (donuts, highlights, learners), pagers
    modals.js           # select-class modal
    mobile-profile.js   # mobile header profile dropdown (classic script)
  utils/
    ui-state.js         # button action helpers
    table-utils.js      # createPager() used by all paginated tables
```

## Conventions

- **Routing** is hash-based: `#view=dashboard|students|assignments`,
  `#view=class&subjectId=MAT&classId=12`, `#view=student&studentId=1001`,
  `#view=assignment&assignmentId=SUB::CLASS::ID&panel=overview|learners`.
  State that must survive refresh (filters, active tab) lives in the hash.
- **ES modules** everywhere except `modal.js` and `ui/mobile-profile.js`,
  which are classic scripts loaded before the module entry.
- **Rendering**: features build HTML strings and assign `innerHTML`; events
  use delegation with `data-*` attributes (never per-row listeners).
- **Design language** comes from the admin app: grade tabs, status pills,
  table links, glass dropdowns. `main.css` is the base; portal deltas go in
  `tmain.css` as *small scoped overrides*, not re-implementations.
- **Loading** is skeleton-based (`view-loading` on the view element);
  buttons do not spin.
- **Backend seam**: `deployAssignmentAPI(payload)` in `teacher-app.js` is
  the single stub to replace with a real `fetch` for assignment deployment.
  When the API exists, the data layer (`scripts/data/`) is the only layer
  that should change.

## Technical decisions

- The assignment workflow now lives in `scripts/ui/assignments.js` instead of being embedded inside `teacher-app.js`.
- `teacher-app.js` remains the shell/router owner: navigation, breadcrumbs, class pages, student pages, and app initialization.
- The assignment module owns assignment-specific state, derived rows, filters, detail rendering, learner table rendering, and assignment event handlers.
- Assignment identity is stable using `subjectId::classId::assignmentId`, so the same deployed assignment can be opened from the main Assignments page or from a class assignment table.

## Tradeoff analysis

- Kept the existing vanilla JavaScript stack instead of introducing a framework. This avoids build tooling and reduces risk for the current prototype.
- Used a feature-module boundary rather than a full domain/application/infrastructure rewrite. This improves maintainability now without changing product behavior.
- Used cached derived assignment rows because assignments are read-only mock data today. If the backend later becomes live, call `invalidateCache()` after mutations.
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

