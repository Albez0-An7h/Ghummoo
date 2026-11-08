# Automated accessibility checks in the Playwright suite

**Difficulty:** Medium · **Category:** Accessibility · **Labels:** `enhancement`, `testing`, `frontend`, `medium` · **Estimated effort:** 2–3 days (including fixes) · **First-time contributor:** No (adds a dev dependency and requires judgement on what to fix now and what to file)

## Problem
`e2e/03-quality.spec.js` checks horizontal overflow, console errors, the mobile filter drawer, form validation messages, reduced motion, layout shift and image sizing, but no accessibility rules (contrast, labels, landmarks, ARIA misuse). AGENTS.md requires every important feature to work with a keyboard and with reduced motion, and the `accessibility` skill is to be checked on every UI change, but nothing enforces it automatically.

## Why it matters
Manual checks miss regressions. A rule engine run on the main pages catches missing labels, low contrast on the brand colours and broken ARIA before release.

## Current behaviour
No automated accessibility rules. The quality spec already visits the right pages: `PUBLIC` (10 paths), `TRAVELLER` (`/me/trips`) and `ORGANISER` (5 paths), defined at `e2e/03-quality.spec.js:10-12`.

## Expected behaviour
- `@axe-core/playwright` added as a root dev dependency. Justification for the PR: Playwright has no built-in rule engine; axe-core is the standard open-source engine, maintained by Deque, MPL-2.0 licensed, and used only in tests, so nothing reaches the production bundle.
- A new spec (e.g. `e2e/05-accessibility.spec.js`) runs axe on the public, traveller and organiser pages above, signed in where needed with the existing `apiLogin` helper, at a desktop and a 390px viewport.
- Tags: WCAG 2.1 A and AA.
- The test fails on any violation with impact `serious` or `critical`; `moderate` and `minor` are written to `e2e/quality-metrics.json` for the report.
- Violations found on first run are fixed in the same PR when small, or filed as separate issues and listed in a temporary, documented allow-list with the issue number. The allow-list must not hide new violations.

## Acceptance criteria
- [ ] `npm run test:e2e` runs the accessibility spec and fails on a new serious or critical violation.
- [ ] Every allow-listed rule has an issue link and a page scope; no global rule disabling.
- [ ] Fixes use the design tokens in `client/src/index.css` (no hex colours in components).
- [ ] The CI e2e job (`.github/workflows/ci.yml`) runs the new spec without extra setup.
- [ ] `docs/GHUMO_V0_1_TEST_REPORT.md` notes what is covered and what is not (axe cannot check everything, e.g. focus order and meaningful alt text).

## Suggested approach
Reuse the page lists from `03-quality.spec.js` (export them from `e2e/helpers.js` rather than copying). Wait for `networkidle` before analysing, as the existing sweep does. Exclude third-party image hosts only if they cause false positives, and say so.

## Relevant files
- `e2e/03-quality.spec.js`, `e2e/helpers.js`, `playwright.config.js`
- Root `package.json` (dev dependency)
- `client/src/index.css` (tokens), pages flagged by the scan

## Testing requirements
Run the full Playwright suite locally and in CI. Include the summary of violations found and how each was handled in the PR description.

## Dependencies
None.
