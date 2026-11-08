# Make departure capacity edits atomic

**Difficulty:** Medium · **Category:** Data integrity · **Labels:** `bug`, `backend`, `testing`, `medium` · **Estimated effort:** 1 day · **First-time contributor:** No (concurrency in the seat inventory)

## Problem
`PUT /api/operator/departures/:id` (`server/src/routes/operator.js:418-430`) changes capacity in three separate steps:

1. `heldSeats(dep._id)` sums seats on `requested` and `confirmed` bookings (lines 410-416, 421);
2. sets `data.seatsAvailable = data.totalCapacity - held` (line 425);
3. writes with `$set` (line 428).

A booking request that lands between steps 1 and 3 has already taken a seat with `holdSeats` (`server/src/services/seats.js:5-11`, an atomic `$inc: { seatsAvailable: -n }`). The `$set` then overwrites `seatsAvailable` with a value computed before that hold, so the seat is counted as free again and the departure can be oversold. `holdSeats` also runs before the `Booking` document is created (`server/src/routes/bookings.js:55-76`), so even the aggregate can miss a hold that is in flight.

## Why it matters
Never overbooking is a core promise and is tested for concurrent bookings (T10, `server/test/api.test.js:178`). A capacity edit while bookings are arriving breaks it.

## Current behaviour
Capacity edits are correct only when no booking is being made at the same moment.

## Expected behaviour
Capacity changes adjust `seatsAvailable` relative to the **current** document in a single update, so concurrent holds and releases are never lost:

```js
// delta = newCapacity - current totalCapacity, computed inside the update
TripDeparture.findOneAndUpdate(
  { _id, $expr: { $gte: [{ $add: ['$seatsAvailable', { $subtract: [newCap, '$totalCapacity'] }] }, 0] } },
  [{ $set: {
    seatsAvailable: { $add: ['$seatsAvailable', { $subtract: [newCap, '$totalCapacity'] }] },
    totalCapacity: newCap,
  } }],
  { new: true }
);
```

If the guard fails (the new capacity would leave fewer seats than are held), the route returns the existing 409 "Capacity can't be lower than the N seat(s) already requested or confirmed". Other fields in the same request (dates, price, status) are applied in the same update or in a separate `$set` that never touches `seatsAvailable`.

## Acceptance criteria
- [ ] A capacity edit running concurrently with booking requests never leaves `seatsAvailable` higher than `totalCapacity` minus the seats on active bookings.
- [ ] Lowering capacity below held seats still returns 409 with the same message.
- [ ] Raising capacity adds exactly the difference to `seatsAvailable`.
- [ ] The cancel-with-active-bookings check (line 422) and all other validation stay as they are.
- [ ] Existing tests pass unchanged (including the capacity check at `server/test/api.test.js:211-213`).

## Suggested approach
Move the capacity logic into `server/src/services/seats.js` (e.g. `changeCapacity(departureId, newCap)`) next to `holdSeats` and `releaseSeats`, which already use the same aggregation-pipeline update style. Keep `heldSeats` only for building the 409 message.

## Relevant files
- `server/src/routes/operator.js` (departure update)
- `server/src/services/seats.js`
- `server/src/routes/bookings.js` (hold before booking creation)
- `server/test/api.test.js` (T10)

## Testing requirements
A concurrency test modelled on T10: on a departure with free seats, fire several one-seat booking requests and a capacity change together with `Promise.all`, repeated a few times; after each round assert `seatsAvailable === totalCapacity - sum(seats of requested and confirmed bookings)`. Also unit-test `changeCapacity` for raise, lower and refused cases.

## Dependencies
`medium/07` (split `operator.js`) should land first; this edits the same file.
