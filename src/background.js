import { freshState, validateState, compileRules } from "./core.js";
import { extensionApi as api } from "./platform.js";
let queue = Promise.resolve();
const serial = (fn) => {
  const task = queue.then(fn);
  queue = task.catch(() => {});
  return task;
};
async function read() {
  return (await api.storage.local.get("state")).state || freshState();
}
async function badge(state) {
  const count = compileRules(state).length;
  await api.action.setBadgeBackgroundColor({
    color: state.enabled ? "#625b7c" : "#797380",
  });
  await api.action.setBadgeText({
    text: state.enabled ? (count ? String(count) : "") : "Ⅱ",
  });
  await api.action.setTitle({
    title: `Header Sprout — ${state.enabled ? `${count} active rules` : "paused"}`,
  });
}
async function apply(state) {
  const rules = compileRules(state);
  for (const rule of rules) {
    const supported = await api.declarativeNetRequest.isRegexSupported({
      regex: rule.condition.regexFilter,
      isCaseSensitive: true,
    });
    if (!supported.isSupported)
      throw Error(
        "This URL pattern is too complex. Use a shorter pattern with fewer wildcards.",
      );
  }
  const old = await api.declarativeNetRequest.getDynamicRules();
  await api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map((r) => r.id),
    addRules: rules,
  });
  try {
    await api.storage.local.set({ state });
  } catch (error) {
    await api.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map((r) => r.id),
      addRules: old,
    });
    throw error;
  }
  await badge(state).catch(() => {});
}
api.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== api.runtime.id || !["get", "save"].includes(message?.type))
    return;
  serial(async () => {
    const current = await read();
    if (message.type === "get") return current;
    if (message.state?.revision !== current.revision)
      throw Error(
        "Another window changed these rules. Reopen this popup before saving.",
      );
    const next = validateState(message.state);
    next.revision = current.revision + 1;
    await apply(next);
    return next;
  }).then(
    (state) => reply({ ok: true, state }),
    (error) => reply({ ok: false, error: error.message }),
  );
  return true;
});
api.runtime.onInstalled.addListener(() =>
  serial(async () => apply(await read())).catch(console.error),
);
api.runtime.onStartup.addListener(() =>
  serial(async () => apply(await read())).catch(console.error),
);
