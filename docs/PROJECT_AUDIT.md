# Ghumo AI: project audit

*Audit date: 8 November 2026. Branch `feat/ghumo-v0.1` at `78ce55d`, plus the uncommitted hardening changes listed in [EXECUTION_PROGRESS.md](EXECUTION_PROGRESS.md).*

This audit compares the product brief (Ghumo AI "V0.0") with the code that is actually in the repository. Findings cite files, so anyone can check them. Earlier, narrower audits remain useful context: [V0_1_CODEBASE_AUDIT.md](V0_1_CODEBASE_AUDIT.md), [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) and [GHUMO_V0_1_KNOWN_LIMITATIONS.md](GHUMO_V0_1_KNOWN_LIMITATIONS.md).

## 1. Facts that change the open-source plan

Read these first. They change several assumptions in the brief.

1. **The repository is already public.** `github.com/shekhar-narayan-mishra/Ghummoo` reports `"visibility": "public"`. All four branches and their full history can be read by anyone, including `feat/ghumo-v0.1`, which holds the whole V0.1 marketplace. "Do not automatically open-source the complete startup" is therefore already moot for the code that has been pushed. What has *not* happened is licensing: there is no `LICENSE` file, so nobody has permission to reuse the code (all rights reserved by default).
2. **The repository has one public fork.** `vedansha07/Ghummoo` was created on 8 November 2026 by the project's collaborator `vedansha07` (confirmed by the owner on 8 November 2026). It is not an unknown third party, but it is still a public copy. Making the original repository private would not make the fork private; its owner would have to delete it or make it private too. Anyone may also have cloned the public repository without forking it.
3. **Every commit has one author.** All 36 commits are by `shekhar-narayan-mishra`. There are no external contributors, pull requests, issues, stars or releases.
4. **The project grew out of an earlier project.** It was transformed from a local-guide project (*Ghummoo*, kept on `backup/ghummoo-legacy`). Ghumo AI also took part in the CoNSTruct 2.0 competition; the owners confirmed on 8 November 2026 that this carries no ownership restrictions or agreements. What remains open is whether anyone else contributed to the *Ghummoo* code (see [MANUAL_ACTIONS.md](MANUAL_ACTIONS.md) M3).
5. **No real secrets were found in Git history.** Every commit on every branch was scanned for Anthropic, OpenAI, Google and AWS keys, GitHub tokens, private keys and credentialed MongoDB URIs. The only matches were documentation placeholders (`USER:PASS@`). Only `server/.env.example` and `server/.env-mongo.example` were ever committed, and both hold placeholders. This is a pattern scan, not a guarantee; see [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## 2. Project overview

Ghumo AI is a marketplace for fixed-departure group trips in India run by independent organisers.

- **Travellers** discover, compare and request bookings.
- **Organisers** run their packages, departures, seats, booking requests, offline payment records and trip updates.
- **AI Package Studio** turns an unstructured caption into a draft listing. The draft is grounded in the source text and lists the fields that are missing.
- **Admins** approve organisers, verify businesses, moderate listings and handle reports.

The repository describes itself as **V0.1** (`AGENTS.md`, `docs/V0_1_*`). The brief describes **V0.0**. The code contains more than the brief lists (see section 4).

## 3. Technology stack (verified from manifests)

| Layer | Technology | Evidence |
| --- | --- | --- |
| Runtime | Node.js ≥ 20.19 (Render and Replit use 22) | `package.json` engines, `render.yaml`, `.replit` |
| Server | Express 4.22, Mongoose 8, helmet, cors, cookie-parser, jsonwebtoken, bcryptjs, multer, dotenv; CommonJS | `server/package.json` |
| Database | MongoDB. Falls back to an embedded `mongodb-memory-server` when `MONGODB_URI` is unset | `server/src/config/db.js` |
| Client | React 19, React Router 7, Vite 8, Tailwind 4, axios, dayjs, lucide-react, react-hot-toast, GSAP 3.15 (lazy) | `client/package.json`, `client/vite.config.js` |
| AI | Direct HTTPS calls to Anthropic Messages (tool use) or any OpenAI-compatible Chat Completions API (Gemini is used in deployment config). No SDK | `server/src/services/ai/provider.js` |
| Tests | `node --test` (server: 7 files, 56 tests; client: 1 file, 6 tests); Playwright 1.64 e2e (4 specs, 25 tests) | `server/test/`, `client/test/`, `e2e/` |
| Lint | ESLint 9 flat config, **client only** | `client/eslint.config.js` |
| Deploy | Single Express process serves `client/dist` and `/api`. Render Blueprint and Replit config | `render.yaml`, `.replit`, `server/src/app.js` |
| CI | **None** before this audit (no `.github/` directory) | — |

There is no TypeScript and no type checking. `@types/react` is installed only for editor hints.

## 4. Product-to-codebase implementation matrix

Status labels:
- **Verified**: implemented, and covered by automated tests that were run during this audit.
- **Implemented, under-tested**: the code exists, but tests are thin or missing.
- **Partial**: some of the capability exists.
- **Mock/sample only**: exists only with sample data.
- **Not implemented**: no code exists.
- **Needs credentials**: can't be verified without a provider key or external access.

### Traveller experience

| Capability (brief) | Status | Client | Server | Tests |
| --- | --- | --- | --- | --- |
| Homepage and group-trip discovery | Verified | `traveller/HomePage.jsx`, `traveller/TripsPage.jsx` | `GET /api/trips` (`routes/trips.js`) | `traveller.test.js`, `e2e/01-traveller` |
| Search and filters: budget, dates, duration, category, departure city | Verified | `traveller/TripsPage.jsx`, `lib/tripParams.js` | `routes/trips.js` (`minPrice`, `maxPrice`, `from`, `to`, `minDays`, `maxDays`, `category`, `departureCity`, `place`, `landscape`) | `traveller.test.js` "Filtering…", `api.test.js` T1/T2 |
| Trip detail with gallery and day-wise itinerary | Verified (gallery is a `coverImage` plus an `images[]` list) | `pages/TripDetailPage.jsx` | `GET /api/trips/:slug` | `api.test.js` T3, e2e |
| Pricing, policies, organiser information | Verified | `TripDetailPage.jsx`, `pages/OrganiserPage.jsx` | `routes/trips.js`, `routes/organisers.js` | `api.test.js` T3 |
| Booking request and booking reference | Verified, including the concurrency test that guards against overbooking | `pages/BookPage.jsx`, `pages/BookingPage.jsx` | `POST /api/bookings`, `services/seats.js` (atomic `$gte` hold), `utils/text.js bookingReference` | `api.test.js` T4–T6, **T10 (six concurrent requests, never overbooked)** |
| My Trips dashboard | Verified | `pages/MyTripsPage.jsx` | `GET /api/bookings/mine` | e2e traveller journey |
| Traveller cancellation | Implemented, under-tested (one happy-path test) | `BookingPage.jsx` | `POST /api/bookings/:id/cancel` | `api.test.js` line ~205 only |
| Reviews after a completed trip | Implemented, under-tested (no completed trips in seed data; never run in a browser) | `BookingPage.jsx` | `POST /api/bookings/:id/review`, `models/Review.js` | none end-to-end |

### Organiser experience

| Capability (brief) | Status | Client | Server | Tests |
| --- | --- | --- | --- | --- |
| Onboarding and approval status | Verified | `pages/operator/Onboarding.jsx` | `routes/operator.js` profile and verification | `organiser.test.js` "Onboarding…" |
| Package creation and editing | Verified | `operator/PackageEditorPage.jsx`, `packageForm.jsx` | `routes/operator.js` packages, `TripPackage.publishBlockers` | `organiser.test.js`, `api.test.js` T7/T8 |
| Itinerary and photo management | Implemented. **Uploaded photos live on local disk and are lost on ephemeral hosts** | `PackageEditorPage.jsx` | `routes/uploads.js` | e2e organiser |
| Multiple departures | Verified | `operator/DeparturePage.jsx` | `routes/operator.js` departures | `organiser.test.js` "Departures…" |
| Confirm and reject booking requests | Verified | `operator/BookingsPage.jsx` | `routes/operator.js` confirm and reject | `api.test.js`, `organiser.test.js`, `india.test.js` |
| Traveller information export | Verified (CSV, with formula-injection guard) | `BookingsPage.jsx`, `DeparturePage.jsx` | `GET /api/operator/bookings/export.csv` | `hardening.test.js` (cell escaping) |
| Offline payment records | Implemented. **Not atomic** (see §8) | `BookingsPage.jsx` | `POST /api/operator/bookings/:id/payments` | indirect only |
| Trip updates board for confirmed travellers | Verified | `BookingPage.jsx` | announcements in `routes/operator.js` and `routes/bookings.js` | e2e |

### AI Package Studio

| Capability (brief) | Status | Evidence |
| --- | --- | --- |
| Extraction from unstructured text | Implemented. **Needs credentials** to judge live quality. Exercised only against the deterministic stub (`e2e/ai-stub.js`) and unit tests | `services/ai/index.js extractPackage`, `routes/ai.js` |
| Structured package generation | Implemented | `SCHEMA` and `normalise()` in `services/ai/index.js` |
| Missing-information identification | Verified (computed in code, not by the model) | `normalise()` `missing[]`; `api.test.js` T11 |
| Review and edit before publishing | Verified (Studio produces a draft; publishing is a separate organiser action gated by `publishBlockers` and admin approval) | `operator/StudioPage.jsx`, `routes/operator.js` publish |
| Anthropic and OpenAI-compatible providers | Implemented, tested with an injected `fetch` | `services/ai/provider.js`, `discovery.test.js` "Provider failures…" |
| Grounding (no invented numbers) | Price and capacity: verified, and **tightened in this audit** (a fragment such as `500` inside `15,000` no longer counts). **Dates and durations are not grounded** (issue medium/01) | `numberInText()`; `hardening.test.js` |

### Admin

| Capability | Status | Evidence |
| --- | --- | --- |
| Approve or reject organisers | Verified | `routes/admin.js`; `api.test.js` "Admin…" |
| Business verification controls | Verified (records are reviewed by an admin; nothing is checked against a government register) | `OperatorVerification` model, `routes/admin.js` |
| Remove and restore listings | Verified | `routes/admin.js` packages |
| Booking visibility | Verified | `GET /api/admin/bookings` |
| Report handling | Verified | `routes/reports.js`, `routes/admin.js` |
| User management | Not implemented | — |

### In the repository but not in the brief

- **Explore India**: a content directory of landscapes and cities, with place pages (`server/src/content/india.js`, `routes/india.js`, `traveller/ExploreIndiaPage.jsx`).
- **AI-assisted trip discovery**: natural-language interpretation with a deterministic fallback, ranking, and "Ask this trip", all grounded in listing fields (`services/discovery/*`, `routes/discover.js`).
- **Compare trips** (`traveller/ComparePage.jsx`), **Decide** (`traveller/DecidePage.jsx`) and **saved trips** (`routes/saved.js`).
- **Trip groups**: messaging for confirmed travellers and the organiser, with contact-detail filtering and reports (`routes/groups.js`, `services/groups.js`).
- **`/v01` design prototype** with sample data (`client/src/v01/`). It is routed but not linked from navigation.

### In the brief, not in the code

- "Local guide functionality", "itinerary generation", "destination recommendation engine", "geospatial utilities" and "agent orchestration" (listed in the master prompt as things to look for) **do not exist**. Local guides belonged to the legacy *Ghummoo* project and are only on `backup/ghummoo-legacy`. There is no itinerary generator: itineraries are written by organisers or extracted from their text. There is no agent framework: AI calls are single structured requests.
- **Payments**: no gateway, by design. Bookings are requests, and payments are offline records.
- **Email/SMS notifications, password reset and email verification**: not implemented.

## 5. Architecture

```
Browser (React SPA, client/dist)
   │  same origin, JWT in an httpOnly cookie
   ▼
Express app (server/src/app.js)
   ├── helmet CSP, CORS allow-list, JSON 1 MB limit, DB-ready gate (503)
   ├── routes/*            thin HTTP handlers, validation inline
   ├── middleware/         auth, roleGuard, rateLimit (in-memory), errorHandler
   ├── services/
   │     seats.js          atomic seat holds and counters
   │     trips.js          card presentation, bookability
   │     discovery/        prefs → constraints → rank, Ask-this-trip
   │     ai/               provider adapters, schema validation, grounding
   │     groups.js         trip-group membership
   ├── models/             17 Mongoose models
   └── static: /uploads (local disk), client/dist
   ▼
MongoDB (Atlas, or embedded mongodb-memory-server in server/.data)
```

The design is a sensible modular monolith for this stage. The strongest parts:
- the seat logic, held atomically with `findOneAndUpdate` and `$gte`;
- the AI provider layer, which has no SDK, typed error codes, model fallback and an injectable `fetch`;
- the deterministic discovery engine with AI as an optional layer.

Weaknesses:
- **Route files hold business logic.** `routes/operator.js` is 575 lines and covers six concerns. Validation is hand-written in each route.
- **No service layer for bookings or payments.** The booking state machine is spread across `routes/bookings.js` and `routes/operator.js`.
- **Process-local state:** the rate limiter, and uploads on local disk. Both block running more than one instance.
- **The embedded database runs in production** when `MONGODB_URI` is unset. That is convenient for demos, but `mongodb-memory-server` is a production dependency that downloads a ~66 MB MongoDB binary at runtime.

## 6. Database design

There are 17 models in `server/src/models/`. The core marketplace models:

- `User` (role: traveler, operator or admin) has one `Operator`, which has many `TripPackage`s.
- Each `TripPackage` has many `TripDeparture`s, and each departure has many `Booking`s. Travellers are embedded in the booking.
- A `Booking` has many `PaymentRecord`s and at most one `Review`.

Supporting models:
- `TripAnnouncement` (per departure);
- `TripGroup`, `GroupMember` and `GroupMessage`;
- `OperatorVerification`, `Report`, `ListingView`;
- the content models `Place` and `Landscape`.

Indexes exist on the foreign keys and on `status`, `slug` and `startDate`. `docs/V0_1_DATA_DICTIONARY.md` documents the fields.

Observations:
- **Inventory:** `seatsAvailable` is decremented on *request*, not on confirmation. A pending request therefore holds seats with no expiry and no per-traveller cap (issue medium/03). `recountConfirmedSeats()` exists to repair drift.
- **Payments:** the "received" total is computed by aggregation at read time. That is correct, but the over-payment check races (issue medium/02).
- **Migrations:** one idempotent foundation migration (`server/src/migrations/v0_1.js`) runs on every boot unless `AUTO_MIGRATE=false`.
- **Seed data:** clearly marked `isDemo`. No bookings, reviews, payments or verified badges are invented. This matches the product rules.

## 7. AI architecture

AI is a set of single, schema-constrained calls, not an agent system. That is the right choice for the problem.

| Feature | Endpoint | Grounding | Without a key |
| --- | --- | --- | --- |
| Package Studio | `POST /api/ai/extract-package` (operator/admin) | Price and capacity must appear in the text as whole numbers; the missing-field list is computed in code; the prompt forbids invention | 503 `AI_NOT_CONFIGURED`; the UI points to manual creation |
| Interpret a traveller's request | `POST /api/discover/interpret` | Invented hard filters are dropped (`discovery.test.js`) | Deterministic parser |
| Ask this trip | `POST /api/discover/trips/:slug/ask` | An answer must cite listing sections; ungrounded answers are replaced | Field lookup from the listing |

What works well:
- No prompt or key reaches the browser.
- Typed failure codes.
- Every traveller-facing feature has a non-AI fallback.

Gaps:
- Dates, durations and itinerary text in Studio drafts are not grounded.
- There is no evaluation set of real organiser posts, so the quality of extraction is unmeasured (issue hard/02).
- Before this audit, Studio had no per-account cost limit (fixed: `AI_EXTRACTIONS_PER_HOUR`, default 30).

## 8. Technical debt and engineering problems

Each item was investigated, not assumed.

| # | Finding | Evidence | Severity | Status |
| --- | --- | --- | --- | --- |
| 1 | AI grounding matched digit substrings: a model price of 500 counted as grounded by "₹15,000" | `services/ai/index.js` (old `numberInText`) | High (honesty rule) | **Fixed** with tests |
| 2 | Query-string filters were passed straight into MongoDB queries (`?status[$ne]=x` became an operator) | `routes/operator.js bookingQuery`, `routes/admin.js` | Medium (scoped to the caller's own data; admin-only otherwise) | **Fixed** (`queryFilter`) with tests |
| 3 | The demo admin was seeded with the README password on production deploys (`SEED_ON_EMPTY=true` in `render.yaml`) | `seedData.js` | **High**: anyone could sign in as admin and read every booking | **Fixed**: random password in production unless `DEMO_ADMIN_PASSWORD` is set; `npm run set-password` added |
| 4 | No cost limit on AI Package Studio | `routes/ai.js` | Medium | **Fixed** with tests |
| 5 | CSV export guard missed tab and carriage-return prefixes | `routes/operator.js csvCell` | Low | **Fixed** (moved to `utils/text.js`) with tests |
| 6 | `qs` advisories through Express 4.22.1 | `npm audit` | Moderate | **Fixed** (Express ^4.22.3) |
| 7 | Payment recording is read-then-write, so concurrent records can exceed the total | `routes/operator.js` payments | Medium | Issue medium/02 |
| 8 | Seat holds from pending requests have no cap or expiry | `routes/bookings.js`, `services/seats.js` | Medium (marketplace abuse) | Issue medium/03 |
| 9 | Uploads on local disk | `routes/uploads.js` | High before launch | Issue medium/04 |
| 10 | In-memory rate limits | `middleware/rateLimit.js` | Medium with more than one instance | Issue medium/05 |
| 11 | JWTs cannot be revoked | `middleware/auth.js` | Medium | Issue medium/06 |
| 12 | `routes/operator.js` is a 575-line multi-concern file and a merge-conflict hot spot | — | Maintainability | Issue medium/07 |
| 13 | The `/v01` prototype duplicates the traveller pages, with sample data | `client/src/v01/`, `client/src/traveller/` | Maintainability, risk of confusion | Issue medium/08 (needs owner approval) |
| 14 | Upload type comes from the client's `Content-Type` | `routes/uploads.js` | Low–medium | Issue easy/03 |
| 15 | No server lint, no CI, no Dockerfile | — | Developer experience | CI added; issues easy/10 and easy/11 |
| 16 | `GET /api/trips` loads every published package and filters in memory | `routes/trips.js` | Fine at current scale; needs pagination past a few thousand listings | Roadmap |
| 17 | 50 ESLint warnings (45 fast-refresh, 5 set-state-in-effect) | `npm run lint` | Low | Issues easy/08 and easy/09 |
| 18 | Untracked scratch files in the working tree (`query_guides.js`, `server/query_guides.js`, `reorder.py`) | `git status` | Hygiene | Left alone: the owner should decide whether to delete them |

There was no evidence of duplicate API servers, unused dependencies of note, or dead backend routes. The legacy `server/database.sqlite` is untracked and gitignored.

## 9. Testing status

The latest run is recorded in [TESTING_AND_CI.md](TESTING_AND_CI.md).

- Server: 56 tests, all passing. They cover booking concurrency, access control, the admin flows, AI grounding, provider failure modes, discovery, trip groups, content and the new hardening tests.
- Client: 6 unit tests of `lib/` logic. **There are no component tests.**
- e2e: 25 Playwright tests (the traveller journey, the organiser journey, quality at five widths, security).
- Not covered: the review flow, edge cases in payment recording, live AI quality, multi-instance behaviour.

## 10. Missing developer tooling

Before this audit the repository had:
- no CI;
- no issue or PR templates, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY policy, LICENSE or CHANGELOG;
- no Dependabot, no server lint, no Docker setup, no `.nvmrc`.

CI, Dependabot, the templates, the contributor documents and `.nvmrc` were added in this audit (see [EXECUTION_PROGRESS.md](EXECUTION_PROGRESS.md)). The licence is deliberately **not** added; it needs the owners' approval.

## 11. Recommended improvements, in order

1. **Owners decide the licence and the open-source scope.** The code is already public, so this is urgent. See [LICENSING_RECOMMENDATION.md](LICENSING_RECOMMENDATION.md).
2. Before any public deployment with real users: persistent uploads (medium/04), a seat-hold cap (medium/03), atomic payments (medium/02), and a rotated or secured demo admin on any existing deployment.
3. Split `routes/operator.js` (medium/07) before inviting contributors.
4. Extract the AI extraction and grounding core into a package (hard/01). That is the most reusable piece of the codebase.
5. Build an evaluation set from real organiser posts, with consent (hard/02). Until then, Studio quality is a claim, not a measurement.

## 12. Open-source opportunities

See [OPEN_SOURCE_STRATEGY.md](OPEN_SOURCE_STRATEGY.md). In short, one component has real value to outside developers:
- the **grounded structured-extraction core** (the provider adapters, schema validation, numeric grounding and code-computed missing fields).

Two others might, after refactoring:
- the **atomic seat-inventory helpers**;
- the **deterministic preference-to-constraint discovery engine**.

The rest is application code. Its value to others would be as a reference marketplace, not as a library.
