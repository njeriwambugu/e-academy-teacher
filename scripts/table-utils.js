import { setButtonLoading } from "./ui-state.js";

/*
 * Shared table helpers: pagination, skeleton rows and simulated refresh.
 * Data is synchronous mock, so "refresh" re-renders after a short delay
 * to give the skeleton/spinner feedback users expect.
 */

const PAGE_WINDOW = 1; // numbered pages shown on each side of the current page

export function createPager({ container, pageSize = 8, onPageChange }) {
  let page = 1;
  let total = 0;

  const el = typeof container === "string" ? document.querySelector(container) : container;

  const pageCount = () => Math.max(1, Math.ceil(total / pageSize));

  el?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const token = btn.dataset.page;
    const next = token === "prev" ? page - 1 : token === "next" ? page + 1 : Number(token);
    const clamped = Math.min(pageCount(), Math.max(1, next));
    if (clamped === page) return;
    page = clamped;
    onPageChange?.();
  });

  function pageNumbers() {
    const last = pageCount();
    const nums = new Set([1, last]);
    for (let n = page - PAGE_WINDOW; n <= page + PAGE_WINDOW; n += 1) {
      if (n >= 1 && n <= last) nums.add(n);
    }
    return [...nums].sort((a, b) => a - b);
  }

  return {
    reset() {
      page = 1;
    },

    paginate(rows) {
      total = rows.length;
      page = Math.min(page, pageCount());
      const start = (page - 1) * pageSize;
      return rows.slice(start, start + pageSize);
    },

    renderControls() {
      if (!el) return;
      if (!total) {
        el.innerHTML = "";
        el.hidden = true;
        return;
      }
      el.hidden = false;

      const last = pageCount();
      const from = (page - 1) * pageSize + 1;
      const to = Math.min(total, page * pageSize);

      let previous = 0;
      const numbers = pageNumbers().map((n) => {
        const gap = n - previous > 1 ? `<span class="table-pagination-gap" aria-hidden="true">&hellip;</span>` : "";
        previous = n;
        return `${gap}<button type="button" data-page="${n}" class="table-page-btn${n === page ? " active" : ""}" ${n === page ? 'aria-current="page"' : ""}>${n}</button>`;
      }).join("");

      el.innerHTML = `
        <span class="table-pagination-meta">Showing ${from}–${to} of ${total}</span>
        <span class="table-pagination-pages">
          <button type="button" data-page="prev" class="table-page-btn nav" aria-label="Previous page" ${page === 1 ? "disabled" : ""}>&lsaquo;</button>
          ${numbers}
          <button type="button" data-page="next" class="table-page-btn nav" aria-label="Next page" ${page === last ? "disabled" : ""}>&rsaquo;</button>
        </span>`;
    },
  };
}

export function skeletonRows(colCount, rowCount = 8) {
  const widths = [88, 64, 76, 58, 70, 82, 60, 74];
  return Array.from({ length: rowCount }, (_, r) => `
    <tr class="skeleton-row" aria-hidden="true">
      ${Array.from({ length: colCount }, (_, c) => `
        <td><span class="skeleton-line" style="width:${widths[(r + c) % widths.length]}%"></span></td>`).join("")}
    </tr>`).join("");
}

export function refreshTable({ button, body, colCount, render, before, delay = 500 }) {
  const tbody = typeof body === "string" ? document.querySelector(body) : body;
  if (!tbody) return;
  if (button) setButtonLoading(button, true);
  tbody.innerHTML = skeletonRows(colCount);

  window.setTimeout(() => {
    // the user may have navigated away while the skeleton was showing
    if (tbody.isConnected) {
      before?.();
      render();
    }
    if (button) setButtonLoading(button, false);
  }, delay);
}
