# duabanti-js-yourname

Your work for the DuabaNti JavaScript programme. This repo is called
`duabanti-js-` followed by your own name, all lowercase — `duabanti-js-ama`. You
chose that name when you clicked **Use this template**; if it is different,
change it under **Settings → Repository name**.

## Where your files go

One file per week, in the **top folder** of this repo, named exactly as the
assignment says:

```
week02-converter.js
week03-grade-calculator.js
week04-functions.js
week05-arrays.js
week06-expense-tracker.js      (read by a person — no automatic check)
week07-classes.js
week08-broken.js
week09-async.js
week10-node.js                 (plus a second file of yours next to it, e.g. week10-summary.js,
                                input.json, and PROPOSAL.md)
NOTES.md
```

The name has to match exactly — a capital letter or a space in the wrong place
and the checker will not find it.

**Weekly files 02–09 must not use `import`, `export` or `require`** — the checker
runs them as plain scripts. Week 10 is the week you learn modules, and only the
Week 10 files use them.

Weeks 11 and 12 are projects, and each gets a **new public repo of its own** —
`duabanti-cli-yourname` for Week 11, and one named after your final project for
Week 12. Their lessons show you how to make it. Nothing for those weeks goes in
this repo.

## Checking your own work

Every time you push, GitHub runs the checks for the weeks you have submitted and
puts a ✅ or a ❌ next to your commit. Click the ❌ to read what failed.

**Weeks 6, 11 and 12 are read by a person only** — there is no automatic check
for them, so no tick appears for that work.

You do not need to do anything else — the ✅/❌ on GitHub is enough. If you want
to run one week's checks on your own machine before you push (from Week 4, once
you are comfortable with the VSCode terminal), open the terminal in this folder
and run that week's file:

```bash
node --test tests/week02.test.mjs
```

Change `02` to the week you are checking. You need Node 22 or newer — the LTS
from nodejs.org is fine. There is
nothing to install.

## What the tick actually means

✅ means the automatic checks pass. It is **not** your mark — a mentor reads your
code as well, and marks are for whether it works, whether it is clear, and
whether you can explain it. A green tick with code you cannot explain is worth
nothing when your mentor asks you to explain it.

❌ before the deadline is not a problem. It is the point. Fix it and push again.

## The function names matter

From Week 2 the assignments name the functions the checker looks for — for
example `celsiusToFahrenheit`. Use those exact names, spelled the same way, or
the checker cannot find your work. You can add as many other functions as you
like.

You do **not** need `module.exports`. Just write the functions normally.

## package.json

This repo's `package.json` says `"type": "commonjs"`. Leave it until Week 10,
when the lessons ask you to change it to `"module"` yourself. Do not run
`npm init` in this repo — it already has a `package.json`.
