# Revocable sessions: token versions and "sign out everywhere"

**Difficulty:** Medium · **Category:** Security · **Labels:** `enhancement`, `security`, `backend`, `frontend`, `medium` · **Estimated effort:** 1–2 days · **First-time contributor:** No (changes authentication for every request)

## Problem
Sessions are JWTs in an httpOnly cookie, signed with only the user ID (`server/src/routes/auth.js:33`: `jwt.sign({ id }, …, { expiresIn: JWT_EXPIRES_IN || '7d' })`). `resolveUser` in `server/src/middleware/auth.js:11-20` accepts any unexpired token whose user exists. Logging out only clears the cookie in that browser (`auth.js:67-70`). Changing a password with `server/src/setPassword.js` leaves every existing session valid, and the script says so (line 19).

## Why it matters
If a session cookie leaks, or a demo admin password is changed after a deployment was exposed, there is no way to end existing sessions before they expire (up to 7 days by default). This is listed in `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` (Security limitations, "JWT sessions").

## Current behaviour
Tokens stay valid until expiry, whatever happens to the account.

## Expected behaviour
- `User` gets `tokenVersion: { type: Number, default: 0 }`.
- Tokens are signed with `{ id, v: user.tokenVersion }`.
- `resolveUser` rejects a token whose `v` differs from the user's current `tokenVersion`. It already loads the user on every request, so this adds no query. Tokens issued before this change (no `v`) are treated as version 0 so nobody is signed out by the deploy.
- `setPassword.js` increments `tokenVersion` and its message says existing sessions were ended.
- `POST /api/auth/logout-all` (signed in) increments `tokenVersion` and clears the cookie.
- The account area (`client/src/pages/MyTripsPage.jsx` for travellers, the organiser profile page for organisers) has a "Sign out of all devices" button with a confirmation.

## Acceptance criteria
- [ ] After `logout-all`, an old token gets 401 from `verifyToken` routes and `null` from `GET /api/auth/me`.
- [ ] After `setPassword.js`, old tokens are rejected.
- [ ] A token without `v` keeps working while the user's `tokenVersion` is 0.
- [ ] Normal sign-in, sign-out and registration are unchanged.
- [ ] The button is keyboard-accessible, confirms before acting, and returns the user to the sign-in page.
- [ ] The known-limitations doc is updated.

## Suggested approach
Change `sign` in `auth.js` to take the user, not just the ID. Keep the cookie options as they are. Add the version check in `resolveUser` only.

## Relevant files
- `server/src/models/User.js`
- `server/src/middleware/auth.js`
- `server/src/routes/auth.js`
- `server/src/setPassword.js`
- `client/src/lib/auth.jsx`, `client/src/pages/MyTripsPage.jsx`, `client/src/pages/operator/ProfilePage.jsx`

## Testing requirements
API tests (e.g. `server/test/sessions.test.js`): two clients signed in as the same user; one calls `logout-all`; both are then rejected. A legacy token signed without `v` is accepted at version 0 and rejected after a bump. Test the password-script path by calling the same increment logic directly (export it) rather than spawning the script.

## Dependencies
None. `easy/01` and `hard/03` also edit `server/src/routes/auth.js` and `server/src/models/User.js`. `hard/03` (password reset) must also bump `tokenVersion`, so this issue should land first.
