# Header Sprout 🌱

A friendly HTTP header editor for **Firefox, Chrome, Edge, and Brave**. Set or remove request and response headers, scope them to URL patterns, switch profiles, and pause everything with one click.

Teal and muted purple, with an original sprout mascot.

## Quick start

Requires **Node.js 22+**, **npm**, and **Python 3** (`python3` on your PATH).

```sh
npm ci --ignore-scripts
npm run check
```

This runs tests, builds both browser variants, and validates the Firefox package with Mozilla’s `web-ext` linter. There are no extension runtime dependencies; development dependencies never enter the browser packages.

| Output                                       | Use                                          |
| -------------------------------------------- | -------------------------------------------- |
| `dist/firefox/`                              | Load temporarily into Firefox for testing    |
| `dist/chromium/`                             | Load unpacked into Chrome, Edge, or Brave    |
| `artifacts/header-sprout-firefox-1.1.0.zip`  | Upload to Mozilla Add-ons for review/signing |
| `artifacts/header-sprout-chromium-1.1.0.zip` | Upload to Chrome Web Store or Edge Add-ons   |

ZIPs contain `manifest.json` at the archive root. Upload the browser package, not a ZIP of this repository.

## Firefox

Targets **Firefox desktop 140+**.

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/firefox/manifest.json`.
4. Open Header Sprout from the extensions menu. If shown, click **Allow website access** so saved rules can apply.
5. Add a header and URL pattern, then click **Save changes** and reload your target page.

Alternatively, `npm run dev:firefox` launches an isolated development profile using your installed Firefox. Changes to `src/` need a rebuild; the watcher observes `dist/firefox/`.

Temporary add-ons are removed when Firefox restarts. Normal persistent installation requires a Mozilla-signed package; the supplied ZIP is unsigned. Android is not part of the tested target; its minimum-version metadata only keeps the manifest’s data-permission declaration consistent.

## Chrome / Edge / Brave

1. Run `npm run build`.
2. Open `chrome://extensions`, `edge://extensions`, or `brave://extensions`.
3. Enable **Developer mode**, choose **Load unpacked**, and select `dist/chromium/`.

After a rebuild, click **Reload** on the extension’s management card. Reusing the same directory preserves the existing extension identity and local data. To preserve settings when switching from a different installation path, export them in the old extension and import them into the new one.

## Commands

```sh
npm test             # Unit, background/API, permission, and packaging tests
npm run build        # Reproducible Firefox + Chromium folders and ZIPs
npm run lint:firefox  # Mozilla validation; fails on warnings
npm run check        # Tests + build + Firefox validation
npm run dev:firefox   # Launch temporary add-on in installed Firefox
npm run preview      # UI only: http://127.0.0.1:8765/popup.html
npm run format       # Format source, tests, manifests, and documentation
```

The standalone preview cannot modify traffic. Its sample settings are separate from extension settings.

## Repository structure

```text
src/                 Shared UI, rule compiler, background logic, and icons
manifests/           Chromium service worker / Firefox module event page
scripts/build.py     Browser packaging with fixed ZIP timestamps
tests/              Unit tests and local HTTP echo server
docs/               Usage, publishing, and privacy information
.github/workflows/   Tests, build, lint, and downloadable CI artifacts
```

Version releases by updating `version` in `package.json` and refreshing the lockfile with `npm install --package-lock-only --ignore-scripts`. The build stamps that version into both manifests. Keep the Firefox add-on ID in `manifests/firefox.json` unchanged after your first publication; it identifies future updates.

## Before pushing

Push this directory’s source files. `.gitignore` excludes dependencies, generated packages, local environment files, and logs. The GitHub Actions workflow will validate pushes and pull requests and attach both packages as build artifacts; it does not publish to any extension store.

No repository remote, account credentials, or publishing tokens are embedded. No open-source license has been chosen; `UNLICENSED` is intentional until you choose your distribution license.

## Testing and known limits

Automated checks cover rule compilation, URL matching, request/response operations, profile isolation, priority, both API namespaces, pause/resume, stale edits, save rollback, permission grant/denial, and packaged assets. Firefox packaging is checked with Mozilla’s linter.

Firefox is not installed in the development environment, so actual Firefox network interception has **not** been verified here. Before publishing, run the [local echo test](docs/usage.md#verify-real-traffic-after-installation) in Firefox and Chromium. Firefox protects certain Mozilla domains and browser pages; rules cannot override those restrictions. Other extensions and browser policies can also affect header modifications.

Read the [usage guide](docs/usage.md), [publishing guide](docs/publishing.md), and [privacy statement](docs/privacy.md).
