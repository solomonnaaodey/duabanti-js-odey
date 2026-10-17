// Week 4 — Function workout.  Run: node --test tests/week04.test.mjs
//
// The point of this week is `return`: each of the four functions hands its
// answer back and prints nothing (lesson 2). That part is strict. HOW the answer
// comes back is judged as in Week 3 — an average of "4.00" from toFixed counts as
// 4, and a grade of "a" or "A (Excellent)" counts as A. Your fifth function of
// your own invention is not checked; nor is the rewrite at the bottom, beyond
// printing something.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, need } from "./_harness.mjs";

/** How a value reads in a message: NaN as NaN, not as JSON's "null". */
const shown = (v) => (typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v));

const FILE = "week04-functions.js";
const NAMES = ["calculateAverage", "getGrade", "formatCedis", "isValidScore"];

/** A number, or text that is a number ("4.00" from toFixed). */
const asNumber = (x) => (typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN);
const near = (got, want) => Math.abs(asNumber(got) - want) <= 0.01;
const letter = (got) => String(got).trim().toUpperCase()[0];

/** Call one function and report whether it printed anything on the way. */
function call(loaded, name, ...args) {
  const f = need(loaded.fns, name, FILE);
  const before = loaded.output.length;
  const got = f(...args);
  const printed = loaded.output.slice(before);
  return { got, printed };
}

describe("Week 4 — Function workout", () => {
  test("the file runs without throwing", () => load(FILE, NAMES));

  test("all four named functions exist", () => {
    const { fns } = load(FILE, NAMES);
    for (const n of NAMES) need(fns, n, FILE);
  });

  test("each function returns its answer instead of printing it", () => {
    const loaded = load(FILE, NAMES);
    const calls = [["calculateAverage", [2, 4, 6]], ["getGrade", 85], ["formatCedis", 1250], ["isValidScore", 50]];
    for (const [name, arg] of calls) {
      const { got, printed } = call(loaded, name, arg);
      const shownArg = Array.isArray(arg) ? `[${arg}]` : arg;
      assert.equal(printed.length, 0,
        `${name}(${shownArg}) printed "${printed.join(" ")}" — it should \`return\` its answer, not console.log it. ` +
        `Printing is the caller's job (lesson 2, "The mistake this week is really about").`);
      assert.notEqual(got, undefined,
        `${name}(${shownArg}) gave back undefined. Did you forget \`return\`? (lesson 2)`);
    }
  });

  test("calculateAverage returns the mean of a list", () => {
    const loaded = load(FILE, NAMES);
    for (const [list, want] of [[[2, 4, 6], 4], [[50], 50], [[72, 45, 91], 69.33]]) {
      const { got } = call(loaded, "calculateAverage", list);
      assert.ok(near(got, want), `calculateAverage([${list}]) gave back ${shown(got)} — expected about ${want}.` +
        (got === undefined ? " Did you forget `return`? (lesson 2)" : ""));
    }
  });

  test("calculateAverage of an empty list is 0, as in Week 3", () => {
    const { got } = call(load(FILE, NAMES), "calculateAverage", []);
    assert.ok(asNumber(got) === 0,
      `calculateAverage([]) gave back ${shown(got)} — check for an empty list first and return 0 (lesson 4, "One job each")`);
  });

  test("getGrade gives the right letter, with the Week 3 boundaries", () => {
    const loaded = load(FILE, NAMES);
    for (const [score, want] of [[95, "A"], [90, "A"], [85, "B"], [80, "B"], [75, "C"], [70, "C"], [60, "D"], [50, "D"], [49, "F"], [20, "F"]]) {
      const { got } = call(loaded, "getGrade", score);
      assert.equal(letter(got), want,
        `getGrade(${score}) gave back ${shown(got)} — expected "${want}". ` +
        `The grades are A 90+, B 80–89, C 70–79, D 50–69, F below 50, as in Week 3.`);
    }
  });

  test("formatCedis shows cedis with two decimal places", () => {
    const loaded = load(FILE, NAMES);
    for (const [amount, want] of [[1250, "1250.00"], [5, "5.00"], [12.5, "12.50"]]) {
      const { got } = call(loaded, "formatCedis", amount);
      const text = String(got);
      assert.match(text, /GH₵|GHS|GH¢|₵|cedi/i,
        `formatCedis(${amount}) gave back ${shown(got)} — mark it as cedis, e.g. "GH₵${want}"`);
      assert.ok(text.replace(/,/g, "").includes(want),
        `formatCedis(${amount}) gave back ${shown(got)} — expected "GH₵${want}" (a comma, as in GH₵1,250.00, is fine too). ` +
        `Money always shows two decimal places: .toFixed(2) (Week 2, lesson 5).`);
    }
  });

  test("isValidScore accepts 0 to 100 and nothing else", () => {
    const loaded = load(FILE, NAMES);
    for (const score of [0, 50, 100]) {
      assert.equal(call(loaded, "isValidScore", score).got, true, `${score} is a valid score — isValidScore should return true`);
    }
    for (const score of [-1, 101]) {
      assert.equal(call(loaded, "isValidScore", score).got, false, `${score} is not a valid score — isValidScore should return false`);
    }
    assert.equal(call(loaded, "isValidScore", NaN).got, false,
      "isValidScore(NaN) should return false — NaN is what Number(\"abc\") gives you, and it is not a score. " +
      "Check that the score is 0 or more AND 100 or less, or use Number.isNaN (Week 3, lesson 5)");
  });

  test("the rewritten calculator at the bottom prints something", () => {
    const { output } = load(FILE, NAMES);
    assert.ok(output.length > 0,
      "the file printed nothing. Below your functions, rewrite the Week 3 calculator using them, and print the results with console.log.");
  });
});
