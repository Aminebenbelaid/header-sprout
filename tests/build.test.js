import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
test("build produces distinct complete manifests and clean store-ready ZIP roots", () => {
  execFileSync("python3", ["scripts/build.py"], { cwd: root });
  const read = (browser) =>
    JSON.parse(readFileSync(path.join(root, "dist", browser, "manifest.json")));
  const chrome = read("chromium"),
    firefox = read("firefox");
  assert.equal(chrome.background.service_worker, "background.js");
  assert(!chrome.background.scripts);
  assert(!chrome.browser_specific_settings);
  assert.deepEqual(firefox.background, {
    scripts: ["background.js"],
    type: "module",
  });
  assert(!firefox.minimum_chrome_version);
  assert(firefox.browser_specific_settings.gecko.id);
  assert.deepEqual(
    firefox.browser_specific_settings.gecko.data_collection_permissions
      .required,
    ["none"],
  );
  for (const browser of ["chromium", "firefox"]) {
    const m = read(browser);
    for (const file of [
      m.action.default_popup,
      "background.js",
      "core.js",
      "platform.js",
      "popup.js",
      "style.css",
      ...Object.values(m.icons),
    ])
      assert(existsSync(path.join(root, "dist", browser, file)), file);
  }
  execFileSync(
    "python3",
    [
      "-c",
      `import pathlib,zipfile
for p in pathlib.Path('artifacts').glob('*.zip'):
 with zipfile.ZipFile(p) as z:
  names=z.namelist()
  assert 'manifest.json' in names
  assert 'platform.js' in names
  assert not any(n.startswith(('node_modules/','tests/','.git/')) for n in names)
`,
    ],
    { cwd: root },
  );
});
