// Week 9 — Fetch and wait.  Run: node --test tests/week09.test.mjs
// The checker never touches the network: every load hands the file a pretend
// `fetch`, so the result does not depend on wifi or on which API the student
// picked. That also lets it check the three ways lesson 6 says a request fails.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { load, need, hostify, StudentFileError } from "./_harness.mjs";

const FILE = "week09-async.js";
const NAMES = ["fetchData", "formatResult"];

const TEST_URL = "https://example.test/data";
const DATA = { name: "Accra", temperature: 31, humidity: 78 };

/** A pretend Response — just the parts the lessons use. */
function fakeResponse({ ok, status, statusText, json }) {
  return {
    ok, status, statusText,
    headers: { get: () => "application/json" },
    json,
    text: async () => JSON.stringify(await json()),
  };
}

/** A server that works — but only for the URL the test asks for. Records every call. */
function goodFetch() {
  const calls = [];
  const fake = async (url) => {
    calls.push(String(url));
    if (!String(url).startsWith(TEST_URL)) throw new TypeError("fetch failed");
    return fakeResponse({ ok: true, status: 200, statusText: "OK", json: async () => structuredClone(DATA) });
  };
  fake.calls = calls;
  return fake;
}

/** No network at all: fetch rejects, the way it does with the wifi off. */
const downFetch = async () => { throw new TypeError("fetch failed"); };

/** The server answers 404. fetch does NOT reject — the code has to check response.ok. */
const notFoundFetch = async () =>
  fakeResponse({ ok: false, status: 404, statusText: "Not Found", json: async () => ({ error: "Not Found" }) });

/** The server answers 200 but sends an HTML page, so response.json() rejects. */
const notJsonFetch = async () =>
  fakeResponse({
    ok: true, status: 200, statusText: "OK",
    json: async () => { throw new SyntaxError(`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`); },
  });

/** Every load goes through here, so every load has a pretend fetch. */
function loadWith(fakeFetch) {
  try {
    return load(FILE, NAMES, { fetch: fakeFetch });
  } catch (err) {
    if (err instanceof StudentFileError && /await is only valid/.test(err.message)) {
      throw new StudentFileError(err.message +
        "\n  `await` is not allowed at the top of the file. Put those lines in `async function main() { ... }`" +
        "\n  and call `main();` on the last line (lesson 4). Do not rename the file.");
    }
    throw err;
  }
}

/**
 * Lets the file's own main() finish. The pretend fetch answers at once, but a
 * file may wait on something else first (lesson 3's one-second pretend request).
 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 1500));

/**
 * A crash inside the file's own async main() is an "unhandled rejection". The
 * test runner would pin it on whichever test happens to be running, with a bare
 * "fetch failed". Collect them instead; the first test reports them plainly.
 */
const unhandled = [];
function collectUnhandled() {
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", (reason) => unhandled.push(reason));
}

const shown = (v) => (v === undefined ? "undefined" : typeof v === "function" ? "a function" : JSON.stringify(v));

describe("Week 9 — Fetch and wait", () => {
  before(collectUnhandled);

  test("the file runs without crashing, even with the network down", async () => {
    unhandled.length = 0;
    loadWith(downFetch);
    await settle();
    if (unhandled.length) {
      const reason = unhandled[0];
      assert.fail(`with the wifi off, your file crashed: "${reason?.message ?? reason}".\n` +
        "  Something in it is not caught. Check that every `await fetch(...)` and `await response.json()` sits\n" +
        "  inside fetchData's try/catch, that the fetch is awaited, and that formatResult copes with null (lesson 6).");
    }
  });

  test("fetchData is async — calling it gives a promise", async () => {
    const f = need(loadWith(downFetch).fns, "fetchData", FILE);
    const returned = f(TEST_URL);
    assert.ok(returned && typeof returned.then === "function",
      "fetchData should be an `async function`, so calling it gives you a promise (lesson 4)");
    await Promise.resolve(returned).catch(() => {});
  });

  test("with a working server, fetchData(url) gives back the parsed data", async () => {
    const fake = goodFetch();
    const f = need(loadWith(fake).fns, "fetchData", FILE);
    fake.calls.length = 0; // ignore whatever the file fetched for itself when it ran
    const got = await f(TEST_URL);
    assert.ok(fake.calls.some((u) => u.startsWith(TEST_URL)),
      `fetchData("${TEST_URL}") never fetched that address — use the url it is given: \`fetch(url)\`` +
      (fake.calls.length ? ` (it fetched ${fake.calls[0]})` : ""));
    assert.ok(!(got && typeof got.then === "function"),
      "fetchData gave back a Promise — `await response.json()` before returning it (lesson 5)");
    assert.ok(!(got && typeof got.json === "function"),
      "fetchData gave back the response itself — return `await response.json()`, the data inside it (lesson 5)");
    assert.ok(got !== null && got !== undefined,
      `fetchData gave back ${shown(got)} even though the server worked — check \`await fetch(url)\` and ` +
      "`await response.json()`, and that the try block returns the data (lesson 5)");
    assert.deepEqual(hostify(got), DATA,
      `fetchData gave back ${shown(got)} — return the whole parsed data, \`return await response.json()\`, ` +
      "and pick out the parts you want in formatResult");
  });

  test("with no network, fetchData catches the error and gives back null", async () => {
    const f = need(loadWith(downFetch).fns, "fetchData", FILE);
    let got;
    await assert.doesNotReject(async () => { got = await f(TEST_URL); },
      "with the wifi off, fetchData crashed — put the awaits inside try/catch (lesson 6). Test it by turning your wifi off.");
    assert.equal(got, null, `with the wifi off, fetchData gave back ${shown(got)} — return null from the catch (lesson 6)`);
  });

  test("a 404 reply gives back null — fetch does not throw on 404", async () => {
    const f = need(loadWith(notFoundFetch).fns, "fetchData", FILE);
    let got;
    await assert.doesNotReject(async () => { got = await f(TEST_URL); },
      "a 404 reply made fetchData crash — keep the throw inside the try, so the catch handles it (lesson 6)");
    assert.equal(got, null,
      `a 404 reply gave back ${shown(got)} — check \`response.ok\` and throw if it is false (lesson 5, "Check ok")`);
  });

  test("a reply that is not JSON gives back null", async () => {
    const f = need(loadWith(notJsonFetch).fns, "fetchData", FILE);
    let got;
    await assert.doesNotReject(async () => { got = await f(TEST_URL); },
      "a reply that was not JSON made fetchData crash — `return await response.json()` inside the try, " +
      "so the catch sees the error (lesson 6, the three ways it fails)");
    assert.equal(got, null, `a reply that was not JSON gave back ${shown(got)} — return null from the catch (lesson 6)`);
  });

  test("formatResult(null) gives a sentence a person can read", () => {
    const f = need(loadWith(downFetch).fns, "formatResult", FILE);
    let got;
    try {
      got = f(null);
    } catch (err) {
      assert.fail(`formatResult(null) crashed with "${err.message}" — check for no data first: ` +
        '`if (!data) return "Could not load the data..."` (lesson 6)');
    }
    assert.equal(typeof got, "string", `formatResult(null) gave back ${shown(got)} — it should return a sentence`);
    assert.ok(got.trim().length > 5 && !/^(null|undefined)$/i.test(got.trim()),
      `formatResult(null) gave back ${shown(got)} — say what happened and what to do, in a sentence (lesson 6)`);
    assert.ok(!got.includes("[object Object]"), "formatResult is printing an object instead of its fields");
  });

  test('it prints "Loading..." when it runs, and really fetches', async () => {
    // Network down, but every call is recorded — so a file that never calls main() shows up.
    const calls = [];
    const recordingFetch = async (url) => {
      calls.push(String(url));
      throw new TypeError("fetch failed");
    };
    const { output } = loadWith(recordingFetch);
    await settle();
    assert.ok(calls.length > 0,
      "your file never called fetch when it ran — call `main();` on the last line, and have main() call fetchData (lesson 4)");
    assert.ok(output.some((line) => /loading/i.test(line)),
      'print "Loading..." in main() before the first await, and make sure the file calls main() at the end (lesson 6)');
  });

  test("there is a comment explaining why await is needed", () => {
    const { source } = loadWith(downFetch);
    // `//` after a colon is part of a web address ("https://..."), not a comment.
    const comments = [...source.matchAll(/(?<![:\w"'`])\/\/(.*)|\/\*([\s\S]*?)\*\//g)]
      .map((m) => (m[1] || m[2] || "").trim());
    // An explanation may run over several `//` lines in a row — read those as one.
    const runs = [...source.matchAll(/(?:^[ \t]*\/\/.*(?:\r?\n|$))+/gm)]
      .map((m) => m[0].replace(/^[ \t]*\/\//gm, " ").trim());
    // One comment that talks about waiting and is long enough to be a reason —
    // "// async stuff" is a label, not an explanation.
    const explains = (c) => /wait/i.test(c) && c.split(/\s+/).length >= 4;
    assert.ok([...comments, ...runs].some(explains),
      "one comment should explain, in your words, why `await` is needed — a sentence, e.g. " +
      "`// await is needed because fetch takes time: without it we get a Promise, not the data`");
  });
});
