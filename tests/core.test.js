import test from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  newRule,
  compileRules,
  validateState,
  patternRegex,
} from "../src/core.js";
const fixture = () => {
  const s = freshState();
  s.profiles[0].rules = [
    {
      ...newRule(),
      name: "X-Debug",
      value: "true",
      pattern: "https://example.com/*",
    },
  ];
  return s;
};
test("empty and paused configurations never modify traffic", () => {
  assert.deepEqual(compileRules(freshState()), []);
  const s = fixture();
  s.enabled = false;
  assert.deepEqual(compileRules(s), []);
});
test("request header is scoped to the whole URL", () => {
  const [r] = compileRules(fixture());
  assert.equal(r.action.requestHeaders[0].value, "true");
  const regex = new RegExp(r.condition.regexFilter);
  assert(regex.test("https://example.com/foo?q=1"));
  assert(!regex.test("https://example.com.evil.test/foo"));
  assert(!regex.test("https://evil.test/?url=https://example.com/"));
});
test("wildcards support protocols, ports and literal punctuation", () => {
  assert(
    new RegExp(patternRegex("*://localhost:*/*")).test(
      "http://localhost:8080/hello",
    ),
  );
  assert(!new RegExp(patternRegex("*://*/*")).test("file:///etc/test"));
  const re = new RegExp(patternRegex("https://example.com/a?b=1"));
  assert(re.test("https://example.com/a?b=1"));
  assert(!re.test("https://example.com/ab=1"));
});
test("removal has no value; response target is respected", () => {
  const s = fixture();
  Object.assign(s.profiles[0].rules[0], {
    operation: "remove",
    target: "response",
  });
  const [r] = compileRules(s);
  assert.deepEqual(r.action.responseHeaders, [
    { header: "x-debug", operation: "remove" },
  ]);
  assert(!r.action.requestHeaders);
});
test("only active profile and enabled rows compile", () => {
  const s = fixture();
  s.profiles.push({
    id: "two",
    name: "Other",
    rules: [{ ...newRule(), name: "Other" }],
  });
  s.profiles[0].rules[0].enabled = false;
  assert.deepEqual(compileRules(s), []);
  s.activeId = "two";
  assert.equal(compileRules(s)[0].action.requestHeaders[0].header, "other");
});
test("first matching rule has higher priority", () => {
  const s = fixture();
  s.profiles[0].rules.push({
    ...s.profiles[0].rules[0],
    id: "second",
    value: "false",
  });
  const rules = compileRules(s);
  assert(rules[0].priority > rules[1].priority);
  assert.notEqual(rules[0].id, rules[1].id);
});
test("rejects header injection, invalid names and malformed imports", () => {
  for (const value of ["foo\r\nCookie: bad", "hello\nworld", "🔑"]) {
    const s = fixture();
    s.profiles[0].rules[0].value = value;
    assert.throws(() => compileRules(s));
  }
  const s = fixture();
  s.profiles[0].rules[0].name = "Bad name";
  assert.throws(() => validateState(s));
  for (const bad of [
    null,
    {},
    { ...freshState(), activeId: "missing" },
    { ...freshState(), profiles: [] },
  ])
    assert.throws(() => validateState(bad));
});
test("rejects duplicate identifiers and unsupported patterns", () => {
  const s = fixture();
  s.profiles.push(s.profiles[0]);
  assert.throws(() => validateState(s));
  for (const pattern of [
    "",
    "example.com",
    "file:///*",
    "https://example.com/a b",
  ])
    assert.throws(() => patternRegex(pattern));
});

test("all resource types, including navigation, without browser-specific enum names", () => {
  const [rule] = compileRules(fixture());
  assert.deepEqual(rule.condition.excludedResourceTypes, []);
  assert(!("resourceTypes" in rule.condition));
});
