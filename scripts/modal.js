(() => {
  "use strict";

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const state = {
    modals: [],
    beforeOpen: null,
    lastFocused: null,
    timers: new WeakMap()
  };

  function resolveModal(modal) {
    if (!modal) return null;
    if (typeof modal === "string") {
      return document.getElementById(modal) || document.querySelector(modal);
    }
    return modal;
  }

  function setManagedModals(modals) {
    state.modals = Array.from(new Set(Array.from(modals || []).filter(Boolean)));
    state.modals.forEach(modal => {
      modal.setAttribute("role", modal.getAttribute("role") || "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-hidden", modal.classList.contains("open") ? "false" : "true");
    });
  }

  function configure(options = {}) {
    setManagedModals(options.modals || document.querySelectorAll(".modal-layer"));
    if (typeof options.beforeOpen === "function") {
      state.beforeOpen = options.beforeOpen;
    }
    return api;
  }

  function getPanel(modal) {
    return modal?.querySelector(".modal-form") || modal;
  }

  function getOpenModals() {
    return state.modals.filter(modal => modal?.classList.contains("open"));
  }

  function focusFirstControl(modal) {
    const target = modal.querySelector("input, select, textarea, button, [tabindex]:not([tabindex='-1'])");
    window.setTimeout(() => target?.focus(), 80);
  }

  function replayTitleAnimation(modal) {
    const title = modal.querySelector(".modal-head h2");
    if (!title) return;
    title.style.animation = "none";
    void title.offsetWidth;
    title.style.animation = "";
  }

  function finishClose(modal, restoreFocus) {
    const panel = getPanel(modal);
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    panel?.classList.remove("is-closing");

    if (!getOpenModals().length) {
      document.body.classList.remove("modal-open");
    }

    if (restoreFocus && state.lastFocused instanceof HTMLElement) {
      state.lastFocused.focus();
    }
  }

  function open(modal, options = {}) {
    const target = resolveModal(modal);
    if (!target) return;

    if (!state.modals.includes(target)) {
      setManagedModals([...state.modals, target]);
    }

    state.beforeOpen?.(target);
    closeAll({ except: target, immediate: true, restoreFocus: false });

    window.clearTimeout(state.timers.get(target));
    state.lastFocused = document.activeElement;
    document.body.classList.add("modal-open");
    target.classList.add("open");
    target.setAttribute("aria-hidden", "false");
    getPanel(target)?.classList.remove("is-closing");
    replayTitleAnimation(target);

    if (options.focus !== false) {
      focusFirstControl(target);
    }
  }

  function close(modal, options = {}) {
    const target = resolveModal(modal);
    if (!target || !target.classList.contains("open")) return;

    const panel = getPanel(target);
    const restoreFocus = options.restoreFocus !== false;
    const immediate = options.immediate === true;
    window.clearTimeout(state.timers.get(target));

    if (immediate) {
      finishClose(target, restoreFocus);
      return;
    }

    panel?.classList.add("is-closing");
    const timer = window.setTimeout(() => finishClose(target, restoreFocus), options.delay ?? 520);
    state.timers.set(target, timer);
  }

  function closeAll(options = {}) {
    getOpenModals().forEach(modal => {
      if (modal !== options.except) {
        close(modal, { immediate: options.immediate, restoreFocus: options.restoreFocus });
      }
    });
  }

  function trapFocus(modal, event) {
    const focusable = Array.from(modal.querySelectorAll(focusableSelector))
      .filter(item => item.offsetParent !== null || item === document.activeElement);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showTransient(modal, options = {}) {
    const target = resolveModal(modal);
    if (!target) return;

    const duration = options.duration ?? 2000;
    const exitDuration = options.exitDuration ?? 400;
    target.classList.remove("hide");
    target.classList.add("show");
    target.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      target.classList.remove("show");
      target.classList.add("hide");
      window.setTimeout(() => {
        target.classList.remove("hide");
        target.setAttribute("aria-hidden", "true");
        options.onAfterHide?.();
      }, exitDuration);
    }, duration);
  }

  document.addEventListener("click", event => {
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      event.preventDefault();
      close(closeButton.closest(".modal-layer"));
      return;
    }

    if (event.target.classList.contains("modal-layer")) {
      close(event.target);
    }
  });

  document.addEventListener("keydown", event => {
    const visibleModals = getOpenModals();
    const activeModal = visibleModals[visibleModals.length - 1];
    if (!activeModal) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close(activeModal);
      return;
    }

    if (event.key === "Tab") {
      trapFocus(activeModal, event);
    }
  });

  const api = {
    configure,
    open,
    close,
    closeAll,
    showTransient
  };

  window.Modals = api;
})();
