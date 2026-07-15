// Mobile topbar profile avatar dropdown + logout action.
(function () {
  const btn = document.getElementById("teacherMobileProfileBtn");
  const dropdown = document.getElementById("teacherMobileProfileDropdown");
  const logout = document.getElementById("teacherMobileLogoutBtn");
  const desktopLogout = document.getElementById("teacherLogoutBtn");

  if (!btn || !dropdown) return;

  function open() {
    dropdown.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }

  function close() {
    dropdown.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    btn.setAttribute(
      "aria-expanded",
      dropdown.classList.contains("open") ? "true" : "false"
    );
  });

  document.addEventListener("click", close);

  dropdown.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  if (logout && desktopLogout) {// reuse existing logout logic
    logout.addEventListener("click", function () {
      desktopLogout.click();
      close();
    });
  }
})();