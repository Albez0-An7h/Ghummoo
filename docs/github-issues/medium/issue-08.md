# Remove the `/v01` design prototype or put it behind a build flag

**Difficulty:** Medium · **Category:** Cleanup · **Labels:** `enhancement`, `frontend`, `medium` · **Estimated effort:** 0.5–1 day · **First-time contributor:** No (needs owner approval first; deletes a large amount of code)

## Problem
`client/src/v01/` holds a design prototype of the traveller pages (home, trips, trip, place, cities, Explore India, compare, decide) running on **sample data**: `client/src/v01/data/packages.js` (about 17 KB) and `client/src/v01/data/india.generated.json` (about 40 KB). It is routed in production at `/v01/*` (`client/src/main.jsx:48` and `:119`) as a lazy chunk, not linked from the navigation. `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` (Engineering debt) says it should be removed or flagged before a public launch.

## Why it matters
- Anyone who finds `/v01` sees trips, prices and seat counts that are not in the database, which conflicts with the rule that nothing shown is invented.
- It duplicates the live traveller pages in `client/src/traveller/` and `client/src/pages/`, so design changes may be made in the wrong place.
- It doubles the surface that `easy/09` and future frontend work must keep compiling.

## Current behaviour
- `/v01/*` renders the prototype in the production build.
- The prototype imports these shared modules, **all of which are also used by live pages** (checked by tracing imports): `components/ui.jsx`, `components/FlightCursor.jsx`, `lib/format.js`, `lib/discovery.js`, `lib/useAsync.js`, `motion/useSceneMotion.js`, `scenes/index.jsx`, `scenes/landscapes.jsx`, and from `design/`: `Booking`, `Cards`, `Compare`, `ComparisonTable`, `context`, `Dialog`, `Feedback`, `Inputs`, `Navbar`, `SearchBox`. No module in `client/src/design/` or `client/src/scenes/` is used only by the prototype, so none of them should be deleted with it.
- `client/src/v01/usePageTitle.js` duplicates `client/src/lib/usePageTitle.js`.
- `scripts/export-india-content.js` (root script `npm run content:export`) writes `client/src/v01/data/india.generated.json` and exists only for the prototype.

## Expected behaviour
One of the following, chosen by the owner:

- **A. Remove:** delete `client/src/v01/`, the lazy import and route in `main.jsx`, `scripts/export-india-content.js` and the `content:export` script, and update docs that mention `/v01`.
- **B. Flag:** include the route only when a build-time variable is set (e.g. `VITE_ENABLE_PROTOTYPE=true`), using a static `import.meta.env` check so Vite drops the chunk from normal builds. Label every page "Prototype: sample data".

## Acceptance criteria
- [ ] Owner has approved option A or B in this issue.
- [ ] A normal `npm run build` contains no prototype chunk and no sample package data (check `client/dist/assets`).
- [ ] `/v01` in production returns the normal not-found page.
- [ ] No live page changes; shared modules listed above remain.
- [ ] `npm run lint`, `npm test`, `npm run build` and `npm run test:e2e` pass.
- [ ] Docs referring to the prototype (`docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`, and any of `docs/V0_1_*.md` that mention `/v01`) are updated.

## Suggested approach
Search the repo for `v01` and `V01App` first. Re-run the import trace after the change to confirm nothing outside the prototype became unused (`vite build` warnings and lint help).

## Relevant files
- `client/src/v01/` (whole folder), `client/src/main.jsx`
- `scripts/export-india-content.js`, root `package.json`
- `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`

## Testing requirements
Build, lint, unit and e2e suites; open the main traveller pages by hand to confirm nothing changed.

## Dependencies
Coordinate with `easy/09`, which edits `client/src/main.jsx` and the shared modules' exports.

## Notes for maintainers
Requires owner approval before any code is written. `docs/OPEN_SOURCE_STRATEGY.md` also lists `india.generated.json` and `v01/data/packages.js` among content whose licensing needs a decision; removing them simplifies that.
