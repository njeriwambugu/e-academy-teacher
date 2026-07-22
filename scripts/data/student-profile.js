import { teacherContext, getClassMock } from "./mock-data.js";

const { students, subjects, classes, subjectStudentScores, teachers } = teacherContext;

function firstNameOf(name) {
  return String(name).trim().split(/\s+/)[0];
}

function subjectNameById(subjectId) {
  return subjects.find((s) => s.id === subjectId)?.name || subjectId;
}

function classNameById(classId) {
  return classes.find((c) => Number(c.id) === Number(classId))?.name || "\u2014";
}


function subjectsForClass(classId) {
  const ids = new Set();
  (teachers || []).forEach((t) =>
    (t.assignments || []).forEach((a) => {
      if (Number(a.classId) === Number(classId)) ids.add(a.subjectId);
    })
  );
  return [...ids];
}

// this learner's latest score in a subject, read from the shared score table.
function subjectScore(subjectId, studentId) {
  const row = (subjectStudentScores[subjectId] || []).find(
    (s) => s.studentId === studentId
  );
  return row ? row.latestScore : null;
}

function hash(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function clampScore(n) {
  return Math.max(35, Math.min(99, Math.round(n)));
}

function fmtDuration(totalSeconds) {//time in m and s
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

// name, subject and the learner's subject score, attempts and time taken are simulated deterministically (no per-attempt logs exist).
function buildPerformance(student) {
  const isPending = student.status === "pending";
  const rows = [];

  subjectsForClass(student.classId).forEach((subjectId) => {
    const classData = getClassMock(subjectId, student.classId);
    const base = subjectScore(subjectId, student.id);

    (classData.assignments || []).forEach((assignment) => {
      const seed = hash(`${student.id}:${assignment.id}`);

      let category;
      if (isPending) {
        category = seed % 3 === 0 ? "overdue" : "pending";
      } else if (assignment.status === "Needs Review" && seed % 2 === 0) {
        category = "retake";
      } else {
        const m = seed % 10;
        if (m === 0) category = "overdue";
        else if (m === 1) category = "pending";
        else if (m === 2) category = "ongoing";
        else if (m === 3) category = "retake";
        else category = "done";
      }

      const attempted =
        category === "done" || category === "retake" || category === "ongoing";
      const attempts = category === "retake" ? 2 : attempted ? 1 : 0;
      const isScored = category === "done" || category === "retake";
      const variance = (seed % 13) - 6; // -6..+6 around the real subject score(change to your preference)
      const score = isScored && base != null ? clampScore(base + variance) : null;
      const timeTaken = attempted ? fmtDuration(180 + (seed % 12) * 45) : null;

      rows.push({
        uid: `${subjectId}::${student.classId}::${assignment.id}`,
        name: assignment.name,
        subjectId,
        subject: subjectNameById(subjectId),
        attempts,
        timeTaken,
        score,
        category,
      });
    });
  });

  return rows;
}

function buildStudentProfile(student, teacherSubjectIds = []) {
  if (!student) return null;
  const isPending = student.status === "pending";
  const performance = buildPerformance(student);

  const scored = performance.filter((p) => p.score != null);
  // overall = across every subject taught to this class (all teachers), the school-wide picture
  const performanceAverage = scored.length
    ? Math.round(scored.reduce((sum, p) => sum + p.score, 0) / scored.length)
    : null;

  // teacherAverage = only the subject(s) the viewing teacher teaches this student
  const teacherScored = scored.filter((p) => teacherSubjectIds.includes(p.subjectId));
  const teacherAverage = teacherScored.length
    ? Math.round(teacherScored.reduce((sum, p) => sum + p.score, 0) / teacherScored.length)
    : null;

  // strongest subject = highest real subject score among the class subjects.
  let strongestSubject = null;
  let bestScore = -1;
  subjectsForClass(student.classId).forEach((subjectId) => {
    const sc = subjectScore(subjectId, student.id);
    if (sc != null && sc > bestScore) {
      bestScore = sc;
      strongestSubject = subjectNameById(subjectId);
    }
  });

  const summary = { done: 0, retake: 0, pending: 0, ongoing: 0, overdue: 0 };
  performance.forEach((p) => {
    if (summary[p.category] != null) summary[p.category] += 1;
  });

  const active = summary.done + summary.retake + summary.ongoing;
  const engagement = performance.length
    ? `${Math.round((active / performance.length) * 100)}%`
    : "\u2014";

  return {
    id: student.id,
    name: student.name,
    firstName: firstNameOf(student.name),
    nickname: student.nickname || firstNameOf(student.name),
    admissionNo: student.admissionNo || "",
    classId: student.classId,
    className: classNameById(student.classId),
    status: student.status,
    invite: student.invite || (isPending ? "Pending" : "Accepted"),
    guardianName: student.guardian || "\u2014",
    guardianContact: student.guardianContact || "\u2014",
    engagement: isPending && active === 0 ? "\u2014" : engagement,
    performanceAverage,
    teacherAverage,
    strongestSubject,
    summary,
    performance: performance.slice(0, 16), // table shows a capped preview; averages above use the full set
  };
}

export function getStudentProfile(studentId, teacherSubjectIds = []) {
  const student = students.find((s) => String(s.id) === String(studentId));
  return buildStudentProfile(student, teacherSubjectIds);
}
