import { teacherContext, classMock, getClassMock } from "./mock-data.js";
import { getStudentProfile } from "./student-profile.js";
import { createSelectClassModal } from "./teacher.modals.js";
import { createAssignmentsFeature } from "./teacher.assignments.js";
import { clearButtonLoading, runButtonAction } from "./ui-state.js";
import { createPager } from "./table-utils.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let activeClassData = classMock;

const studentsPager = createPager({
  container: "#studentsPagination",
  onPageChange: () => renderStudents(),
});
const classAssignmentsPager = createPager({
  container: "#classAssignmentsPagination",
  onPageChange: () => renderClassAssignments(activeClassData.assignments || []),
});



function getTeacherAssignments() {
  return teacherContext?.teacher?.assignments || [];
}

function getTeacherClassIds() {
  return [...new Set(getTeacherAssignments().map((a) => Number(a.classId)))];
}

function getTeacherSubjectIds() {
  return [...new Set(getTeacherAssignments().map((a) => a.subjectId))];
}

function getTeacherClasses() {
  const classIds = getTeacherClassIds();
  return (teacherContext?.classes || []).filter((c) =>
    classIds.includes(Number(c.id))
  );
}

function getTeacherSubjects() {
  const subjectIds = getTeacherSubjectIds();
  return (teacherContext?.subjects || []).filter((s) =>
    subjectIds.includes(s.id)
  );
}

function getTeacherStudents() {
  const classIds = getTeacherClassIds();
  return (teacherContext?.students || []).filter((student) =>
    classIds.includes(Number(student.classId))
  );
}

function getSubjectClasses(subjectId) {
  const assignmentClassIds = getTeacherAssignments()
    .filter((a) => a.subjectId === subjectId)
    .map((a) => Number(a.classId));

  return (teacherContext?.classes || []).filter((c) =>
    assignmentClassIds.includes(Number(c.id))
  );
}

function getClassById(classId) {
  return (teacherContext?.classes || []).find(
    (c) => Number(c.id) === Number(classId)
  );
}

function getClassName(classId) {
  return getClassById(classId)?.name || "Class";
}

function getClassGroupName(classId) {
  const klass = getClassById(classId);
  return klass?.group || klass?.name || "Class";
}

function getSubjectById(subjectId) {
  return (teacherContext?.subjects || []).find((s) => s.id === subjectId);
}

function getSubjectName(subjectId) {
  return getSubjectById(subjectId)?.name || "Subject";
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(value) {
  if (!value) return "\u2014";
  // accepts "2026-06-09 09:30:00" or ISO strings.
  const datePart = String(value).slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return String(value);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

function initials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
 
const subjectsGrid = $("#teacherSubjectsGrid");
const emptyEl = $("#teacherNoSubjects");
const countEl = $("#subjectCount");

const teacherNameEl = $("#teacherName");
const teacherNameMobileEl = $("#teacherNameMobile");
const teacherDashboardNameEl = $("#teacherDashboardName");

const totalSubjectsEl = $("#teacherTotalSubjects");
const totalClassesEl = $("#teacherTotalClasses");
const totalStudentsEl = $("#teachersTotalStudents");

const views = {
  dashboard: $("#teacherDashboardView"),
  students: $("#teacherStudentsView"),
  assignments: $("#teacherAssignmentsView"),
  class: $("#teacherClassView"),
  studentProfile: $("#teacherStudentProfileView"),
};

const navButtons = $$("[data-teacher-nav]");
const breadcrumbEl = $("#teacherBreadcrumb");

const NAV_LABELS = {
  dashboard: "Dashboard",
  students: "Students",
  assignments: "Assignments",
};

 
const selectClassModalApi = createSelectClassModal({//modal
  teacherContext,
  escapeHTML,
  onClassSelected: ({ subjectId, classId }) => {
    const params = new URLSearchParams();
    params.set("view", "class");
    params.set("subjectId", subjectId);
    params.set("classId", String(classId));
    location.hash = params.toString();
  },
});


function renderTeacherName() {//stats
  const name = teacherContext?.teacher?.name || "Teacher";
  if (teacherNameEl) teacherNameEl.textContent = name;
  if (teacherNameMobileEl) teacherNameMobileEl.textContent = name;
  if (teacherDashboardNameEl) teacherDashboardNameEl.textContent = name;
}

function renderTeacherTotals() {
  const totalSubjects = getTeacherSubjects().length;
  const totalClasses = getTeacherClasses().length;
  const totalStudents = getTeacherStudents().length;

  if (totalSubjectsEl) totalSubjectsEl.textContent = String(totalSubjects);
  if (totalClassesEl) totalClassesEl.textContent = String(totalClasses);
  if (totalStudentsEl) totalStudentsEl.textContent = String(totalStudents);
}

function renderSubjects() {
  if (!subjectsGrid) return;

  const subjects = getTeacherSubjects();

  if (countEl) {
    countEl.textContent = `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`;
  }

  if (emptyEl) {
    emptyEl.hidden = subjects.length > 0;
  }

  subjectsGrid.innerHTML = subjects
    .map((subject) => {
      const subjectClasses = getSubjectClasses(subject.id);
      return `
        <button
          type="button"
          class="subject-card"
          data-subject="${escapeHTML(subject.id)}"
        >
          <span class="subject-doodles" aria-hidden="true">
            ${subjectDoodles(subject.id).map((glyph) => `<i>${escapeHTML(glyph)}</i>`).join("")}
          </span>
          <img
            class="subject-icon"
            src="${escapeHTML(subject.icon)}"
            alt=""
            aria-hidden="true"
          />
          <div class="subject-name">${escapeHTML(subject.name)}</div>
          <div class="subject-meta">
            ${subjectClasses.length
          ? `${subjectClasses.length} class${subjectClasses.length === 1 ? "" : "es"}`
          : "No classes assigned"
        }
          </div>
        </button>
      `;
    })
    .join("");
}

// faint background glyphs per subject
const SUBJECT_DOODLES = {
  MAT: ["🔢︎", "2⁷", "𝝅", "√", "⏲", "⃤", "𓍝", "⊿", "i³", "✗", "⛀⛁", "∑", "±" ],
  ENG: ["✎", "❝ ❞", "Aa", "🗣", "❞", "𓂃✍︎", "ִ🕮", "🗪", "✉︎"],
  KIS: ["𓂃🖊", "❝ ❞", "Ss", "⁉", "❞", "🗯", "🗣", "ᶻ𐰁", "📖︎"],
  SCI: ["🐛︎", "🍂︎", "☢", "⚙", "𓌉◯𓇋", "Co²", "🕸", "🕷", "𓆈","📱︎", "🖨︎", "💻︎", "🌐︎"],
  SS: ["ᨒ", "🗺", "⛱", "✈", "🏝", "🌤", "🌡", "🏜", "🏞", "👥︎", "✊︎"],
  INT: ["⚗︎", "⋆⌬", "♻", "⚡︎", "☤", "⚧", "⚠︎",  "🔬︎", "🔭︎", "👁︎", "⚛", "🌡︎"],
  COMP: ["🖧", "</>", "💻︎", "💾︎", "🖥︎", "🖳", "모", "⁴⁰⁴", "📡︎", "🗁"],
  CRE: ["†⛪︎†", "♕", "✞", "𓉸", "🕯", "⛧", "🕊", "𓆩†𓆪", "🎚", "🍞︎", "👼︎", "🔔︎"],
  IRE: ["☪︎📿︎", "☪︎", "🕋︎", "۞", "📜︎", "☾⋆", "-`♡´-", "الله", "🕌︎", "🛐︎", "🌙︎"],
  ENV: ["♲", "🌍︎", "🌱︎", "🌀︎", "💧︎", "🛢", "🌨", "🛏", "☘", "🌲︎", "🌪︎"],
  PTECH: ["🛠︎", "⛓", "🔌︎", "🏗", "⛟", "🏠︎⛏", "⚙︎", "⌁", "⚒", "📐︎", "🗜︎", "⚓︎"],
  AGRI: ["𓃽𓃽𓀚", "⸙", "𓆝 𓆟 𓆞", "🌱︎", "𓄀", "𓇢𓆸", "𓃖", "𓃟", "🐪︎", "🌾︎"],
  ART: ["⚽︎", "♫", "𓂃🖌", "🎼︎", "🎤︎︎", "⚾︎", "ᯓ♪", "🏃︎", "🏟", "-ˋˏ✄┈┈┈┈", "⛸", "🎨︎"]
};

const DOODLE_SLOTS = 24;

function subjectDoodles(subjectId) {
  const glyphs = SUBJECT_DOODLES[subjectId] || ["🕮", "✎", "☀", "+", "❝", "%", "𓂃🖊", "📜︎"];
  // cycle the array so every slot fills and the card is covered edge to edge
  return Array.from({ length: DOODLE_SLOTS }, (_, i) => glyphs[i % glyphs.length]);
}

let studentGradeFilter = "all";//students view
let studentGroupFilter = "all";
let studentSearch = "";

function renderStudentGradeFilters() {
  const el = $("#studentGradeFilters");
  if (!el) return;

  const classes = getTeacherClasses();

  const groups = [];
  const groupMap = new Map();
  classes.forEach((c) => {
    const groupName = c.group || c.name;
    if (!groupMap.has(groupName)) {
      const group = { name: groupName, theme: c.theme || "", streams: [] };//c theme
      groupMap.set(groupName, group);
      groups.push(group);
    }
    groupMap.get(groupName).streams.push(c);
  });

  const activeGroup = groups.find((g) => g.name === studentGroupFilter);
  const activeClass = studentGradeFilter !== "all" ? getClassById(studentGradeFilter) : null;
  const allActive = studentGradeFilter === "all" && studentGroupFilter === "all" ? "active" : "";

  const desktopGroupHTML = groups
    .map((g) => {
      const isActive = g.name === studentGroupFilter || g.streams.some(
        (s) => String(s.id) === String(studentGradeFilter)
      );
      const streamButtons = [
        `<button type="button" class="grade-option ${g.name === studentGroupFilter && studentGradeFilter === "all" ? "selected" : ""}" data-grade-group-filter="${escapeHTML(g.name)}">All ${escapeHTML(g.name)} students</button>`,
        ...g.streams.map(
          (s) => `
            <button
              type="button"
              class="grade-option ${String(s.id) === String(studentGradeFilter) ? "selected" : ""}"
              data-grade-filter="${escapeHTML(s.id)}"
            >${escapeHTML(s.name)}</button>`
        ),
      ].join("");

      return `
        <div class="grade-dropdown" data-grade-group="${escapeHTML(g.name)}">
          <button
            type="button"
            class="grade-filter-btn ${escapeHTML(g.theme)} ${isActive ? "active" : ""}"
            data-grade-toggle
          >
            ${escapeHTML(g.name)}
            <img class="arrow" src="assets/icons/arrow_down.svg" alt="" aria-hidden="true" width="14" height="14" />
          </button>
          <div class="grade-dropdown-menu" role="menu">
            ${streamButtons}
          </div>
        </div>`;
    })
    .join("");

  const selectedMobileLabel = activeClass
    ? activeClass.name
    : activeGroup
      ? activeGroup.name
      : "Select Class";

  const mobileMenuHTML = activeGroup
    ? [
        `<button type="button" class="grade-option ${studentGradeFilter === "all" ? "selected" : ""}" data-grade-group-filter="${escapeHTML(activeGroup.name)}">All ${escapeHTML(activeGroup.name)} students</button>`,
        ...activeGroup.streams.map((stream) => `
          <button type="button" class="grade-option ${String(stream.id) === String(studentGradeFilter) ? "selected" : ""}" data-grade-filter="${escapeHTML(stream.id)}">${escapeHTML(stream.name)}</button>`),
        `<div class="grade-menu-divider" role="separator"></div>`,
        ...groups
          .filter((group) => group.name !== activeGroup.name)
          .map((group) => `<button type="button" class="grade-option" data-grade-group-filter="${escapeHTML(group.name)}">Switch to ${escapeHTML(group.name)}</button>`),
      ].join("")
    : groups
        .map((group) => `<button type="button" class="grade-option" data-grade-group-filter="${escapeHTML(group.name)}">${escapeHTML(group.name)}</button>`)
        .join("");

  el.innerHTML = `
    <div class="student-filter-desktop" aria-label="Class filters">
      <button
        type="button"
        class="grade-filter-btn ${allActive}"
        data-grade-filter="all"
      >All Classes</button>
      ${desktopGroupHTML}
    </div>

    <div class="student-filter-mobile" aria-label="Mobile class filters">
      <button
        type="button"
        class="grade-filter-btn ${allActive}"
        data-grade-filter="all"
      >All Classes</button>

      <div class="grade-dropdown mobile-class-dropdown ${activeGroup || activeClass ? "has-selection" : ""}">
        <button
          type="button"
          class="grade-filter-btn ${activeGroup || activeClass ? "active" : ""}"
          data-mobile-grade-toggle
        >
          ${escapeHTML(selectedMobileLabel)}
          <img class="arrow" src="assets/icons/arrow_down.svg" alt="" aria-hidden="true" width="14" height="14" />
        </button>
        <div class="grade-dropdown-menu" role="menu">
          ${mobileMenuHTML || `<p class="muted grade-empty">No classes assigned.</p>`}
        </div>
      </div>
    </div>`;
}

function renderStudentOverview(allStudents, visibleStudents) {
  const el = $("#studentOverview");
  if (!el) return;

  // counts reflect the filtered table, not the whole roster
  const active = visibleStudents.filter((student) => student.status !== "pending").length;
  const pending = visibleStudents.length - active;

  const cards = [
    { key: "total", label: "Total Students", value: visibleStudents.length, note: "current view" },
    { key: "active", label: "Active", value: active, note: "active students" },
    { key: "pending", label: "Pending", value: pending, note: "invite not accepted" },
  ];

  el.innerHTML = cards
    .map((card) => `
      <article class="student-overview-card ${escapeHTML(card.key)}">
        <span>${escapeHTML(card.label)}</span>
        <strong>${escapeHTML(card.value)}</strong>
        <em>${escapeHTML(card.note)}</em>
      </article>`)
    .join("");
}

function renderStudents() {
  renderStudentGradeFilters();

  const body = $("#studentsTableBody");
  if (!body) return;

  const allStudents = getTeacherStudents();
  let list = [...allStudents];

  if (studentGradeFilter !== "all") {
    list = list.filter(
      (s) => Number(s.classId) === Number(studentGradeFilter)
    );
  } else if (studentGroupFilter !== "all") {
    list = list.filter((s) => getClassGroupName(s.classId) === studentGroupFilter);
  }

  if (studentSearch) {
    const q = studentSearch.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q));
  }

  renderStudentOverview(allStudents, list);

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="5" class="muted">No students match your search.</td></tr>`;
    studentsPager.paginate([]);
    studentsPager.renderControls();
    return;
  }

  const pageRows = studentsPager.paginate(list);
  body.innerHTML = pageRows
    .map((student) => {
      const status = student.status === "pending" ? "pending" : "active";
      const statusLabel = status === "pending" ? "Pending" : "Active";
      const invite = student.invite || (status === "pending" ? "Pending" : "Accepted");
      const inviteClass = invite.toLowerCase() === "pending" ? "invite-status pending" : "invite-status";
      return `
        <tr>
          <td>
            <button type="button" class="student-name-btn" data-student-id="${escapeHTML(student.id)}" title="View ${escapeHTML(student.name)}'s profile">
              <span class="student-info">
                <strong>${escapeHTML(student.name)}</strong>
              </span>
            </button>
          </td>
          <td><span class="student-status ${status}">${escapeHTML(statusLabel)}</span></td>
          <td>${escapeHTML(getClassName(student.classId))}</td>
          <td><span class="${inviteClass}">${escapeHTML(invite)}</span></td>
          <td class="actions-col">
            <button type="button" class="student-action-btn profile-only" data-student-id="${escapeHTML(student.id)}" title="View profile" aria-label="View ${escapeHTML(student.name)}'s profile">
              <img src="assets/icons/user-info.svg" alt="" aria-hidden="true" width="18" height="18" />
            </button>
          </td>
        </tr>`;
    })
    .join("");
  studentsPager.renderControls();
}

function closeStudentGradeDropdowns(filters) {
  filters
    ?.querySelectorAll(".grade-dropdown.open")
    .forEach((d) => d.classList.remove("open"));
}

function bindStudentControls() {
  const filters = $("#studentGradeFilters");

  filters?.addEventListener("click", (e) => {
    // toggle a grade dropdown open/closed.
    const toggle = e.target.closest("[data-grade-toggle], [data-mobile-grade-toggle]");
    if (toggle) {
      const dropdown = toggle.closest(".grade-dropdown");
      const willOpen = !dropdown.classList.contains("open");
      closeStudentGradeDropdowns(filters);
      if (willOpen) dropdown.classList.add("open");
      return;
    }

    // select a whole grade group, e.g. all Grade 9 students.
    const groupBtn = e.target.closest("[data-grade-group-filter]");
    if (groupBtn) {
      studentGroupFilter = groupBtn.dataset.gradeGroupFilter;
      studentGradeFilter = "all";
      closeStudentGradeDropdowns(filters);
      studentsPager.reset();
      renderStudents();
      updateStudentsRouteState();
      return;
    }

    // select a specific stream or "All Classes".
    const btn = e.target.closest("[data-grade-filter]");
    if (!btn) return;
    studentGradeFilter = btn.dataset.gradeFilter;
    studentGroupFilter = studentGradeFilter === "all" ? "all" : getClassGroupName(studentGradeFilter);
    closeStudentGradeDropdowns(filters);
    studentsPager.reset();
    renderStudents();
    updateStudentsRouteState();
  });

  // close any open grade dropdown when clicking outside the filter bar.
  document.addEventListener("click", (e) => {
    if (filters && !filters.contains(e.target)) {
      closeStudentGradeDropdowns(filters);
    }
  });

  $("#studentSearchInput")?.addEventListener("input", (e) => {
    studentSearch = e.target.value.trim();
    studentsPager.reset();
    renderStudents();
    updateStudentsRouteState();
  });

  $("#studentsTableBody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-student-id]");
    if (!btn) return;
    runButtonAction(btn, () => openStudentProfile(btn.dataset.studentId));
  });
}

/*class Detail: stats, assignments, strands, mixed, chart  */

function renderClassStatCards(target, cards) {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;

  el.innerHTML = cards
    .map(
      (c) => `
        <article class="stat class-stat-card">
          <div>
            <div class="stat-value">${escapeHTML(c.value)}</div>
            <div class="stat-label">${escapeHTML(c.label)}</div>
          </div>
        </article>`
    )
    .join("");
}

function renderClassStats(stats, assignments = []) {
  renderClassStatCards("#teacherClassInfoStats", [
    { label: "Total Students", value: stats.totalStudents },
    { label: "Average Score", value: stats.averageScore },
    { label: "Completion", value: stats.completion },
  ]);

  const completedAssignments = assignments.filter((assignment) => {
    return Number(assignment.total) > 0 && Number(assignment.completed) >= Number(assignment.total);
  }).length;

  renderClassStatCards("#teacherAssignmentStats", [
    { label: "Total Assignments", value: stats.totalAssignments },
    { label: "Completed", value: completedAssignments },
  ]);
}

function renderClassAssignments(assignments) {
  const body = $("#teacherClassAssignmentsBody");
  if (!body) return;

  if (!assignments?.length) {
    body.innerHTML = `<tr><td colspan="5" class="muted">No assignments recorded yet.</td></tr>`;
    classAssignmentsPager.paginate([]);
    classAssignmentsPager.renderControls();
    return;
  }

  const pageRows = classAssignmentsPager.paginate(assignments);
  body.innerHTML = pageRows
    .map((a) => {
      const statusClass = a.status === "Active" ? "active" : "pending";
      const completion = a.total ? `${a.completed}/${a.total}` : "\u2014";
      return `
        <tr>
          <td>
            <button type="button" class="assignment-name-link" data-assignment-open="${escapeHTML(`${activeAssignmentCtx.subjectId}::${activeAssignmentCtx.classId}::${a.id}`)}">
              <strong>${escapeHTML(a.name)}</strong>
            </button>
          </td>
          <td>${escapeHTML(formatDate(a.deployed))}</td>
          <td><span class="student-status ${statusClass}">${escapeHTML(a.status || "\u2014")}</span></td>
          <td>${escapeHTML(completion)}</td>
          <td>${a.average == null ? "\u2014" : escapeHTML(a.average + "%")}</td>
        </tr>`;
    })
    .join("");
  classAssignmentsPager.renderControls();
}

function renderStrands(strands) {
  const el = $("#teacherStrandsAccordion");
  if (!el) return;

  if (!strands?.length) {
    el.innerHTML = `<p class="muted">No strands available for this class yet.</p>`;
    return;
  }

  el.innerHTML = strands
    .map((strand, i) => {
      const subs = (strand.subStrands || [])
        .map((sub, si) => `
            <button type="button" class="substrand-row" data-strand="${i}" data-sub="${si}">
              <span class="substrand-name">${escapeHTML(sub.name)}</span>
              <span class="substrand-pills">
                <span class="pill pill-avg">${assignmentCountLabel(sub.count)}</span>
              </span>
            </button>`)
        .join("");

      const strandCount = (strand.subStrands || []).reduce((sum, sub) => sum + (Number(sub.count) || 0), 0);

      return `
        <div class="accordion-item">
          <button type="button" class="accordion-header" data-strand-open="${i}">
            <span class="accordion-title">${escapeHTML(strand.name)}</span>
            <span class="accordion-pills"><span class="pill pill-avg">${assignmentCountLabel(strandCount)}</span></span>
            <span class="accordion-sign" aria-hidden="true"></span>
          </button>
          <div class="accordion-body">
            <div class="substrand-list">${subs}</div>
          </div>
        </div>`;
    })
    .join("");
}

// pill label: assignments not yet assigned to learners
function assignmentCountLabel(count) {
  const n = Number(count) || 0;
  return `${n} assignment${n === 1 ? "" : "s"}`;
}

function renderMixed(mixed) {
  const el = $("#teacherMixedAccordion");
  if (!el) return;

  if (!mixed?.length) {
    el.innerHTML = `<p class="muted">No mixed exercises yet.</p>`;
    return;
  }

  el.innerHTML = mixed
    .map((m, i) => `
        <div class="accordion-item">
          <button type="button" class="accordion-header" data-mixed-open="${i}">
            <span class="accordion-title">${escapeHTML(m.name)}</span>
            <span class="accordion-pills"><span class="pill pill-avg">${assignmentCountLabel(m.count)}</span></span>
            <span class="accordion-sign" aria-hidden="true"></span>
          </button>
          <div class="accordion-body"><div class="mixed-body"><span class="pill pill-avg">${assignmentCountLabel(m.count)} ready to assign</span></div></div>
        </div>`)
    .join("");
}

function renderClassChart(performance) {//temp chart so remove on dep
  const el = $("#teacherClassChart");
  const caption = $("#teacherChartCaption");
  if (caption && performance?.title) caption.textContent = performance.title;
  if (!el) return;

  const labels = performance?.labels || [];
  const values = (performance?.values || []).map((v) => Math.max(0, Math.min(100, Number(v) || 0)));

  if (!labels.length) {
    el.innerHTML = `<p class="muted">No performance data yet.</p>`;
    return;
  }

  const W = 720;
  const H = 420;
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxV = 100;
  const n = values.length;
  const barGap = 18;
  const barW = plotW / n - barGap;

  let grid = "";
  for (let t = 0; t <= 100; t += 25) {
    const y = padT + plotH - (t / maxV) * plotH;
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e4e8f1" stroke-width="1"/>`;
    grid += `<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6e7593">${t}</text>`;
  }

  let bars = "";
  const points = [];
  values.forEach((v, i) => {
    const x = padL + i * (barW + barGap) + barGap / 2;
    const h = (v / maxV) * plotH;
    const y = padT + plotH - h;
    points.push([x + barW / 2, y]);
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="8" fill="url(#teacherBarGradient)"/>`;
    bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="800" fill="#26325d">${v}%</text>`;
    bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${(padT + plotH + 22).toFixed(1)}" text-anchor="middle" font-size="11" fill="#6e7593">${escapeHTML(labels[i] || "")}</text>`;
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const dots = points
    .map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#172653"/>`)
    .join("");

  el.innerHTML = `
    <svg class="teacher-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHTML(performance.title || "Class performance")}">
      <defs>
        <linearGradient id="teacherBarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f48221"/>
          <stop offset="100%" stop-color="#f06405"/>
        </linearGradient>
      </defs>
      ${grid}
      ${bars}
      <path d="${linePath}" fill="none" stroke="#172653" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
    </svg>`;
}

/* panel/seg switch */

function activateClassPanel(name) {
  $$("#teacherClassView [data-class-panel]").forEach((p) => {
    p.classList.toggle("active", p.dataset.classPanel === name);
  });
  $$("#teacherClassSegments [data-panel]").forEach((seg) => {
    seg.classList.toggle("active", seg.dataset.panel === name);
  });
}

function activateAssignmentSubPanel(name) {
  showAssignmentDrill("list");
  $$("#teacherClassView [data-assignment-panel]").forEach((p) => {
    p.classList.toggle("active", p.dataset.assignmentPanel === name);
  });
  $$("#teacherAssignmentSubSegments [data-subpanel]").forEach((seg) => {
    seg.classList.toggle("active", seg.dataset.subpanel === name);
  });
}

function bindClassPanels() {
  $("#teacherClassSegments")?.addEventListener("click", (e) => {
    const seg = e.target.closest("[data-panel]");
    if (seg) activateClassPanel(seg.dataset.panel);
  });

  $("#teacherAssignmentSubSegments")?.addEventListener("click", (e) => {
    const seg = e.target.closest("[data-subpanel]");
    if (seg) activateAssignmentSubPanel(seg.dataset.subpanel);
  });
}

function bindAccordions() {
  // The chevron toggles the accordion; pressing the header itself opens the
  // Class Assignments drill for that strand / mixed exercise.
  $("#teacherStrandsAccordion")?.addEventListener("click", (e) => {
    const row = e.target.closest(".substrand-row");
    if (row) {
      row
        .closest(".substrand-list")
        ?.querySelectorAll(".substrand-row")
        .forEach((r) => r.classList.toggle("active", r === row));
      showAssignmentCards(Number(row.dataset.strand), Number(row.dataset.sub));
      return;
    }

    const header = e.target.closest(".accordion-header");
    if (!header) return;
    if (e.target.closest(".accordion-sign")) {
      header.closest(".accordion-item")?.classList.toggle("open");
      return;
    }
    showStrandCards(Number(header.dataset.strandOpen));
  });

  $("#teacherMixedAccordion")?.addEventListener("click", (e) => {
    const header = e.target.closest(".accordion-header");
    if (!header) return;
    if (e.target.closest(".accordion-sign")) {
      header.closest(".accordion-item")?.classList.toggle("open");
      return;
    }
    showMixedCards(Number(header.dataset.mixedOpen));
  });

  $("#teacherAssignmentCardsBack")?.addEventListener("click", () => showAssignmentDrill("list"));
  $("#teacherAssignmentDetailBack")?.addEventListener("click", () => showAssignmentDrill("cards"));

  $("#teacherAssignmentCardGrid")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-assignment-id]");
    if (btn) {
      runButtonAction(btn, () => {
        openAssignmentDetail(btn.dataset.assignmentId);
        clearButtonLoading();
      });
    }
  });

  $("#teacherClassAssignmentsBody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-assignment-open]");
    if (btn) runButtonAction(btn, () => assignmentsFeature?.openDetail(btn.dataset.assignmentOpen));
  });

  $("#teacherAssignToLearners")?.addEventListener("click", (event) => {
    runButtonAction(event.currentTarget, () => {
      notifyTeacher("Deployment flow is coming soon. This is where you'll assign to learners.");
      clearButtonLoading();
    });
  });
}


let activeAssignmentCtx = { subjectName: "", className: "", subjectId: "", classId: "" };
let activeSubstrandAssignments = [];

function showAssignmentDrill(layer) {
  const list = $("#teacherAssignmentList");
  const cards = $("#teacherAssignmentCards");
  const detail = $("#teacherAssignmentDetail");
  if (list) list.hidden = layer !== "list";
  if (cards) cards.hidden = layer !== "cards";
  if (detail) detail.hidden = layer !== "detail";
  syncAssignFab(layer === "detail");
}

// The Assign FAB lives beside the floating back button and only shows on the
// deployment page (class view, detail drill layer).
function syncAssignFab(visible) {
  const fab = $("#teacherAssignFab");
  if (fab) fab.hidden = !visible;
}

function buildSubstrandAssignments(strand, sub) {
  const matchingAssignments = (activeClassData?.assignments || []).filter((assignment) => {
    return String(assignment.strand || "").toLowerCase().includes(String(sub.name || "").toLowerCase());
  });

  return matchingAssignments.map((existing) => ({
    id: String(existing.id),
    uid: `${activeAssignmentCtx.subjectId}::${activeAssignmentCtx.classId}::${existing.id}`,
    name: existing.name,
    subject: activeAssignmentCtx.subjectName,
    className: activeAssignmentCtx.className,
    created: formatDate(existing.deployed),
    skills: [sub.name],
  }));
}

function renderAssignmentCards(title, cards, emptyMessage) {
  activeSubstrandAssignments = cards;
  const titleEl = $("#teacherAssignmentCardsTitle");
  if (titleEl) titleEl.textContent = title;

  const grid = $("#teacherAssignmentCardGrid");
  if (grid) {
    grid.innerHTML = cards.length
      ? cards
        .map((a) => `
<article class="assignment-card">
  <h3 class="assignment-card-name">${escapeHTML(a.name)}</h3>
  <p class="assignment-card-skills">${escapeHTML(a.skills.join(", "))}</p>
  <button type="button" class="button" data-assignment-id="${escapeHTML(a.id)}">View Assignment Page</button>
</article>`)
        .join("")
      : `<p class="muted">${escapeHTML(emptyMessage)}</p>`;
  }

  showAssignmentDrill("cards");
}

function showAssignmentCards(strandIdx, subIdx) {
  const strand = activeClassData?.strands?.[strandIdx];
  const sub = strand?.subStrands?.[subIdx];
  if (!sub) return;

  renderAssignmentCards(
    `Class Assignments \u2022 ${sub.name}`,
    buildSubstrandAssignments(strand, sub),
    "No assignments available for this sub-strand yet."
  );
}

function showStrandCards(strandIdx) {
  const strand = activeClassData?.strands?.[strandIdx];
  if (!strand) return;

  const cards = (strand.subStrands || []).flatMap((sub) => buildSubstrandAssignments(strand, sub));

  renderAssignmentCards(
    `Class Assignments \u2022 ${strand.name}`,
    cards,
    "No assignments available for this strand yet."
  );
}

function showMixedCards(mixedIdx) {
  const mixed = activeClassData?.mixedExercises?.[mixedIdx];
  if (!mixed) return;

  renderAssignmentCards(
    `Class Assignments \u2022 ${mixed.name}`,
    [{
      id: `mixed-${mixedIdx}`,
      uid: "",
      name: mixed.name,
      subject: activeAssignmentCtx.subjectName,
      className: activeAssignmentCtx.className,
      created: "\u2014",
      skills: ["Mixed Exercise"],
    }],
    "No mixed exercises available yet."
  );
}

function openAssignmentDetail(id) {
  const a = activeSubstrandAssignments.find((x) => x.id === id);
  if (!a) return;

  const nameEl = $("#teacherAssignmentDetailName");
  if (nameEl) nameEl.textContent = "Assignment Deployment";

  const assignBtn = $("#teacherAssignToLearners");
  if (assignBtn) assignBtn.hidden = true;

  const metaEl = $("#teacherAssignmentDetailMeta");
  if (metaEl) {
    metaEl.innerHTML = `
      <section class="assignment-deploy-placeholder">
        <h3>${escapeHTML(a.name)}</h3>
        <p>This opens the assignment deployment flow. The backend can connect the real learner assignment screen here.</p>
      </section>
      `;
  }

  const fab = $("#teacherAssignFab");
  if (fab) {
    fab.dataset.deployAssign = a.name;
    fab.setAttribute("aria-label", `Assign ${a.name} to learners`);
  }

  showAssignmentDrill("detail");
}

/* assignment deployment modal */

let pendingDeployment = null;

// Single backend integration point. Replace the body of this function with the
// real API call (e.g. fetch("/api/assignments/deploy", {method:"POST", body}))
// and everything else keeps working unchanged.
function deployAssignmentAPI(payload) {
  console.info("deployAssignmentAPI", payload);
  return new Promise((resolve) => window.setTimeout(() => resolve({ ok: true }), 250));
}

function setDeployModalOpen(open) {
  const modal = $("#teacherDeployModal");
  if (!modal) return;
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("modal-open", open);
  if (open) setDeploySuccessState(false);
}

function setDeploySuccessState(success) {
  const fields = $("#teacherDeployFields");
  const actions = $("#teacherDeployActions");
  const done = $("#teacherDeploySuccess");
  if (fields) fields.hidden = success;
  if (actions) actions.hidden = success;
  if (done) done.hidden = !success;
}

function bindDeployModal() {
  const modal = $("#teacherDeployModal");
  if (!modal) return;

  $("#teacherAssignFab")?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    pendingDeployment = {
      assignment: btn.dataset.deployAssign || "",
      subjectId: activeAssignmentCtx.subjectId,
      classId: activeAssignmentCtx.classId,
    };
    const nameEl = $("#teacherDeployAssignmentName");
    if (nameEl) nameEl.textContent = pendingDeployment.assignment || "Set a deadline and add a note.";
    const deadline = $("#teacherDeployDeadline");
    const comment = $("#teacherDeployComment");
    if (deadline) deadline.value = "";
    if (comment) comment.value = "";
    setDeployModalOpen(true);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-deploy-close]")) {
      setDeployModalOpen(false);
    }
  });

  $("#teacherDeployOk")?.addEventListener("click", () => {
    const payload = {
      ...pendingDeployment,
      deadline: $("#teacherDeployDeadline")?.value || null,
      comment: $("#teacherDeployComment")?.value.trim() || "",
    };

    deployAssignmentAPI(payload)
      .then((result) => {
        if (!result?.ok) {
          notifyTeacher("Deployment failed. Try again.");
          return;
        }
        const note = $("#teacherDeploySuccessNote");
        if (note) {
          note.textContent = payload.deadline
            ? `${payload.assignment || "Assignment"} • due ${formatDate(payload.deadline)}`
            : payload.assignment || "Your learners can now see it.";
        }
        setDeploySuccessState(true);
        window.setTimeout(() => setDeployModalOpen(false), 1700);
      })
      .catch(() => notifyTeacher("Deployment failed. Try again."))
      .finally(() => {
        pendingDeployment = null;
      });
  });
}

function notifyTeacher(message) {
  let el = document.getElementById("teacherToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "teacherToast";
    el.className = "teacher-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 2800);
}


let assignmentsFeature;

/* klass page */

function renderClassPage(subjectId, classId) {
  const subject = teacherContext.subjects.find((s) => s.id === subjectId);
  const klass = getClassById(classId);

  const subjectName = subject?.name || "Subject";
  const className = klass?.name || "Class";
  const classTheme = klass?.theme || "grade-default";

  const titleEl = $("#teacherClassTitle");
  const subtitleEl = $("#teacherClassSubtitle");
  const pageEl = $("#teacherClassView");

  if (titleEl) titleEl.textContent = className;
  if (subtitleEl) subtitleEl.textContent = `${subjectName} \u2022 Class overview`;
  if (pageEl) pageEl.dataset.theme = classTheme;

  setBreadcrumb([
    { label: "Dashboard", nav: "dashboard" },
    { label: className },
  ]);

  activeClassData = getClassMock(subjectId, classId);
  activeAssignmentCtx = { subjectName, className, subjectId, classId: String(classId) };
  classAssignmentsPager.reset();
  showAssignmentDrill("list");

  renderClassStats(activeClassData.stats, activeClassData.assignments);
  renderClassAssignments(activeClassData.assignments);
  renderStrands(activeClassData.strands);
  renderMixed(activeClassData.mixedExercises);
  renderClassChart(activeClassData.performance);

  activateClassPanel("info");
  activateAssignmentSubPanel("strands");
}

/* student profile modal*/

function getStudentById(id) {
  return (teacherContext?.students || []).find(
    (s) => String(s.id) === String(id)
  );
}

function getStudentSubjects(student) {
  const subjectIds = getTeacherAssignments()//subjects the teacher teaches to this student's class.
    .filter((a) => Number(a.classId) === Number(student.classId))
    .map((a) => a.subjectId);

  return [...new Set(subjectIds)]
    .map((id) => teacherContext.subjects.find((s) => s.id === id)?.name)
    .filter(Boolean);
}

// resolve a subject the teacher teaches for a given class, so breadcrumb class links can jump straight to that class page.
function getSubjectIdForClass(classId) {
  const assignment = getTeacherAssignments().find(
    (a) => Number(a.classId) === Number(classId)
  );
  return assignment ? assignment.subjectId : null;
}

function openStudentProfile(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;
  location.hash = `view=student&studentId=${encodeURIComponent(student.id)}`;
}

function renderStudentProfilePage(studentId) {
  const profile = getStudentProfile(studentId);
  if (!profile) return null;

  const profileView = $("#teacherStudentProfileView");
  if (profileView) {
    const profileClass = getClassById(profile.classId);
    profileView.dataset.theme = profileClass?.theme || "grade-default";
  }

  const inviteOk = String(profile.invite).toLowerCase() === "accepted";
  const activeStatus = profile.status !== "pending";
  const nickname = profile.nickname ? ` (${profile.nickname})` : "";

  const nameEl = $("#profileName");
  if (nameEl) nameEl.textContent = profile.name;

  const heroSubEl = $("#profileSummary");
  if (heroSubEl) {
    const subjects = getStudentSubjects(profile).slice(0, 3).join(", ");
    heroSubEl.textContent = subjects
      ? `${profile.className} learner in ${subjects}.`
      : `${profile.name} is enrolled in ${profile.className}.`;
  }

  const classBadge = $("#profileClassBadge");
  if (classBadge) classBadge.textContent = profile.className;

  const inviteBadge = $("#profileInviteBadge");
  if (inviteBadge) {
    inviteBadge.textContent = `Invite ${profile.invite}`;
    inviteBadge.className = `profile-badge ${inviteOk ? "is-accepted" : "is-warning"}`;
  }

  const activeBadge = $("#profileActiveBadge");
  if (activeBadge) {
    activeBadge.textContent = activeStatus ? "Active" : "Pending";
    activeBadge.className = `profile-badge ${activeStatus ? "is-accepted" : "is-pending"}`;
  }

  const infoName = $("#profileInfoName");
  if (infoName) infoName.textContent = `${profile.name}${nickname}`;

  const guardian = $("#profileGuardian");
  if (guardian) guardian.textContent = profile.guardianName || "\u2014";

  const contact = $("#profileContact");
  if (contact) contact.textContent = profile.guardianContact || "\u2014";

  const className = $("#profileClassName");
  if (className) className.textContent = profile.className;

  const engagement = $("#profileEngagement");
  if (engagement) engagement.textContent = profile.engagement || "\u2014";

  const performance = $("#profilePerformance");
  if (performance) {
    performance.textContent = profile.performanceAverage == null ? "\u2014" : `${profile.performanceAverage}%`;
  }

  const bestSubject = $("#profileBestSubject");
  if (bestSubject) bestSubject.textContent = profile.strongestSubject || "\u2014";

  const perfBody = $("#profilePerformanceBody");
  if (perfBody) {
    const rows = profile.performance || [];
    perfBody.innerHTML = rows.length
      ? rows
        .map(
          (p) => `
        <tr>
          <td>
            <button type="button" class="profile-assignment-link" data-profile-assignment-open="${escapeHTML(p.uid)}">
              ${escapeHTML(p.name)}
            </button>
          </td>
          <td>${escapeHTML(p.subject)}</td>
          <td>${escapeHTML(p.attempts)}</td>
          <td>${escapeHTML(p.timeTaken || "\u2014")}</td>
          <td>${p.score == null ? "\u2014" : escapeHTML(p.score) + "%"}</td>
        </tr>`
        )
        .join("")
      : `<tr><td colspan="5" class="muted">No assignments deployed yet.</td></tr>`;
  }

  return profile;
}

/* routing*/

let currentNav = "dashboard";
const scrollPositions = new Map();
const bottomNav = $("#teacherBottomNav");
const bottomNavFloatIcon = $("#teacherBottomNav .nav-float-icon");

function saveScrollPosition() {
  scrollPositions.set(currentNav, window.scrollY || 0);
}

function restoreScrollPosition(name) {
  requestAnimationFrame(() => window.scrollTo({ top: scrollPositions.get(name) || 0, behavior: "auto" }));
}

function syncBottomNav(nav) {
  const active = $(`#teacherBottomNav [data-teacher-nav="${nav}"]`);
  if (!bottomNav || !active) return;
  bottomNav.style.setProperty("--active-index", active.dataset.navIndex || "0");
  if (bottomNavFloatIcon) bottomNavFloatIcon.innerHTML = active.querySelector(".nav-icon")?.innerHTML || "";
}

function addNavRipple(button, event) {
  const ripple = document.createElement("span");
  const rect = button.getBoundingClientRect();
  ripple.className = "nav-ripple";
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  button.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    if (!el) return;
    const isActive = key === name;
    el.classList.toggle("active", isActive);
    el.classList.toggle("view-entering", isActive);
    if (isActive) setTimeout(() => el.classList.remove("view-entering"), 380);
  });
  // the deployment FAB only belongs to the class view's detail drill
  if (name !== "class") syncAssignFab(false);
}

let routeTransitionId = 0;

function setViewLoading(name, loading) {
  const view = views[name];
  if (!view) return;
  view.classList.toggle("view-loading", loading);
  view.setAttribute("aria-busy", String(loading));
}

function transitionToView(name, render, options = {}) {
  const token = ++routeTransitionId;
  const useSkeleton = options.loading !== false;
  const delay = useSkeleton ? options.delay ?? 180 : 0;

  showView(name);

  if (!useSkeleton) {
    render?.();
    clearButtonLoading();
    restoreScrollPosition(options.scrollKey || name);
    return;
  }

  setViewLoading(name, true);

  window.setTimeout(() => {
    if (token !== routeTransitionId) return;
    render?.();

    requestAnimationFrame(() => {
      if (token !== routeTransitionId) return;
      setViewLoading(name, false);
      clearButtonLoading();
      restoreScrollPosition(options.scrollKey || name);
    });
  }, delay);
}

function setActiveNav(nav) {
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.teacherNav === nav);
  });
  syncBottomNav(nav);
}

function setBreadcrumb(trail) {//breadcrumb
  if (!breadcrumbEl) return;
  const items = Array.isArray(trail) ? trail : [{ label: trail }];
  breadcrumbEl.innerHTML = items
    .map((item, i) => {
      const sep =
        i > 0 ? `<span class="breadcrumb-sep" aria-hidden="true">/</span>` : "";
      const isLast = i === items.length - 1;
      const clickable = !isLast && (item.nav || item.classId != null);
      if (!clickable) {
        return `${sep}<span class="current">${escapeHTML(item.label)}</span>`;
      }
      const attr =
        item.nav != null
          ? `data-crumb-nav="${escapeHTML(item.nav)}"`
          : `data-crumb-class="${escapeHTML(item.classId)}"`;
      return `${sep}<button type="button" class="crumb" ${attr}>${escapeHTML(item.label)}</button>`;
    })
    .join("");
}


function buildStudentsRouteParams() {
  const params = new URLSearchParams();
  params.set("view", "students");
  if (studentSearch) params.set("q", studentSearch);
  if (studentGroupFilter !== "all") params.set("group", studentGroupFilter);
  if (studentGradeFilter !== "all") params.set("classId", String(studentGradeFilter));
  return params;
}

function updateStudentsRouteState() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  if ((params.get("view") || currentNav) !== "students") return;
  history.replaceState(null, "", `#${buildStudentsRouteParams().toString()}`);
}

function navigateToHash(params) {
  const nextHash = `#${params.toString()}`;
  if (location.hash === nextHash) {
    handleRoute();
    return;
  }
  location.hash = nextHash;
}

function handleRoute() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const backBtn = $("#teacherClassBack");

  const view = params.get("view") || currentNav;

  if (view === "dashboard") {
    currentNav = "dashboard";
    if (backBtn) {
      backBtn.hidden = true;
      backBtn.dataset.backTo = "";
    }
    setActiveNav("dashboard");
    setBreadcrumb("Dashboard");
    transitionToView("dashboard", null, { loading: false });
    return;
  }

  if (view === "students") {
    currentNav = "students";
    studentSearch = params.get("q") || "";
    studentGroupFilter = params.get("group") || "all";
    studentGradeFilter = params.get("classId") || "all";
    if (studentGradeFilter !== "all") studentGroupFilter = getClassGroupName(studentGradeFilter);
    studentsPager.reset();
    const searchInput = $("#studentSearchInput");
    if (searchInput && searchInput.value !== studentSearch) searchInput.value = studentSearch;
    if (backBtn) {
      backBtn.hidden = false;
      backBtn.dataset.backTo = "dashboard";
    }
    setActiveNav("students");
    setBreadcrumb([
      { label: "Dashboard", nav: "dashboard" },
      { label: "Students" },
    ]);
    transitionToView("students", renderStudents);
    return;
  }

  if (view === "assignments") {
    currentNav = "assignments";
    if (backBtn) {
      backBtn.hidden = false;
      backBtn.dataset.backTo = "dashboard";
    }
    setActiveNav("assignments");
    setBreadcrumb([
      { label: "Dashboard", nav: "dashboard" },
      { label: "Assignments" },
    ]);
    transitionToView("assignments", () => assignmentsFeature?.renderList());
    return;
  }

  if (view === "class" && params.get("classId")) {
    currentNav = "class";
    setActiveNav(null);
    const cls = getClassById(params.get("classId"));
    setBreadcrumb([
      { label: "Dashboard", nav: "dashboard" },
      { label: cls ? cls.name : "Class" },
    ]);
    if (backBtn) {
      backBtn.hidden = false;
      backBtn.dataset.backTo = "dashboard";
    }
    transitionToView("class", () => renderClassPage(params.get("subjectId"), params.get("classId")));
    return;
  }

  if (view === "student" && params.get("studentId")) {
    currentNav = "studentProfile";
    const profilePreview = getStudentProfile(params.get("studentId"));
    setActiveNav("students");
    setBreadcrumb([
      { label: "Dashboard", nav: "dashboard" },
      { label: profilePreview ? profilePreview.className : "Class", classId: profilePreview ? profilePreview.classId : null },
      { label: profilePreview ? profilePreview.name : "Student" },
    ]);
    if (backBtn) {
      backBtn.hidden = false;
      backBtn.dataset.backTo = "students";
    }
    transitionToView("studentProfile", () => {
      const profile = renderStudentProfilePage(params.get("studentId"));
      setBreadcrumb([
        { label: "Dashboard", nav: "dashboard" },
        { label: profile ? profile.className : "Class", classId: profile ? profile.classId : null },
        { label: profile ? profile.name : "Student" },
      ]);
    });
    return;
  }

  if (view === "assignment" && params.get("assignmentId")) {
    currentNav = "assignments";
    setActiveNav("assignments");
    setBreadcrumb([
      { label: "Dashboard", nav: "dashboard" },
      { label: "Assignments", nav: "assignments" },
      { label: "Assignment" },
    ]);
    if (backBtn) {
      backBtn.hidden = false;
      backBtn.dataset.backTo = "assignments";
    }
    transitionToView("assignments", () => {
      const row = assignmentsFeature?.renderDetail(params.get("assignmentId"));
      const panel = params.get("panel");
      if (panel) assignmentsFeature?.activateDetailPanel(panel);
      setBreadcrumb([
        { label: "Dashboard", nav: "dashboard" },
        { label: "Assignments", nav: "assignments" },
        { label: row ? row.name : "Assignment" },
      ]);
    });
    return;
  }

  if (backBtn) {
    backBtn.hidden = true;
    backBtn.dataset.backTo = "";
  }
  setActiveNav(currentNav);
  setBreadcrumb(NAV_LABELS[currentNav] || "Dashboard");
  transitionToView(currentNav, () => {
    if (currentNav === "students") renderStudents();
    if (currentNav === "assignments") assignmentsFeature?.renderList();
  }, { loading: false });
}

function goToNav(nav) {
  saveScrollPosition();
  currentNav = NAV_LABELS[nav] ? nav : "dashboard";
  if (currentNav === "students") {
    navigateToHash(buildStudentsRouteParams());
    return;
  }

  const params = new URLSearchParams();
  params.set("view", currentNav);
  navigateToHash(params);
}

function bindNav() {
  navButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      if (btn.closest("#teacherBottomNav")) addNavRipple(btn, event);
      runButtonAction(btn, () => goToNav(btn.dataset.teacherNav), 90);
    });
  });

  $("#teacherClassBack")?.addEventListener("click", () => {
    const btn = $("#teacherClassBack");
    // real browser back so the user returns exactly where they were;
    // if there is no in-app history (fresh tab / deep link) fall back
    // to the view this page belongs under.
    const fallback = btn?.dataset.backTo || "dashboard";
    const hashBefore = location.hash;
    runButtonAction(btn, () => {
      history.back();
      window.setTimeout(() => {
        if (location.hash === hashBefore) goToNav(fallback);
      }, 180);
    }, 90);
  });

  $("#profilePerformanceBody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-profile-assignment-open]");
    if (btn) runButtonAction(btn, () => assignmentsFeature?.openDetail(btn.dataset.profileAssignmentOpen));
  });

  breadcrumbEl?.addEventListener("click", (e) => {
    const navCrumb = e.target.closest("[data-crumb-nav]");
    if (navCrumb) {
      goToNav(navCrumb.dataset.crumbNav);
      return;
    }
    const classCrumb = e.target.closest("[data-crumb-class]");
    if (classCrumb) {
      const classId = classCrumb.dataset.crumbClass;
      const subjectId = getSubjectIdForClass(classId);
      if (subjectId != null) {
        location.hash = `view=class&subjectId=${encodeURIComponent(subjectId)}&classId=${encodeURIComponent(classId)}`;
      } else {
        studentGradeFilter = classId;
        studentGroupFilter = getClassGroupName(classId);
        goToNav("students");
      }
    }
  });

  window.addEventListener("hashchange", handleRoute);
}

/* logout & subject cards*/

function bindSubjectCards() {
  subjectsGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".subject-card");
    if (!card) return;
    const subjectId = card.dataset.subject;
    if (subjectId) {
      runButtonAction(card, () => {
        selectClassModalApi.openSelectClass(subjectId);
        clearButtonLoading();
      });
    }
  });
}

function bindLogout() {
  ["#teacherLogoutBtn", "#teacherMobileLogoutBtn"].forEach((sel) => {
    $(sel)?.addEventListener("click", () => {
      // no auth backend in this prototype; send the user back to the dashboard.
      goToNav("dashboard");
    });
  });
}

function bindSidebarToggle() {
  const app = $("#teacherApp") || document.querySelector(".teacher-app");
  const toggle = $("#sidebarToggleBtn");
  if (!app || !toggle) return;

  const apply = (collapsed) => {
    app.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    $$(".sidebar .nav-item, .sidebar-footer .logout").forEach((btn) => {
      const label = btn.querySelector("span:not(.nav-icon)")?.textContent.trim() || "";
      if (collapsed) btn.setAttribute("title", label);
      else btn.removeAttribute("title");
    });
  };

  apply(localStorage.getItem("teacher.sidebar-collapsed") === "1");

  toggle.addEventListener("click", () => {
    const collapsed = !app.classList.contains("sidebar-collapsed");
    localStorage.setItem("teacher.sidebar-collapsed", collapsed ? "1" : "0");
    apply(collapsed);
  });
}

function bindSwitchAdmin() {
  ["#teacherSwitchAdminBtn", "#teacherMobileSwitchAdminBtn"].forEach((sel) => {
    $(sel)?.addEventListener("click", () => {
      window.location.href = "../e-academy-admin-main/e-academy-admin-main/index.html";
    });
  });
}

function initializeTeacherDashboard() {
  renderTeacherName();
  renderTeacherTotals();
  renderSubjects();

  bindSubjectCards();
  bindNav();
  bindStudentControls();
  assignmentsFeature = createAssignmentsFeature({
    $,
    $$,
    teacherContext,
    getTeacherAssignments,
    getClassMock,
    getClassName,
    getSubjectName,
    escapeHTML,
    formatDate,
    openStudentProfile,
    goToNav,
  });
  assignmentsFeature.bind();
  bindClassPanels();
  bindAccordions();
  bindDeployModal();
  bindLogout();
  bindSidebarToggle();
  bindSwitchAdmin();

  handleRoute();
}

initializeTeacherDashboard();
