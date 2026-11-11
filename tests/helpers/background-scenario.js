import assert from "node:assert/strict";
import { freshState, newRule } from "../../src/core.js";
export async function backgroundScenario(namespace) {
  let listener,
    installed,
    stored,
    rules = [],
    failStorage = false,
    failDnr = false;
  globalThis[namespace] = {
    runtime: {
      id: "test",
      onMessage: { addListener: (f) => (listener = f) },
      onInstalled: { addListener: (f) => (installed = f) },
      onStartup: { addListener: () => {} },
    },
    storage: {
      local: {
        get: async () => ({ state: stored }),
        set: async ({ state }) => {
          if (failStorage) throw Error("Storage full");
          stored = structuredClone(state);
        },
      },
    },
    action: {
      setBadgeBackgroundColor: async () => {},
      setBadgeText: async () => {},
      setTitle: async () => {},
    },
    declarativeNetRequest: {
      isRegexSupported: async () => ({ isSupported: true }),
      getDynamicRules: async () => structuredClone(rules),
      updateDynamicRules: async ({ addRules }) => {
        if (failDnr) throw Error("Unsupported header");
        rules = structuredClone(addRules);
      },
    },
  };
  await import("../../src/background.js");
  const send = (message) =>
    new Promise((resolve) => listener(message, { id: "test" }, resolve));

  let result = await send({ type: "get" });
  assert.deepEqual(result.state, freshState());
  let next = result.state;
  next.profiles[0].rules.push({ ...newRule(), name: "X-Test", value: "yes" });
  result = await send({ type: "save", state: next });
  assert(result.ok);
  assert.equal(rules.length, 1);
  assert.equal(stored.revision, 1);
  const conflict = await send({ type: "save", state: next });
  assert(!conflict.ok);
  assert.equal(rules.length, 1);
  next = structuredClone(stored);
  next.enabled = false;
  result = await send({ type: "save", state: next });
  assert(result.ok);
  assert.equal(rules.length, 0);
  next = structuredClone(stored);
  next.enabled = true;
  result = await send({ type: "save", state: next });
  assert(result.ok);
  assert.equal(rules.length, 1);
  const before = structuredClone(rules);
  next = structuredClone(stored);
  next.profiles[0].rules[0].value = "changed";
  failDnr = true;
  result = await send({ type: "save", state: next });
  assert(!result.ok);
  assert.deepEqual(rules, before);
  failDnr = false;
  failStorage = true;
  result = await send({ type: "save", state: next });
  assert(!result.ok);
  assert.deepEqual(rules, before);
  assert.equal(stored.profiles[0].rules[0].value, "yes");
  failStorage = false;
  await installed();
  assert.deepEqual(rules, before);
}
