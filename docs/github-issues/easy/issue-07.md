# Unit tests for client formatting and trip-query helpers

**Difficulty:** Easy · **Category:** Testing · **Labels:** `good first issue`, `testing`, `frontend`, `easy` · **Estimated effort:** 2–4 hours · **First-time contributor:** Yes (pure functions, existing test file to copy)

## Problem
`client/src/lib/format.js` (money, dates, durations, image sizing) has no tests. `client/src/lib/tripParams.js` is partly covered in `client/test/discovery.test.js:31-46`, but several branches are untested.

## Why it matters
These helpers decide how every price, date and duration is shown to travellers. Prices must be shown exactly as stored, never rounded into something misleading, and an empty value must say "—" rather than "₹0".

## Current behaviour
Probing the functions shows:

- `money(12999)` → `₹12,999`; Indian grouping applies to lakhs (`125000` → `₹1,25,000`). `money(null)` and `money('abc')` → `—`. An unknown currency code falls back to `CODE 1,000`.
- `duration(5, 4)` → `5D / 4N`; `durationLong(2, 0)` → `2 days, 0 nights`.
- `toTripParams({ month: '2027-13' })` returns `{ from: '2027-13-01', to: '2027-13-31' }`: the month check (`tripParams.js:14`) accepts any two digits, so an invalid month from a hand-edited URL is sent to the API as an invalid date range. `'2027-00'` behaves the same way.

## Expected behaviour
A new test file covers each exported helper. For the month bug, the test asserts that months outside 01–12 are dropped, and the regex in `tripParams.js` is tightened so the test passes (a one-line change).

## Acceptance criteria
- [ ] `money`: INR formatting, lakh grouping, `null`/`NaN` → `—`, another valid currency (e.g. `USD`), invalid currency fallback.
- [ ] `date`, `shortDate`, `weekdayDate`, `dateTime`, `dateRange` (same month, same year, different years, missing end), with deterministic inputs.
- [ ] `duration` and `durationLong`, including singular/plural and a missing night count.
- [ ] `toInputDate`, `sized` (Unsplash URL rewritten, other URLs unchanged, empty input), `daysUntil` (relative to today).
- [ ] `toTripParams`: cases not already in `discovery.test.js` (destination, limit, `sort: 'departure'` dropped, `available` false) and months `00` and `13` dropped.
- [ ] `tripParams.js` accepts only months 01–12.
- [ ] `npm test --prefix client` passes.

## Suggested approach
Create `client/test/format.test.js` (and add the extra `toTripParams` cases there or in `discovery.test.js`), using `node:test` and `node:assert/strict` with `.js` import paths, exactly like `client/test/discovery.test.js`. Date helpers use the local time zone: set `process.env.TZ = 'Asia/Kolkata'` at the top of the file before any `Date` is created, and use midday times (e.g. `2026-12-10T12:00:00Z`) so results don't depend on the machine.

## Relevant files
- `client/src/lib/format.js`
- `client/src/lib/tripParams.js`
- `client/test/discovery.test.js` (conventions)

## Testing requirements
`npm test --prefix client` must pass locally and in CI (`.github/workflows/ci.yml` runs `npm test`).

## Dependencies
None.
