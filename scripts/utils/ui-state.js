export function setButtonLoading(button, loading = true) {
  if (!(button instanceof HTMLElement)) return;

  if (loading) {
    if (!button.dataset.wasDisabled) {
      button.dataset.wasDisabled = button.disabled ? "true" : "false";
    }
    button.style.setProperty("--button-loader-color", getComputedStyle(button).color || "#172653");
    button.classList.add("is-button-loading");
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
    return;
  }

  button.classList.remove("is-button-loading");
  button.removeAttribute("aria-busy");
  button.style.removeProperty("--button-loader-color");
  if (button.dataset.wasDisabled === "false") button.disabled = false;
  delete button.dataset.wasDisabled;
}

export function clearButtonLoading(root = document) {
  root
    .querySelectorAll(".is-button-loading")
    .forEach((button) => setButtonLoading(button, false));
}

// Buttons no longer show a spinner — pages use skeleton loading instead,
// so actions run immediately for a smooth flow.
export function runButtonAction(button, action) {
  action?.();
}
