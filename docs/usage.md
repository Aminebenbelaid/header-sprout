# Header Sprout

A small, cute header editor for Chrome, Edge, and Brave. Teal and muted purple, with a custom sprout mascot.

For browser-specific installation and build commands, see [the README](../README.md).

## Use

- Click **Add header**, enter a name and value, and choose a URL pattern.
- Use **Set header** to add/replace a value, or **Remove header** to strip it.
- Choose **Request** for outgoing headers; **Response** for incoming headers.
- Click **Save changes**, then reload the target page or issue a new request.
- Row switches are saved with other edits. The power button immediately pauses/resumes the last saved configuration, without saving pending edits.
- Create or rename profiles with the controls beside the profile selector. Save changes to activate a selected profile. Only one profile runs at a time.
- Import stages the replacement configuration, paused, for review. Click Save changes to apply it; resume when ready. Export includes only the last saved configuration.
- Closing the popup discards unsaved edits. Saving is explicit so unfinished header values are never applied.

Patterns match the **entire URL**, case-sensitively. `*` means any characters; this is a simple wildcard pattern, not a regular expression or Chrome match pattern.

| Pattern                    | Matches                         |
| -------------------------- | ------------------------------- |
| `https://example.com/*`    | All HTTPS paths on example.com  |
| `http://localhost:*/*`     | Localhost with an explicit port |
| `*://api.example.com/v1/*` | HTTP or HTTPS under /v1/        |
| `*://*/*`                  | All HTTP(S) URLs                |

Default new rules target `http://localhost/*` (without a custom port). Change that pattern for your development server. If multiple enabled rows modify the same header on the same matching request/response, the topmost row takes precedence. Browser restrictions and other extensions can affect the final result. Header modification does not bypass CORS or browser security rules. Internal browser pages are excluded.

## Permissions and data

Uses Manifest V3 and Chrome’s [declarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest).

- `storage`: saves profiles on this device, with no sync.
- `declarativeNetRequestWithHostAccess`: applies header rules in the browser.
- HTTP/HTTPS host access: necessary to modify headers on URLs you choose. This produces a site-access prompt during installation.

No analytics, external services, remote code, content scripts, or network logging. Header values are stored unencrypted in local extension storage. JSON exports include those values, including any credentials you entered. There are no default active rules. Limits: 30 profiles, 100 headers per profile.

## Verify real traffic after installation

1. Run `python3 tests/echo_server.py` from the repository root.
2. Add a request rule: Set `X-Sprout-Test` to `hello`, URL `http://127.0.0.1:8877/*`.
3. Add a response rule: Remove `X-Powered-By`, same URL.
4. Save and open `http://127.0.0.1:8877/` in the browser with the extension installed. JSON should include `X-Sprout-Test: hello` (header capitalization may vary).
5. In DevTools → Network, select the request. The response should have no `X-Powered-By` header.
6. Pause Header Sprout and reload. The injected request header should disappear and the original response header should return.
7. Stop the server with Ctrl+C. Remove these test rules or keep them scoped to that local address.

## Development and checks

See [the README](../README.md) for automated checks, build commands, and test limitations.

## Design

Palette: teal `#1CBBBE`, muted purple `#625B7C`. Supporting mint, lavender, and pink soften the developer tool. System typography; no font downloads. Keyboard focus styles, labeled fields, tab arrow-key navigation, reduced-motion support, and a popup layout capped at 600px.
