# Header Sprout privacy statement

Header Sprout has no accounts, telemetry, advertising, analytics, cloud backend, or remote code. It does not send browsing history or settings to its publisher.

Profiles, URL patterns, and header names/values are stored locally in the browser’s extension storage. They are not synced by the extension. This storage is not encrypted by Header Sprout. Do not treat it as a password vault.

When you enable and save a request-header rule, the browser sends the configured header value to websites whose request URLs match the pattern. Values can include credentials if you choose to enter them. Choose patterns carefully. Response-header rules change headers received by the browser. These actions are the extension’s user-configured functionality, not data collection by the publisher.

The extension uses declarative rules and does not record request bodies, response bodies, or network logs. HTTP and HTTPS host access enables modification on the websites you choose. Browser-internal and protected pages are outside its scope.

Exported JSON files contain the saved configuration, including any header values or tokens. Exports remain local unless you choose to share them. Importing a file stages the replacement configuration in a paused state until saved.

You can remove individual rules and profiles and save the changes, or uninstall the extension to remove its local extension storage. Exported files must be deleted separately.

The standalone design preview uses localStorage on its preview origin and cannot modify browser traffic.
