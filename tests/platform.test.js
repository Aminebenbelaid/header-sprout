import test from "node:test";
import assert from "node:assert/strict";

test("prefers native browser API and requests hosts within the user gesture", async () => {
  const calls = [];
  globalThis.browser = {
    permissions: {
      contains: async (args) => {
        calls.push(args);
        return false;
      },
      request: (args) => {
        calls.push(args);
        return Promise.resolve(true);
      },
    },
  };
  globalThis.chrome = {};
  const p = await import("../src/platform.js?firefox-test");
  assert.equal(p.extensionApi, globalThis.browser);
  assert.equal(await p.hasSiteAccess(), false);
  const result = p.requestSiteAccess();
  assert.equal(calls.length, 2, "permission request must happen synchronously");
  assert.equal(await result, true);
  assert.deepEqual(calls[1], { origins: ["http://*/*", "https://*/*"] });
});
test("Chrome fallback and a denied permission request are handled", async () => {
  delete globalThis.browser;
  globalThis.chrome = {
    permissions: { contains: async () => true, request: async () => false },
  };
  const p = await import("../src/platform.js?chrome-test");
  assert.equal(p.extensionApi, globalThis.chrome);
  assert.equal(await p.hasSiteAccess(), true);
  assert.equal(await p.requestSiteAccess(), false);
});
test("ordinary web preview has no extension API", async () => {
  delete globalThis.browser;
  delete globalThis.chrome;
  const p = await import("../src/platform.js?preview-test");
  assert.equal(p.extensionApi, undefined);
});
