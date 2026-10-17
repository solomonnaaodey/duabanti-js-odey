/**
 * Loads a student's file and hands the tests its functions.
 *
 * Beginners are not taught `module.exports` until Week 10, and the published
 * assignments never mention it — so requiring it would fail people for a thing
 * nobody told them. Instead the file is evaluated in a sandbox and the named
 * functions are read straight out of its top-level scope, which works for
 * `function f() {}` and `const f = () => {}` alike. `module.exports` also works
 * if they happen to use it.
 *
 * Top-level `console.log` still runs — Week 2 asks for printed output — so it is
 * captured rather than allowed to spill into the test report.
 */
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

export class StudentFileError extends Error {}

/**
 * `overrides` replaces sandbox globals for one load — e.g. `{ fetch: fakeFetch }`
 * so a test can decide what the network returns instead of using the real one.
 */
export function load(file, names = [], overrides = {}) {
  if (!existsSync(file)) {
    throw new StudentFileError(
      `\n  ${file} not found.\n` +
        `  The filename has to be exactly "${file}" — not a capital letter or a space different.\n` +
        `  It must sit in the top folder of the repo, not inside another folder.`
    );
  }

  const source = readFileSync(file, "utf8");
  const output = [];
  const record = (...args) => output.push(args.map(String).join(" "));

  const moduleObj = { exports: {} };
  const sandbox = {
    // Every console method a lesson teaches, so a leftover `console.table` (Week 8)
    // is recorded instead of crashing the whole file.
    console: {
      log: record, info: record, warn: record, error: record, debug: record,
      table: record, dir: record, trace: record, count: record, timeEnd: record, timeLog: record,
      group: record, groupCollapsed: record, groupEnd: () => {}, time: () => {}, assert: () => {},
    },
    module: moduleObj,
    exports: moduleObj.exports,
    require: (name) => {
      throw new StudentFileError(
        `\n  ${file} calls require("${name}").\n` +
          `  The checker runs your file with nobody at the keyboard, so it cannot use readline or other\n` +
          `  modules until Week 10. Put your data in the file, or read it from process.argv (Week 3).`
      );
    },
    fetch,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    TextEncoder,
    TextDecoder,
    AbortSignal,
    AbortController,
    // exit() is a no-op: a file that exits early on bad input should not take the
    // tests down with it. stdout.write is recorded like console.log.
    process: { argv: ["node", file], env: {}, exit: () => {}, exitCode: 0, stdout: { write: (t) => record(String(t).replace(/\n$/, "")) } },
    ...overrides,
  };
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  const harvest = names
    .map((n) => `${JSON.stringify(n)}: (typeof ${n} === "function" ? ${n} : undefined)`)
    .join(", ");
  const wrapped = `${source}\n;({ ${harvest} })`;

  let picked;
  try {
    picked = vm.runInContext(wrapped, context, { timeout: 10_000, displayErrors: true });
  } catch (err) {
    if (err instanceof StudentFileError) throw err;
    // `node file.js` allows a bare `return` at the top of a file, so the student
    // sees no error when they run it — tell them what is actually wrong.
    if (err && err.message === "Illegal return statement") {
      throw new StudentFileError(
        `\n  ${file} has a \`return\` outside any function.\n` +
          `  Node lets that run at the top of a file, but the checker does not: \`return\` belongs\n` +
          `  inside a function. At the top of the file, use if/else instead (Week 3, lesson 1).`
      );
    }
    throw new StudentFileError(
      `\n  ${file} threw an error before any test could run:\n` +
        `    ${err.message}\n` +
        `  Run it yourself first — \`node ${file}\` — and fix that error.`
    );
  }

  // Anything assigned to module.exports wins, so an explicit export is honoured.
  const fns = { ...picked };
  for (const [k, v] of Object.entries(moduleObj.exports || {})) {
    if (typeof v === "function") fns[k] = v;
  }
  return { fns, output, source };
}

/** A clear failure when a required function simply is not there. */
export function need(fns, name, file) {
  const fn = fns[name];
  if (typeof fn !== "function") {
    throw new StudentFileError(
      `\n  ${file} does not define a function called \`${name}\`.\n` +
        `  The assignment lists the exact names the grader looks for.\n` +
        `  Spelling and capitals matter: \`${name}\`, not \`${name.toLowerCase()}\`.`
    );
  }
  return fn;
}

/**
 * Copies a value out of the sandbox realm into this one.
 *
 * The student's code runs in a `vm` context, which has its OWN `Array` and
 * `Object`. An array it returns therefore has the sandbox's `Array.prototype`,
 * and `assert.deepStrictEqual` compares prototypes — so a correct answer fails
 * with "expected [91, 88] to equal [91, 88]", which would be a cruel thing to
 * show a beginner. Rebuild the value with this realm's constructors first.
 */
export function hostify(value) {
  if (Array.isArray(value)) return Array.from(value, hostify);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) out[key] = hostify(value[key]);
    return out;
  }
  return value;
}

/** Numbers compared the way a human would, not to 14 decimal places. */
export function closeTo(actual, expected, tolerance = 0.01) {
  return typeof actual === "number" && Math.abs(actual - expected) <= tolerance;
}
