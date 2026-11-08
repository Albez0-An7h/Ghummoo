# Exercise the review flow end to end with a completed-trip test fixture

**Difficulty:** Medium · **Category:** Testing · **Labels:** `testing`, `backend`, `frontend`, `medium` · **Estimated effort:** 1–2 days · **First-time contributor:** No (needs a test-only way to create past trips without touching demo data)

## Problem
Travellers can review a trip only when their booking is confirmed and the departure has ended (`POST /api/bookings/:id/review`, `server/src/routes/bookings.js:142-154`; model `server/src/models/Review.js`). The booking page shows the form only in that state (`client/src/pages/BookingPage.jsx:62` and `:162`), and the trip page lists visible reviews (`client/src/pages/TripDetailPage.jsx:434-436`, data from `ratingSummary` in `server/src/services/trips.js:131-139`).

The seed has no completed trips, and the API refuses to create a departure in the past (`server/src/routes/operator.js`, "Departure date must be in the future"). So this flow has never run in a browser, and there are no server tests for the review endpoint either. `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` ("Reviews") records the gap.

## Why it matters
Reviews are the main trust signal in a marketplace. The rules that keep them honest (only real, completed, confirmed trips; one per booking; 1–5 rating) must be tested, and AGENTS.md forbids seeding fake reviews to make the feature look used.

## Current behaviour
- No server test calls `/api/bookings/:id/review`.
- No e2e journey reaches the review form.
- **Admin hiding does not exist.** `Review.hidden` exists and public reads filter on `hidden: false` (`server/src/services/trips.js:132`, `server/src/routes/organisers.js:11`), but there is no admin endpoint or UI to set it, and `Report.targetType` has no `review` option. That part of the original idea is out of scope here.

## Expected behaviour
- **Server tests** for the review rules.
- **A test-only fixture** that creates a departure that ended yesterday, with a confirmed booking for the demo traveller, used by both server and e2e tests. It is never part of `seed()` or demo data and is clearly named (e.g. package title "E2E fixture: completed trip").
- **An e2e test** in which the traveller opens the completed booking, leaves a rating and comment, sees the "You reviewed this trip" notice, and then sees the review on the public trip page.

## Acceptance criteria
- [ ] Server tests: a review on a confirmed, ended booking returns 201; on a future trip 409; on a requested, rejected or cancelled booking 409; by another user 404 (or 403 for the trip's organiser); rating outside 1–5 or not an integer 400; a second review for the same booking is refused (unique index → 409) and the error message is readable.
- [ ] The fixture lives under `server/test/` or `e2e/` only; `server/src/seedData.js` is unchanged and still seeds no reviews.
- [ ] The e2e test passes in CI and leaves no data in the developer's database (the e2e server already uses a temporary database, `e2e/start-app.js`).
- [ ] The review shows the author's first name only, as `ratingSummary` does today.

## Suggested approach
- Server tests: create the past departure with `TripDeparture.create` directly, as other tests use models directly (`server/test/india.test.js`).
- E2E: the app runs in a separate process with an embedded database. One option is to set a fixed `EMBEDDED_DB_PORT` in `e2e/start-app.js`, then have a small `e2e/fixtures.js` connect with Mongoose after `/api/health` is ready and insert the fixture. Another is a server start-up hook enabled only by an e2e-only environment variable; if you choose this, make sure it can never run in production.

## Relevant files
- `server/src/routes/bookings.js` (review route), `server/src/models/Review.js`
- `server/src/services/trips.js` (`ratingSummary`), `server/src/routes/organisers.js`
- `client/src/pages/BookingPage.jsx`, `client/src/pages/TripDetailPage.jsx`
- `e2e/start-app.js`, `e2e/helpers.js`, `e2e/01-traveller.spec.js`

## Testing requirements
Server suite, the new e2e test, and the full e2e suite (the fixture must not change results of other journeys, e.g. trip counts on `/trips`).

## Dependencies
None.

## Notes for maintainers
Decide which fixture mechanism to allow for e2e. If review moderation is wanted, file it as a separate issue (admin endpoint to hide a review, `review` as a report target).
