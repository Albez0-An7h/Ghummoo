# Ghumo AI V0.1: feature scope

**Priority labels:**
- **Must:** V0.1 doesn't ship without it.
- **Should:** in scope if time allows; small.
- **Later:** explicitly out of V0.1. The product must not claim it.

Every feature follows the honesty rules in `AGENTS.md`.

## 1. Done in the data-foundation milestone

| Item | Where | Verified by |
| --- | --- | --- |
| `Landscape` and `Place` models (cities and destinations, embedded landmarks and assets) | `server/src/models/` | `india.test.js` |
| India content: 6 landscapes, 10 directory cities, 29 supporting places, 45 landmarks (40 of them in the 10 cities) | `server/src/content/india.js` | Claims guard test |
| `TripPackage.destinationRefs` and `departureCityRefs` with safe auto-linking | Model, `migrations/v0_1.js`, `routes/operator.js` | Linking tests |
| `TripDeparture.confirmedSeats` plus derived `availability` | Model, `services/seats.js`, `services/trips.js`, booking transitions | Seat tests |
| Read-only India API (`/api/india/*`) and `places` on trip detail | `routes/india.js`, `routes/trips.js` | API tests |
| Idempotent migration (on boot plus `npm run migrate`) | `migrations/v0_1.js`, `src/migrate.js` | Idempotency test; local dev boot |

## 2. Traveller

| Feature | Priority | Acceptance criteria |
| --- | --- | --- |
| Landing with landscapes and cities | **Must** | The six landscapes show real trip counts. Rails show only real published trips. Works at 360px and with reduced motion |
| Explore India hub, landscape page, place page | **Must** | Editorial blocks are labelled. Landmarks and nearby places render, with a placeholder when an illustration is `planned`. Each trip rail is empty-honest. No distance, time or season copy |
| Search results with a landscape filter | **Must** | Shareable URL. Combining filters never shows unpublished trips |
| Package details: place chips and availability | **Must** | `sold_out`, `booking_closed` and similar states are shown in words, not only colour |
| AI-assisted discovery (`/find`) | **Must** | Returns only IDs from the server's candidate list. Reasons cite only card fields. With no AI key it falls back to `basic` mode with a note. Rate-limited. An empty result explains which filter to relax |
| Ask This Trip | **Must** | Answers only from the package's public fields and upcoming departures. Answers "not shared" when the data has no answer. Shows source chips. Never sees bookings or users. Hidden when AI is off |
| Package comparison (2–3 trips) | **Should** | No AI. A missing field reads "Not stated by organiser". Keyboard-operable table |
| Booking request | **Must** (exists) | Atomic seats. Offline-payment notice |
| My Trips grouped, with a timeline | **Should** | Groups: confirmed upcoming, requested, past and cancelled. Timeline from `history` |
| Confirmed trip group | **Must** (exists, extend) | Locked until confirmed. Shows announcements, pickup and group size (`confirmedSeats`). No co-traveller personal data |
| Wishlist, saved searches, alerts | **Later** | |
| Traveller-to-traveller chat or member list | **Later** | Privacy and moderation are not ready |

## 3. Organiser

| Feature | Priority | Acceptance criteria |
| --- | --- | --- |
| Landing (`/partners`), registration, login | **Must** (exists) | Copy states approval, verification and offline payments honestly |
| Business profile and verification status | **Must** (exists) | Approval (publishing) and verification (badge) are clearly separate |
| Today: action queue and basic insights | **Must** | Only stored data. Each queue item links to the place it's resolved. Empty state when nothing needs action |
| Create or edit a package, with a place picker | **Must** | Picker uses `/india/cities` and place search. Departure cities must be cities. Free text stays editable |
| AI Package Studio | **Must** (exists) | Plus a warning when a capacity was dropped |
| Departures inventory | **Must** | Shows capacity, confirmed, held and available, and availability state, per departure across packages |
| Booking management | **Must** (exists, extend) | Declining a paid booking needs a refund note recorded in history |
| Traveller management (manifest and CSV) | **Must** (exists) | Visible only to the owning organiser |
| Trip group management (announcements) | **Must** (exists) | |
| Analytics beyond basic insights, CRM, messaging, team accounts | **Later** | |

## 4. Platform and cross-cutting

| Feature | Priority | Notes |
| --- | --- | --- |
| Persistent image uploads (GridFS) | **Must** | Render's disk is wiped on every deploy |
| Rate limiting (auth, reports, AI) | **Must** | In-memory per IP; no new dependency |
| Accessibility fixes (modal focus, tabs, route focus and page titles) | **Must** | See `.agents/skills/accessibility` |
| India illustrations (city, landmark and landscape scenes) | **Must** for the 6 landscapes and 10 cities; **Should** for landmarks | Assets are referenced by key. Original artwork only; needs your decision on who produces it |
| Scroll storytelling on Home and landscape pages | **Should** | The prototype isn't in the repo. Static layout first, enhancement second |
| Admin (approval, verification, moderation, reports) | **Must** (exists) | No V0.1 changes; content is edited as code, not in admin |
| Content admin UI | **Later** | `content/india.js` is the source of truth for V0.1 |
| Online payments, email or SMS, password reset | **Later** | Never implied in the UI |
| Distances, travel times, best seasons, weather | **Later** | Only with a sourced data provider |

## 5. Data honesty checklist (applies to every feature)

- Every price, seat count, date, inclusion and status on screen traces back to an API field.
- Every editorial block is labelled as a guide and contains no trip facts.
- Demo packages and organisers show "Demo" wherever they appear, including AI results.
- Missing values read "Not stated by organiser"; nothing is filled in.
- Verified appears only when `Operator.verifiedAt` is set by an admin.
- Planned illustrations never show as broken images.
