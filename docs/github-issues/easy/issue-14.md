# Rate-limit content reports and check that the reported target exists

**Difficulty:** Easy · **Category:** Abuse prevention · **Labels:** `good first issue`, `bug`, `security`, `backend`, `easy` · **Estimated effort:** 3–4 hours · **First-time contributor:** Yes (one short route; the limiter and lookup patterns already exist elsewhere)

## Problem
`POST /api/reports` (`server/src/routes/reports.js:7-13`) lets any signed-in user file a report against a package, organiser or booking.

- There is no rate limit, so one account can create any number of reports. The group-message report route already has one (`reportLimiter` in `server/src/routes/groups.js:26`, 5 per minute per user).
- `targetId` is only checked for presence (line 9). A malformed ID reaches `Report.create` and fails Mongoose casting, returning a 400 with Mongoose's message. A well-formed ID of something that does not exist is stored (201).
- The admin list (`GET /api/admin/reports`, `server/src/routes/admin.js:113-126`) resolves targets only for `package` and `operator` (lines 118-123). Booking reports always show `target: null`, so admins cannot see what was reported.

## Why it matters
Reports feed the admin moderation queue. Spam and reports about nothing waste moderators' time and can bury real safety reports. For bookings, a user should not be able to report (or probe for) a booking they cannot see.

## Current behaviour
- Unlimited report creation.
- `targetId: "abc"` → 400 with a technical message; `targetId` of a non-existent document → 201.
- Admin list: `target: null` for every booking report. (Today the client only files package reports, from `client/src/pages/TripDetailPage.jsx:184`.)

## Expected behaviour
- A per-user limiter on the route, e.g. `rateLimit({ windowMs: 60000, max: 5, name: 'report', key: (req) => String(req.user._id) })`, returning the existing 429 `RATE_LIMITED` response.
- `targetId` must be a valid ObjectId (`mongoose.isValidObjectId`), else 400 "Invalid report target".
- The target must exist for its type: `TripPackage`, `Operator`, or `Booking`. Otherwise 404 "We couldn't find what you're reporting".
- A booking may be reported only by its traveller or by the organiser it belongs to; anyone else gets the same 404, so existence is not revealed.
- The admin list also resolves booking targets with non-sensitive fields only (e.g. `reference`, `status`), never traveller contact details.

## Acceptance criteria
- [ ] The sixth report within a minute from one user returns 429; another user is unaffected.
- [ ] Malformed `targetId` → 400; unknown target → 404; inaccessible booking → 404.
- [ ] Valid package, operator and own-booking reports still return 201.
- [ ] `GET /api/admin/reports` returns a non-null `target` for booking reports, without phone numbers or emails of travellers.
- [ ] The existing report test (`server/test/api.test.js:277`) passes unchanged.

## Suggested approach
Add a `TARGETS` map in `reports.js` from type to model plus an access check. Reuse `rateLimit` from `server/src/middleware/rateLimit.js`. In `admin.js`, add a third lookup for booking IDs alongside packages and operators.

## Relevant files
- `server/src/routes/reports.js`
- `server/src/routes/admin.js` (reports list)
- `server/src/routes/groups.js` (limiter example)
- `server/src/models/Report.js`

## Testing requirements
New tests (e.g. `server/test/reports.test.js`, with `RATE_LIMIT` unset as in `hardening.test.js`) for each acceptance criterion, including the admin list showing a booking target.

## Dependencies
None. `medium/05` changes the rate-limit store; this issue only adds another `rateLimit()` call, which keeps working with either store.
