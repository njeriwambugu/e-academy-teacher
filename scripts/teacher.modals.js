import { runButtonAction } from "./ui-state.js";

function openModal(modalEl) {
  if (!modalEl) return;
  if (window.Modals?.open) return window.Modals.open(modalEl);

  modalEl.classList.add("open");// fallback if the shared engine hasn't loaded.
  modalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modalEl) {
  if (!modalEl) return;
  if (window.Modals?.close) return window.Modals.close(modalEl);

  modalEl.classList.remove("open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function getGradeNumber(className = "") {
  const match = String(className).match(/grade\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function getClassTheme(className = "") {
  const grade = getGradeNumber(className);
  return grade ? `grade-${grade}` : "grade-default";
}

export function createSelectClassModal(options) {
  const { teacherContext, escapeHTML, onClassSelected } = options || {};

  const modal = document.querySelector("#teacherSelectClassModal");
  const title = document.querySelector("#teacherSelectClassTitle");
  const meta = document.querySelector("#teacherSelectClassMeta");
  const optionsWrap = document.querySelector("#teacherClassOptions");

  function openSelectClass(subjectId) {
    const subject = teacherContext?.subjects?.find((s) => s.id === subjectId);

    if (!subject) return;

    if (title) {
      title.textContent = "Select a class";
    }

    if (meta) {
      meta.textContent = `Subject: ${subject.name}`;
    }

    const classes = (teacherContext?.classes || []).filter((klass) =>
      (teacherContext?.teacher?.assignments || []).some(
        (assignment) =>
          assignment.subjectId === subjectId &&
          Number(assignment.classId) === Number(klass.id)
      )
    );

    if (optionsWrap) {
      optionsWrap.innerHTML = classes.length
        ? classes
            .map((c) => {
              const theme = c.theme || getClassTheme(c.name);
              const grade = getGradeNumber(c.name);
              return `
                <button
                  type="button"
                  class="option-btn class-option-btn ${escapeHTML(theme)}"
                  data-subject-id="${escapeHTML(subjectId)}"
                  data-class-id="${escapeHTML(c.id)}"
                  data-class-theme="${escapeHTML(theme)}"
                  data-grade="${escapeHTML(grade ?? "")}">
                  <span class="class-option-copy">
                    <span class="class-option-name">${escapeHTML(c.name)}</span>
                  </span>
                </button>
              `;
            })
            .join("")
        : `<div class="modal-note">No classes available for this subject yet.</div>`;
    }

    openModal(modal);
  }

  if (optionsWrap) {
    optionsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-class-id]");
      if (!btn) return;

      const subjectId = btn.dataset.subjectId;
      const classId = btn.dataset.classId;
      const classTheme = btn.dataset.classTheme;

      runButtonAction(btn, () => {
        closeModal(modal);

        if (typeof onClassSelected === "function") {
          onClassSelected({ subjectId, classId, classTheme });
        }
      }, 160);
    });
  }

  // backdrop,close-button,escape handling is provided by the shared window.Modals engine, so we don't re-add those listeners here.

  return {
    openSelectClass,
    close: () => closeModal(modal),
  };
}
