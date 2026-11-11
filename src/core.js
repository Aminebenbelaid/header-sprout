export const freshState = () => ({
  version: 1,
  revision: 0,
  enabled: true,
  activeId: "default",
  profiles: [{ id: "default", name: "My headers", rules: [] }],
});
export const newRule = () => ({
  id: crypto.randomUUID(),
  enabled: true,
  target: "request",
  operation: "set",
  name: "",
  value: "",
  pattern: "http://localhost/*",
});
const token = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
export function patternRegex(pattern) {
  if (
    !pattern ||
    pattern.length > 500 ||
    !/^(https?:\/\/|\*:\/\/)/.test(pattern)
  )
    throw Error(
      "Use a full URL pattern, such as https://example.com/* or *://*/*.",
    );
  if (/[^\x21-\x7e]/.test(pattern))
    throw Error(
      "URL patterns must use ASCII without spaces. Encode spaces as %20.",
    );
  const protocol = pattern.startsWith("*://") ? "https?://" : "";
  const rest = protocol ? pattern.slice(4) : pattern;
  return (
    "^" +
    protocol +
    rest
      .split("*")
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*") +
    "$"
  );
}
export function validateState(input) {
  if (
    !input ||
    input.version !== 1 ||
    typeof input.enabled !== "boolean" ||
    !Array.isArray(input.profiles) ||
    !input.profiles.length ||
    input.profiles.length > 30
  )
    throw Error(
      "Invalid configuration. Use a Header Sprout v1 export with 1–30 profiles.",
    );
  const ids = new Set();
  const profiles = input.profiles.map((p) => {
    if (
      !p ||
      typeof p.id !== "string" ||
      !p.id ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 60 ||
      !Array.isArray(p.rules) ||
      p.rules.length > 100
    )
      throw Error(
        "Profiles need unique IDs, a name (up to 60 characters), and at most 100 rules.",
      );
    ids.add(p.id);
    const ruleIds = new Set();
    const rules = p.rules.map((r) => {
      if (
        !r ||
        typeof r.id !== "string" ||
        !r.id ||
        ruleIds.has(r.id) ||
        typeof r.enabled !== "boolean" ||
        !["request", "response"].includes(r.target) ||
        !["set", "remove"].includes(r.operation)
      )
        throw Error("Invalid header rule.");
      ruleIds.add(r.id);
      if (
        typeof r.name !== "string" ||
        !token.test(r.name) ||
        r.name.length > 200
      )
        throw Error(
          "Enter a valid header name, for example X-Debug. Spaces are not allowed.",
        );
      if (
        typeof r.value !== "string" ||
        r.value.length > 8000 ||
        /[^\x20-\x7e\x80-\xff\t]/.test(r.value)
      )
        throw Error(
          "Header values cannot contain line breaks or unsupported characters.",
        );
      if (typeof r.pattern !== "string") throw Error("Enter a URL pattern.");
      patternRegex(r.pattern);
      return {
        id: r.id,
        enabled: r.enabled,
        target: r.target,
        operation: r.operation,
        name: r.name,
        value: r.value,
        pattern: r.pattern,
      };
    });
    return { id: p.id, name: p.name.trim(), rules };
  });
  if (!ids.has(input.activeId)) throw Error("Select an existing profile.");
  return {
    version: 1,
    revision: Number.isSafeInteger(input.revision) ? input.revision : 0,
    enabled: input.enabled,
    activeId: input.activeId,
    profiles,
  };
}
export function compileRules(input) {
  const state = validateState(input);
  if (!state.enabled) return [];
  return state.profiles
    .find((p) => p.id === state.activeId)
    .rules.filter((r) => r.enabled)
    .map((r, i, rows) => ({
      id: i + 1,
      priority: rows.length - i,
      action: {
        type: "modifyHeaders",
        [r.target === "request" ? "requestHeaders" : "responseHeaders"]: [
          {
            header: r.name.toLowerCase(),
            operation: r.operation,
            ...(r.operation === "set" ? { value: r.value } : {}),
          },
        ],
      },
      condition: {
        regexFilter: patternRegex(r.pattern),
        isUrlFilterCaseSensitive: true,
        excludedResourceTypes: [],
      },
    }));
}
