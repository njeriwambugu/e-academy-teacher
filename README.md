# ESOMA Academy — Teacher Portal

Frontend prototype for the teacher side of the ESOMA Academy school system.
Plain HTML/CSS/ES-modules — **no build step**. Served by WAMP from
`c:\wamp64\www\`.

- Teacher portal (this repo): <http://localhost/e-academy-teacher-v14/>
- Admin portal (sibling repo): <http://localhost/e-academy-admin-main/e-academy-admin-main/>

## The two portals, one system

| | Admin | Teacher |
|---|---|---|
| Scope | Whole school | Only the logged-in teacher's classes/subjects/students |
| Folder | `e-academy-admin-main/e-academy-admin-main/` | `e-academy-teacher-v14/` |
| Entry script | `scripts/legacy.js` (+ `scripts/app.js`) | `scripts/teacher-app.js` |
| Data | Adapter over the shared store | **Canonical mock store** |

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
  assets/               # icons, images
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

## Running

1. Start WAMP (both project folders under `c:\wamp64\www\`).
2. Open <http://localhost/e-academy-teacher-v14/>.
3. "Switch to Admin" in the sidebar (or the mobile profile dropdown) jumps to
   the admin portal.

Both folders are independent git repositories; commit teacher and admin
changes in their own repos.

## More docs

- [docs/assignment-architecture.md](docs/assignment-architecture.md) —
  assignment feature design notes.
