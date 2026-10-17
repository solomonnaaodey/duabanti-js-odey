// Week 5 — Array workout.  Run: node --test tests/week05.test.mjs
//
// Every function is handed a list of student objects like { name: "Ama", score: 72 }.
// The checker uses its own lists, not yours — two different ones — so your
// functions must work on whatever list they are given, not on your list by name.
// It is generous about small choices the lessons leave open (a total of "532"
// counts as 532; getTopScorer may return Esi's object or just "Esi"), and strict
// about the results.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, need, hostify } from "./_harness.mjs";

/** How a value reads in a message: NaN as NaN, not as JSON's "null". */
const shown = (v) => (typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v));

const FILE = "week05-arrays.js";
const NAMES = ["getNames", "getPassing", "getTotal", "getTopScorer", "rank"];
const STUDENTS = [
  { name: "Ama", score: 72 }, { name: "Kofi", score: 45 }, { name: "Esi", score: 91 },
  { name: "Yaw", score: 38 }, { name: "Akua", score: 65 }, { name: "Kwame", score: 88 },
  { name: "Abena", score: 54 }, { name: "Kojo", score: 79 },
];
const PASSED = ["Ama", "Esi", "Akua", "Kwame", "Abena", "Kojo"]; // 50 or more
const TOTAL = 532;

/** A second, different list: a function that ignores its input and reads a list of its own fails here. */
const OTHERS = [
  { name: "Adjoa", score: 60 }, { name: "Fiifi", score: 97 }, { name: "Nana", score: 30 }, { name: "Kofi", score: 50 },
];
const OTHERS_PASSED = ["Adjoa", "Fiifi", "Kofi"];
const OTHERS_TOTAL = 237;

/** For getTopScorer: someone above 90 comes before the real top scorer here, and nobody reaches 90 in the next. */
const HIGH_FIRST = [{ name: "Akos", score: 92 }, { name: "Edem", score: 98 }, { name: "Baaba", score: 40 }];
const NOBODY_90 = [{ name: "Yaa", score: 70 }, { name: "Ebo", score: 85 }, { name: "Esi", score: 62 }];

/** A fresh copy every time, so one function cannot spoil the list for the next. */
const fresh = (list = STUDENTS) => list.map((s) => ({ name: s.name, score: s.score }));
const IGNORED = "Does it use the list it is given (its parameter), not a list of your own by name?";
const asNumber = (x) => (typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN);

describe("Week 5 — Array workout", () => {
  test("the file runs without throwing", () => load(FILE, NAMES));

  test("getNames returns just the names", () => {
    const got = hostify(need(load(FILE, NAMES).fns, "getNames", FILE)(fresh()));
    assert.ok(Array.isArray(got),
      `getNames(students) gave back ${shown(got)} — it should return an array of names, made with map (lesson 3)`);
    assert.deepEqual(got, STUDENTS.map((s) => s.name),
      "getNames(students) should give back the names in the same order, e.g. [ 'Ama', 'Kofi', ... ] (lesson 3, \"Pulling one field out\")");
    const other = hostify(need(load(FILE, NAMES).fns, "getNames", FILE)(fresh(OTHERS)));
    assert.deepEqual(other, OTHERS.map((s) => s.name),
      `getNames gave back ${shown(other)} for a list of ${OTHERS.map((s) => s.name).join(", ")}. ${IGNORED}`);
  });

  test("getPassing keeps everyone who scored 50 or more", () => {
    const got = hostify(need(load(FILE, NAMES).fns, "getPassing", FILE)(fresh()));
    assert.ok(Array.isArray(got),
      `getPassing(students) gave back ${shown(got)} — it should return an array, made with filter (lesson 4)`);
    assert.ok(got.every((s) => s && typeof s === "object"),
      `getPassing(students) gave back ${shown(got)} — it should return the whole student objects, ` +
      "like { name: 'Ama', score: 72 }, not just the names (lesson 4)");
    const names = got.map((s) => s.name);
    assert.deepEqual(names, PASSED,
      `getPassing(students) kept ${shown(names)} — expected the ${PASSED.length} students with 50 or more: ${PASSED.join(", ")}. ` +
      "Is it >= 50, not > 50? (lesson 4)");
    const other = hostify(need(load(FILE, NAMES).fns, "getPassing", FILE)(fresh(OTHERS)));
    const otherNames = Array.isArray(other) ? other.map((s) => s?.name) : other;
    assert.deepEqual(otherNames, OTHERS_PASSED,
      `getPassing kept ${shown(otherNames)} from a list of ${OTHERS.map((s) => `${s.name} ${s.score}`).join(", ")} — ` +
      `expected ${OTHERS_PASSED.join(", ")}. ${IGNORED}`);
  });

  test("getTotal adds up every score", () => {
    const got = need(load(FILE, NAMES).fns, "getTotal", FILE)(fresh());
    assert.ok(Math.abs(asNumber(got) - TOTAL) <= 0.01,
      `getTotal(students) gave back ${shown(got)} — the scores add up to ${TOTAL}. ` +
      (got === undefined ? "Did you forget `return`?" : "Add each student's .score, starting from 0 (lesson 6)."));
    const other = need(load(FILE, NAMES).fns, "getTotal", FILE)(fresh(OTHERS));
    assert.ok(Math.abs(asNumber(other) - OTHERS_TOTAL) <= 0.01,
      `getTotal gave back ${shown(other)} for a list whose scores add up to ${OTHERS_TOTAL}. ${IGNORED}`);
  });

  test("getTotal of an empty list is 0, not a crash", () => {
    const f = need(load(FILE, NAMES).fns, "getTotal", FILE);
    let got;
    try {
      got = f([]);
    } catch (err) {
      assert.fail(`getTotal([]) crashed: ${err.message}. Give reduce a starting value of 0 (lesson 6, "Always pass the starting value")`);
    }
    assert.ok(asNumber(got) === 0, `getTotal([]) gave back ${shown(got)} — an empty list totals 0 (lesson 6)`);
  });

  test("getTopScorer finds the highest", () => {
    const got = hostify(need(load(FILE, NAMES).fns, "getTopScorer", FILE)(fresh()));
    const name = typeof got === "string" ? got : got?.name;
    assert.equal(name, "Esi",
      `getTopScorer(students) gave back ${shown(got)} — Esi scored 91, the highest. ` +
      "It should return Esi's student object (lesson 4, \"The top scorer\").");
    const other = hostify(need(load(FILE, NAMES).fns, "getTopScorer", FILE)(fresh(OTHERS)));
    const otherName = typeof other === "string" ? other : other?.name;
    assert.equal(otherName, "Fiifi",
      `getTopScorer gave back ${shown(other)} for a list where Fiifi scored 97, the highest. ${IGNORED}`);
    // Two more lists, so the answer has to come from comparing scores, not from a fixed number like 90.
    for (const [list, top] of [[HIGH_FIRST, "Edem"], [NOBODY_90, "Ebo"]]) {
      const got3 = hostify(need(load(FILE, NAMES).fns, "getTopScorer", FILE)(fresh(list)));
      const name3 = typeof got3 === "string" ? got3 : got3?.name;
      const scored = list.find((s) => s.name === top).score;
      assert.equal(name3, top,
        `getTopScorer gave back ${shown(got3)} for a list of ${list.map((s) => `${s.name} ${s.score}`).join(", ")} — ` +
        `expected ${top}, who scored ${scored}, the highest. Find the highest score by comparing the students with each ` +
        "other, not against a fixed number (lesson 4, \"The top scorer\").");
    }
  });

  test("rank orders highest first", () => {
    const got = hostify(need(load(FILE, NAMES).fns, "rank", FILE)(fresh()));
    assert.ok(Array.isArray(got),
      `rank(students) gave back ${shown(got)} — it should return the students as an array, highest score first (lesson 5)`);
    assert.equal(got.length, STUDENTS.length, `rank(students) gave back ${got.length} students — expected all ${STUDENTS.length}`);
    const scores = got.map((s) => s?.score);
    const want = STUDENTS.map((s) => s.score).sort((a, b) => b - a);
    assert.deepEqual(scores, want,
      `rank(students) put the scores in this order: ${scores.join(", ")} — expected highest first: ${want.join(", ")}. ` +
      "For numbers, sort needs (a, b) => b.score - a.score (lesson 5, \"Sorting objects\").");
    const other = hostify(need(load(FILE, NAMES).fns, "rank", FILE)(fresh(OTHERS)));
    const otherScores = Array.isArray(other) ? other.map((s) => s?.score) : other;
    assert.deepEqual(otherScores, [97, 60, 50, 30],
      `rank gave back the scores ${shown(otherScores)} for a list scoring 60, 97, 30, 50 — expected 97, 60, 50, 30. ${IGNORED}`);
  });

  test("rank leaves the original list in its original order", () => {
    const loaded = load(FILE, NAMES);
    const other = fresh(OTHERS);
    need(loaded.fns, "rank", FILE)(other);
    assert.deepEqual(other.map((s) => s.name), OTHERS.map((s) => s.name),
      "rank(students) changed the order of the list it was given. sort rearranges the array you call it on — " +
      "copy first with students.slice(), then sort the copy (lesson 5, \"Trap two\").");
    const input = fresh();
    need(loaded.fns, "rank", FILE)(input);
    assert.deepEqual(input.map((s) => s.name), STUDENTS.map((s) => s.name),
      "rank(students) changed the order of the list it was given. sort rearranges the array you call it on — " +
      "copy first with students.slice(), then sort the copy (lesson 5, \"Trap two\").");
  });

  test("it prints a readable summary", () => {
    const { output } = load(FILE, NAMES);
    assert.ok(output.length > 0, "the file should print a readable summary with console.log");
  });
});
