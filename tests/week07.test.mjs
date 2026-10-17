// Week 7 — Class design.  Run: node --test tests/week07.test.mjs
// Students pick their own subject (a trotro route, a shop, a team), so this
// checks the shape of the design rather than guessing names. Structure is read
// from the source; the printed summary from actually running the file.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./_harness.mjs";

const FILE = "week07-classes.js";

const classesIn = (src) => [...src.matchAll(/^[ \t]*class\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);

/**
 * The source with every class body blanked out, so a `new X(` inside a static
 * factory (lesson 4's `fromString`) is not counted as well as the call to it.
 * Brace matching is rough — a `{` inside a string can fool it — but class
 * bodies in a beginner's file are plain enough.
 */
function outsideClasses(src) {
  let out = "";
  let i = 0;
  // Anchored to the start of a line, so `// Using the class` in a comment is not read as one.
  const re = /^[ \t]*class\s+[A-Za-z_$][\w$]*[^{]*\{/gm;
  let m;
  while ((m = re.exec(src))) {
    out += src.slice(i, m.index);
    let depth = 1;
    let j = m.index + m[0].length;
    while (j < src.length && depth > 0) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") depth--;
      j++;
    }
    i = j;
    re.lastIndex = j;
  }
  return out + src.slice(i);
}

/** Static methods declared in the file — `static fromString(text) {`. */
const staticsIn = (src) => [...src.matchAll(/^[ \t]+static\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map((m) => m[1]);

/**
 * Instances of the file's OWN classes: `new Route(...)`, or a call to one of its
 * static methods, `Route.fromString(...)`. `throw new Error(...)` does not count.
 * One made inside a loop or a `.map` is counted as several.
 */
function countInstances(src) {
  const classes = classesIn(src);
  if (classes.length === 0) return 0;
  const names = classes.map((c) => c.replace(/\$/g, "\\$")).join("|");
  const statics = staticsIn(src).map((s) => s.replace(/\$/g, "\\$"));
  const outside = outsideClasses(src);
  const patterns = [new RegExp(`\\bnew\\s+(?:${names})\\s*\\(`, "g")];
  if (statics.length) patterns.push(new RegExp(`\\b(?:${names})\\.(?:${statics.join("|")})\\s*\\(`, "g"));
  let count = 0;
  for (const re of patterns) {
    for (const m of outside.matchAll(re)) {
      const before = outside.slice(0, m.index).split("\n").slice(-3).join("\n");
      count += /\.map\s*\(|\.forEach\s*\(|\bfor\s*\(/.test(before) ? 3 : 1;
    }
  }
  return count;
}

describe("Week 7 — Class design", () => {
  test("the file runs without throwing", () => load(FILE));

  test("there are at least two classes, and one extends the other", () => {
    const { source } = load(FILE);
    const names = classesIn(source);
    assert.ok(names.length >= 2, `found ${names.length} class(es) — the brief asks for two (lesson 3 and lesson 4)`);
    assert.match(source, /\bclass\s+[A-Za-z_$][\w$]*\s+extends\s+/,
      "one class should `extends` another — `class ExpressRoute extends TrotroRoute` (lesson 4)");
  });

  test("the base class has a constructor", () => {
    const { source } = load(FILE);
    assert.match(source, /constructor\s*\(/, "a class needs a constructor that takes its data (lesson 3)");
  });

  test("a class has at least three methods of its own", () => {
    const { source } = load(FILE);
    const body = source.slice(Math.max(0, source.search(/\bclass\s/)));
    // Any indentation counts, spaces or tabs.
    const methods = [...body.matchAll(/^[ \t]+(?:static\s+|get\s+|async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)]
      .map((m) => m[1])
      .filter((n) => !["constructor", "if", "for", "while", "switch", "catch", "function"].includes(n));
    assert.ok(methods.length >= 3,
      `found ${methods.length} method(s) (${methods.join(", ") || "none"}) — the brief asks for three, ` +
      "written like `summary() { ... }` inside the class (lesson 3)");
  });

  test("at least three instances are created", () => {
    const { source } = load(FILE);
    const found = countInstances(source);
    assert.ok(found >= 3,
      `found ${found} instance(s) of your classes — create at least three. ` +
      "Separate `new YourClass(...)` lines are simplest (lesson 3).");
  });

  test("a summary is printed for a person to read", () => {
    const { output, source } = load(FILE);
    assert.ok(output.length > 0,
      "nothing was printed — call your summary method and print it: `console.log(madina.summary())` (lesson 2)");
    // A method printed without its brackets, `console.log(x.summary)`, shows up
    // here as the method's own source text — not a sentence.
    const looksLikeCode = (l) => /^\s*(?:async\s+)?[\w$]+\s*\([^)]*\)\s*\{/.test(l);
    // A summary is built from the object's data, so it never appears word for word
    // in the file. A fixed heading like "My trotro routes" does.
    const builtByCode = (l) => !source.includes(l.trim());
    assert.ok(output.some((l) => l.trim().length > 10 && !l.includes("[object Object]") && !looksLikeCode(l) && builtByCode(l)),
      "print the summary sentence your method returns, not a bare value, a fixed heading or the object itself — " +
      "and call it with brackets: `console.log(madina.summary())`, not `console.log(madina.summary)`");
  });
});
