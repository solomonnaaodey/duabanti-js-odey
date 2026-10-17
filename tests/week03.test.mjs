// Week 3 — Grade calculator.  Run: node --test tests/week03.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, need } from "./_harness.mjs";

/** How a value reads in a message: NaN as NaN, not as JSON's "null". */
const shown = (v) => (typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v));

const FILE = "week03-grade-calculator.js";
const NAMES = ["average", "getGrade", "isValidScore"];

/** A number, or text that is a number ("20.00" from toFixed) — both are a fair answer this week. */
const asNumber = (x) => (typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN);
const near = (got, want) => Math.abs(asNumber(got) - want) <= 0.01;
const letter = (got) => String(got).trim().toUpperCase()[0];

describe("Week 3 — Grade calculator", () => {
  test("the file runs without throwing", () => load(FILE, NAMES));

  test("average returns the mean of a list", () => {
    const f = need(load(FILE, NAMES).fns, "average", FILE);
    for (const [list, want] of [[[10, 20, 30], 20], [[50], 50], [[72, 45, 91], 69.33]]) {
      const got = f(list);
      assert.ok(near(got, want),
        `average([${list}]) gave back ${shown(got)} — expected about ${want}.` +
        (got === undefined ? " Did you forget `return`?" : ""));
    }
  });

  test("average of an empty list is 0, not NaN", () => {
    const f = need(load(FILE, NAMES).fns, "average", FILE);
    const got = f([]);
    assert.ok(asNumber(got) === 0,
      `average([]) gave back ${shown(got)} — check for an empty list first and return 0 (lesson 4, "Building a total")`);
  });

  test("getGrade gives the right letter", () => {
    const f = need(load(FILE, NAMES).fns, "getGrade", FILE);
    const cases = [[100, "A"], [95, "A"], [90, "A"], [89, "B"], [85, "B"], [80, "B"], [79, "C"], [75, "C"], [70, "C"], [69, "D"], [60, "D"], [50, "D"], [49, "F"], [20, "F"], [0, "F"]];
    for (const [score, want] of cases) {
      const got = f(score);
      if (letter(got) === want) continue;
      let hint = "";
      if (got === undefined) {
        hint = " Did you forget `return`? Printing the letter with console.log is not the same as giving it back.";
      } else if (typeof got === "string" && got.trim().length > 1) {
        hint = ` Return just the letter, "${want}", with nothing around it.`;
      } else if (score === 100) {
        hint = " 100 is an A too — \"90 and above\" includes 100.";
      } else if (want === "A") {
        hint = " Check the highest grade first (lesson 1).";
      } else if (score % 10 === 0 || score % 10 === 9) {
        hint = ` ${score} sits on the edge of a band — check >= against > (the brief lists the bands).`;
      }
      assert.fail(`getGrade(${score}) gave back ${shown(got)} — expected "${want}".${hint}`);
    }
  });

  test("isValidScore accepts 0 to 100 and nothing else", () => {
    const f = need(load(FILE, NAMES).fns, "isValidScore", FILE);
    for (const score of [0, 50, 100]) assert.equal(f(score), true, `${score} is a valid score — isValidScore should return true`);
    for (const score of [-1, 101]) assert.equal(f(score), false, `${score} is not a valid score — isValidScore should return false`);
    assert.equal(f(NaN), false,
      "isValidScore(NaN) should return false — NaN is what Number(\"abc\") gives you, and it is not a score. " +
      "Check that the score is 0 or more AND 100 or less, or use Number.isNaN (lesson 5)");
  });

  test("it prints something a human can read", () => {
    const { output } = load(FILE, NAMES);
    assert.ok(output.length > 0, "the file should print each score's grade and the average with console.log");
  });
});
