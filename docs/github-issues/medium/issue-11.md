# Request IDs and structured request logging

**Difficulty:** Medium · **Category:** Observability · **Labels:** `enhancement`, `backend`, `devops`, `medium` · **Estimated effort:** 1 day · **First-time contributor:** No (touches every request and must never log personal data)

## Problem
The server logs only start-up messages, database errors and 500 errors with bare `console.log`/`console.error` (`server/src/index.js`, `server/src/config/db.js`, `server/src/middleware/errorHandler.js:20`). There is no per-request log line and no way to connect a user's error report to a server log entry.

## Why it matters
When an organiser says "saving my departure failed", there is nothing to search for. A request ID returned to the client and printed in the logs makes support and debugging possible without collecting any personal data.

## Current behaviour
- No request logging.
- 500 responses in production say "Something went wrong on our side" (`errorHandler.js`), with nothing the user can quote.

## Expected behaviour
- A middleware early in `server/src/app.js` (before the 503 gate) that:
  - reads an incoming `X-Request-Id` if it is a short, safe string (e.g. up to 64 characters of `[A-Za-z0-9._-]`), otherwise generates one with `crypto.randomUUID()`;
  - stores it on `req.id` and sets the `X-Request-Id` response header;
  - on `res` `finish`, writes **one JSON line**: `{ time, level, requestId, method, path, status, durationMs, role }`.
- `path` is the route path **without the query string** (queries can contain search text). `role` is `req.user?.role` or `anonymous`. Never log bodies, cookies, headers, IP addresses, emails, phones or user IDs.
- Requests for static files (`/assets/*`, `/uploads/*`) are skipped or logged at a lower level so logs stay readable.
- `errorHandler` includes `requestId` in the JSON body of 500 responses and in its `console.error` line.
- `LOG_REQUESTS=false` turns request lines off (tests keep quiet output); documented in `server/.env.example`.
- No new dependency.

## Acceptance criteria
- [ ] Every API response has an `X-Request-Id` header; a valid incoming one is echoed, an invalid one is replaced.
- [ ] Each API request produces exactly one JSON log line with the listed fields and nothing else.
- [ ] A forced 500 returns `requestId` in the body and logs the same ID with the error.
- [ ] No log line contains query strings, request bodies or personal data (asserted in a test).
- [ ] Test output is not flooded (tests set `LOG_REQUESTS=false` or capture the logger).

## Suggested approach
Write a small `server/src/middleware/requestLog.js` that takes an injectable `write` function (default `process.stdout.write` of a JSON string plus newline) so tests can capture lines. Use `process.hrtime.bigint()` for duration.

## Relevant files
- `server/src/app.js`
- `server/src/middleware/errorHandler.js`
- `server/.env.example`

## Testing requirements
Tests in `server/test/` for: header generation and echo, rejection of an unsafe incoming ID, the logged fields for a request with a query string and a JSON body containing an email (neither appears), and `requestId` in a 500 body.

## Dependencies
None. `easy/05` also edits `server/src/app.js`; whichever lands second rebases.
