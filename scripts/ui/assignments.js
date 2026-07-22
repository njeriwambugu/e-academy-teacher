
import { runButtonAction } from "../utils/ui-state.js";
import { createPager } from "../utils/table-utils.js";

function hashString(value = "") {
  return String(value).split("").reduce((sum, char) => {
    return (sum * 31 + char.charCodeAt(0)) >>> 0;
  }, 7);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// table-friendly "3m 45s" style because if i used 3.45 it would have been confusing...
function formatMinutes(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function debounce(fn, delay = 120) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function toAssignmentUid({ subjectId, classId, assignmentId }) {
  return `${subjectId}::${classId}::${assignmentId}`;
}

function classParts(klass, fallback = "Class") {
  const group = klass?.group || fallback;
  const stream = String(klass?.name || fallback).replace(group, "").trim() || klass?.name || group;
  return { group, stream };
}

export function createAssignmentsFeature(deps) {
  const {
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
  } = deps;

  const filters = {
    search: "",
    branch: "",
    subjectId: "",
    classGroup: "",
    classId: "",
    status: "",
    date: "", 
  };

  let currentDetailPanel = "overview";
  let allRowsCache = null;
  let rowByIdCache = null;
  let lastDetailUid = null;
  let learnerSort = null; // { type: "column", key: "score"|"secondsTaken"|"status", dir: 1|-1 } or { type: "status", key }

  const listPager = createPager({
    container: "#assignmentsPagination",
    onPageChange: () => renderList(),
  });
  const learnersPager = createPager({
    container: "#learnersPagination",
    onPageChange: () => { if (lastDetailUid) renderDetail(lastDetailUid); },
  });

  function invalidateCache() {
    allRowsCache = null;
    rowByIdCache = null;
  }

  function getAllRows() {
    if (allRowsCache) return allRowsCache;

    allRowsCache = getTeacherAssignments().flatMap((teachingAssignment) => {
      const subjectId = teachingAssignment.subjectId;
      const classId = String(teachingAssignment.classId);
      const subjectName = getSubjectName(subjectId);
      const className = getClassName(classId);
      const classData = getClassMock(subjectId, classId);
      const klass = (teacherContext?.classes || []).find((c) => String(c.id) === String(classId));
      const { group: classGroup, stream: classStream } = classParts(klass, className);

      return (classData.assignments || []).map((assignment) => {
        const strand = assignment.strand || "Mixed Exercise";
        return {
          ...assignment,
          uid: toAssignmentUid({ subjectId, classId, assignmentId: assignment.id }),
          subjectId,
          classId,
          subjectName,
          className,
          classGroup,
          classStream,
          strand,
          skills: strand.includes(" - ") ? strand.split(" - ").slice(1).join(" - ") : strand,
          classData,
        };
      });
    });

    rowByIdCache = new Map(allRowsCache.map((row) => [row.uid, row]));
    return allRowsCache;
  }

  function getRowByUid(uid) {
    getAllRows();
    return rowByIdCache?.get(uid) || null;
  }

  function getVisibleRows() {
    const search = filters.search.toLowerCase();
    return getAllRows().filter((row) => {
      if (filters.subjectId && row.subjectId !== filters.subjectId) return false;
      if (filters.classGroup && row.classGroup !== filters.classGroup) return false;
      if (filters.classId && String(row.classId) !== String(filters.classId)) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (filters.date && String(row.deployed).slice(0, 10) !== filters.date) return false;
      if (!search) return true;
      return [row.name, row.subjectName, row.className, row.classGroup, row.classStream, row.strand, row.status]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }

  function uniqueOptions(rows, key, label = key) {
    return uniqueBy(rows, (row) => row[key])
      .filter((row) => row[key])
      .map((row) => ({ value: row[key], label: row[label] || row[key] }));
  }

  function setBranch(branch) {
    Object.assign(filters, { branch, subjectId: "", classGroup: "", classId: "", status: "", date: "" });
  }

  function setCrumb(level) {
    if (level === "all") return setBranch("");
    if (["subject", "class", "status", "date"].includes(level)) return setBranch(level);
    if (level === "classGroup") Object.assign(filters, { classId: "" });
  }

  function chooseFilter(value) {
    if (!filters.branch) return setBranch(value);
    if (filters.branch === "subject") filters.subjectId = value;
    if (filters.branch === "class") filters.classGroup ? filters.classId = value : filters.classGroup = value;
    if (filters.branch === "status") filters.status = value;
  }

  function currentFilterOptions(rows) {
    if (!filters.branch) return [
      { value: "subject", label: "Subject" },
      { value: "class", label: "Class" },
      { value: "status", label: "Status" },
      { value: "date", label: "Date" },
    ];
    if (filters.branch === "subject") return uniqueOptions(rows, "subjectId", "subjectName");
    if (filters.branch === "class" && !filters.classGroup) return uniqueOptions(rows, "classGroup");
    if (filters.branch === "class" && !filters.classId) {
      return uniqueOptions(rows.filter((r) => r.classGroup === filters.classGroup), "classId", "classStream");
    }
    if (filters.branch === "status") return uniqueOptions(rows, "status");
    return [];
  }

  function currentLevelLabel() {
    if (!filters.branch) return "Filter";
    if (filters.branch === "subject") return filters.subjectId ? getSubjectName(filters.subjectId) : "Subject";
    if (filters.branch === "class") {
      if (filters.classId) return getAllRows().find((r) => r.classId === filters.classId)?.classStream || "Stream";
      return filters.classGroup || "Class";
    }
    if (filters.branch === "status") return filters.status || "Status";
    if (filters.branch === "date") return filters.date ? formatDate(filters.date) : "Date";
    return "Filter";
  }

  function crumbItems() {
    const items = [{ key: "all", label: "All" }];
    if (!filters.branch) return items;
    items.push({ key: filters.branch, label: filters.branch[0].toUpperCase() + filters.branch.slice(1) });
    if (filters.branch === "subject" && filters.subjectId) items.push({ key: "subjectValue", label: getSubjectName(filters.subjectId) });
    if (filters.branch === "class" && filters.classGroup) items.push({ key: "classGroup", label: filters.classGroup });
    if (filters.branch === "class" && filters.classId) items.push({ key: "classValue", label: getAllRows().find((r) => r.classId === filters.classId)?.classStream || getAllRows().find((r) => r.classId === filters.classId)?.className || "Stream" });
    if (filters.branch === "status" && filters.status) items.push({ key: "statusValue", label: filters.status });
    if (filters.branch === "date" && filters.date) items.push({ key: "dateValue", label: formatDate(filters.date) });
    return items;
  }

  function renderFilterControls(allRows) {
    const label = $("#assignmentLevelLabel");
    const menu = $("#assignmentLevelMenu");
    const crumbs = $("#assignmentFilterCrumbs");
    if (label) label.textContent = currentLevelLabel();
    if (menu) {
      if (filters.branch === "date") {
        menu.innerHTML = `
          <div class="level-menu-date">
            <span class="level-menu-date-label">Deployed on</span>
            <input type="date" id="assignmentDateFilter" value="${escapeHTML(filters.date)}" aria-label="Filter assignments by deployed date" />
            ${filters.date ? `<button type="button" class="level-menu-date-clear" data-date-clear>Clear date</button>` : ""}
          </div>`;
      } else {
        const options = currentFilterOptions(allRows);
        menu.innerHTML = options.length
          ? options.map((opt) => `<button type="button" role="menuitem" data-tree-filter="${escapeHTML(opt.value)}">${escapeHTML(opt.label)}</button>`).join("")
          : `<p class="muted">No deeper options.</p>`;
      }
    }
    if (crumbs) {
      crumbs.innerHTML = crumbItems().map((item, index, arr) => `
        <button type="button" data-filter-crumb="${escapeHTML(item.key)}" ${index === arr.length - 1 ? 'aria-current="page"' : ""}>${escapeHTML(item.label)}</button>
        ${index < arr.length - 1 ? `<span aria-hidden="true">›</span>` : ""}`).join("");
    }
  }

  function renderList() {
    const listView = $("#teacherAssignmentsListView");
    const detailView = $("#teacherAssignmentProfile");
    if (listView) listView.hidden = false;
    if (detailView) detailView.hidden = true;

    const allRows = getAllRows();
    let visibleRows = getVisibleRows();

    renderFilterControls(allRows);
    visibleRows = getVisibleRows();

    const meta = $("#assignmentResultsMeta");
    if (meta) {
      const total = allRows.length;
      meta.textContent = `${visibleRows.length} of ${total} deployed assignment${total === 1 ? "" : "s"}`;
    }

    const body = $("#teacherAssignmentsBody");
    if (!body) return;

    if (!visibleRows.length) {
      body.innerHTML = `<tr><td colspan="5" class="muted">No assignments match your filters.</td></tr>`;
      listPager.paginate(visibleRows);
      listPager.renderControls();
      return;
    }

    const pageRows = listPager.paginate(visibleRows);
    body.innerHTML = pageRows.map((row) => `
        <tr>
          <td>
            <button type="button" class="assignment-name-link" data-assignment-open="${escapeHTML(row.uid)}">
              <strong>${escapeHTML(row.name)}</strong>
            </button>
          </td>
          <td>${row.average == null ? "\u2014" : escapeHTML(row.average + "%")}</td>
          <td class="col-wide">${escapeHTML(row.subjectName)}</td>
          <td class="col-wide">${escapeHTML(row.className)}</td>
          <td class="col-wide">${escapeHTML(`${row.completed}/${row.total}`)}</td>
        </tr>`).join("");
    listPager.renderControls();
  }

  //force tied extremes on Whole Numbers Practice 1 (Grade 9 North) so the "N Students"  grouping has real ties to show 
  const TIE_TEST_OVERRIDES = {
    "MAT::12::MAT-0-0": {
      1014: { score: 92, seconds: 95 },  // Sharon Cheruiyot
      1015: { score: 92, seconds: 95 },  // Caleb Mutua
      1016: { score: 92, seconds: 95 },  // Grace Naliaka
      1017: { score: 92, seconds: 130 }, // Eric Kiplangat
      1018: { score: 92, seconds: 170 }, // Faith Nyambura
      1019: { score: 45, seconds: 210 }, // Abel Musyoka
      1020: { score: 45, seconds: 260 }, // Christine Atieno
      1021: { score: 68, seconds: 260 }, // John Mwenda
      1024: { score: 79, seconds: 260 }, // Amani Yusuf
    },
  };

  function getLearnerRows(row) {
    const students = row.classData?.students || [];
    const completionPct = row.total ? row.completed / row.total : 0;
    const completedCount = Math.min(students.length, Math.round(students.length * completionPct));
    const tieOverrides = TIE_TEST_OVERRIDES[row.uid];

    return students.map((student, index) => {
      const override = tieOverrides?.[student.id];
      const seed = hashString(`${row.uid}:${student.id}`);
      const completed = override ? true : index < completedCount;
      const scoreBase = row.average == null ? 72 : Number(row.average);
      const score = override ? override.score : completed ? Math.max(35, Math.min(100, scoreBase + (seed % 19) - 9)) : null;
      const seconds = override ? override.seconds : completed ? 72 + (seed % 190) : null;
      //states: completed (green) / retake (red) for attempted work, ongoing (blue) / not started (grey) for the rest.
      let status;
      let statusClass;
      if (completed) {
        const needsRetake = score < 55;//change the score for retake
        status = needsRetake ? "Retake" : "Completed";
        statusClass = needsRetake ? "retake" : "completed";
      } else {
        const ongoing = seed % 2 === 0;
        status = ongoing ? "Ongoing" : "Not Started";
        statusClass = ongoing ? "ongoing" : "not-started";
      }

      return {
        ...student,
        completed,
        status,
        statusClass,
        score,
        secondsTaken: seconds,
        timeTaken: seconds == null ? null : formatMinutes(seconds),
      };
    });
  }

  function sortLearnerRows(rows) {
    if (!learnerSort) return rows;
    if (learnerSort.type === "status") {
      return [...rows].sort((a, b) => (a.statusClass === learnerSort.key ? 0 : 1) - (b.statusClass === learnerSort.key ? 0 : 1));
    }
    const { key, dir } = learnerSort;
    return [...rows].sort((a, b) => {
      const av = key === "status" ? a.status : a[key];
      const bv = key === "status" ? b.status : b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls (not started/ongoing) always sink to the bottom
      if (bv == null) return -1;
      return typeof av === "string" ? av.localeCompare(bv) * dir : (av - bv) * dir;
    });
  }

  function toggleColumnSort(key) {
    const firstDir = key === "status" ? 1 : -1; // numeric columns lead with highest/slowest first
    if (learnerSort?.type === "column" && learnerSort.key === key) {
      learnerSort = { type: "column", key, dir: -learnerSort.dir };
    } else {
      learnerSort = { type: "column", key, dir: firstDir };
    }
  }

  function toggleStatusSort(key) {
    learnerSort = learnerSort?.type === "status" && learnerSort.key === key ? null : { type: "status", key };
  }

  function updateLearnerSortUI() {
    document.querySelectorAll(".assignment-students-table [data-sort-key]").forEach((btn) => {
      const active = learnerSort?.type === "column" && learnerSort.key === btn.dataset.sortKey;
      btn.classList.toggle("is-sorted", active);
      btn.classList.toggle("is-asc", active && learnerSort.dir === 1);
      btn.classList.toggle("is-desc", active && learnerSort.dir === -1);
    });
    document.querySelectorAll("#learnersStatusKey [data-status-sort]").forEach((btn) => {
      btn.classList.toggle("is-active-filter", learnerSort?.type === "status" && learnerSort.key === btn.dataset.statusSort);
    });
  }

  function activateDetailPanel(panel) {
    currentDetailPanel = panel || "overview";
    $$("#assignmentDetailSegments [data-assignment-detail-panel]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.assignmentDetailPanel === currentDetailPanel);
    });
    $$("[data-assignment-detail-content]").forEach((content) => {
      content.classList.toggle("active", content.dataset.assignmentDetailContent === currentDetailPanel);
    });

    // keep the active panel in the hash so a refresh restores it
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (params.get("view") === "assignment" && params.get("panel") !== currentDetailPanel) {
      params.set("panel", currentDetailPanel);
      history.replaceState(null, "", `#${params.toString()}`);
    }
  }

  function openDetail(uid) {
    location.hash = `view=assignment&assignmentId=${encodeURIComponent(uid)}`;
  }

  function scoreTone(score) {
    if (score == null) return { status: "Pending", color: "#6B7280", gradient: "linear-gradient(90deg,#9CA3AF,#6B7280)" };
    if (score < 40) return { status: "Needs Improvement", color: "#EF4444", gradient: "linear-gradient(90deg,#FCA5A5,#EF4444)" };
    if (score < 60) return { status: "Fair", color: "#F97316", gradient: "linear-gradient(90deg,#FDBA74,#F97316)" };
    if (score < 70) return { status: "Satisfactory", color: "#F59E0B", gradient: "linear-gradient(90deg,#FDE68A,#F59E0B)" };
    if (score < 85) return { status: "Good", color: "#14B8A6", gradient: "linear-gradient(90deg,#5EEAD4,#14B8A6)" };
    return { status: "Excellent", color: "#10B981", gradient: "linear-gradient(90deg,#6EE7B7,#10B981)" };
  }

  function paceLabel(seconds) {
    if (!seconds) return { text: "Average Pace", color: "#14B8A6" };
    if (seconds <= 150) return { text: "Faster than average", color: "#10B981" };
    if (seconds <= 240) return { text: "Average Pace", color: "#14B8A6" };
    return { text: "Needs Improvement", color: "#F59E0B" };
  }

  function donutRing({ id, value, color, centerHTML, sublineHTML, ariaLabel }) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    return `
      <div class="score-ring-variant" style="--target:${escapeHTML(safeValue)}; --metric-color:${escapeHTML(color)};" aria-label="${escapeHTML(ariaLabel)}">
        <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="${escapeHTML(id)}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="${escapeHTML(color)}" stop-opacity=".62" />
              <stop offset="100%" stop-color="${escapeHTML(color)}" />
            </linearGradient>
          </defs>
          <circle class="score-ring-track" cx="60" cy="60" r="48"></circle>
          <circle class="score-ring-dots" cx="60" cy="60" r="37"></circle>
          <circle class="score-ring-progress" cx="60" cy="60" r="48" stroke="url(#${escapeHTML(id)})"></circle>
        </svg>
        <span class="score-ring-center">
          <strong>${centerHTML}</strong>
          <span class="score-ring-subline">${sublineHTML}</span>
        </span>
      </div>`;
  }

  function animateMetricCards(root) {
    if (!root) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    root.querySelectorAll("[data-count-to]").forEach((node) => {
      const target = Number(node.dataset.countTo) || 0;
      if (reduce) {
        node.textContent = Math.round(target);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 780);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    root.querySelectorAll("[data-count-duration]").forEach((node) => {
      const target = Number(node.dataset.countDuration) || 0;
      if (reduce || !target) {
        node.textContent = formatDuration(target);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 780);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = formatDuration(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    requestAnimationFrame(() => root.classList.add("is-ready"));
  }

  function renderMetricPills({ score, time, completed, total, avgSeconds = 0 }) {
    const el = $("#assignmentInsightPills");
    if (!el) return;
    const scoreValue = score == null ? 0 : Number(score);
    const completionPct = total ? Math.round((completed / total) * 100) : 0;
    const remaining = Math.max(0, total - completed);
    const tone = scoreTone(score);
    const pace = paceLabel(avgSeconds);
    const timePct = avgSeconds ? Math.min(100, Math.round((avgSeconds / 300) * 100)) : 0;
    el.className = "assignment-insight-pills analytics-capsules";
    el.innerHTML = `
      <article class="analytics-card score-card" tabindex="0" style="--metric-color:${escapeHTML(tone.color)};">
        ${donutRing({
          id: "donutScore",
          value: scoreValue,
          color: tone.color,
          centerHTML: `<span data-count-to="${escapeHTML(scoreValue)}">0</span><em>%</em>`,
          sublineHTML: escapeHTML(tone.status),
          ariaLabel: `Score average ${scoreValue} percent, ${tone.status}`,
        })}
        <span class="analytics-title">Score Average</span>
        <span class="analytics-status" style="color:${escapeHTML(tone.color)}">${escapeHTML(tone.status)}</span>
      </article>
      <article class="analytics-card time-card" tabindex="0" style="--metric-color:${escapeHTML(pace.color)};">
        ${donutRing({
          id: "donutTime",
          value: timePct,
          color: pace.color,
          centerHTML: avgSeconds
            ? `<span class="timer-value" data-count-duration="${escapeHTML(avgSeconds)}">00:00:00</span>`
            : `<span class="timer-value">—</span>`,
          sublineHTML: escapeHTML(pace.text),
          ariaLabel: `Average time ${time || "not available"}, ${pace.text}`,
        })}
        <span class="analytics-title">Average Time</span>
        <span class="analytics-status" style="color:${escapeHTML(pace.color)}">${escapeHTML(pace.text)}</span>
      </article>
      <article class="analytics-card completion-card" tabindex="0" style="--metric-color:#10B981;">
        ${donutRing({
          id: "donutCompletion",
          value: completionPct,
          color: "#10B981",
          centerHTML: `<span data-count-to="${escapeHTML(completionPct)}">0</span><em>%</em>`,
          sublineHTML: `<b><span data-count-to="${escapeHTML(completed)}">0</span></b>/${escapeHTML(total)} completed`,
          ariaLabel: `Completion ${completed} of ${total}, ${completionPct} percent`,
        })}
        <span class="analytics-title">Completion Rate</span>
        <span class="analytics-status">${escapeHTML(remaining)} assignment${remaining === 1 ? "" : "s"} remaining</span>
      </article>`;
    animateMetricCards(el);
  }

  function renderDetail(uid) {
    const row = getRowByUid(uid);
    if (!row) {
      renderList();
      return null;
    }

    if (uid !== lastDetailUid) {
      learnersPager.reset();
      lastDetailUid = uid;
    }

    const listView = $("#teacherAssignmentsListView");
    const detailView = $("#teacherAssignmentProfile");
    if (listView) listView.hidden = true;
    if (detailView) detailView.hidden = false;

    const completionPct = row.total ? Math.round((row.completed / row.total) * 100) : 0;
    const learnerRows = getLearnerRows(row);
    const completedLearners = learnerRows.filter((student) => student.completed);
    const avgSeconds = completedLearners.length
      ? Math.round(completedLearners.reduce((sum, student) => sum + (student.secondsTaken || 0), 0) / completedLearners.length)
      : 0;

    const title = $("#assignmentProfileTitle");
    if (title) title.textContent = row.name;
    const subtitle = $("#assignmentProfileSubtitle");
    if (subtitle) subtitle.textContent = `${row.subjectName} \u2022 ${row.className} \u2022 ${row.strand}`;
    const status = $("#assignmentProfileStatus");
    if (status) {
      status.textContent = row.status;
      status.className = `student-status ${row.status === "Active" ? "active" : "pending"}`;
    }

    renderMetricPills({
      score: row.average,
      time: completedLearners.length ? formatDuration(avgSeconds) : "",
      completed: row.completed,
      total: row.total,
      avgSeconds,
    });

    const metaRows = [
      { label: "Assignment Name", value: row.name },
      { label: "Subject", value: row.subjectName },
      { label: "Class", value: row.className },
      { label: "Date Deployed", value: formatDate(row.deployed) },
      { label: "Strand / Skill", value: row.strand },
      { label: "Completion", value: `${row.completed}/${row.total} (${completionPct}%)` },
    ];
    const meta = $("#assignmentProfileMeta");
    if (meta) {
      meta.innerHTML = metaRows.map((item) => `
        <div class="assignment-meta-row">
          <span class="assignment-meta-label">${escapeHTML(item.label)}</span>
          <span class="assignment-meta-value">${escapeHTML(item.value)}</span>
        </div>`).join("");
    }

    const learnerCount = $("#assignmentLearnerCount");
    if (learnerCount) learnerCount.textContent = `${completedLearners.length}/${learnerRows.length} completed`;

    renderHighlights(row, completedLearners);

    const studentBody = $("#assignmentStudentsBody");
    if (studentBody) {
      const pageLearners = learnersPager.paginate(sortLearnerRows(learnerRows));
      studentBody.innerHTML = learnerRows.length
        ? pageLearners.map((student) => `
          <tr>
            <td>
              <button type="button" class="student-name-btn" data-student-id="${escapeHTML(student.id)}">
                <i class="learner-dot ${escapeHTML(student.statusClass)}" aria-hidden="true"></i>
                <span class="student-info"><strong>${escapeHTML(student.name)}</strong></span>
              </button>
            </td>
            <td class="learner-status-col"><span class="student-status ${escapeHTML(student.statusClass)}">${escapeHTML(student.status)}</span></td>
            <td>${student.score == null ? "\u2014" : escapeHTML(student.score + "%")}</td>
            <td>${escapeHTML(student.timeTaken || "\u2014")}</td>
          </tr>`).join("")
        : `<tr><td colspan="4" class="muted">No learners found for this class.</td></tr>`;
      learnersPager.renderControls();
      updateLearnerSortUI();
    }

    activateDetailPanel(currentDetailPanel);
    return row;
  }

  function bind() {
    const levelButton = $("#assignmentLevelButton");
    const levelMenu = $("#assignmentLevelMenu");
    const applySearch = debounce((value) => {
      filters.search = value.trim();
      listPager.reset();
      renderList();
    });

    $("#assignmentSearchInput")?.addEventListener("input", (e) => applySearch(e.target.value));

    levelButton?.addEventListener("click", () => {
      const open = !levelMenu?.classList.contains("open");
      levelMenu?.classList.toggle("open", open);
      levelButton.setAttribute("aria-expanded", String(open));
    });

    levelMenu?.addEventListener("click", (e) => {
      const clearBtn = e.target.closest("[data-date-clear]");
      if (clearBtn) {
        filters.date = "";
        listPager.reset();
        renderList();
        // keep the calendar visible so another date can be picked
        levelMenu.classList.add("open");
        levelButton?.setAttribute("aria-expanded", "true");
        return;
      }

      const item = e.target.closest("[data-tree-filter]");
      if (!item) return;
      chooseFilter(item.dataset.treeFilter);
      listPager.reset();
      renderList();

      const keepOpen = filters.branch === "date" && !filters.date;
      levelMenu.classList.toggle("open", keepOpen);
      levelButton?.setAttribute("aria-expanded", String(keepOpen));
    });

    levelMenu?.addEventListener("change", (e) => {
      if (e.target?.id !== "assignmentDateFilter") return;
      filters.date = e.target.value || "";
      listPager.reset();
      levelMenu.classList.remove("open");
      levelButton?.setAttribute("aria-expanded", "false");
      renderList();
    });

    $("#assignmentFilterCrumbs")?.addEventListener("click", (e) => {
      const crumb = e.target.closest("[data-filter-crumb]");
      if (!crumb || crumb.hasAttribute("aria-current")) return;
      setCrumb(crumb.dataset.filterCrumb);
      listPager.reset();
      renderList();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".assignment-level-picker")) {
        levelMenu?.classList.remove("open");
        levelButton?.setAttribute("aria-expanded", "false");
      }
    });

    $("#teacherAssignmentsBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-assignment-open]");
      if (btn) runButtonAction(btn, () => openDetail(btn.dataset.assignmentOpen));
    });

    $("#assignmentDetailSegments")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-assignment-detail-panel]");
      if (btn) activateDetailPanel(btn.dataset.assignmentDetailPanel);
    });

    $("#assignmentStudentsBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-student-id]");
      if (btn) runButtonAction(btn, () => openStudentProfile(btn.dataset.studentId));
    });

    $(".assignment-students-table")?.addEventListener("click", (e) => {
      const sortBtn = e.target.closest("[data-sort-key]");
      if (!sortBtn) return;
      toggleColumnSort(sortBtn.dataset.sortKey);
      learnersPager.reset();
      if (lastDetailUid) renderDetail(lastDetailUid);
    });

    $("#learnersStatusKey")?.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-status-sort]");
      if (!pill) return;
      toggleStatusSort(pill.dataset.statusSort);
      learnersPager.reset();
      if (lastDetailUid) renderDetail(lastDetailUid);
    });
  }

  function renderHighlights(row, completedLearners) {
    const el = $("#assignmentHighlights");
    if (!el) return;

    if (!completedLearners.length) {
      el.innerHTML = `<p class="muted">Highlights appear once learners complete this assignment.</p>`;
      return;
    }

    const byScore = [...completedLearners].sort((a, b) => b.score - a.score);
    const byTime = [...completedLearners].sort((a, b) => (a.secondsTaken || 0) - (b.secondsTaken || 0));
    const avgNote = `Class average ${row.average == null ? "—" : row.average + "%"}`;

    // when several learners tie for an extreme, show a headcount instead of picking one name at random
    const tieLabel = (student, pool, key) => {
      const tied = pool.filter((s) => s[key] === student[key]);
      return tied.length > 1 ? `${tied.length} Students` : student.name;
    };

    const top = byScore[0];
    const lowest = byScore[byScore.length - 1];
    const fastest = byTime[0];
    const slowest = byTime[byTime.length - 1];

    const cards = [
      { cls: "top", title: "Top Performer", name: tieLabel(top, byScore, "score"), main: `${top.score}%`, note: avgNote },
      { cls: "lowest", title: "Lowest Score", name: tieLabel(lowest, byScore, "score"), main: `${lowest.score}%`, note: avgNote },
      { cls: "fastest", title: "Least Time Taken", name: tieLabel(fastest, byTime, "secondsTaken"), main: fastest.timeTaken, note: `Scored ${fastest.score}% • ${avgNote}` },
      { cls: "slowest", title: "Most Time Taken", name: tieLabel(slowest, byTime, "secondsTaken"), main: slowest.timeTaken, note: `Scored ${slowest.score}% • ${avgNote}` },
    ];

    el.innerHTML = cards.map((c) => `
      <article class="deploy-insight-card ${c.cls}">
        <span class="deploy-insight-title">${escapeHTML(c.title)}</span>
        <strong class="deploy-insight-name">${escapeHTML(c.name)}</strong>
        <span class="deploy-insight-main">${escapeHTML(c.main)}</span>
        <em class="deploy-insight-note">${escapeHTML(c.note)}</em>
      </article>`).join("");
  }

  return {
    bind,
    renderList,
    renderDetail,
    openDetail,
    activateDetailPanel,
    invalidateCache,
  };
}
