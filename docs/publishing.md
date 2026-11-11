# Publishing Header Sprout

## Build and verify

```sh
npm ci --ignore-scripts
npm run check
```

Run the local HTTP echo test in `usage.md` in each target browser before submission. Test set/remove on both request and response headers, scoped URLs, pause/resume, profile selection, persistence after browser restart, and access denied/granted. The linter does not replace a live browser test.

## Firefox / Mozilla Add-ons (AMO)

1. Register at https://addons.mozilla.org/developers/.
2. Choose the Firefox ID in `manifests/firefox.json` before the first submission. A generated UUID is already included; it is not a secret or account credential. Keep it stable for future releases.
3. Upload `artifacts/header-sprout-firefox-<version>.zip`.
4. Choose listed distribution for the marketplace, or self-distribution if you only need a signed file for your own users.
5. Provide the listing text, original icons/screenshots, and privacy information. Explain that HTTP(S) site access is required to modify headers on user-chosen sites.
6. If reviewer source is requested, provide the repository source and the reproducible build command. Runtime JavaScript is readable and is copied without bundling/minification.
7. After review/signing, distribute Mozilla’s signed XPI or the marketplace listing. The ZIP produced by this repository is not signed and cannot be installed permanently in standard release Firefox as-is.

Firefox uses `background.scripts` with module loading, native promise-based `browser` APIs, and a stable Gecko ID. The manifest includes the current data-collection declaration (`required: ["none"]`): there is no publisher telemetry, remote configuration, or collection backend. Header values supplied by the user are sent to the matching websites as explicitly configured; this is described in the privacy statement and listing text below. If you add data collection or any external service later, update the declaration and privacy statement to reflect the actual behavior.

Firefox’s host permissions can be withheld or revoked. The popup detects missing broad HTTP(S) access and offers a button to request it directly from a user click. Individual site grants may permit some rules even if the broad-access reminder is still visible.

## Chrome Web Store / Microsoft Edge Add-ons

Upload `artifacts/header-sprout-chromium-<version>.zip` to the developer dashboard. The same build targets Chrome, Edge, and Brave. Supply the store assets and complete the privacy/permission disclosures. Brave users can install the Chrome Web Store listing.

Suggested single-purpose description:

> Edit HTTP request and response headers on user-selected URL patterns for development and debugging.

Suggested permission explanation:

> HTTP and HTTPS host access allows Header Sprout to apply headers to the URL patterns the user configures. declarativeNetRequestWithHostAccess applies those rules in the browser without logging network traffic. Local storage saves profiles and settings on the device.

Suggested listing copy:

> A little help for your headers. Set or remove request and response headers, target URL patterns, organize profiles, and pause all rules with one click. Settings stay on your device. No analytics, accounts, or cloud backend. User-configured request header values are sent to the websites matching your rules. Import and export profiles as JSON. Designed for development and debugging.

The source ZIP and installable ZIPs are different artifacts. Only browser packages have a manifest at the ZIP root. Do not upload node_modules, tests, JSON exports containing real tokens, or the full repository as the installable extension.

## Reference documentation

- [Firefox Manifest V3 migration](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)
- [Firefox background scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
- [Firefox data declarations](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)
- [Mozilla signing and distribution](https://extensionworkshop.com/documentation/publish/)
- [Chrome publishing](https://developer.chrome.com/docs/webstore/publish/)
