// Week 8 — Bug hunt.  Run: node --test tests/week08.test.mjs
// Tests the FIXED behaviour of week08-broken.js. Each of the first seven tests
// is one planted bug, so a student can see which remain. The rules in the
// file's header comment say what "fixed" means. Names match the file we hand
// out, so nothing is renamed.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, need, closeTo } from "./_harness.mjs";

const FILE = "week08-broken.js";
const NAMES = ["average", "getGrade", "hasPassed", "addBonus", "shout", "report"];

/** How a value reads in a message: NaN as NaN, text in quotes. */
const shown = (v) => (typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v));

/** Runs a call and turns a crash into a plain-English failure instead of a stack trace. */
function call(fn, args, label, hint) {
  try {
    return fn(...args);
  } catch (err) {
    assert.fail(`${label} crashed with "${err.message}". ${hint}`);
  }
}

describe("Week 8 — Bug hunt (7 bugs)", () => {
  test("bug 1 — average no longer reads past the end of the array", () => {
    const f = need(load(FILE, NAMES).fns, "average", FILE);
    const got = call(f, [[72, 65, 80]], "average([72, 65, 80])", "average must not throw.");
    assert.ok(!Number.isNaN(got),
      "average([72, 65, 80]) is NaN — the loop runs one step too far (lesson 4, off-by-one)");
    assert.ok(closeTo(got, 72.33, 0.01), `average([72, 65, 80]) gave ${shown(got)} — expected about 72.33`);
  });

  test("bug 2 — average of an empty list is 0", () => {
    const f = need(load(FILE, NAMES).fns, "average", FILE);
    const got = call(f, [[]], "average([])",
      "The file's rules say a student with no scores has an average of 0 — return 0, do not throw.");
    assert.equal(got, 0,
      `average([]) gave ${shown(got)} — the file's rules say a student with no scores has an average of 0 ` +
      "(lesson 4, the unguarded empty case)");
  });

  test("bug 3 — getGrade returns A instead of undefined", () => {
    const f = need(load(FILE, NAMES).fns, "getGrade", FILE);
    assert.equal(f(91), "A", `getGrade(91) gave ${shown(f(91))} — the A branch works the value out but never returns it`);
    assert.equal(f(70), "B", "getGrade(70) should still be B");
    assert.equal(f(55), "C", "getGrade(55) should still be C");
    assert.equal(f(20), "F", "getGrade(20) should still be F");
  });

  test("bug 4 — hasPassed actually compares", () => {
    const f = need(load(FILE, NAMES).fns, "hasPassed", FILE);
    assert.equal(f(50), true, "hasPassed(50) should be true — 50 is the pass mark");
    assert.equal(f(80), true, "hasPassed(80) should be true");
    assert.equal(f(49), false, "hasPassed(49) is true — check `=` against `===` (lesson 4)");
    assert.equal(f(0), false, "hasPassed(0) should be false");
  });

  test("bug 5 — addBonus adds instead of joining text", () => {
    const f = need(load(FILE, NAMES).fns, "addBonus", FILE);
    const got = call(f, [72, "5"], 'addBonus(72, "5")', "addBonus must cope with a typed bonus, not throw.");
    assert.equal(got, 77,
      `addBonus(72, "5") gave ${shown(got)} — a typed bonus is text, so + joins it on. ` +
      "Convert it inside addBonus itself, as the file's rules say (lesson 4, a number that is secretly a string)");
    assert.equal(f(72, 5), 77, "addBonus(72, 5) should still be 77");
  });

  test("bug 6 — shout copes with a missing name", () => {
    const f = need(load(FILE, NAMES).fns, "shout", FILE);
    assert.equal(f("ama"), "AMA", 'shout("ama") should give "AMA"');
    call(f, [undefined], "shout(undefined)",
      "Some students have no name on record — shout must cope, and the data stays as it is (lesson 4, reading a property of nothing)");
  });

  test("bug 7 — report runs to the end and says how many students there were", () => {
    const f = need(load(FILE, NAMES).fns, "report", FILE);
    const got = call(f, [[{ name: "Ama", scores: [72, 65, 80] }, { scores: [60, 70] }]], "report(...)",
      "Run the file and read the error — fix crashes first (lesson 4).");
    assert.equal(typeof got, "string", `report gave back ${shown(got)} — it should return the finished report as text`);
    assert.match(got, /AMA/, "the report should have a line for each student");
    const lastLine = got.trim().split("\n").pop();
    assert.match(lastLine, /\b2\s+students?\b/i,
      `for two students the last line should say "2 students" — it says ${shown(lastLine)}`);
  });

  test("the whole file runs top to bottom without throwing", () => {
    const { output } = load(FILE, NAMES);
    assert.ok(output.length >= 1, "the file should still print its report at the end");
  });

  test("try/catch is used in at least two places, and no catch is empty", () => {
    const { source } = load(FILE, NAMES);
    const tries = source.match(/\btry\s*\{/g) || [];
    assert.ok(tries.length >= 2,
      `found ${tries.length} try/catch — add two: around converting typedBonus, and around the final report call (lesson 3)`);
    assert.doesNotMatch(source, /\bcatch\s*(\([^)]*\))?\s*\{(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*\}/,
      "a catch block is empty (a comment on its own still counts as empty) — say what went wrong, or the error disappears (lesson 3, do not catch what you cannot handle)");
  });

  test("one function throws a useful error", () => {
    const { source } = load(FILE, NAMES);
    assert.match(source, /\bthrow\s+new\s+\w*Error\s*\(/,
      'add one new function that throws, e.g. `throw new Error(`Bonus must be a number, got: "${text}"`)` (lesson 3)');
  });
});
