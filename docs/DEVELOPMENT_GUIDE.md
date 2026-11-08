# Development guide

How to make changes that fit the codebase. Read [ARCHITECTURE.md](ARCHITECTURE.md) first, and `AGENTS.md` for the product rules.

## Daily loop

```bash
git switch staging && git pull
git switch -c feature/my-change
npm run dev                       # API with nodemon on :5050, Vite on :5173 (proxies /api and /uploads)
# … edit …
npm run lint && npm test && npm run build
```

## Adding an API endpoint

1. Put it in the router that owns the resource (`server/src/routes/`). Do not create a parallel API.
2. Guard it:
   - `verifyToken` or `optionalAuth`;
   - `requireRole('traveler' | 'operator' | 'admin')`;
   - `loadOperator()` for organiser routes.
3. Validate every input, and throw `badRequest()`, `notFoundErr()`, `forbidden()` or `conflict()` from `server/src/utils/http.js`.
   - Query-string filters go through `queryFilter(req.query, 'name')`, so objects cannot become MongoDB operators.
   - Strings: trim them and cap their length.
   - Numbers: `Number.isInteger` or `Number.isFinite`, with explicit bounds.
4. Scope ownership in the query (`findOne({ _id, operator: req.operator._id })`) and return 404 for anything not owned by the caller.
5. Wrap async handlers in `asyncHandler`.
6. Return `{ success: true, data }`.
7. If a public endpoint is expensive or calls AI, add a `rateLimit({ … })`.
8. Write tests (see [TESTING_GUIDE.md](TESTING_GUIDE.md)), and document the endpoint in [API_REFERENCE.md](API_REFERENCE.md).

## Changing models

- Add fields with safe defaults. Existing documents must keep working.
- If existing data needs changing, add an **idempotent** step to `server/src/migrations/` that is safe to run on every boot. It must never delete or overwrite data an organiser entered.
- Update [V0_1_DATA_DICTIONARY.md](V0_1_DATA_DICTIONARY.md).

## Working with seats and booking status

Always use the helpers in `server/src/services/seats.js`, and conditional updates on the expected current status. Never read a value, compute, then `$set` it: concurrent requests will overwrite each other (see issue medium/13).

## AI features

- Call `callStructured()` from `services/ai/provider.js` with a JSON schema. Never call a provider from the client.
- Treat the model's output as untrusted. Ground every number and date in the source data, and compute missing-field lists in code.
- Every traveller-facing AI feature needs a non-AI fallback and a clear message when AI is unavailable.
- In tests, inject `setFetch()` and never call a real provider.

## Frontend

- Use the shared primitives in `client/src/components/ui.jsx` and the components in `client/src/design/`. Load data with `useAsync` (`client/src/lib/useAsync.js`).
- Every data view has loading, error and empty states.
- Colours and type come from tokens in `client/src/index.css`. If you need a new token, add it there.
- Motion must respect `prefers-reduced-motion`. Load GSAP lazily, and only on pages with scroll scenes.
- Check every UI change at 360 px wide, with the keyboard only, and with reduced motion on.
- Load the relevant skill notes in `.agents/skills/` (frontend-design, accessibility, motion-performance) for detailed guidance.

## Dependencies

Avoid new ones. If one is really needed, the PR must explain:
- why existing code can't do the job;
- its install size;
- its licence (it must be OSI-approved and compatible);
- its maintenance status.

## Things that must never be committed

`.env` files, keys, database dumps, `server/.data/`, `server/uploads/`, real traveller or organiser data. See [PROPRIETARY_BOUNDARIES.md](PROPRIETARY_BOUNDARIES.md).
