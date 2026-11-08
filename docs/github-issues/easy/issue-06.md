# Unit tests for server text utilities (`server/src/utils/text.js`)

**Difficulty:** Easy · **Category:** Testing · **Labels:** `good first issue`, `testing`, `backend`, `easy` · **Estimated effort:** 2–4 hours · **First-time contributor:** Yes (pure functions, no database, uses the built-in `node --test` runner)

## Problem
`server/src/utils/text.js` holds helpers used across the API: `slugify`, `uniqueSlug`, `bookingReference`, `escapeRegex`, `toList` and `csvCell`. Only `csvCell` has tests (`server/test/hardening.test.js:85-94`). The others are exercised indirectly at best.

## Why it matters
Slugs become public URLs (`/trips/:slug`), booking references are what travellers and organisers quote to each other, and `escapeRegex` protects the organiser booking search (`server/src/routes/operator.js`, `bookingQuery`). A regression in any of them is easy to miss without direct tests.

## Current behaviour
Probing the functions shows some behaviour worth pinning down (or fixing):

- `slugify('Café Delhi')` → `cafe-delhi` (accents are stripped).
- `slugify('मनाली ट्रिप')` → `item`: text in Devanagari or any non-Latin script is removed entirely, so the fallback is used.
- `slugify('--Hello--')` → `-hello-`: leading and trailing hyphens survive.
- The 70-character cap (`text.js:10`) can leave a trailing hyphen, e.g. 69 letters followed by `" b"`.
- `bookingReference()` returns `GHM-` plus 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no `I`, `L`, `O`, `0`, `1`).

## Expected behaviour
A new test file documents the intended behaviour of each helper. Where current behaviour looks unintended (the hyphen cases above), the test should either assert the current output with a comment, or the contributor proposes a one-line fix in the same PR after a maintainer agrees.

## Acceptance criteria
- [ ] `slugify`: lower-casing, accent stripping, spaces and underscores to single hyphens, empty/`null`/`undefined` → `item`, non-Latin input behaviour, length cap of 70.
- [ ] `uniqueSlug`: returns the base slug when free; adds a suffix when taken; respects `excludeId`; falls back to a time-based suffix after 20 collisions. Use a fake model (`{ exists: async (q) => … }`), no database.
- [ ] `bookingReference`: matches `^GHM-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$` over many calls (for example 500).
- [ ] `toList`: arrays (trimmed, blanks dropped, non-strings stringified), newline-separated strings, and other types → `[]`.
- [ ] `escapeRegex`: for a string full of regex metacharacters, `new RegExp(escapeRegex(s)).test(s)` is true and matches literally.
- [ ] No test duplicates the existing `csvCell` cases in `hardening.test.js`.
- [ ] `npm test` passes.

## Suggested approach
Create `server/test/text.test.js` using `node:test` and `node:assert/strict`, like the other server tests. Import from `../src/utils/text`. No `before`/`after` hooks or database are needed.

## Relevant files
- `server/src/utils/text.js`
- `server/test/hardening.test.js` (existing `csvCell` tests, for style)

## Testing requirements
Run `npm test --prefix server`. The new file must run in well under a second because it touches no database.

## Dependencies
None.

## Notes for maintainers
Decide whether non-Latin titles should produce something better than `item` (for example a transliteration or an ID-based slug). That is a product decision and out of scope here; the test should simply record today's behaviour.
