# Email notifications and password reset

**Difficulty:** Hard · **Category:** Product infrastructure · **Labels:** `enhancement`, `security`, `backend`, `frontend`, `architecture`, `hard` · **Estimated effort:** 2–3 weeks · **First-time contributor:** No (maintainer-led; needs a provider choice and touches authentication)

## Problem
Ghumo sends no email at all (no mail dependency in `server/package.json`, no mail code in `server/src/`). As a result:

- A traveller or organiser who forgets their password cannot recover the account. The only reset path is the operator script `server/src/setPassword.js`.
- Email addresses are never verified (`server/src/models/User.js` has no verification field).
- Travellers learn that a request was confirmed or declined only by opening the app; organisers learn about new requests the same way. `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` ("Email and SMS") records this.

## Why it matters
Account recovery is required for any real launch. Booking status emails matter because bookings are requests that wait for a manual organiser decision; people need to know when it happens.

## Current behaviour
In-app status only (My trips, booking pages, organiser activity feed, trip-group badge).

## Expected behaviour
- **Mail adapter** in `server/src/services/mail/`: one interface `send({ to, subject, text, html })`. Default **console/dev** implementation that logs a redacted summary (recipient domain and subject, never the token or full address) and stores messages in memory for tests. One real provider implementation chosen by maintainers, selected by env vars documented in `server/.env.example`. Sending never blocks or fails the user's request; failures are logged.
- **Password reset:** `POST /api/auth/forgot-password` always answers the same way whether or not the email exists (no enumeration), rate-limited per IP and per email. It creates a single-use token, stores **only its hash** with an expiry (e.g. 30 minutes), and emails a link. `POST /api/auth/reset-password` checks the hash and expiry, sets the new password (same rules as sign-up), marks the token used, and ends existing sessions (the `tokenVersion` from `medium/06`). Client pages for both steps.
- **Email verification:** a similar single-use token on registration; unverified accounts keep working in V0.1, and maintainers decide what requires verification later.
- **Notifications:** booking confirmed and declined (to the traveller), new booking request (to the organiser's contact email). Plain wording; no payment claims ("Payment is arranged directly with the organiser").
- Emails never include other travellers' details, manifests or phone numbers.

## Acceptance criteria
- [ ] Provider chosen by maintainers and recorded in this issue.
- [ ] Reset tokens are random (at least 32 bytes), stored hashed, single-use and expiring; a used or expired token returns 400.
- [ ] `forgot-password` responses and timing do not reveal whether an account exists.
- [ ] A reset ends all existing sessions.
- [ ] Notification triggers fire once per status change (no duplicates on retries) and do not slow down the API response.
- [ ] Without provider configuration the app runs as today, using the console adapter.
- [ ] README and known-limitations doc updated.

## Suggested approach
Add a `PasswordToken` model (`{ user, purpose, tokenHash, expiresAt, usedAt }`) with a TTL index on `expiresAt`. Trigger notifications from the routes that change booking status (`server/src/routes/bookings.js`, operator confirm/reject in `server/src/routes/operator.js`) after the database update succeeds, using `setImmediate` or a small in-process queue.

## Relevant files
- `server/src/routes/auth.js`, `server/src/models/User.js`, `server/src/middleware/auth.js`
- `server/src/routes/bookings.js`, `server/src/routes/operator.js`
- `server/src/middleware/rateLimit.js`
- `client/src/pages/AuthPage.jsx`, `client/src/main.jsx` (new routes)
- `server/.env.example`, `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`

## Testing requirements
API tests with the in-memory adapter: reset happy path, expired token, reused token, unknown email (same response), sessions ended after reset, one notification per status change, no personal data in console adapter logs. An e2e journey for forgot-password using the in-memory adapter through a test-only hook.

## Dependencies
- `medium/06` (revocable sessions) should land first.
- `medium/07` if the operator triggers are added after the split.
- Maintainer decision on the mail provider.

## Notes for maintainers
Maintainer-led. Choosing a provider also means a data-processing agreement for email addresses; check that before enabling it in production.
