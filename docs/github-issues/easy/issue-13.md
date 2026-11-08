# Test traveller cancellation edge cases

**Difficulty:** Easy · **Category:** Testing · **Labels:** `good first issue`, `testing`, `backend`, `easy` · **Estimated effort:** 3–5 hours · **First-time contributor:** Yes (tests only, using the existing API test client)

## Problem
`POST /api/bookings/:id/cancel` (`server/src/routes/bookings.js:114-130`) has several rules, but only the successful path is tested:

- the caller must own the booking (otherwise 403 for the trip's organiser, or 404 for anyone else, via `loadAccessible`);
- only `requested` or `confirmed` bookings can be cancelled (409 otherwise);
- a trip that has started cannot be cancelled (409);
- a conditional update (`findOneAndUpdate` with a status filter) prevents a double cancellation from releasing seats twice.

Successful cancellations are already covered in `server/test/api.test.js:205-209`, `server/test/traveller.test.js:236` and `server/test/groups.test.js:198`. `server/test/india.test.js:226-265` already checks that cancelling a confirmed booking lowers `confirmedSeats` and that cancelling a request does not. No test covers the refusals or the race.

## Why it matters
Seat inventory is the marketplace's core promise: seats must never be released twice or released for a trip that has already left. These rules are easy to break during refactors such as `medium/03` or `medium/07`.

## Current behaviour
The code enforces the rules above; there are no tests that would catch a regression.

## Expected behaviour
A test file exercises each refusal and the concurrent case.

## Acceptance criteria
- [ ] Cancelling a **rejected** booking returns 409.
- [ ] Cancelling an **already cancelled** booking returns 409.
- [ ] Cancelling after the departure's `startDate` has passed returns 409.
- [ ] Another traveller cancelling the booking gets 404; the trip's organiser calling the traveller endpoint gets 403. Neither changes the booking.
- [ ] Two **concurrent** cancel requests for the same booking: exactly one returns 200, the other 409, and `seatsAvailable` rises by the booking's seat count exactly once.
- [ ] Each test restores or isolates the data it changes, so other tests are unaffected.
- [ ] The `confirmedSeats` cases already in `india.test.js` are not duplicated.

## Suggested approach
Create `server/test/cancellation.test.js`, copying the setup block (temporary embedded MongoDB, `seed()`, `client()` helper) from `server/test/api.test.js:1-59`.

- To get a "trip started" booking, create a booking on a future departure, then move the departure's `startDate` into the past directly with the model (`TripDeparture.updateOne`), as `india.test.js` does with direct model calls.
- For the race, book on a departure that still has other free seats. `releaseSeats` caps `seatsAvailable` at `totalCapacity` (`server/src/services/seats.js:14-20`), so on a nearly empty departure a double release could be hidden by the cap.

## Relevant files
- `server/src/routes/bookings.js` (cancel route, `loadAccessible`)
- `server/src/services/seats.js`
- `server/test/api.test.js`, `server/test/india.test.js` (setup and style)

## Testing requirements
`npm test --prefix server` passes, and the new file passes when run on its own (`node --test test/cancellation.test.js`).

## Dependencies
None.
