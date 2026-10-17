import { DEFAULT_APP_ORIGIN, normalizeAppOrigin } from "./save-url.mjs";

const form = document.querySelector("#settings");
const input = document.querySelector("#app-origin");
const status = document.querySelector("#status");
const buttons = [...form.querySelectorAll("button")];
function report(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
  input.setAttribute("aria-invalid", String(error));
}

async function load() {
  try {
    const settings = await chrome.storage.local.get({ appOrigin: DEFAULT_APP_ORIGIN });
    input.value = settings.appOrigin;
  } catch {
    input.value = DEFAULT_APP_ORIGIN;
    report("Could not read settings. Reload the extension and try again.", true);
  }
}

async function save(value) {
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const appOrigin = normalizeAppOrigin(value);
    await chrome.storage.local.set({ appOrigin });
    input.value = appOrigin;
    report("Saved. Your next save will open this Kivo app.");
  } catch (error) {
    report(error instanceof Error ? error.message : "Could not save settings. Try again.", true);
    input.focus();
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}
form.addEventListener("submit", (event) => { event.preventDefault(); void save(input.value); });
document.querySelector("#reset").addEventListener("click", () => { void save(DEFAULT_APP_ORIGIN); });
void load();
