# Limit seat holds from pending booking requests

**Difficulty:** Medium · **Category:** Marketplace integrity · **Labels:** `enhancement`, `security`, `backend`, `medium` · **Estimated effort:** 1–3 days (after the policy decision) · **First-time contributor:** No (needs a maintainer decision first and touches the core booking flow)

## Problem
A booking request holds seats immediately: `POST /api/bookings` calls `holdSeats` (`server/src/routes/bookings.js:55`), which decrements `seatsAvailable` atomically (`server/src/services/seats.js:5-11`). Seats come back only when the organiser declines or the traveller cancels. There is no limit on how many open requests one traveller may have on a departure (each request may be up to 10 seats, `bookings.js:10`), and no expiry.

## Why it matters
One account can make a departure look sold out by sending a few large requests and never following up. Other travellers see "sold out" and the organiser loses real bookings. Because organisers confirm requests manually, this can go unnoticed for days.

## Current behaviour
- A single traveller can hold every seat on a departure. `server/test/traveller.test.js:217-226` does exactly that on purpose to test the sold-out state.
- Requests never expire.

## Expected behaviour
Proposed policy, to be confirmed by maintainers before coding:

- **Cap:** a traveller may have at most N active (`requested`) bookings on one departure, and at most M seats held across them. Suggested starting values: N = 1, M = 10 (the current per-booking maximum). Over the cap → 409 with a clear message ("You already have a request for this departure. You can cancel it from My trips and send a new one").
- **Optional expiry:** a `requested` booking older than X days (or past the departure's `bookingDeadline`) is moved to a new terminal state or to `cancelled` with a history note, and its seats are released. This needs a scheduled sweep, which the app does not have today; a lazy sweep on read is an alternative.

Confirmed bookings are not affected by either rule.

## Acceptance criteria
- [ ] The agreed policy is written in the issue before coding starts.
- [ ] The cap is enforced server-side without a race: two concurrent requests from one traveller cannot both pass (e.g. check with a conditional insert or a unique partial index on `{ user, departure }` where `status: 'requested'`).
- [ ] The client shows the refusal clearly on the booking page.
- [ ] If expiry is in scope: expired requests release their seats exactly once, travellers see why on their booking page, and organisers see it in the booking history.
- [ ] `server/test/traveller.test.js` is updated to the new rule (fill the departure from several accounts) without weakening what it checks.
- [ ] `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` is updated.

## Suggested approach
For N = 1 a unique partial index (`{ user: 1, departure: 1 }`, `partialFilterExpression: { status: 'requested' }`) is the simplest race-free check. The existing duplicate-key branch in `server/src/middleware/errorHandler.js` returns 409, but the message should be replaced with a specific one in the route. Seats already held must be released when the insert fails (the route already does this in its `catch`).

## Relevant files
- `server/src/routes/bookings.js`
- `server/src/services/seats.js`
- `server/src/models/Booking.js`
- `client/src/pages/BookPage.jsx`
- `server/test/traveller.test.js`, `server/test/api.test.js` (T10 books six one-seat requests from one account)

## Testing requirements
API tests for: second request refused, concurrent requests (only one succeeds and seats are held once), cancelling the first request allows a new one, and expiry if implemented.

## Dependencies
None in code. Blocked on a maintainer decision about the policy.

## Notes for maintainers
Decide N, M, whether expiry is in scope, and what a traveller who genuinely needs two separate bookings (e.g. two families) should do. T10 in `server/test/api.test.js` sends six concurrent requests from one traveller; with N = 1 it must be rewritten to use several accounts.
