# Add ESLint to the server and include it in `npm run lint`

**Difficulty:** Easy · **Category:** Developer tooling · **Labels:** `enhancement`, `backend`, `devops`, `easy` · **Estimated effort:** 3–6 hours · **First-time contributor:** No (adds dev dependencies and may surface real issues that need judgement)

## Problem
Only the client is linted. The root `lint` script runs `npm run lint --prefix client` (root `package.json`), and `server/package.json` has no lint script or ESLint dependency. The server code already contains 13 `eslint-disable` comments that currently do nothing:

- 12 × `eslint-disable-next-line no-await-in-loop` in `server/src/index.js`, `server/src/config/db.js`, `server/src/services/ai/provider.js` and `server/src/utils/text.js`.
- 1 × `eslint-disable-line no-unused-vars` in `server/src/middleware/errorHandler.js:1` (Express needs the four-argument signature).

## Why it matters
The server holds the business rules (seat holds, roles, grounding). Linting catches unused variables, accidental globals and unhandled sequential awaits before review. CI (`.github/workflows/ci.yml`) already runs `npm run lint`, so wiring the server in gives it CI coverage at once.

## Current behaviour
No server lint. The disable comments are not checked.

## Expected behaviour
- `server/eslint.config.js` (flat config, CommonJS, `globals.node`), extending `@eslint/js` recommended.
- `no-await-in-loop` explicitly enabled (it is **not** in `recommended`), so the existing disable comments become meaningful.
- `reportUnusedDisableDirectives` on, so a stale disable comment is reported.
- Test files (`server/test/**`) linted too, with `node:test` style allowed.
- `"lint": "eslint ."` in `server/package.json`; the root script runs client and server lint.
- Every error found is fixed, or disabled on the line with a short reason in the comment.

## Acceptance criteria
- [ ] `npm run lint` from the root lints both client and server and exits 0.
- [ ] `no-await-in-loop` is enabled; every remaining loop with `await` either has a justified disable comment or is rewritten.
- [ ] No unused disable directives remain.
- [ ] Dev dependencies added only to `server/package.json`: `eslint`, `@eslint/js`, `globals`, at the same major versions the client uses (`client/package.json`). The PR states why (no existing server lint; same tools as the client, so no new maintenance surface).
- [ ] No production dependency changes; `npm test` and `npm run build` pass.

## Suggested approach
Copy the structure of `client/eslint.config.js`, drop the React plugins, set `sourceType: 'commonjs'`. Run `npx eslint .` in `server/` and fix in small commits. Expect hits in seed and migration loops (`server/src/seedData.js`, `server/src/migrations/v0_1.js`); sequential awaits there are often intended (ordered inserts) and can be justified.

## Relevant files
- `server/package.json`, root `package.json`
- `client/eslint.config.js` (reference)
- Files with existing disable comments, listed above
- `.github/workflows/ci.yml` (no change expected; it already calls `npm run lint`)

## Testing requirements
Run `npm run lint`, `npm test` and `npm run build`. Mention in the PR how many problems were found and how each group was handled.

## Dependencies
None. Server PRs open at the same time may start failing lint once this lands; announce it to contributors.
