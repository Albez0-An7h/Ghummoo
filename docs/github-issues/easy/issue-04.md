# Make `npm run seed` refuse to wipe a remote database without `--force`

**Difficulty:** Easy · **Category:** Developer safety · **Labels:** `good first issue`, `bug`, `backend`, `devops`, `easy` · **Estimated effort:** 2–4 hours · **First-time contributor:** Yes (one small script, no database access needed to test the guard)

## Problem
`server/src/seed.js` calls `clearAll()` (which runs `deleteMany({})` on ten collections, `server/src/seedData.js:281-283`) and then reloads demo data. The only guard (`seed.js:8-11`) refuses when `NODE_ENV=production`. A developer whose local `server/.env` points `MONGODB_URI` at a shared or production Atlas cluster, but without `NODE_ENV=production`, wipes it with one command.

## Why it matters
AGENTS.md treats `npm run seed` as destructive and asks people to confirm before running it. The script should enforce the same rule: wiping a remote database should take a deliberate extra step, and the script should say which database it is about to wipe.

## Current behaviour
- With `MONGODB_URI=mongodb+srv://…` and no `NODE_ENV`, `npm run seed` wipes and reseeds that cluster without asking.
- Nothing is printed about the target before the wipe.
- From the repository root, `npm run seed -- --force` does **not** pass `--force` to `seed.js`: the root script is `npm run seed --prefix server` (root `package.json`), and npm consumes the extra flag. Only `npm run seed --prefix server -- --force` or `cd server && npm run seed -- --force` forward it. README "Database setup" (around line 113) suggests `npm run seed -- --force` without saying where to run it.

## Expected behaviour
- Before connecting, the script works out the target: "embedded database at server/.data" when `MONGODB_URI` is unset, otherwise the host(s) and database name from the URI with credentials masked (the `safeUri` helper in `server/src/index.js:22` shows the masking rule).
- It prints `About to wipe and reseed: <target>`.
- It refuses (exit code 1, clear message) unless `--force` is passed when either `NODE_ENV=production` **or** the URI host is not local. Local means: `localhost`, `127.0.0.1`, `::1`, or the embedded database. Any `mongodb+srv://` URI is remote.
- `--force` reaches the script from the root as well, or the README documents the exact working command.

## Acceptance criteria
- [ ] Remote URI without `--force`: exits 1 before connecting, prints the masked target and how to force.
- [ ] Local or embedded target: behaves as today.
- [ ] `NODE_ENV=production` without `--force`: still refused.
- [ ] Credentials never appear in the output.
- [ ] Running from the repository root with `--force` works, or README states the exact command; README and the command agree.
- [ ] The decision logic is a pure, exported function with unit tests.

## Suggested approach
Move the decision into a function such as `seedTarget(env, argv)` returning `{ label, local, allowed, reason }`, in `server/src/seed.js` (guarded by `require.main === module` so tests can import it) or a small module under `server/src/utils/`. To forward the flag from the root, change the root script to `npm run seed --prefix server --` so extra arguments pass through; check it by running the guard with a remote URI (it refuses before connecting, so nothing is touched).

## Relevant files
- `server/src/seed.js`
- `server/src/seedData.js` (`clearAll`)
- `server/src/index.js` (`safeUri`)
- `package.json` (root `seed` script), `README.md`

## Testing requirements
Unit tests in `server/test/` for `seedTarget`: unset URI, `mongodb://localhost:27017/x`, `mongodb://127.0.0.1/x`, `mongodb+srv://user:pass@cluster.example.net/ghumo` (refused, password masked), production without and with `--force`. Do **not** run the real seed against any database you care about while testing.

## Dependencies
None.
