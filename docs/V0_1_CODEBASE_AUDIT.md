# Ghumo AI V0.1: codebase audit

*Audited on branch `feat/ghumo-v0.1` at commit `c779ff2` on 2026-11-07. No application code was changed during this audit.*

## How to read the status labels

| Label | Meaning |
| --- | --- |
| **Working** | Implemented and proven, either by an automated test in `server/test/api.test.js` or by an end-to-end browser check during development |
| **Partial** | Some of the feature exists, but a piece needed for real use is missing |
| **Untested** | Implemented in code and wired to the UI, but with no automated test and no recorded browser check |
| **Missing** | Not present in the repository |
| **Improve** | Works, but has a concrete weakness (security, accessibility, durability or UX) described in the notes |

A feature can carry two labels, for example **Untested / Improve**.

## 1. Health check (run during this audit)

| Check | Command | Result |
| --- | --- | --- |
| Server API tests | `npm test` | **8 passed, 0 failed** |
| Client lint | `npm run lint` | 0 errors, **34 warnings**: 27 `react-refresh/only-export-components` and 7 `react-hooks/set-state-in-effect` |
| Production build | `vite build` | Succeeds in about 0.5s. The largest chunks are `react` (232 kB, 74 kB gzip), `vendor` (68 kB, 26 kB gzip), `index` (36 kB, 11 kB gzip) and `TripDetailPage` (26 kB, 7 kB gzip) |
| Live deployment | `GET https://ghummoo-api.onrender.com/api/health` | `database: ready`. Trips are served from Atlas |
| Live static site | `GET https://ghummoo-client.onrender.com/explore` | **404**: the static site is missing its SPA rewrite rule (a Render setting, not a code issue) |

## 2. Stack and architecture

| Layer | What is used | Verdict |
| --- | --- | --- |
| Client | React 19, React Router 7, Vite 8, Tailwind 4 (`@theme` tokens), lucide-react, axios, react-hot-toast, dayjs | **Keep.** Small dependency set, lazy routes and a clean token system |
| Server | Express 4, Mongoose 8, CommonJS, helmet, cors, cookie-parser, multer, bcryptjs, jsonwebtoken | **Keep.** Conventional and fully covered by the existing tests |
| Database | MongoDB (Atlas in production; embedded `mongodb-memory-server` fallback with persistent `server/.data` locally) | **Keep** |
| Auth | JWT in an httpOnly cookie (Bearer header also accepted), 7-day expiry, bcrypt hashes | **Keep** (see the improvement notes in section 5) |
| AI | Provider abstraction in `server/src/services/ai/index.js` (Anthropic tool use, or any OpenAI-compatible API, currently Gemini) | **Keep and extend.** It is the right place for traveller-facing AI |
| Deployment | One Express service serves the API and `client/dist` (`render.yaml`). The current live setup uses two Render services | **Keep.** The single-service Blueprint is simpler |

There is no technical reason to replace Express, Mongoose, the authentication or the frontend architecture. Every V0.1 requirement in `V0_1_PRODUCT_GAPS.md` fits the current structure.

### Request lifecycle

The API is ready before the database is.

1. `server/src/index.js` loads `.env` and starts listening immediately.
2. It connects to the database in the background, retrying every 15 seconds, and auto-seeds when there are no trips (or no users in embedded mode).
3. `app.locals.db` tracks readiness.
4. `server/src/app.js` serves `/api/health`. A gate returns `503 DB_UNAVAILABLE` with a reason until the database is ready.
5. Requests pass through the routers, then `notFound`, then `errorHandler`. The error handler maps Mongoose validation, cast and duplicate-key errors, plus multer errors, to 4xx responses.

Responses always use the `{ success, data }` or `{ success: false, message, details? }` shape. The client interceptor (`client/src/lib/api.js`) unwraps `data` and turns errors into `Error(message)` with `status` and `code`.

## 3. Frontend structure

### Routing (`client/src/main.jsx`)

Every route except `/` is lazy-loaded. `ScrollToTop` resets the scroll position on navigation.

| Layout | Routes | Guard |
| --- | --- | --- |
| `PublicLayout` (Header, Footer, `FlightCursor`) | `/`, `/trips`, `/trips/:slug`, `/destinations`, `/how-it-works`, `/partners`, `/organisers/:slug`, `/login`, `/register`, `*` | none |
| | `/trips/:slug/book`, `/me/trips` | `RequireRole roles=['traveler']` |
| | `/bookings/:id` | `RequireRole` (any signed-in user; the server decides access) |
| `OperatorLayout` (via `DashboardShell`) | `/operator`, `/operator/profile`, `/operator/packages`, `/operator/packages/new`, `/operator/packages/:id`, `/operator/studio`, `/operator/bookings`, `/operator/departures/:id` | `RequireRole roles=['operator']` |
| `AdminPage` (internal routes) | `/admin`, `/admin/operators`, `/admin/packages`, `/admin/bookings`, `/admin/reports` | `RequireRole roles=['admin']` |

### Shared building blocks (reusable without changes)

| File | Contents |
| --- | --- |
| `components/ui.jsx` | Button, Input, Textarea, Select, Field, Badge, StatusBadge, Card, Spinner, Skeleton, EmptyState, ErrorState, Notice, Modal, Tabs, Stat, SafeImage (responsive Unsplash `srcset`, error fallback), PageHeader, ListEditor |
| `lib/api.js`, `lib/useAsync.js`, `lib/auth.jsx`, `lib/format.js` | HTTP client, data-loading hook (loading, error, reload), session context, ₹ and date formatting |
| `components/TripCard.jsx`, `Rail.jsx`, `SearchPanel.jsx` | Listing card (with Demo badge), horizontal rail, hero search |
| `components/DashboardShell.jsx`, `Guards.jsx` | Dashboard layout, role guard |
| `components/FlightCursor.jsx` | Canvas plane cursor with a dotted trail. Public pages only; fine pointers only; respects reduced motion; the animation loop sleeps when idle |
| `index.css` | Warm Tangerine Glass tokens (matching `AGENTS.md`), `glass`, `num` and `no-scrollbar` utilities, a global `:focus-visible` ring, a reduced-motion override, and flight-cursor rules |

### Design conventions in use

- Manrope is loaded from Google Fonts (weights 400 to 800, `display=swap`).
- Ivory background, `brand` orange actions, `ink` text, `line` borders, rounded-2xl and rounded-3xl cards with `shadow-soft` and `shadow-lift`.
- Hero and trip imagery are editorial Unsplash photos (licence noted in the seed data).
- **There are no custom Indian landmark illustrations and no atmospheric scene art yet.**
- Motion is limited to `animate-fade-up`, hover transitions, the header's scroll state and the flight cursor.
- **Scroll-animation prototype: not present.** Nothing was found in the working tree, in the `main`, `ghumo-ai`, `feat/ghumo-v0.1` or `backup/ghummoo-legacy` branches, or in git history (no `IntersectionObserver`, parallax or scroll-driven code). If a prototype exists elsewhere it needs to be added to the repo before the discovery milestone.

## 4. Backend: API inventory

The base path is `/api`. Auth labels: **public**; **auth** (any signed-in user); **traveler**, **operator** or **admin** (the role is checked on the server); **op-owned** (the record must belong to the caller's `Operator`).

### Auth (`routes/auth.js`)

| Method and path | Auth | Purpose | Client caller | Status |
| --- | --- | --- | --- | --- |
| `POST /auth/register` | public | Create a traveller or operator account (admin cannot be self-assigned); sets the cookie | `lib/auth.jsx` → `AuthPage` | **Working** (used by tests) |
| `POST /auth/login` | public | Sets the cookie | `AuthPage` | **Working / Improve** (no rate limit) |
| `POST /auth/logout` | public | Clears the cookie | `Header` | **Working** |
| `GET /auth/me` | optional | Returns the profile (plus an operator summary) or `null` | `AuthProvider` | **Working** |
| `PUT /auth/me` | auth | Update name and phone | `MyTripsPage` | **Untested** |

### Trips and organisers (`routes/trips.js`, `routes/organisers.js`, `services/trips.js`)

| Method and path | Auth | Purpose | Client caller | Status |
| --- | --- | --- | --- | --- |
| `GET /trips` | public | Published trips from approved operators. Filters: `q`, `destination`, `category`, `city`, `minDays`/`maxDays`, `from`/`to`, `minPrice`/`maxPrice`, `available`, `sort`, `limit` | `HomePage`, `ExplorePage` | **Working** (T1/T2) / **Improve** (filters run in memory over up to 500 packages; fine at V0.1 scale) |
| `GET /trips/meta` | public | Destination, city and category facets plus the price range | `HomePage`, `ExplorePage`, `DestinationsPage` | **Untested** |
| `GET /trips/:slug` | optional | Full detail, upcoming departures, public operator info, reviews and similar trips. Owners and admins can preview unpublished trips | `TripDetailPage`, `BookPage` | **Working** (T3) |
| `GET /organisers/:slug` | public | Approved organiser profile, trips and rating | `OrganiserPage` | **Untested** |

### Bookings, traveller side (`routes/bookings.js`)

| Method and path | Auth | Purpose | Client caller | Status |
| --- | --- | --- | --- | --- |
| `POST /bookings` | traveler | Validate travellers and contact, atomically hold seats, create a `requested` booking; seats are released if creation fails | `BookPage` | **Working** (T4–T6, T10 concurrency) |
| `GET /bookings/mine` | auth | The traveller's bookings, populated | `MyTripsPage` | **Working** (T9) |
| `GET /bookings/:id` | owner, op-owned or admin | Booking detail plus the review | `BookingPage` | **Working** (access-control test) |
| `POST /bookings/:id/cancel` | owner | Cancel a requested or confirmed booking before start; releases seats | `BookingPage` | **Untested** |
| `GET /bookings/:id/announcements` | owner, op or admin | Trip board, locked until the booking is confirmed | `BookingPage` | **Untested** |
| `POST /bookings/:id/review` | owner | One review per confirmed booking, only after the trip ends | `BookingPage` | **Untested** (no seeded completed trip, so the UI has never been exercised) |
| `POST /reports` | auth | Report a package, operator or booking | `TripDetailPage` (packages only) | **Untested / Improve** (target existence isn't validated; no rate limit) |

### Organiser (`routes/operator.js`; everything requires the operator role)

| Method and path | Purpose | Client caller | Status |
| --- | --- | --- | --- |
| `GET`/`POST`/`PUT /operator/profile` | Onboarding (creates a `pending` operator). Editing a rejected profile re-queues it | `OperatorLayout`, `ProfilePage` | **Untested** |
| `POST /operator/verification` | Submit business registration details | `ProfilePage` | **Untested** (seeded once) |
| `GET /operator/stats` | Overview counters, recorded payments, recent bookings, next departures | `OverviewPage` | **Untested** |
| `GET`/`POST /operator/packages`, `GET`/`PUT`/`DELETE /operator/packages/:id` | Package CRUD with publish-safe edits; delete is blocked when bookings exist | `PackagesPage`, `PackageEditorPage`, `StudioPage` | **Working** (T7/T8 create) / **Untested** (edit, delete) |
| `POST /operator/packages/:id/publish`, `.../unpublish` | Publish blocked until approved and `publishBlockers()` is empty | `PackageEditorPage`, `PackagesPage` | **Working** (T7/T8) |
| `POST /operator/packages/:id/departures`, `PUT`/`DELETE /operator/departures/:id` | Departure CRUD. Capacity can't drop below held seats; cancelling is blocked while bookings are active | `PackageEditorPage`, `DeparturePage`, `StudioPage` | **Working** (create) / **Untested** (edit, cancel, delete) |
| `GET /operator/departures/:id` | Manifest plus announcements | `DeparturePage` | **Untested** |
| `POST /operator/departures/:id/announcements`, `DELETE /operator/announcements/:id` | Trip board posts | `DeparturePage` | **Untested** |
| `GET /operator/bookings`, `GET /operator/bookings/:id` | List or search (with amount received), detail with payments | `BookingsPage` | **Working** (T9) |
| `GET /operator/bookings/export.csv` | Traveller manifest CSV (formula-injection safe) | `BookingsPage`, `DeparturePage` | **Untested** |
| `POST /operator/bookings/:id/confirm` | `requested` → `confirmed` (atomic) | `BookingsPage` | **Working** (T4–T6) |
| `POST /operator/bookings/:id/reject` | `requested` or `confirmed` → `rejected`, with a required note; releases seats | `BookingsPage` | **Untested / Improve** (a confirmed booking with recorded payments can be rejected with no refund trail) |
| `POST /operator/bookings/:id/payments` | Record an offline payment against a confirmed booking; capped at the booking total | `BookingsPage` | **Untested** |

### AI (`routes/ai.js`; operator or admin only)

| Method and path | Purpose | Client caller | Status |
| --- | --- | --- | --- |
| `GET /ai/status` | Whether a provider is configured | `StudioPage` | **Working** (T11) |
| `POST /ai/extract-package` | Turn a caption into a structured draft with grounded numbers and a missing-field list | `StudioPage` | **Working** (T11 grounding plus a manual browser check with Gemini) / **Improve** (no rate limit, so a busy organiser account can run up provider cost) |

### Admin (`routes/admin.js`; admin only)

| Method and path | Purpose | Client caller | Status |
| --- | --- | --- | --- |
| `GET /admin/stats` | Platform counters | `AdminPage` overview | **Untested** |
| `GET /admin/operators`, `POST .../approve`, `POST .../reject` | Approval queue. Rejecting unpublishes the operator's trips | `AdminPage` | **Working** (admin test) |
| `POST /admin/operators/:id/verification` | Verify or reject the latest submission; sets `verifiedAt` | `AdminPage` | **Working** (admin test) |
| `GET /admin/packages`, `POST .../remove`, `POST .../restore` | Moderation | `AdminPage` | **Working** (remove) / **Untested** (restore) |
| `GET /admin/bookings` | Read-only booking list | `AdminPage` | **Untested** |
| `GET /admin/reports`, `POST /admin/reports/:id/resolve` | Report queue | `AdminPage` | **Untested** |

### Uploads (`routes/uploads.js`)

| Method and path | Auth | Purpose | Client caller | Status |
| --- | --- | --- | --- | --- |
| `POST /uploads` | operator or admin | Image upload (JPG, PNG, WebP or AVIF, up to 5 MB) to `server/uploads`, served from `/uploads/*` | `packageForm` (trip photos), `ProfilePage` (logo) | **Untested / Improve**: **files are written to the server's local disk, which is wiped on every Render deploy or restart.** Uploaded photos will break in production |

### Health

`GET /api/health` (public) reports database state. **Working**: it has been checked in production in both the failing and the healthy state.

## 5. Data model

All models live in `server/src/models/`. Every listing-related record carries `isDemo` where it applies.

```
User 1 ─── 0..1 Operator (owner, unique)
Operator 1 ─── * OperatorVerification
Operator 1 ─── * TripPackage 1 ─── * TripDeparture
User(traveler) 1 ─── * Booking * ─── 1 TripDeparture   (also references package and operator, denormalised)
Booking 1 ─── * PaymentRecord          (offline records only, gateway='offline')
TripDeparture 1 ─── * TripAnnouncement
Booking 1 ─── 0..1 Review              (unique on booking; also references package and operator)
Report ─── targetType + targetId       (package | operator | booking; polymorphic, not validated)
```

| Model | Key fields | Notes |
| --- | --- | --- |
| `User` | name, email (unique), `passwordHash` (`select: false`, bcrypt), role (`traveler`, `operator` or `admin`), phone, `isDemo` | No password reset or email verification fields |
| `Operator` | owner, businessName, slug, description, contacts, location, instagram, website, logoUrl, foundedYear, status (`pending`, `approved` or `rejected`), statusNote, `verifiedAt`, `isDemo` | `verifiedAt` alone drives the "Verified" badge (honest) |
| `OperatorVerification` | registrationType, registrationNumber, legalName, documentUrl (a text field, not an upload), notes, status, reviewer | |
| `TripPackage` | title, slug, destination, region, country, startLocation, categories (9 fixed values), duration, basePrice, currency, coverImage, images, summary, overview, highlights, itinerary[], accommodation, transport, meals, inclusions, exclusions, pickupInfo, cancellationPolicy, groupSize, status (`draft`, `published`, `unpublished` or `removed`), source (`manual` or `ai`), aiWarnings, `isDemo` | `publishBlockers()` enforces completeness before publishing. **There are no structured fields for difficulty, age range, pace or traveller type; AI matching must work from the existing fields** |
| `TripDeparture` | package, operator, start and end dates, price, totalCapacity, seatsAvailable, bookingDeadline, pickupPoint, reportingTime, status (`open`, `closed` or `cancelled`) | Seat counts change only through `services/seats.js` (atomic `$inc` holds; release is capped at capacity) |
| `Booking` | reference (`GHM-XXXXXX`), user, operator, package, departure, seats (1–20; the API caps at 10), pricePerSeat, totalAmount, travelers[] (subdocument), contact, specialRequests, status (`requested`, `confirmed`, `rejected` or `cancelled`), operatorNote, history[] | The price is snapshotted at booking time |
| `PaymentRecord` | booking, operator, amount, method (`upi`, `bank_transfer`, `cash`, `card` or `other`), externalReference, recordedBy, `gateway: 'offline'` | Honest: no gateway is implemented |
| `TripAnnouncement` | departure, package, operator, kind, title, body, pinned, author | |
| `Review` | package, operator, booking (unique), user, rating 1–5, comment, hidden | Seeded data contains **no reviews**, as intended |
| `Report` | reporter, targetType, targetId, reason, details, status, resolution | |

**Production data note:** the Atlas `ghummoo` database also contains legacy collections from the old Ghummoo app (`guides`, `certifications`, `availabilityslots`, `notifications`, plus old documents in `users`, `bookings` and `reviews`, including users with the obsolete `guide` role). They are unused by the current code. Cleaning them up is destructive and needs your approval.

## 6. Authentication, sessions and permissions

| Aspect | Implementation | Status |
| --- | --- | --- |
| Session | JWT `{ id }` in an httpOnly cookie, 7-day expiry. `Secure` follows the TLS connection (`trust proxy`). `SameSite=None` only when the request is cross-site over HTTPS, otherwise `Lax` | **Working** (verified for both the same-site and cross-site cases) |
| Missing `JWT_SECRET` | Falls back to a random per-process secret with a warning, which logs everyone out on each restart | **Improve** (`render.yaml` generates one, so this only matters for manual setups) |
| Role checks | `requireRole` (`middleware/roleGuard.js`), `loadOperator` (403/409 `ONBOARDING_REQUIRED`), and ownership queries such as `{ _id, operator: req.operator._id }` | **Working** (access-control test) |
| Self-registration | Only `traveler` or `operator`. Admins are created by the seed | **Working** |
| Unpublished visibility | Owners and admins can preview; everyone else gets 404 | **Working** |
| Private data | Traveller details are visible only to the owner, the trip's operator and admins. Public trip and organiser pages expose the organiser's **business** contact email and phone (intended) | **Working** |
| Brute-force protection | None on `/auth/login`, `/auth/register`, `/reports` or `/ai/*` | **Missing** |
| Password reset and email verification | None (there is no email provider) | **Missing** (deferred: needs a provider) |
| Token revocation | Logout clears the cookie, but a stolen token stays valid until it expires | **Improve** (acceptable for V0.1) |

## 7. Workflows end to end

### Traveller discovery and booking

1. **Home** (`HomePage`): hero photo with "Some trips are better together", `SearchPanel`, category chips, category rails from `GET /trips`, a destination grid from `GET /trips/meta`, a how-it-works strip, and an organiser call to action. Loading skeletons and an error notice with retry are in place. **Working.**
2. **Explore** (`/trips`, `ExplorePage`): search, a filter sidebar (a sheet on mobile), active-filter chips, sort, and an empty state. URL-driven filters. **Working** (T1/T2 cover the API side).
3. **Trip detail** (`/trips/:slug`): gallery and lightbox, section nav, overview, itinerary, logistics, included and excluded, pickup and cancellation, all departures with seats left, the organiser card (Verified only when `verifiedAt` is set), reviews (empty-state honest), similar trips, and a report modal. A sticky booking card with departure and seat selectors. **Working.**
4. **Book** (`/trips/:slug/book`, travellers only): per-traveller forms, contact, special requests, and a clear "No payment is taken on Ghumo AI" notice. **Working** (browser-verified).
5. **Booking page** (`/bookings/:id`): status, travellers, itinerary, organiser contact, the trip board (locked until confirmed), cancellation and a review form after the trip. **Partial**: cancellation, the trip board and reviews are **untested**.
6. **My trips** (`/me/trips`): a booking list with status, plus a profile edit form. **Working** (list) / **Untested** (profile edit).

**Gaps:** no traveller-facing AI; no notifications; no saved or wishlist trips; destinations are only an aggregation of package strings (see `V0_1_PRODUCT_GAPS.md`).

### Organiser onboarding and dashboard

1. Register as an operator, then `OperatorLayout` detects that no profile exists and shows `OnboardingForm` (from `ProfilePage`) in place of any dashboard page. The form creates a `pending` operator, and pending or rejected banners follow. A logo upload is available. **Untested** (the UI flow has not been browser-verified since the transformation).
2. Admin approval is required before publishing. Drafts, departures and Studio all work while the operator is pending. **Working.**
3. Verification submission goes to admin review and sets the Verified badge. **Working** on the API side.
4. **Overview:** counters, recent bookings, next departures, and a first-trip call to action. **Untested / Improve**: it shows numbers rather than a "what needs you today" queue.
5. **Packages and editor:** status tabs, publish blockers shown inline, photo upload or URL, ListEditor for lists and itinerary, and inline departure management. **Working** (core) / **Untested** (edit paths).
6. **Bookings:** status tabs, search, a detail modal with confirm, decline (note required) and record-payment actions, plus CSV export. **Working** (confirm) / **Untested** (the rest).
7. **Departure manifest and trip board:** traveller list, CSV, capacity and status edits, announcements. **Untested.**

### AI Package Studio

`StudioPage`:

1. Checks `/ai/status`.
2. Paste a caption (with a "Try a sample" option), then extract.
3. Review the draft: editable basics, logistics, lists and itinerary, detected departures, and a "Check before publishing" list of missing fields and warnings.
4. Save as a draft package (`source: 'ai'`, `aiWarnings` kept), optionally creating the detected departures.

Server-side safeguards:
- a strict system prompt;
- schema output;
- grounding (a price or capacity is dropped unless the number appears in the text);
- past dates are dropped;
- the category whitelist;
- the missing-field list is computed in code;
- model fallback on 503 and 429;
- a 60-second timeout.

**Working** (T11 and a manual Gemini check) / **Improve** (no rate limit; capacity grounding silently drops values without a warning, while price does warn).

### Admin

`AdminPage` tabs: Overview stats, Operators (approve or reject with a note, verification decision), Listings (remove with a reason, restore), Bookings (read-only), and Reports (resolve or dismiss). **Working** (approval and moderation are tested) / **Untested** (reports, restore, bookings list).

## 8. Tests

`server/test/api.test.js` uses Node's `node:test` against an in-memory MongoDB and seeds its own fixtures.

| Test | Covers |
| --- | --- |
| T1/T2 | Listing and filters |
| T3 | Trip detail shape |
| T4–T6, T9 | Booking persisted, seats held, visible to the operator, confirmed |
| T7/T8/T9 | Package creation, departure, publish, availability |
| T10 | Concurrent overbooking is impossible |
| Access control | Ownership and roles |
| Admin | Approval and moderation |
| T11 | AI not configured (503) plus `normalise` grounding |

**Not covered:**
- cancellation and seat release;
- reject releasing seats;
- the payment cap;
- departure capacity rules;
- announcements locking;
- review eligibility;
- reports;
- CSV export (including the formula-injection escape);
- operator onboarding and verification;
- `PUT /auth/me`;
- `/trips/meta`;
- uploads;
- the 503 database gate.

There are **no client tests**: no Vitest or Playwright setup.

## 9. Reusable without changes

These can be built on as they are:

- **Server:**
  - Auth and cookie handling, `requireRole` and `loadOperator`.
  - The error handler and response shape.
  - The `services/seats.js` atomic seat holds.
  - The booking state machine.
  - `services/trips.js` (`listCards`, `presentCard`, `isBookable`, `ratingSummary`), which is the right data source for AI matching.
  - The AI provider plumbing (`getConfig`, `callAnthropic`, `callOpenAI` with model fallback).
  - All models.
  - The health and database gate.
  - Seeding.
- **Client:**
  - Every component in `components/ui.jsx`; `useAsync`, `api` and `auth`.
  - `TripCard`, `Rail`, `SearchPanel`, `DashboardShell`, `Guards` and `FlightCursor`.
  - The tokens in `index.css`.
  - The Explore filters (URL-driven).
  - The booking form, the operator package editor and the Studio review screen.

## 10. Needs improvement (concrete)

| # | Area | Issue | Smallest fix |
| --- | --- | --- | --- |
| I1 | Uploads | Stored on ephemeral local disk, so they disappear on Render redeploys | Store them in MongoDB GridFS (driver already installed via Mongoose; no new dependency) and serve them from `GET /api/uploads/:id`. Keep `POST /api/uploads` returning `{ url }` |
| I2 | Abuse protection | No rate limits on login, register, reports or AI | A small in-memory per-IP limiter middleware (single instance, no dependency) |
| I3 | Accessibility | `Modal` has no focus trap and doesn't return focus to the opener. `Tabs` has no arrow-key navigation. Route changes don't move focus. Only `TripDetailPage` sets `document.title` | Fix in `ui.jsx` and `main.jsx` (a small `usePageTitle` hook) |
| I4 | Booking integrity | An operator can reject a **confirmed** booking that already has recorded payments, leaving no refund trail | Require a note mentioning the refund, or block rejection when payments exist and route it through a "cancel with refund note" path |
| I5 | Reports | `targetId` isn't validated to exist and has no throttle | Check the target exists; apply the I2 limiter |
| I6 | AI grounding | A dropped capacity isn't explained to the organiser | Add a warning like the one for price |
| I7 | Lint | 7 `set-state-in-effect` warnings (risk of extra renders); 27 export-shape warnings | Fix the 7; the 27 are harmless (shared modules export helpers) |
| I8 | Scale | `/trips` filters in memory over up to 500 packages | Fine for V0.1; revisit past about 300 listings |
| I9 | Deploy | The live static site lacks the SPA rewrite; the database holds legacy collections | A Render setting, or move to the single-service Blueprint; clean the legacy data only with approval |
