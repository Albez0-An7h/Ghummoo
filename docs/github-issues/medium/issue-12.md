# Record a refund (or an acknowledgement) when declining a paid booking

**Difficulty:** Medium · **Category:** Payments record-keeping · **Labels:** `enhancement`, `backend`, `frontend`, `medium` · **Estimated effort:** 2–3 days · **First-time contributor:** No (changes money records, organiser and traveller screens, and needs a product decision)

## Problem
An organiser can decline a **confirmed** booking (`POST /api/operator/bookings/:id/reject`, `server/src/routes/operator.js:541-555`; the UI calls it "Cancel confirmed booking", `client/src/pages/operator/BookingsPage.jsx:83`). If offline payments were already recorded against it (`PaymentRecord`), nothing records whether that money was returned. `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` ("Declining a paid booking") lists this.

The traveller also cannot see any payment records: `GET /api/bookings/:id` (`server/src/routes/bookings.js`) returns the booking and review only.

## Why it matters
After a decline, the traveller who paid by UPI or bank transfer has no record of whether a refund is coming, and the organiser's revenue figures still count money they may have returned. Ghumo has no payment gateway; this must stay a record of what the organiser did offline, never a claim that Ghumo moved money.

## Current behaviour
- Declining requires a note (3+ characters) and releases seats.
- Payment records remain and keep counting towards the organiser's recorded revenue (`operator.js` stats and insights).
- No refund record type exists (`server/src/models/PaymentRecord.js`, `amount` has `min: 1`).

## Expected behaviour
Proposal, to be confirmed by maintainers:

- `PaymentRecord` gains `kind: 'payment' | 'refund'` (default `payment`; existing records stay payments). Refunds are positive amounts with `kind: 'refund'`, so `min: 1` still holds.
- Declining a booking whose net received amount (payments minus refunds) is above zero requires **one** of:
  - a refund record for the outstanding amount (method, reference, note), created together with the decline; or
  - an explicit acknowledgement with a reason (e.g. "Refund to be sent by bank transfer within 7 days", or "Non-refundable deposit per policy").
- Without either, the API returns 409 with a clear message, and the UI asks for it in the decline dialog.
- Revenue and insights use net amounts.
- The traveller's booking page shows the payment and refund records, labelled "Recorded by the organiser. Ghumo doesn't process payments."

## Acceptance criteria
- [ ] Declining a paid booking without a refund record or acknowledgement → 409; with either → 200 and seats released as today.
- [ ] Declining an unpaid booking works exactly as today.
- [ ] Net received never goes below zero; a refund can't exceed what was received.
- [ ] Stats and insights count refunds correctly.
- [ ] The traveller sees payments, refunds and any acknowledgement on their booking page, and never another traveller's data.
- [ ] No wording suggests online payment or that Ghumo handles money.
- [ ] Tests cover each case.

## Suggested approach
Build on the running total from `medium/02` (an `amountReceived` on `Booking` updated atomically) so the refund and the decline use one conditional update. Store the acknowledgement in the booking history entry for the rejection.

## Relevant files
- `server/src/routes/operator.js` (reject, payments, stats, insights)
- `server/src/routes/bookings.js` (traveller booking detail)
- `server/src/models/PaymentRecord.js`, `server/src/models/Booking.js`
- `client/src/pages/operator/BookingsPage.jsx`, `client/src/pages/BookingPage.jsx`
- `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`

## Testing requirements
API tests for every acceptance criterion, plus an e2e step in the organiser journey (`e2e/02-organiser.spec.js`, B10–B13 already record an offline payment) that declines the paid booking with a refund record and checks the traveller's view.

## Dependencies
- `medium/02` (atomic payments) should land first.
- `medium/07` (split `operator.js`) should land first.
- `easy/02` edits the payment validation used here.

## Notes for maintainers
Decide between "refund record required" and "refund or acknowledgement", and whether travellers should see organiser payment references (UPI reference numbers).
