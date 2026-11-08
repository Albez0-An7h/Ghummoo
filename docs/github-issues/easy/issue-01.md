# Validate and length-limit phone and emergency-contact fields

**Difficulty:** Easy · **Category:** Input validation · **Labels:** `good first issue`, `bug`, `backend`, `frontend`, `easy` · **Estimated effort:** 3–5 hours · **First-time contributor:** Yes (small, well-bounded change in two route files and three forms, with an existing validation pattern to copy)

## Problem
Several free-text fields that end up in organiser manifests accept any value of any length:

- `PUT /api/auth/me` stores `phone` exactly as sent (`server/src/routes/auth.js:84`). `POST /api/auth/register` does the same (`auth.js:51`).
- In a booking request, each traveller's `phone` and `emergencyContact` are only trimmed (`server/src/routes/bookings.js:27` and `:29`, inside `validateTravelers`).
- The Mongoose schemas have no `maxlength` for these fields (`server/src/models/User.js:13`, `server/src/models/Booking.js:8` and `:11`).

The only upper bound is the 1 MB JSON body limit (`server/src/app.js:27`). The booking **contact** phone is already validated (`bookings.js:45`, pattern `^[+\d][\d\s-]{7,16}$`), so the rules are inconsistent.

## Why it matters
These values are shown to organisers in the departure manifest (`client/src/pages/operator/DeparturePage.jsx:154`) and exported to CSV (`server/src/routes/operator.js`, `/bookings/export.csv`). A phone field containing a paragraph, or an emergency contact several kilobytes long, makes the manifest unreadable and stores data nobody asked for. AGENTS.md requires validation on both client and server for every input.

## Current behaviour
- `PUT /api/auth/me` with `{ "phone": "not a phone" }` returns 200 and saves it.
- A booking whose traveller has `phone: "abc"` or a 5,000-character `emergencyContact` is accepted (201).
- The client forms do not validate these fields: `client/src/pages/MyTripsPage.jsx:13-34` (profile), `client/src/pages/BookPage.jsx:161` and `:163` (traveller phone and emergency contact), `client/src/pages/AuthPage.jsx:68` (sign-up phone).

## Expected behaviour
- `phone` (profile, sign-up, traveller) stays optional. When present and non-empty it must match the same pattern as the contact phone. An empty string clears the profile phone (`null`).
- `emergencyContact` stays optional free text ("name and phone number"), trimmed, with a length cap. Suggested: 120 characters (maintainers may pick another value).
- Invalid values return 400 with a readable message, for travellers in the existing form `Traveller 2: phone looks invalid`.
- Mongoose `maxlength` is added as a backstop, not as the only check.
- The client shows the same rules inline before submitting and sets `maxLength` on the inputs.

## Acceptance criteria
- [ ] `PUT /api/auth/me` and `POST /api/auth/register` reject a malformed or over-long phone with 400.
- [ ] `POST /api/bookings` rejects a malformed traveller phone and an over-long emergency contact with 400, naming the traveller number.
- [ ] Valid and empty values still work exactly as today (existing tests pass unchanged).
- [ ] `User.phone`, traveller `phone` and `emergencyContact` have a `maxlength` in the schema.
- [ ] Profile, sign-up and booking forms show an inline error for an invalid phone and prevent typing past the cap.
- [ ] `npm test`, `npm run lint` and `npm run build` pass.

## Suggested approach
1. In `server/src/routes/auth.js`, add a small `cleanPhone(value)` helper that returns `null` for empty input, throws `badRequest` for a bad pattern, and otherwise returns the trimmed string. Use it in `/register` and `PUT /me`.
2. In `validateTravelers` (`bookings.js:14`), validate `t.phone` with the same pattern when present and cap `emergencyContact`.
3. Add `maxlength` to the three schema fields.
4. On the client, extend `validateTravellers` in `BookPage.jsx` and add a check to the `Profile` form in `MyTripsPage.jsx` and to `AuthPage.jsx`. The pattern is currently repeated in `BookPage.jsx:29`, `pages/operator/Onboarding.jsx:39` and `pages/operator/ProfilePage.jsx:17`; a shared constant is welcome but not required.

## Relevant files
- `server/src/routes/auth.js`
- `server/src/routes/bookings.js`
- `server/src/models/User.js`, `server/src/models/Booking.js`
- `client/src/pages/MyTripsPage.jsx`, `client/src/pages/BookPage.jsx`, `client/src/pages/AuthPage.jsx`

## Testing requirements
- Add server tests (a new file such as `server/test/validation.test.js` avoids conflicts with other work) covering: bad phone on `PUT /me` (400), empty phone clears it (200, `phone: null`), bad traveller phone (400), over-long emergency contact (400), and a valid booking still returning 201.
- Check the three forms by hand with a keyboard and at mobile width.

## Dependencies
None. `medium/06` and `hard/03` also edit `server/src/routes/auth.js` and `server/src/models/User.js`; whichever lands second rebases.
