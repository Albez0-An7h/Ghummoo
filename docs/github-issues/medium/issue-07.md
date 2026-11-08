# Split `server/src/routes/operator.js` into focused routers (pure refactor)

**Difficulty:** Medium · **Category:** Refactor · **Labels:** `architecture`, `backend`, `medium` · **Estimated effort:** 1 day · **First-time contributor:** No (maintainer-led: it conflicts with every open change to this file)

## Problem
`server/src/routes/operator.js` is 571 lines and handles every organiser concern in one router:

| Section | Approx. lines | Routes |
| --- | --- | --- |
| Profile and onboarding | 17-70 | `GET/POST/PUT /profile`, `POST /verification` |
| Stats and recent activity | 72-131 | `GET /stats` |
| Insights | 133-175 | `GET /insights` |
| Packages | 176-356 | `/packages` CRUD, publish, unpublish, archive, restore, duplicate |
| Departures | 357-449 | `/packages/:id/departures`, `/departures/:id` |
| Announcements | 450-465 | `POST /departures/:id/announcements`, `DELETE /announcements/:id` |
| Bookings | 466-556 | list, `export.csv`, detail, confirm, reject |
| Payments | 557-569 | `POST /bookings/:id/payments` |

Shared helpers sit between the sections (`pick`, `validateProfile`, `recentActivity`, `cleanPackage`, `ownPackage`, `parseDeparture`, `ownDeparture`, `heldSeats`, `bookingQuery`, `ownBooking`).

## Why it matters
Several planned changes edit this file (`easy/02`, `medium/02`, `medium/12`, `medium/13`). In one large file they will conflict with each other. Smaller files are also easier to review and test.

## Current behaviour
One router mounted at `/api/operator` (`server/src/app.js:61`), guarded by `router.use(verifyToken, requireRole('operator'))` (line 15).

## Expected behaviour
- A folder `server/src/routes/operator/` with `index.js` that applies `verifyToken` and `requireRole('operator')` once and mounts sub-routers: e.g. `profile.js`, `stats.js` (stats, activity, insights), `packages.js`, `departures.js` (including announcements), `bookings.js` (including payments).
- Ownership helpers that more than one file needs (`ownPackage`, `ownDeparture`, `ownBooking`) move to a shared module, e.g. `server/src/routes/operator/own.js`.
- `app.js` keeps `app.use('/api/operator', require('./routes/operator'))`; Node resolves the folder's `index.js`.
- **No URL, status code, response body, validation message or middleware order changes.** `/bookings/export.csv` must still be matched before `/bookings/:id`.

## Acceptance criteria
- [ ] Every existing route answers at the same path with the same behaviour.
- [ ] `npm test` passes **without editing any test file**.
- [ ] `npm run test:e2e` passes (organiser journeys B1–B15).
- [ ] No business logic changes in the same PR; the diff is moves plus imports.
- [ ] No file in the new folder is longer than about 200 lines.

## Suggested approach
Move one section per commit, running `npm test` after each. Use `git mv` for the first file so history follows the largest section (packages). Ask reviewers to read with `git diff --color-moved` (or `--color-moved=zebra`).

## Relevant files
- `server/src/routes/operator.js`
- `server/src/app.js`
- `server/src/middleware/roleGuard.js` (`loadOperator`, used on every route)
- `server/test/organiser.test.js`, `server/test/api.test.js` (main coverage)

## Testing requirements
The full server suite and the Playwright suite, unchanged. Optionally list the routes before and after (e.g. by walking `router.stack`) and attach the identical output to the PR.

## Dependencies
Should land **before** `easy/02`, `medium/02`, `medium/12` and `medium/13`.

## Notes for maintainers
Maintainer-led. Announce a short freeze on `operator.js` while this is open, merge it quickly, and ask authors of the dependent issues to rebase afterwards.
