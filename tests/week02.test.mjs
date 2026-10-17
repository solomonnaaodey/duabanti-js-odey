// Week 2 — Unit converter.  Run: node --test tests/week02.test.mjs
//
// Functions are not taught properly until Week 4, so this is deliberately
// generous about HOW the answer comes back. A conversion passes if the right
// number shows up in any of the ways a Week 2 student might reasonably give it:
//   - returned as a number:             return celsius * 9 / 5 + 32;
//   - returned inside a sentence:       return `${c}°C = ${f}°F`;
//   - printed from inside the function: console.log(`${c}°C = ${f}°F`);
// What it does check is the arithmetic, the names, and that the file prints
// something a person can read. Rounding is judged on the PRINTED output, because
// lesson 5 says to keep full precision while calculating and round for display.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, need } from "./_harness.mjs";

/** How a value reads in a message: NaN as NaN, not as JSON's "null". */
const shown = (v) => (typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v));

const FILE = "week02-converter.js";
const NAMES = ["cedisToDollars", "kmToMiles", "celsiusToFahrenheit"];

/** Every number in a piece of text: "GHc2,000.00 = $170.00" -> [2000, 170]. */
function numbersIn(text) {
  return [...String(text).matchAll(/-?\d[\d,]*(?:\.\d+)?/g)]
    .map((m) => Number(m[0].replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n));
}

/** Call a student's function and collect every number it gave back or printed. */
function answers(loaded, name, input) {
  const f = need(loaded.fns, name, FILE);
  const before = loaded.output.length;
  const got = f(input);
  const printed = loaded.output.slice(before).join(" ");
  const found = [];
  if (typeof got === "number") found.push(got);
  else if (got !== undefined && got !== null) found.push(...numbersIn(got));
  found.push(...numbersIn(printed));
  return { found, got, printed };
}

function shows(loaded, name, input, expected, tolerance) {
  const { found, got, printed } = answers(loaded, name, input);
  const ok = found.some((n) => Math.abs(n - expected) <= tolerance);
  const said = got === undefined ? (printed ? `printed "${printed}"` : "gave back nothing") : `gave back ${shown(got)}`;
  assert.ok(
    ok,
    `${name}(${input}) ${said} — expected it to show about ${expected}.` +
      (got === undefined && !printed ? " Did you forget `return`? (lesson 6, \"Your first function\")" : "")
  );
}

describe("Week 2 — Unit converter", () => {
  test("the file runs without throwing", () => {
    load(FILE, NAMES);
  });

  test("celsiusToFahrenheit converts correctly", () => {
    const loaded = load(FILE, NAMES);
    shows(loaded, "celsiusToFahrenheit", 0, 32, 0.06);
    shows(loaded, "celsiusToFahrenheit", 100, 212, 0.06);
    shows(loaded, "celsiusToFahrenheit", 25, 77, 0.06);
  });

  test("kmToMiles converts correctly", () => {
    const loaded = load(FILE, NAMES);
    shows(loaded, "kmToMiles", 10, 6.21, 0.05);
    shows(loaded, "kmToMiles", 100, 62.14, 0.5);
  });

  test("cedisToDollars applies a rate", () => {
    const loaded = load(FILE, NAMES);
    const small = answers(loaded, "cedisToDollars", 100);
    const big = answers(loaded, "cedisToDollars", 1000);
    const said = small.got === undefined ? (small.printed ? `printed "${small.printed}"` : "gave back nothing") : `gave back ${shown(small.got)}`;
    // A dollar costs well over 1 cedi, so 100 cedis is some amount between 1 and 50
    // dollars whatever this week's rate is. The input itself (100) does not count.
    // And 1000 cedis must come to ten times as much — so a number that merely sits
    // in the sentence (the rate itself, say) is not mistaken for the answer.
    const ok = small.found.some(
      (n) => n > 1 && n < 50 && big.found.some((m) => Math.abs(m - 10 * n) <= Math.max(0.1, 0.05 * 10 * n))
    );
    assert.ok(
      ok,
      `cedisToDollars(100) ${said} — 100 cedis should come to somewhere between 1 and 50 dollars, ` +
        `and cedisToDollars(1000) to ten times that. Multiply by a rate: GH₵1 ≈ $0.085 (lesson 6).`
    );
  });

  test("printed results are rounded sensibly — nobody needs 14 decimal places", () => {
    const { output, source } = load(FILE, NAMES);
    for (const line of output) {
      // A number typed into the file — a rate such as 0.621371 printed as
      // "1 km = 0.621371 miles" — is not a calculated result, so it is not
      // judged. Only long decimals the program worked out have to be rounded.
      const long = [...line.matchAll(/\d+\.\d{4,}/g)].map((m) => m[0]).find((n) => !source.includes(n));
      assert.ok(!long, `"${line}" prints ${long?.[0]} — round results to 2 decimal places when you print them (lesson 5: toFixed(2))`);
    }
  });

  test("it prints something a human can read", () => {
    const { output } = load(FILE, NAMES);
    assert.ok(output.length > 0, "the file should print its results with console.log");
    assert.ok(
      output.some((line) => /[a-zA-Z°₵$]/.test(line) && /\d/.test(line)),
      "print units and labels, not a bare number: `25°C = 77°F`, not `77`"
    );
  });
});
