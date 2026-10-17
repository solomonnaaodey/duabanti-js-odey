// Week 10 — First Node script.
//
// This one inspects the repo rather than running the script: running it would
// need `npm install`, and the checker deliberately installs nothing. So it reads
// your files and checks the things the brief asks for, the way a mentor would
// skim them before running anything.
//
// "Your Week 10 files" means week10-node.js, every file it imports from your own
// folder (and every file those import), and any other week10-*.js file. Your
// Week 2–9 files are ignored here — they are checked by their own weeks.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ENTRY = "week10-node.js";
const EARLIER_WEEK = /^week0[2-9]-.*\.js$/;

const LESSON = {
  npm: "Week 10, lesson 2 (npm, package.json and installing a package)",
  modules: "Week 10, lesson 3 (Modules: splitting code across files)",
  files: "Week 10, lesson 4 (Reading and writing files)",
  gitignore: "Week 10, lesson 5 (node_modules and .gitignore)",
  proposal: "Week 10, lesson 6 (Your final project proposal)",
};

const say = (...lines) => "\n  " + lines.join("\n  ");

/** True only if the file exists with exactly this capitalisation (macOS and Windows forgive a wrong capital; GitHub's Linux machines do not). */
function existsExactly(file) {
  const dir = path.dirname(file);
  if (!existsSync(dir)) return false;
  return readdirSync(dir).includes(path.basename(file));
}

/** Source without comments, so a commented-out import does not count. Rough, but enough. */
function code(file) {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

/** Every module name a file imports or requires: "./week10-summary.js", "chalk", "node:fs/promises". */
function specifiers(src) {
  const found = [];
  const patterns = [
    // Anchored to the start of an import/export statement, so a message such as
    // console.log("Loaded from './input.json'") is not mistaken for an import.
    /^\s*(?:import|export)\b[^;"'`]*?\bfrom\s*["']([^"']+)["']/gm,  // import x from "y"   export { x } from "y"
    /^\s*import\s*["']([^"']+)["']/gm,           // import "y"
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,   // await import("y")
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,  // require("y")
  ];
  for (const re of patterns) for (const m of src.matchAll(re)) found.push(m[1]);
  return found;
}

const isLocal = (spec) => spec.startsWith("./") || spec.startsWith("../");
const usesImportSyntax = (src) => /^\s*(import\s|import\{|export\s)/m.test(src);
const usesRequire = (src) => /\brequire\s*\(/.test(src) || /\bmodule\.exports\b/.test(src);

/** Package name from a specifier: "chalk" → chalk, "dayjs/plugin/utc.js" → dayjs, "@scope/pkg/x" → @scope/pkg. */
function packageName(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** Where a local import points. ES modules need the exact filename; require also tries adding .js. */
function resolveLocal(fromFile, spec) {
  const target = path.normalize(path.join(path.dirname(fromFile), spec));
  if (existsExactly(target)) return target;
  if (!path.extname(target) && existsExactly(target + ".js")) return target + ".js";
  return null;
}

/** week10-node.js, everything it reaches through local imports, and any other week10-*.js in the top folder. */
function week10Files() {
  const seen = new Set();
  const queue = [ENTRY, ...readdirSync(".").filter((f) => /^week10-.*\.js$/.test(f))];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file) || !existsExactly(file)) continue;
    if (EARLIER_WEEK.test(path.basename(file)) || file.split(path.sep).includes("node_modules")) continue;
    seen.add(file);
    for (const spec of specifiers(code(file)).filter(isLocal)) {
      const target = resolveLocal(file, spec);
      if (target) queue.push(target);
    }
  }
  return [...seen];
}

function needEntry() {
  if (!existsExactly(ENTRY)) {
    assert.fail(say(
      `${ENTRY} not found.`,
      `The file you run has to be called exactly "${ENTRY}" and sit in the top folder of your`,
      `duabanti-js repo, next to package.json — not inside another folder, not index.js.`,
      `Your second file sits next to it, for example week10-summary.js.`,
    ));
  }
}

function readPackage() {
  if (!existsSync("package.json")) {
    assert.fail(say(
      "There is no package.json in the top folder of your repo.",
      "Your repo came with one from the template — if you deleted it, get it back from GitHub",
      `(or copy it from the template repo). See ${LESSON.npm}.`,
    ));
  }
  try {
    return JSON.parse(readFileSync("package.json", "utf8"));
  } catch (err) {
    assert.fail(say(
      `package.json is not valid JSON, so neither npm nor Node can read it: ${err.message}`,
      "The usual causes: a missing comma between lines, a comma after the LAST line, or 'single quotes'.",
    ));
  }
}

describe("Week 10 — First Node script", () => {
  test(`${ENTRY} is in the top folder of the repo`, () => {
    needEntry();
  });

  test(`${ENTRY} imports from a second file of yours`, () => {
    needEntry();
    const pkg = readPackage();
    const esm = pkg.type === "module";
    const local = specifiers(code(ENTRY)).filter(isLocal);

    assert.ok(local.length > 0, say(
      `${ENTRY} does not import anything from another file of yours.`,
      "Put some of the work in a second file next to it, export it there, and import it here:",
      '    import { summarise } from "./week10-summary.js";',
      `The "./" at the start is what tells Node it is YOUR file. See ${LESSON.modules}.`,
    ));

    for (const spec of local) {
      if (esm && !path.extname(spec)) {
        assert.fail(say(
          `${ENTRY} imports "${spec}" with no ".js" on the end.`,
          `With "type": "module" Node needs the full filename: "${spec}.js". See ${LESSON.modules}.`,
        ));
      }
      const target = resolveLocal(ENTRY, spec);
      assert.ok(target, say(
        `${ENTRY} imports "${spec}", but there is no file with exactly that name in the repo.`,
        "Check the spelling and the capitals — Week10-Summary.js and week10-summary.js are different",
        "files on GitHub, even if your laptop treats them as the same. And check it was committed.",
      ));
      assert.ok(!EARLIER_WEEK.test(path.basename(target)), say(
        `${ENTRY} imports ${target}, an earlier week's file.`,
        "Weeks 2–9 must stay plain scripts with no import or export — the checker for those weeks runs",
        "them that way. Make a new file for Week 10 instead, for example week10-summary.js.",
      ));
      const src = code(target);
      assert.ok(/\bexport\b/.test(src) || /\bmodule\.exports\b|\bexports\.\w+\s*=/.test(src), say(
        `${ENTRY} imports ${target}, but ${target} does not export anything.`,
        "Put `export` in front of the function you want to share:",
        "    export function summarise(records) { ... }",
        `See ${LESSON.modules}.`,
      ));
    }
  });

  test('package.json says "type": "module", and your files use import', () => {
    needEntry();
    const pkg = readPackage();
    const sources = week10Files().map(code);
    const importing = sources.some(usesImportSyntax);
    const requiring = sources.some(usesRequire);

    // Week 10 is the ES modules week, so "module" is required whichever way the
    // files are written — a require-based submission is not what was asked for.
    assert.equal(pkg.type, "module", say(
      importing
        ? `Your Week 10 files use import/export, but package.json says "type": ${JSON.stringify(pkg.type ?? "(missing)")}.`
        : `package.json says "type": ${JSON.stringify(pkg.type ?? "(missing)")}. Week 10 uses ES modules, so it has to say "type": "module".`,
      importing && pkg.type === "commonjs"
        ? "Node will stop with: SyntaxError: Cannot use import statement outside a module."
        : importing
          ? "Without it Node has to guess what kind of file this is, and other tools may guess wrong."
          : "Write your Week 10 files with import and export, not require and module.exports.",
      pkg.type === undefined
        ? 'Open package.json and add this line:   "type": "module",'
        : `Open package.json and change ${JSON.stringify(pkg.type)} to "module":   "type": "module",`,
      `Do not run npm init — your repo already has a package.json. See ${LESSON.npm} and ${LESSON.modules}.`,
    ));
    if (requiring && pkg.type === "module") {
      assert.fail(say(
        'package.json says "type": "module", but your Week 10 files use require or module.exports.',
        'Node will stop with: ReferenceError: require is not defined in ES module scope.',
        `Use import and export instead, as in ${LESSON.modules}.`,
      ));
    }
  });

  test("one package from npm is a dependency, and your code imports it", () => {
    needEntry();
    const pkg = readPackage();
    const deps = Object.keys(pkg.dependencies ?? {});
    const devDeps = Object.keys(pkg.devDependencies ?? {});

    if (deps.length === 0 && devDeps.length > 0) {
      assert.fail(say(
        `${devDeps.join(", ")} is installed as a devDependency — "only needed while developing".`,
        "Your program needs its package to run, so it belongs under dependencies. Install it again",
        `without --save-dev:   npm install ${devDeps[0]}`,
        `See ${LESSON.npm}.`,
      ));
    }
    assert.ok(deps.length > 0, say(
      'package.json has no "dependencies" — no package from npm has been installed.',
      "In the VSCode terminal, in your repo folder, install one small package, for example:",
      "    npm install chalk",
      "npm adds it to package.json for you. Then commit package.json and package-lock.json.",
      `See ${LESSON.npm}.`,
    ));

    const used = new Set(
      week10Files().flatMap((f) => specifiers(code(f))).filter((s) => !isLocal(s) && !s.startsWith("node:")).map(packageName),
    );
    assert.ok(deps.some((d) => used.has(d)), say(
      `package.json lists ${deps.join(", ")}, but none of your Week 10 files import it.`,
      "Installing is half of it — use it too. For example:",
      `    import chalk from "chalk";`,
      `    console.log(chalk.green("Done"));`,
      `See ${LESSON.npm}.`,
    ));
  });

  test(".gitignore lists node_modules", () => {
    assert.ok(existsSync(".gitignore"), say(
      "There is no .gitignore in the top folder of your repo.",
      "Create one (the dot at the start matters) with node_modules/ on its own line.",
      `See ${LESSON.gitignore}.`,
    ));
    const lines = readFileSync(".gitignore", "utf8").split(/\r?\n/).map((l) => l.trim());
    assert.ok(lines.some((l) => /^\/?node_modules\/?$/.test(l)), say(
      ".gitignore does not have node_modules on a line of its own.",
      "Add this line:   node_modules/",
      `See ${LESSON.gitignore}.`,
    ));
  });

  test("node_modules was not committed", (t) => {
    // node_modules on disk is normal after `npm install`, so its existence proves
    // nothing locally. What matters is whether Git is tracking it — so ask Git.
    let tracked;
    try {
      tracked = execFileSync("git", ["ls-files", "--", "node_modules"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      t.skip("not a Git repo here (or Git is not installed), so this one is checked on GitHub when you push");
      return;
    }
    const count = tracked.split("\n").filter(Boolean).length;
    assert.equal(count, 0, say(
      `node_modules is committed — Git is tracking ${count} file(s) inside it.`,
      "This is the classic beginner mistake. Your .gitignore does not undo it on its own:",
      "in the VSCode terminal, in your repo folder, run",
      "    git rm -r --cached node_modules",
      'then commit ("Stop tracking node_modules") and push. Your files stay on your laptop.',
      `See ${LESSON.gitignore}.`,
    ));
  });

  test("the script reads a file in and writes a file out", () => {
    needEntry();
    const src = week10Files().map(code).join("\n");
    assert.match(src, /\breadFile(Sync)?\s*\(/, say(
      "None of your Week 10 files read a file in.",
      '    const text = await readFile("input.json", "utf8");',
      `See ${LESSON.files}.`,
    ));
    assert.match(src, /\b(writeFile|writeFileSync|appendFile|appendFileSync)\s*\(/, say(
      "None of your Week 10 files write a file out.",
      '    await writeFile("report.txt", report, "utf8");',
      `See ${LESSON.files}.`,
    ));

    // A file read by its plain name ("input.json") has to be in the repo, or
    // nobody who clones it can run it. Files the script also writes are fine to be missing.
    const literal = (re) => [...src.matchAll(re)].map((m) => m[1]);
    const written = new Set(literal(/\b(?:writeFile|writeFileSync|appendFile|appendFileSync)\s*\(\s*["'`]([^"'`$]+)["'`]/g));
    for (const name of literal(/\breadFile(?:Sync)?\s*\(\s*["'`]([^"'`$]+)["'`]/g)) {
      if (written.has(name)) continue;
      assert.ok(existsExactly(name), say(
        `Your script reads "${name}", but there is no file with exactly that name in the repo.`,
        "Commit the input file, so whoever clones your repo can run it — a repo that reads",
        `input.json and does not contain one cannot be marked. See ${LESSON.files}.`,
      ));
    }
  });

  test("PROPOSAL.md has the four headings", () => {
    assert.ok(existsExactly("PROPOSAL.md"), say(
      "PROPOSAL.md not found in the top folder of your repo.",
      "Part 2 of this week is your final project proposal, in a file called exactly PROPOSAL.md.",
      `See ${LESSON.proposal}.`,
    ));
    const headings = [...readFileSync("PROPOSAL.md", "utf8").matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]);
    const wanted = [
      ["What I am building", /build/i],
      ["Who it is for", /\bwho\b/i],
      ["The three things it must do", /three|\b3\b/i],
      ["What might go wrong", /wrong/i],
    ];
    const missing = wanted.filter(([, re]) => !headings.some((h) => re.test(h))).map(([name]) => name);
    assert.deepEqual(missing, [], say(
      `PROPOSAL.md is missing ${missing.length === 1 ? "this heading" : "these headings"}: ${missing.join(", ")}.`,
      "It needs four, each starting with ## :",
      "    ## What I am building",
      "    ## Who it is for",
      "    ## The three things it must do",
      "    ## What might go wrong",
      `See ${LESSON.proposal}.`,
    ));
  });
});
