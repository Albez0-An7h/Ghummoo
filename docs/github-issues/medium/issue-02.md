# Make offline payment recording atomic

**Difficulty:** Medium · **Category:** Data integrity · **Labels:** `bug`, `backend`, `testing`, `medium` · **Estimated effort:** 1–2 days · **First-time contributor:** No (concurrency, a schema change and a data backfill)

## Problem
`POST /api/operator/bookings/:id/payments` (`server/src/routes/operator.js:557-569`) sums the existing records with an aggregate (line 562), checks that the new amount fits within `booking.totalAmount` (line 563), and only then creates the record (line 564). Two requests that arrive together both read the same old sum, both pass the check, and both are saved.

## Why it matters
Recorded payments are the only revenue figures Ghumo shows (operator stats and insights read them, `operator.js` around lines 82 and 119). An organiser double-clicking "Save payment record" on a slow connection could record more money than the booking is worth, and the outstanding amount would go negative.

## Current behaviour
Sequential over-payment is refused (tested in `server/test/api.test.js:141` and `server/test/organiser.test.js:171`). Concurrent requests are not protected.

## Expected behaviour
The check and the write happen atomically, so the total of a booking's payment records can never exceed `totalAmount`, however many requests arrive at once.

Two acceptable designs:

1. **Running total on the booking (preferred, matches `services/seats.js`).** Add `amountReceived` (default 0) to `Booking`. Reserve the amount with one conditional update, e.g. `findOneAndUpdate({ _id, status: 'confirmed', $expr: { $lte: [{ $add: [{ $ifNull: ['$amountReceived', 0] }, amount] }, '$totalAmount'] } }, { $inc: { amountReceived: amount } })`. If it matches, create the `PaymentRecord`; if creating fails, `$inc` back.
2. **Transaction.** Wrap read and write in a MongoDB transaction. This needs a replica set; check whether the embedded test database (`mongodb-memory-server`) and the Atlas deployment support it before choosing this.

With option 1, existing bookings need `amountReceived` backfilled from their records. Add an idempotent step to the existing migration (`server/src/migrations/v0_1.js`, `runFoundation`), like `backfillConfirmedSeats`.

## Acceptance criteria
- [ ] Concurrent payment requests can never make the recorded total exceed `totalAmount`.
- [ ] Error responses are unchanged: 400 "Recorded payments would exceed the booking total", 409 for non-confirmed bookings.
- [ ] Existing bookings with payments get the correct `amountReceived` on boot (migration is idempotent).
- [ ] The operator bookings list (`operator.js:482-495`) shows the same `amountReceived` values as before; it may read the new field instead of aggregating.
- [ ] Existing payment tests pass unchanged.

## Suggested approach
Put the reserve/release logic in a small service, e.g. `server/src/services/payments.js`, next to the seat functions, so the route stays thin.

## Relevant files
- `server/src/routes/operator.js` (payments route, bookings list)
- `server/src/models/Booking.js`, `server/src/models/PaymentRecord.js`
- `server/src/services/seats.js` (pattern to follow)
- `server/src/migrations/v0_1.js`

## Testing requirements
Add a concurrency test modelled on T10 in `server/test/api.test.js:178`: confirm a booking, then send several payment requests at once (e.g. six of 40% each) with `Promise.all`; assert that exactly two succeed, the rest return 400, and the stored records sum to at most `totalAmount`. Add a migration test that backfills `amountReceived` from existing records.

## Dependencies
- `medium/07` (split `operator.js`) should land first.
- `easy/02` edits the same route; land it first or rebase.
- `medium/12` (refund trail) depends on this issue's design for the running total.
