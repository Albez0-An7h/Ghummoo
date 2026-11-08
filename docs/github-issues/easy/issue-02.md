# Validate offline payment record fields before saving

**Difficulty:** Easy · **Category:** Input validation · **Labels:** `good first issue`, `bug`, `backend`, `frontend`, `easy` · **Estimated effort:** 2–3 hours · **First-time contributor:** Yes (one route, one model and one form; existing tests show how to call the endpoint)

## Problem
`POST /api/operator/bookings/:id/payments` (`server/src/routes/operator.js:557-569`) passes `method`, `externalReference` and `note` from the request body straight to `PaymentRecord.create`. The route validates only `amount`.

- `method` is checked only by the Mongoose enum (`server/src/models/PaymentRecord.js:11`: `upi`, `bank_transfer`, `cash`, `card`, `other`).
- `externalReference` and `note` (`PaymentRecord.js:12-13`) have no length limit.

## Why it matters
Payment records are the organiser's only evidence of money received offline (no payment gateway exists). They should be clean, short and predictable. Error messages should also be readable by organisers, not Mongoose internals.

## Current behaviour
- An unknown method, e.g. `"method": "bitcoin"`, does return 400, but via the generic Mongoose `ValidationError` branch of `server/src/middleware/errorHandler.js`. The message is Mongoose's own text (along the lines of "`bitcoin` is not a valid enum value for path `method`"). A missing method gives "Path `method` is required."
- `externalReference` and `note` are stored at any length up to the 1 MB body limit.
- The client form (`PaymentForm` in `client/src/pages/operator/BookingsPage.jsx:12-50`) uses a select built from `PAYMENT_METHODS` (`client/src/pages/operator/_shared.jsx:20`), but its reference and note inputs have no `maxLength`.

## Expected behaviour
- The route checks `method` against the model's enum before creating the record and returns 400 with a plain message, e.g. "Choose how the payment was received: UPI, bank transfer, cash, card or other".
- `externalReference` and `note` are trimmed strings with caps. Suggested: 100 and 500 characters. Over-long values return 400 with a readable message.
- The schema gets matching `maxlength` values as a backstop.
- The client inputs set `maxLength` with the same caps.

## Acceptance criteria
- [ ] Unknown or missing `method` returns 400 with the readable message (not Mongoose's).
- [ ] Over-long `externalReference` or `note` returns 400; no record is created.
- [ ] The allowed method list is defined once on the server (read it from the schema, e.g. `PaymentRecord.schema.path('method').enumValues`, or export a constant from the model).
- [ ] Existing payment tests in `server/test/api.test.js:137-141` and `server/test/organiser.test.js:161-171` pass unchanged.
- [ ] `npm test`, `npm run lint` and `npm run build` pass.

## Suggested approach
Add a small `parsePayment(body)` helper next to the route that returns `{ amount, method, externalReference, note }` or throws `badRequest`. Keep the amount checks where they are. Export the method list from `PaymentRecord.js` so the route does not repeat it.

## Relevant files
- `server/src/routes/operator.js` (payments route)
- `server/src/models/PaymentRecord.js`
- `client/src/pages/operator/BookingsPage.jsx`, `client/src/pages/operator/_shared.jsx`

## Testing requirements
Add tests (ideally in a new file, or next to the existing payment assertions in `server/test/organiser.test.js`) for: invalid method (400, readable message), missing method (400), over-long note (400) and a valid record (201).

## Dependencies
`medium/07` (splitting `operator.js`) should ideally land first. If it has not started, this issue may land first and `medium/07` rebases onto it. `medium/02` and `medium/12` change the same route; coordinate order with maintainers.
