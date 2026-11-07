# Ghumo AI V0.1: route map

**Status labels:**
- **Exists:** live today.
- **Extend:** live today; V0.1 changes it.
- **New:** to be built.
- **Built:** added in the data-foundation milestone (API only).

Guards are enforced on the server. Client guards (`RequireRole`) only shape the UI.

## 1. Client routes (`client/src/main.jsx`)

### Public and traveller (`PublicLayout`: header, footer, flight cursor)

| Route | Page | Guard | Data | Status |
| --- | --- | --- | --- | --- |
| `/` | `HomePage` | none | `GET /trips`, `GET /trips/meta`, `GET /india/landscapes`, `GET /india/cities` | **Extend** (landscape and city sections) |
| `/india` | `IndiaPage` (Explore India hub) | none | `GET /india/landscapes`, `GET /india/cities`, `GET /trips/meta` | **New** |
| `/india/:landscape` | `LandscapePage` | none | `GET /india/landscapes/:slug` | **New** |
| `/places/:slug` | `PlacePage` (city or destination) | none | `GET /india/places/:slug` | **New** |
| `/destinations` | redirect to `/india` | none | n/a | **Extend** (keeps old links working) |
| `/find` | `FindTripPage` (AI-assisted discovery) | none | `POST /ai/match`, `GET /india/cities` | **New** |
| `/trips` | `ExplorePage` (search results) | none | `GET /trips`, `GET /trips/meta` | **Extend** (`landscape` filter, compare checkbox) |
| `/trips/:slug` | `TripDetailPage` | none | `GET /trips/:slug`, `POST /ai/trips/:slug/ask`, `POST /reports` | **Extend** (place chips, availability, Ask panel, compare) |
| `/compare?trips=a,b,c` | `ComparePage` | none | `GET /trips/:slug` for each trip | **New** |
| `/trips/:slug/book` | `BookPage` | traveller | `GET /trips/:slug`, `POST /bookings` | **Exists** |
| `/bookings/:id` | `BookingPage` (status, timeline, **trip group**) | signed in (server: owner, operator or admin) | `GET /bookings/:id`, `GET /bookings/:id/announcements`, `POST .../cancel`, `POST .../review` | **Extend** (timeline, group size) |
| `/me/trips` | `MyTripsPage` | traveller | `GET /bookings/mine`, `PUT /auth/me` | **Extend** (grouped by status) |
| `/organisers/:slug` | `OrganiserPage` | none | `GET /organisers/:slug` | **Exists** |
| `/how-it-works` | `HowItWorksPage` | none | n/a | **Exists** |
| `/partners` | `PartnersPage` (organiser landing) | none | n/a | **Extend** (copy) |
| `/login`, `/register` | `AuthPage` | none | `POST /auth/login`, `POST /auth/register` | **Exists** (`?role=operator` preselects organiser) |
| `*` | `NotFoundPage` | none | n/a | **Exists** |

### Organiser (`OperatorLayout` → `DashboardShell`; guard: operator)

| Route | Page | Data | Status |
| --- | --- | --- | --- |
| `/operator` | `OverviewPage` → **Today** (action queue and insights) | `GET /operator/stats` (additive fields) | **Extend** |
| `/operator/profile` | `ProfilePage` (business profile and verification) | `GET`/`POST`/`PUT /operator/profile`, `POST /operator/verification`, `POST /uploads` | **Exists** |
| `/operator/packages` | `PackagesPage` | `GET /operator/packages`, publish, unpublish, delete | **Exists** |
| `/operator/packages/new`, `/operator/packages/:id` | `PackageEditorPage` | Package CRUD, departures, `GET /india/cities` (place picker) | **Extend** (place picker) |
| `/operator/studio` | `StudioPage` | `GET /ai/status`, `POST /ai/extract-package`, package and departure create | **Exists** |
| `/operator/departures` | `DeparturesPage` (inventory) | `GET /operator/departures` | **New** |
| `/operator/departures/:id` | `DeparturePage` (manifest, trip group) | `GET`/`PUT /operator/departures/:id`, announcements, CSV | **Exists** |
| `/operator/bookings` | `BookingsPage` (bookings and traveller search) | `GET /operator/bookings[/:id]`, confirm, reject, payments, CSV | **Extend** (refund note on paid declines) |

### Admin (`AdminPage`; guard: admin)

`/admin`, `/admin/operators`, `/admin/packages`, `/admin/bookings` and `/admin/reports` all **exist** and are unchanged in V0.1.

## 2. API routes (`/api`)

### Built in this milestone

| Method and path | Auth | Returns |
| --- | --- | --- |
| `GET /india/landscapes` | public | `[ { slug, name, order, tagline, intro, palette, assets, placeCount, tripCount } ]` |
| `GET /india/landscapes/:slug` | public | Landscape, plus `places[]` (summaries) and `trips[]` (cards). 404 if unknown |
| `GET /india/cities` | public | The 10 directory cities (summaries), each with `tripCounts { to, from }` |
| `GET /india/places/:slug` | public | Place, plus `landmarks`, `highlights`, `landscapes`, `nearby[]` and `relatedPackages { to, from, nearby }`. 404 if unknown |
| `GET /trips/:slug` | optional | **Additive:** `places { destinations[], departureCities[] }`, and `availability` on each departure |
| `POST`/`PUT /operator/packages[/:id]` | operator | **Additive:** accepts `destinationRefs` and `departureCityRefs` (validated) and auto-links empty ones |
| `POST /operator/bookings/:id/confirm`, `.../reject`, `POST /bookings/:id/cancel` | as before | Same contracts. Now keep `TripDeparture.confirmedSeats` in step |

Responses from `/india/*` are sent with `Cache-Control: public, max-age=300`.

### Built in the traveller-experience milestone

| Method and path | Auth | Change |
| --- | --- | --- |
| `GET /trips` | public | **Additive:** cards include `places { destinations, departureCities }` and `landscapes`. New filters: `place=<slug>` (goes to or departs from), `departureCity=<slug>`, `landscape=<slug>[,…]`, and `slugs=a,b`. The existing `from`/`to` date filters are unchanged |
| `GET /trips/meta` | public | **Additive:** `places.destinations`, `places.departureCities` (with trip counts) and `landscapes` for filters |
| `GET /trips/:slug` | optional | `places` entries now include `theme`; `landscapes` is added |
| `GET /india/places` | public | **New.** Every published place (summary, with aliases), for search suggestions |
| `GET /saved`, `PUT /saved/:slug`, `DELETE /saved/:slug` | traveller | **New.** Saved trips (`User.savedTrips`). Idempotent; unpublished trips drop out, and the count is returned as `unavailable` |

The client routes `/`, `/india`, `/cities`, `/places/:slug`, `/trips`, `/trips/:slug`, `/compare` and `/decide` are live and use these APIs. `/destinations` redirects to `/india`. The sample-data prototype stays at `/v01`.

### Built in the AI-discovery milestone

| Method and path | Auth | Behaviour |
| --- | --- | --- |
| `GET /discover/status` | public | `{ ai }`: whether a provider key is configured |
| `POST /discover/interpret` | public, rate-limited | `{ text }` → `{ prefs, summary, ambiguities, mode: 'ai' or 'basic', notice? }`. AI output is grounded in the user's words, and the rule-based parser is the fallback |
| `POST /discover/search` | public, rate-limited | `{ prefs }` → `{ summary, results, alternatives, explanation }`. Deterministic: hard filters (budget, departure city, dates, duration, published status, open seats) over live inventory, then soft ranking. **No AI call** |
| `POST /discover/trips/:slug/ask` | public (owners and admins on previews), rate-limited | `{ question }` → `{ answered, answer, sources[{key, label, anchor}], mode }`. Answers come from listing fields only and are checked on the server; otherwise the reply is "This detail hasn't been confirmed by the organiser." |

These replace the planned `POST /ai/match` and `POST /ai/trips/:slug/ask`. The operator-only `/ai/status` and `/ai/extract-package` are unchanged; Package Studio now shares the provider layer (`services/ai/provider.js`).

### Planned for V0.1 (not built yet)

| Method and path | Auth | Purpose | Milestone |
| --- | --- | --- | --- |
| `POST /ai/match` | public, rate-limited | AI-assisted discovery over real candidates. `mode: 'ai'` or `'basic'` | Discovery AI |
| `POST /ai/trips/:slug/ask` | public, rate-limited | Grounded Q&A on one published trip | Ask this trip |
| `GET /operator/departures` | operator | Inventory across packages: capacity, confirmed, held, available, availability | Organiser inventory |
| `GET /operator/stats` | operator | **Additive:** action-queue and insight fields | Organiser Today |
| `POST /operator/bookings/:id/reject` | operator | Requires a refund note when payments exist | Marketplace polish |
| `GET /uploads/:id`, `POST /uploads` | public, operator | GridFS-backed images (same `{ url }` contract) | Hardening |
| `GET /trips?landscape=` | public | Filter by landscape through the linked places | Explore India |

### Unchanged

`/auth/*`, `/trips`, `/trips/meta`, `/organisers/:slug`, `/bookings/*` (apart from the seat counter), `/operator/*` (apart from the above), `/ai/status`, `/ai/extract-package`, `/admin/*`, `/reports`, `/uploads` and `/health` behave exactly as documented in `V0_1_CODEBASE_AUDIT.md`.

## 3. Navigation to route mapping

| Nav item | Route |
| --- | --- |
| Explore India | `/india` (then `/india/:landscape` or `/places/:slug`) |
| Trips | `/trips` (then `/trips/:slug`, `/compare`, `/trips/:slug/book`) |
| Find my trip | `/find` |
| My trips | `/me/trips` (then `/bookings/:id`) |
| For organisers | `/partners` (then `/register?role=operator`) |
| Organiser sidebar: Today, Trips, Departures, Bookings, AI Studio, Business | `/operator`, `/operator/packages`, `/operator/departures`, `/operator/bookings`, `/operator/studio`, `/operator/profile` |
