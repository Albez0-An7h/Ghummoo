# Ghumo AI V0.1: product architecture

*Builds on `V0_1_CODEBASE_AUDIT.md`. Routes are listed in `V0_1_ROUTE_MAP.md`, fields in `V0_1_DATA_DICTIONARY.md`, and what ships in `V0_1_FEATURE_SCOPE.md`.*

**Status labels:** **Exists** (built and working today), **Extend** (exists; V0.1 changes it), **New** (to be built), **Foundation done** (data and API built in this milestone, UI still to come).

## 1. Principles that shape every journey

1. **Two kinds of data, never mixed.**
   - *India content* is editorial: landscapes, cities, destinations and landmarks, written and reviewed by us.
   - *Marketplace data* is owned by organisers: packages, departures, prices and seats.
   - Discovery pages show both side by side, but a trip fact only ever comes from marketplace data.
2. **AI works on real records.** The matcher ranks only real published trips, and "Ask this trip" answers only from that trip's stored fields. When the data is silent, the UI says so.
3. **Booking is a request.** Organisers confirm bookings and take payment offline; the product says this wherever money comes up.
4. **One primary action per screen.** Every journey below names it.
5. **Usable without motion, on a phone, with a keyboard.** Scroll storytelling is an enhancement on top of a page that already works.

## 2. Traveller journeys

### T1. Landing (`/`)

**Extend.**

- **Goal:** understand what Ghumo is in one screen and start exploring.
- **Primary action:** search, or "Find my trip".
- **Flow:**
  1. Hero (headline, search panel).
  2. Six landscape entry points (Himalayas … Culture & heritage) from `GET /api/india/landscapes`, with honest trip counts.
  3. Real trip rails from `GET /api/trips`.
  4. City directory teaser from `GET /api/india/cities`.
  5. How booking works (request, organiser confirms, offline payment).
  6. Organiser call to action.
- **States:**
  - A landscape with 0 trips still shows, labelled "No departures listed yet".
  - Rails hide when they're empty.
  - The API error notice with retry already exists.

### T2. Search and Explore India (`/india`)

**New** (foundation done).

- **Goal:** browse India by landscape or city before deciding on a trip.
- **Primary action:** open a landscape or a city.
- **Flow:**
  1. Six landscape cards.
  2. A ten-city directory.
  3. A search box filtering places by name or alias, which works against the loaded list on the client.
- **Data:** `GET /api/india/landscapes` and `GET /api/india/cities`.
- The existing `/destinations` route redirects here; its aggregated "destinations from listings" grid moves into this page as "Places with trips".

### T3. Explore by landscape and city

**New** (foundation done).

- **Landscape** (`/india/:landscape`): intro and scene, its places (cities first), and real trips to those places. Uses `GET /api/india/landscapes/:slug`.
- **Place** (`/places/:slug`, either a city or a destination): intro, theme palette, landmarks, highlights, experience chips, nearby places, and three trip rails. Uses `GET /api/india/places/:slug`. The three rails are:
  - **Trips to here** (`relatedPackages.to`);
  - **Trips departing from here** (`relatedPackages.from`, cities only);
  - **Trips to nearby places** (`relatedPackages.nearby`).
- **Honesty:**
  - Editorial blocks carry a small "Ghumo guide" label.
  - No distances, seasons or timings appear.
  - An empty rail says "No organiser lists a trip here yet" instead of filling the space.
  - Planned illustrations fall back to a palette-tinted placeholder.

### T4. AI-assisted discovery (`/find`)

**New.**

- **Goal:** describe what I want and get a short, explained list of real trips.
- **Primary action:** "Show matching trips".
- **Form:**
  - budget per person;
  - month;
  - trip length;
  - departure city (from `GET /api/india/cities`, plus free text);
  - landscape chips;
  - experience chips;
  - a 300-character optional note.
- **Flow:**
  1. The server filters real bookable trips with the existing `/trips` logic.
  2. AI ranks up to 5 and writes one reason each, using only card fields.
  3. Any ID that wasn't a candidate is discarded.
  4. With no AI configured, the server returns a deterministic ranking with `mode: 'basic'`, and the UI says "Sorted by fit and date".
- **Output:** real `TripCard`s with the reason underneath, demo labels where they apply, plus "Refine" and "See all results".
- **Not a chatbot:** there is one submit and one result list.

### T5. Search results (`/trips`)

**Exists / Extend.** URL-driven filters (destination, budget, month, duration, departure city, category), sort, and empty state. V0.1 adds:

- a `landscape` filter (via the linked places);
- a "Compare" checkbox on each card;
- an entry point to `/find`.

### T6. Package details (`/trips/:slug`)

**Exists / Extend.**

- **Already there:** gallery, overview, itinerary, logistics, inclusions and exclusions, pickup and cancellation, departures with seats left, organiser, reviews, similar trips, report.
- **V0.1 adds:**
  - linked place chips (`places.destinations` and `places.departureCities` from the API, built in this milestone) linking to `/places/:slug`;
  - a departure availability label (`availability`, built in this milestone);
  - the "Ask this trip" panel;
  - "Add to compare".
- **Primary action:** "Request to book".

### T7. Package comparison (`/compare?trips=a,b,c`)

**New.**

- Compare 2–3 trips side by side, laid out by field: price from, next departure and seats, duration, departure city, stay, transport, meals, inclusions, exclusions, cancellation policy, organiser (Verified only if `verifiedAt` is set).
- **Deterministic; no AI.** Each trip is fetched with `GET /api/trips/:slug`. A missing value shows "Not stated by organiser".
- The compare tray lives in `sessionStorage` (per-tab convenience, so losing it is harmless).
- **Primary action:** open the chosen trip.

### T8. Ask This Trip (panel on `/trips/:slug`)

**New.**

- Suggested questions plus a free-text field.
- `POST /api/ai/trips/:slug/ask` answers from the package's public fields and upcoming departures only. Each answer shows its source chips (Itinerary, Inclusions, Departures …).
- When the data has no answer, it says "The organiser hasn't shared this" and offers the organiser's public contact.
- Hidden when AI isn't configured.
- Never sees bookings or personal data.

### T9. Booking request (`/trips/:slug/book`)

**Exists.**

- **Flow:**
  1. Choose a departure and seats.
  2. Enter traveller details and contact.
  3. Submit, which atomically holds the seats.
  4. The booking page shows "Request sent".
- The "No payment is taken on Ghumo AI" notice stays.
- **Primary action:** "Send booking request".

### T10. My Trips (`/me/trips`)

**Exists / Extend.**

- Today: a list with status badges, plus a profile editor.
- V0.1 groups bookings into **Upcoming (confirmed)**, **Requested**, and **Past and cancelled**, and adds a timeline from `Booking.history` on each booking page.

### T11. Confirmed trip group (`/bookings/:id`, Trip group section)

**Exists / Extend.**

- **Who can see it:** only travellers with a confirmed booking on that departure (plus the organiser and admins).
- **Shows:** the organiser's pinned pickup and instructions, an announcements feed (`TripAnnouncement`), the organiser's contact, and the group size, counted as the departure's `confirmedSeats`.
- **No traveller-to-traveller chat or member list in V0.1.** Exposing co-travellers' names or contacts would leak private data.
- Locked state: "Unlocks when the organiser confirms your booking".

## 3. Organiser journeys

### O1. Organiser landing page (`/partners`)

**Exists / Extend.** Value proposition, how it works (list → requests → confirm → manage the group), honest notes (no payment processing, admin approval, verification), and a call to action to `/register?role=operator`.

### O2. Registration and login (`/register`, `/login`)

**Exists.** Role choice (traveller or organiser). After sign-in, organisers land on `/operator`.

### O3. Business profile (`/operator/profile`)

**Exists.** On first visit the `OnboardingForm` creates a `pending` operator. Profile editing includes a logo upload. A rejected operator who edits their profile is re-queued.

### O4. Verification submission and status (`/operator/profile`, Verification section)

**Exists.**

- Submit the registration type, number, legal name and a document link.
- Status shows as Submitted, Verified or Rejected (with the admin's note).
- The "Verified" badge appears publicly only after admin review.
- Approval (which allows publishing) and verification (the badge) are separate, and the UI must make that clear.

### O5. Organiser dashboard, "Today" (`/operator`)

**Extend.** Turns today's counters into an **action queue**:

1. booking requests waiting (oldest first);
2. departures whose booking deadline is close;
3. drafts with publish blockers;
4. confirmed bookings not yet fully recorded as paid.

Basic insights (O11) sit below the queue.

### O6. Create and edit package (`/operator/packages/new`, `/operator/packages/:id`)

**Exists / Extend.**

- **Already there:** the full editor, publish blockers, and photo upload or URL.
- **V0.1 adds** a "Where does this trip go?" picker that writes `destinationRefs` and `departureCityRefs`. The API side is built in this milestone: it validates, departure cities must be cities, and empty links are filled automatically from the organiser's own text. The free-text fields remain the organiser's wording.

### O7. AI Package Studio (`/operator/studio`)

**Exists.**

1. Caption.
2. Grounded draft and missing-field list.
3. Review and edit.
4. Save as draft, with optional departures.

Saved drafts are auto-linked to places in the same way as O6. V0.1 also adds a warning when a capacity number was dropped for not appearing in the text.

### O8. Departures and inventory (`/operator/departures`, `/operator/departures/:id`)

**Extend.**

- **Today:** departures are managed inside each package.
- **V0.1 adds** an inventory list across all packages with, for each departure:
  - date and package;
  - capacity, confirmed seats, held seats and seats available;
  - availability state.
- **Data:** `confirmedSeats` and `availability` are built in this milestone. The list endpoint `GET /api/operator/departures` is new.
- The departure page keeps the manifest, capacity and status edits, and the trip board.

### O9. Booking management (`/operator/bookings`)

**Exists.** Status tabs, search, detail modal (confirm, decline with a reason, record an offline payment), and CSV export. V0.1 adds a guard: declining a confirmed booking that has recorded payments requires a refund note.

### O10. Traveller management (`/operator/departures/:id` manifest, plus booking search)

**Exists.**

- **Per departure:** traveller names, ages, phones, emergency contacts and booking contact, plus CSV export.
- **Across departures:** booking search by name, phone, email or reference.
- **No CRM, tagging or messaging in V0.1.**

### O11. Basic business insights (on Today)

**Extend.** Uses only stored data:

- seats confirmed versus capacity per upcoming departure;
- requests received versus confirmed versus declined (last 90 days);
- recorded payments (offline);
- published, draft and unpublished counts.

No revenue projections, page-view numbers or invented benchmarks.

### O12. Trip group management (`/operator/departures/:id`, Trip group section)

**Exists.** Post announcements of four kinds (announcement, pickup, instruction, itinerary), pin them, and delete them. They are visible only to confirmed travellers on that departure.

## 4. Minimum navigation

### Traveller (public header)

| Desktop header | Mobile menu |
| --- | --- |
| Logo → `/` | Logo |
| **Explore India** → `/india` | Explore India |
| **Trips** → `/trips` | Trips |
| **Find my trip** → `/find` | Find my trip |
| **My trips** (signed-in travellers) or **Sign in** | My trips / Sign in |
| "For organisers" (text link) → `/partners` | For organisers |

The footer keeps How it works, For organisers and the demo-data note. The compare tray shows as a floating pill only when it holds 2 or more trips.

### Organiser (dashboard sidebar, bottom tab bar on mobile)

| Item | Route | Contains |
| --- | --- | --- |
| **Today** | `/operator` | Action queue and insights |
| **Trips** | `/operator/packages` | Packages, editor, publish |
| **Departures** | `/operator/departures` | Inventory, then manifest, trip group |
| **Bookings** | `/operator/bookings` | Requests, confirm or decline, payments |
| **AI Studio** | `/operator/studio` | Caption to draft |
| **Business** | `/operator/profile` | Profile and verification |

On mobile, the bottom bar shows Today, Trips, Departures and Bookings, with "More" opening Studio and Business.

## 5. System view

```
             ┌──────────────── India content (editorial, content-as-code) ───────────────┐
content/india.js ──migrate──▶ Landscape ◀── Place.landscapes      Place.nearby ──▶ Place
                                               ▲          ▲
                       TripPackage.destinationRefs   TripPackage.departureCityRefs
             └────────────────────────────────────────────────────────────────────────────┘
                                               │
             ┌──────────────── Marketplace (organiser-owned) ────────────────────────────┐
Operator ─▶ TripPackage ─▶ TripDeparture (seatsAvailable, confirmedSeats, availability*)
                                 ▲                  ▲
                              Booking ─▶ PaymentRecord (offline)   TripAnnouncement (trip group)
             └────────────────────────────────────────────────────────────────────────────┘
* derived, not stored
```

- **AI services** read cards from `services/trips.js`; they never query bookings or users.
- **Related packages** are always derived at request time (`routes/india.js`), never stored on places.
