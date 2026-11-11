// Firefox's native promise API; Chrome 120+ supports promises on these APIs.
export const extensionApi = globalThis.browser ?? globalThis.chrome;
export const siteOrigins = ["http://*/*", "https://*/*"];
export async function hasSiteAccess() {
  return extensionApi.permissions.contains({ origins: siteOrigins });
}
export function requestSiteAccess() {
  // Call directly inside a click handler to preserve Firefox's user gesture.
  return extensionApi.permissions.request({ origins: siteOrigins });
}
