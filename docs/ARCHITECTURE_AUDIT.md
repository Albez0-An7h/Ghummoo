# Ghummoo → Ghumo AI: Architecture Audit

Audit date: 4 Nov 2026. The pre-transformation code is preserved on the git branch
`backup/ghummoo-legacy`.

## What was in the repository

| Area | What it was | Evidence | Decision |
|---|---|---|---|
| `server/src/` | Express 4 + Mongoose 8 API for local-guide booking. JWT in httpOnly cookie or Bearer header, `requireRole` guard, async error wrapper. | `server/package.json` `main: src/index.js`; `src/app.js` mounts `/api/*` | **KEEP the platform, REPLACE the domain.** Auth, middleware, error handling and the Mongoose connection were reused. Guide, availability, certification and notification models/services were removed. |
| `server/*.js`, `server/models`, `server/controllers`, `server/services`, `server/repositories`, `server/routes`, `server/events` (root level) | A second, older backend built on Sequelize + SQLite. | `server/index.js` requires `sequelize`, which isn't in `server/package.json`, so it can't run. | **REPLACE (deleted).** It was a dead duplicate architecture. |
| `server/src/patterns/*`, `server/src/repositories/*` | Guide-specific design-pattern classes (factory, decorator, pipeline, state machine). | Only used by guide services. | **REPLACE (deleted).** |
| `client/` | React 19 + Vite 8 + Tailwind 4 SPA with guide pages, axios API layer, AuthContext. | `client/package.json` | **KEEP the toolchain and dependencies, REPLACE the UI.** Every page was guide-centric. The API envelope interceptor and AuthContext pattern were carried over. |
| `client-tailwind/` | A third, unused React 18 + Tailwind 3 frontend. | Not referenced by any script. | **REPLACE (deleted).** It was a competing duplicate frontend. |
| `do_commits.py`, `make_*_commits.py`, `script.sh` | Scripts for generating commits. | | **Deleted.** They aren't part of the product. |
| UML `.md` files | Diagrams for the old guide model. | | **Moved** to `docs/legacy/`. |
| `server/.env` | Points to a MongoDB Atlas cluster. | The SRV lookup for `cluster0.q5qwecf.mongodb.net` returns NXDOMAIN, so the cluster no longer exists. | Kept outside git. A new `MONGODB_URI` is needed, or the embedded DB fallback is used (below). |

## Final architecture (one of each)

- **Frontend:** `client/`, React 19 + React Router 7 + Tailwind 4 + lucide icons + react-hot-toast.
- **Backend:** `server/`, Express 4 + Mongoose 8 (CommonJS).
- **Database:** MongoDB is the single source of truth.
  - Production: `MONGODB_URI` (for example MongoDB Atlas).
  - Local or demo with no URI: `mongodb-memory-server` starts an embedded mongod that persists to
    `server/.data/` and seeds itself automatically when empty.
- **Serving:** in production, Express serves `client/dist`, so the whole app is one process on
  one port (Replit-friendly).
- **AI:** called from the server only, through `server/src/services/ai/`. The provider is
  configured with environment variables (`AI_PROVIDER`, `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`,
  `AI_MODEL`). Keys never reach the browser.

## Seat safety

Seats are reserved with a single atomic conditional update:
`findOneAndUpdate({ _id, status: 'open', seatsAvailable: { $gte: n } }, { $inc: { seatsAvailable: -n } })`.
MongoDB applies this atomically on one document, so two concurrent requests can't oversell a
departure. It works on standalone servers, which don't support multi-document transactions.
Seats are released atomically on rejection or cancellation. If saving the booking fails after
seats are held, the hold is rolled back.
