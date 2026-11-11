import { freshState, newRule, validateState, compileRules } from "./core.js";
import {
  extensionApi as api,
  hasSiteAccess,
  requestSiteAccess,
} from "./platform.js";
const $ = (id) => document.getElementById(id);
const preview = !api?.runtime?.id;
let state,
  saved,
  direction = "request",
  dirty = false,
  busy = false,
  dialogMode = "new",
  siteAccess = true;
const clone = (x) => structuredClone(x);
const active = () => state.profiles.find((p) => p.id === state.activeId);
function showError(message = "") {
  $("error").textContent = message;
  $("error").hidden = !message;
}
async function request(type, next) {
  if (preview) {
    if (type === "get")
      return (
        JSON.parse(localStorage.getItem("header-sprout-preview") || "null") ||
        freshState()
      );
    const result = validateState(next);
    result.revision++;
    compileRules(result);
    localStorage.setItem("header-sprout-preview", JSON.stringify(result));
    return result;
  }
  const result = await api.runtime.sendMessage({ type, state: next });
  if (!result?.ok)
    throw Error(
      result?.error ||
        "The extension did not respond. Reopen the popup and try again.",
    );
  return result.state;
}
function markDirty() {
  dirty = true;
  showError();
  updateStatus();
}
function updateStatus() {
  document.querySelector(".workspace").inert = busy;
  $("power").disabled = busy;
  $("import").disabled = busy;
  $("export").disabled = busy;
  const count = compileRules(saved).length;
  $("status").textContent = saved.enabled
    ? count
      ? `${count} active`
      : "Ready to grow"
    : "Paused";
  if (!siteAccess && saved.enabled)
    $("status").textContent = "Site access needed";
  $("status").classList.toggle("paused", !saved.enabled || !siteAccess);
  $("power").classList.toggle("off", !saved.enabled);
  $("power").setAttribute(
    "aria-label",
    saved.enabled ? "Pause all rules" : "Resume rules",
  );
  $("power").title = saved.enabled ? "Pause all rules" : "Resume rules";
  $("save").disabled = !dirty || busy;
  $("save").textContent = busy ? "Saving…" : "Save changes";
  $("save-status").textContent = dirty
    ? "Unsaved changes"
    : saved.enabled
      ? "All changes saved"
      : "Saved · all rules paused";
  $("request-count").textContent = active().rules.filter(
    (r) => r.target === "request",
  ).length;
  $("response-count").textContent = active().rules.filter(
    (r) => r.target === "response",
  ).length;
}
const element = (tag, attrs = {}, text) => {
  const e = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
  if (text !== undefined) e.textContent = text;
  return e;
};
function renderRules() {
  const container = $("rules");
  container.replaceChildren();
  const rules = active().rules.filter((r) => r.target === direction);
  if (!rules.length) {
    const empty = element("div", { class: "empty" });
    empty.append(
      element("img", { src: "mascot.svg", alt: "" }),
      element("h3", {}, "Room for a little sprout"),
      element(
        "p",
        {},
        "Add a header and choose where it should grow. Your first rule starts on localhost.",
      ),
    );
    container.append(empty);
  }
  for (const rule of rules) {
    const card = element("article", {
      class: `rule${rule.enabled ? "" : " disabled"}`,
    });
    const head = element("div", { class: "rule-head" });
    const toggle = element("label", { class: "switch" });
    const check = element("input", {
      type: "checkbox",
      "aria-label": `Enable ${rule.name || "header"}`,
    });
    check.checked = rule.enabled;
    check.addEventListener("change", () => {
      rule.enabled = check.checked;
      card.classList.toggle("disabled", !rule.enabled);
      markDirty();
    });
    toggle.append(check, element("span"));
    const op = element("select", {
      class: "operation",
      "aria-label": "Header operation",
    });
    op.append(
      element("option", { value: "set" }, "Set header"),
      element("option", { value: "remove" }, "Remove header"),
    );
    op.value = rule.operation;
    const del = element(
      "button",
      {
        class: "delete",
        "aria-label": `Delete ${rule.name || "header"}`,
        title: "Delete header",
      },
      "×",
    );
    del.addEventListener("click", () => {
      active().rules = active().rules.filter((r) => r.id !== rule.id);
      markDirty();
      renderRules();
    });
    head.append(
      toggle,
      op,
      element(
        "span",
        { class: "rule-label" },
        rule.target === "request" ? "Outgoing" : "Incoming",
      ),
      del,
    );
    const fields = element("div", { class: "fields" });
    const nameLabel = element("label", { class: "field" }, "Header name");
    const name = element("input", {
      value: rule.name,
      placeholder: "X-Debug",
      autocomplete: "off",
      spellcheck: "false",
      maxlength: "200",
    });
    name.addEventListener("input", () => {
      rule.name = name.value;
      markDirty();
    });
    nameLabel.append(name);
    const valueLabel = element("label", { class: "field" }, "Value");
    const value = element("input", {
      value: rule.value,
      placeholder: "true",
      autocomplete: "off",
      spellcheck: "false",
      maxlength: "8000",
    });
    value.disabled = rule.operation === "remove";
    value.addEventListener("input", () => {
      rule.value = value.value;
      markDirty();
    });
    valueLabel.append(value);
    op.addEventListener("change", () => {
      rule.operation = op.value;
      value.disabled = op.value === "remove";
      markDirty();
    });
    fields.append(nameLabel, valueLabel);
    const scope = element("label", { class: "scope" }, "Match URL");
    const pattern = element("input", {
      value: rule.pattern,
      "aria-label": "Match URL",
      placeholder: "https://example.com/*",
      autocomplete: "off",
      spellcheck: "false",
      maxlength: "500",
    });
    pattern.addEventListener("input", () => {
      rule.pattern = pattern.value;
      markDirty();
    });
    scope.append(pattern);
    card.append(head, fields, scope);
    container.append(card);
  }
  updateStatus();
}
function render() {
  $("profiles").replaceChildren(
    ...state.profiles.map((p) => element("option", { value: p.id }, p.name)),
  );
  $("profiles").value = state.activeId;
  $("delete-profile").disabled = state.profiles.length === 1;
  renderRules();
}
async function persist(next = state) {
  if (busy) return false;
  busy = true;
  updateStatus();
  showError();
  try {
    state = await request("save", next);
    saved = clone(state);
    dirty = false;
    render();
    return true;
  } catch (error) {
    showError(error.message);
    return false;
  } finally {
    busy = false;
    updateStatus();
  }
}
function canDiscard() {
  return !dirty || confirm("Discard unsaved changes?");
}
function setDirection(value) {
  direction = value;
  for (const d of ["request", "response"]) {
    const selected = d === value;
    $(`${d}-tab`).classList.toggle("selected", selected);
    $(`${d}-tab`).setAttribute("aria-selected", String(selected));
    $(`${d}-tab`).tabIndex = selected ? 0 : -1;
  }
  $("rules-panel").setAttribute("aria-labelledby", `${value}-tab`);
  $("section-title").textContent =
    value === "request" ? "Request headers" : "Response headers";
  $("section-copy").textContent =
    value === "request"
      ? "A small tweak on the way out."
      : "A finishing touch on the way back.";
  renderRules();
}
$("save").addEventListener("click", () => persist());
$("add-rule").addEventListener("click", () => {
  if (active().rules.length >= 100)
    return showError("Each profile can hold up to 100 headers.");
  active().rules.push({ ...newRule(), target: direction });
  markDirty();
  renderRules();
  $("rules").lastElementChild.querySelector(".field input")?.focus();
});
for (const d of ["request", "response"]) {
  $(`${d}-tab`).addEventListener("click", () => setDirection(d));
  $(`${d}-tab`).addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const other = d === "request" ? "response" : "request";
      setDirection(other);
      $(`${other}-tab`).focus();
    }
  });
}
$("power").addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  updateStatus();
  showError();
  try {
    const next = clone(saved);
    next.enabled = !next.enabled;
    const result = await request("save", next);
    saved = clone(result);
    state.enabled = result.enabled;
    state.revision = result.revision;
  } catch (error) {
    showError(error.message);
  } finally {
    busy = false;
    updateStatus();
  }
});
$("profiles").addEventListener("change", () => {
  if (busy) return;
  state.activeId = $("profiles").value;
  markDirty();
  render();
});
function openProfileDialog(mode) {
  if (busy) return;
  dialogMode = mode;
  $("dialog-title").textContent =
    mode === "new" ? "New profile" : "Rename profile";
  $("profile-name").value = mode === "new" ? "" : active().name;
  $("profile-dialog").showModal();
  $("profile-name").focus();
}
$("add-profile").addEventListener("click", () => {
  if (state.profiles.length >= 30)
    return showError("You can keep up to 30 profiles.");
  openProfileDialog("new");
});
$("rename").addEventListener("click", () => openProfileDialog("rename"));
$("cancel-dialog").addEventListener("click", () => $("profile-dialog").close());
$("profile-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("profile-name").value.trim();
  if (!name) return;
  if (dialogMode === "new") {
    const p = { id: crypto.randomUUID(), name, rules: [] };
    state.profiles.push(p);
    state.activeId = p.id;
  } else active().name = name;
  $("profile-dialog").close();
  markDirty();
  render();
});
$("delete-profile").addEventListener("click", () => {
  if (busy || state.profiles.length === 1) return;
  if (
    !confirm(
      `Delete “${active().name}” and its headers? This takes effect when you save.`,
    )
  )
    return;
  state.profiles = state.profiles.filter((p) => p.id !== state.activeId);
  state.activeId = state.profiles[0].id;
  markDirty();
  render();
});
$("help").addEventListener("click", () => $("help-dialog").showModal());
$("close-help").addEventListener("click", () => $("help-dialog").close());
$("export").addEventListener("click", () => {
  if (
    !confirm(
      "Export saved profiles? The file includes all header values, including any tokens. Unsaved edits are not included.",
    )
  )
    return;
  const blob = new Blob([JSON.stringify(saved, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = element("a", { href: url, download: "header-sprout.json" });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("import").addEventListener("click", () => {
  if (!busy) $("import-file").click();
});
$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    if (file.size > 3000000)
      throw Error("Choose a JSON export smaller than 3 MB.");
    const next = validateState(JSON.parse(await file.text()));
    if (!canDiscard()) return;
    next.revision = saved.revision;
    next.enabled = false;
    state = next;
    markDirty();
    render();
    $("save-status").textContent = "Imported as paused · save to apply";
  } catch (error) {
    showError(`Import failed: ${error.message}`);
  }
});
$("grant-access").addEventListener("click", async () => {
  try {
    siteAccess = await requestSiteAccess();
    $("site-access").hidden = siteAccess;
    updateStatus();
    if (!siteAccess)
      showError(
        "Website access was not granted. You can try again when ready.",
      );
    else showError();
  } catch (error) {
    showError(error.message);
  }
});
try {
  siteAccess = preview || (await hasSiteAccess());
  $("site-access").hidden = siteAccess;
  state = validateState(await request("get"));
  saved = clone(state);
  if (preview) {
    document.body.classList.add("preview");
    $("preview").hidden = false;
  }
  render();
  setDirection("request");
} catch (error) {
  showError(error.message);
  document
    .querySelectorAll("button,select")
    .forEach((e) => (e.disabled = true));
}
