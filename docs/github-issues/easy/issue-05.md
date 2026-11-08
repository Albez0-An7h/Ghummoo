# Hide database error details from public responses in production

**Difficulty:** Easy · **Category:** Security · **Labels:** `security`, `backend`, `devops`, `easy` · **Estimated effort:** 2–4 hours · **First-time contributor:** No (changes a documented troubleshooting path, so the README and deployment notes must change with it)

## Problem
When the database is unreachable, `explain()` in `server/src/index.js:24-34` builds a human-readable reason and stores it in `app.locals.db.error` (line 58). That text is then returned publicly:

- `GET /api/health` puts it in `data.database` (`server/src/app.js:36-40`).
- The 503 gate for every `/api/*` call adds it to `message`, with `code: 'DB_UNAVAILABLE'` (`app.js:44-52`).

For DNS failures the reason includes the MongoDB host (credentials are masked by `safeUri`, the host is not). For unrecognised errors, `explain()` returns the raw driver message (line 33), which can contain host names, paths or other internals.

## Why it matters
Anyone can call `/api/health`. Host names of the database cluster, and raw driver errors, help an attacker and are of no use to travellers. The detail is still valuable to whoever runs the server, so it belongs in the server logs, which already receive it (`index.js:59`).

## Current behaviour
In production with a wrong `MONGODB_URI`, `/api/health` returns 503 with `database: "Could not find the MongoDB host (mongodb+srv://***@cluster0.example.mongodb.net/ghumo). …"`, and every API call returns the same text in `message`.

## Expected behaviour
- With `NODE_ENV=production`, public responses use a generic reason, e.g. `database: "unavailable"` in health and "The server can't reach its database right now. Please try again shortly." in the 503 gate. `code: 'DB_UNAVAILABLE'` and the HTTP statuses stay the same.
- Outside production the current detailed messages stay (they help local setup).
- The detailed reason is still logged by the server on every retry, as now.
- README "Troubleshooting: pages stuck on loading placeholders" (around lines 148-155) currently tells people to read the reason from `/api/health`. It must be updated to point at the service logs in production.

## Acceptance criteria
- [ ] In production, neither `/api/health` nor the 503 gate includes the host, URI or raw driver message.
- [ ] In development, both still show the detailed reason.
- [ ] Status codes, `success`, `code` and `data.status` keep their current values, so health checks on Render and Replit are unaffected.
- [ ] README troubleshooting text matches the new behaviour.
- [ ] A test covers both modes.

## Suggested approach
Keep `app.locals.db.error` as the detailed reason. Add a tiny helper in `app.js`, e.g. `publicDbReason(db)`, that returns the detail outside production and a fixed string in production, and use it in both places. Read `process.env.NODE_ENV` at request time so tests can switch it.

## Relevant files
- `server/src/index.js` (`explain`, `connectWithRetry`)
- `server/src/app.js` (health route and 503 gate)
- `README.md` (troubleshooting section)
- `docs/V0_1_CODEBASE_AUDIT.md` (Health section, if wording changes)

## Testing requirements
Add a test that sets `app.locals.db = { ready: false, state: 'error', error: 'Could not find the MongoDB host (mongodb+srv://***@secret-host.example.net/x)' }` on an app instance, calls `/api/health` and one `/api/*` route, and asserts that `secret-host` is absent with `NODE_ENV=production` and present otherwise. Restore `NODE_ENV` and `app.locals.db` afterwards, because other tests share the app.

## Dependencies
None. `medium/11` (request logging) also edits `server/src/app.js`.

## Notes for maintainers
The current behaviour was a deliberate choice for deployment debugging (`docs/V0_1_CODEBASE_AUDIT.md`, Health section). Confirm that operators can read server logs on every supported host before merging.
