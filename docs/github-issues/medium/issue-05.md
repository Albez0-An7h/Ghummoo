# Optional MongoDB-backed store for rate limits

**Difficulty:** Medium · **Category:** Scalability · **Labels:** `enhancement`, `backend`, `security`, `medium` · **Estimated effort:** 1–2 days · **First-time contributor:** No (async middleware, TTL indexes and keeping the "only failures" mode correct)

## Problem
`server/src/middleware/rateLimit.js` keeps counters in a `Map` inside each process. With more than one server instance, each has its own counters, so the effective limit is multiplied by the number of instances, and every restart resets them. This is recorded in `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` ("Rate limits").

The limiter protects sign-in (`server/src/routes/auth.js:11-13`), paid AI calls (`server/src/routes/ai.js:10-15`, `server/src/routes/discover.js:20-21`) and group messages and reports (`server/src/routes/groups.js:25-26`).

## Why it matters
Sign-in brute-force protection and the AI cost cap only hold if the counters are shared. Running two instances should not double the number of password guesses or paid AI calls allowed.

## Current behaviour
In-memory fixed windows per process. `onlyFailures` mode counts a request when its response finishes with status 400 or above (line 24).

## Expected behaviour
- `rateLimit()` keeps its signature and options (`windowMs`, `max`, `name`, `key`, `onlyFailures`).
- A store interface with two implementations: the current in-memory one (default) and a MongoDB one.
- The MongoDB store uses one collection, e.g. `ratelimits` with `{ _id: '<name>:<key>:<windowStart>', count, expiresAt }`, a TTL index on `expiresAt`, and an atomic `findOneAndUpdate(..., { $inc: { count: 1 } }, { upsert: true })`.
- Selected by an environment variable, e.g. `RATE_LIMIT_STORE=memory|mongo`, documented in `server/.env.example`.
- `RATE_LIMIT=off` still disables limiting (used by several test files).
- If the store errors, the request is allowed and the error is logged (fail open), so a database hiccup cannot lock everyone out. Maintainers may prefer fail closed for sign-in; see notes.

## Acceptance criteria
- [ ] Default behaviour and headers (`RateLimit-Limit`, `RateLimit-Remaining`, `Retry-After`, 429 body with `code: 'RATE_LIMITED'`) are unchanged.
- [ ] With the Mongo store, two app instances sharing one database share counters.
- [ ] `onlyFailures` counts only failed responses with both stores.
- [ ] Expired windows are removed by the TTL index.
- [ ] Existing tests pass unchanged (`server/test/hardening.test.js:142` checks the AI cap; `server/test/api.test.js:303` checks sign-in).
- [ ] No new dependency.

## Suggested approach
Make the middleware `async` and wrap it so errors go to `next()`. Limiters are created when route modules load, before the database is connected; the Mongo store should get the model lazily on first use. The API returns 503 until the database is ready (`server/src/app.js:44-52`), so requests never reach a limiter without a connection.

## Relevant files
- `server/src/middleware/rateLimit.js`
- `server/src/routes/auth.js`, `ai.js`, `discover.js`, `groups.js`, `reports.js` (callers; no change expected)
- `server/.env.example`, `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`

## Testing requirements
Unit tests for both stores through the same test cases: counting, window reset, `onlyFailures`, `RATE_LIMIT=off`. For the shared case, create two separate `rateLimit()` instances with the same `name` (simulating two processes) on the Mongo store and show they share a count.

## Dependencies
None. `easy/14` adds a new limiter call, which works with either store.

## Notes for maintainers
Choose fail-open or fail-closed behaviour when the store is unavailable, possibly per limiter (fail closed for sign-in, open for search).
