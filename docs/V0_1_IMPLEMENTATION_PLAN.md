# Ghumo AI V0.1: implementation plan

*Based on `V0_1_CODEBASE_AUDIT.md` and `V0_1_PRODUCT_GAPS.md`. Each milestone follows the workflow in `AGENTS.md`: inspect, propose, implement only that milestone, then run tests, lint and build, and report.*

## Guiding decisions

1. **Keep the stack.** Express, Mongoose, cookie JWT auth, React and Vite and Tailwind all stay. Every V0.1 feature fits the current structure. Nothing found in the audit justifies replacing any of them.
2. **AI reads real data through existing services.** Traveller AI uses `services/trips.js` (`listCards`, `presentCard`) as its only source of trips. The model only ranks and explains candidates the server hands it. The server then rejects any ID the model returns that wasn't in the candidate set.
3. **Editorial content is content, not data.** India destination stories live in a versioned client content file, are labelled as a guide, and never contain prices, seats or dates.
4. **No new runtime dependencies are planned.**
   - Rate limiting is a roughly 30-line in-memory middleware (single Render instance).
   - Uploads use GridFS through the MongoDB driver that Mongoose already bundles.
   - Motion uses CSS plus `IntersectionObserver` and `requestAnimationFrame`.
5. **Additive API changes only.** Existing endpoints keep their request and response contracts.

## Recommended order

| # | Milestone | Why this position | Size |
| --- | --- | --- | --- |
| M0 | Foundations and hardening | Removes production blockers (lost uploads) and adds the rate limiter that public AI endpoints need | S–M |
| M1 | Test the untested marketplace paths | Locks in current behaviour before discovery work touches shared pages | S |
| M2 | Immersive India discovery | Pillar 1. Visual and content work, mostly client-side; no API changes beyond what already exists | L |
| M3 | AI trip matcher | Pillar 2. Depends on M0 (rate limit) and benefits from M2's surfaces | M |
| M4 | Ask about this trip | Pillar 2. Reuses M3's grounding utilities | M |
| M5 | Marketplace polish | Pillar 3. Organiser action queue, booking guard, in-app status clarity | S–M |
| M6 | QA, accessibility, performance and release | Full pass over every role and width, README and docs, then deploy | S |

M2 and M3 can run in parallel once M0 has merged, because they touch different files (`client/src/pages/HomePage.jsx` and the destination pages, versus the server AI service and a new matcher component). Coordinate only on where the matcher entry point sits on Home.

## M0: Foundations and hardening

**Changes**

- **Persistent uploads (I1).**
  - Store files in GridFS bucket `uploads`, through a new `server/src/services/storage.js`.
  - `POST /api/uploads` keeps its contract and still returns `{ url }`, now `/api/uploads/<id>`.
  - Add `GET /api/uploads/:id`: public, with long cache headers and the stored content type.
  - The existing `/uploads/*` static route stays, so legacy files keep working.
  - `packageForm.jsx` should accept the `/api/uploads/` prefix in its URL check.
- **Rate limiter (I2).** Add `server/src/middleware/rateLimit.js` (a per-IP fixed window that returns `429` with `Retry-After`). Apply it to:
  - `POST /auth/login` and `/auth/register`;
  - `POST /reports`;
  - `/ai/*`.
- **Accessibility basics (I3).**
  - `Modal`: focus trap, initial focus, and focus returned to the opener.
  - `Tabs`: arrow-key navigation.
  - A `usePageTitle` hook used by every page; focus moves to `<main>` on route change.
- **Small fixes.**
  - I5: validate that a report's target exists.
  - I6: warn when the AI drops a capacity.
  - I7: fix the 7 `set-state-in-effect` lint warnings.

**Tests:** upload round trip (store then fetch, plus wrong-type rejection); limiter returns 429 after N calls; report with an unknown target returns 404.

**Risk:** GridFS in the embedded local database is fine. Large images increase Atlas storage (5 MB cap per file, 512 MB on the free tier); document this.

## M1: Cover the untested marketplace paths

Tests only, with no behaviour changes unless a test exposes a bug:

- Traveller cancellation releases seats.
- Rejecting a booking releases seats.
- Payments can't exceed the booking total, and are confirmed-only.
- Departure capacity can't drop below held seats.
- Cancelling a departure is blocked while bookings are active.
- The trip board is locked until the booking is confirmed.
- Review eligibility: confirmed, ended, and one per booking.
- Reports: create, then admin resolves.
- Operator onboarding and verification.
- `PUT /auth/me`.
- `/trips/meta` facets.
- The 503 database gate.
- CSV export, including the formula-injection escape.

Then do one browser pass over the organiser onboarding UI.

## M2: Immersive India discovery

**Prerequisite:** the scroll-animation prototype mentioned in the brief is **not in the repository**. If it exists, add it under `docs/prototypes/` (or share it) before this milestone starts. Otherwise M2 builds the scroll storytelling from scratch, following `.agents/skills/motion-performance`.

**Changes (client only)**

- Add `client/src/content/regions.js`: a curated, reviewed list of regions such as Himalaya, Rajasthan, Kerala, the North-East, Goa and the Konkan coast, and Ladakh. Each entry has:
  - slug and name;
  - a short editorial intro;
  - a "best months" note, marked as a guide;
  - an illustration key;
  - the matching rules used to query real trips (`destination` and `region` terms).
- Add SVG landmark illustrations and layered landscape scenes in `client/src/assets/illustrations/`. They are original, use brand tokens, stay under about 30 KB each, are lazy-loaded below the fold, and are `aria-hidden` when decorative.
- **Home:** a scroll-told journey across regions. Each scene shows an illustration, an intro and a rail of **real** trips from `GET /trips?destination=…`. Hide a region with no trips, or show an honest empty line. The hero, search and category rails stay.
- **New route `/destinations/:slug`:** a region story plus real trips (reusing `TripCard` and `Rail`) and seasonal departures derived from real departure months. `/destinations` becomes region-first, with the existing aggregated destination list kept below.
- **Motion:** `IntersectionObserver` reveals and transform-only parallax. A static layout is used under reduced motion or on coarse pointers, and there is no scroll-jacking.

**API:** none required. `GET /trips` with `destination` already covers it. An optional convenience is `GET /trips?region=` (a one-line filter addition) if region matching by string proves too loose.

**Tests:** client build and lint, a manual pass at 360, 768 and 1280px, a reduced-motion pass, and a Lighthouse performance check on Home (LCP under 2.5 s on mobile emulation).

**Risks:** illustration production time and quality (they need a consistent style); bundle growth (scenes must be lazy-loaded); cultural accuracy (review every landmark).

## M3: AI trip matcher

**API (new, additive):** `POST /api/ai/match`. It is public, rate-limited, and limits the free text to 500 characters.

- **Request:** `{ budgetMax?, month?, minDays?, maxDays?, fromCity?, interests?: string[], groupNote?: string }`
- **Server steps:**
  1. Build candidates with existing filters through `listCards`, keeping only bookable trips.
  2. Cap the list at about 25 compact cards (title, destination, region, categories, days, `priceFrom`, `nextDeparture` date and seats left, inclusions summary, `isDemo`).
  3. Ask the model to rank up to 5 **by ID** with a one-sentence reason that cites only the provided fields.
  4. Drop any ID that wasn't among the candidates, and any reason that mentions numbers not in that card.
  5. With no AI configured (or on provider failure), return a deterministic ranking (interest-category overlap, then soonest departure) with `mode: 'basic'`.
- **Response:** `{ mode: 'ai' | 'basic', results: [{ trip: <card>, reason }], note }`. `note` explains an empty result honestly.
- **Code:** add `matchTrips()` to `services/ai/index.js`, reusing `getConfig` and `callOpenAI` and `callAnthropic`. Add a new prompt and schema.

**Client:** a structured "Find my group trip" panel (chips plus a few inputs, not a chat) on Home and at the top of Explore. Results show real `TripCard`s with the reason underneath, a demo label where it applies, and a link to adjust filters.

**Tests:**
- IDs not in the candidate set are rejected (stubbed provider).
- Basic-mode fallback works with no key.
- Empty candidates give an honest note.
- The rate limit applies.

## M4: Ask about this trip

**API (new, additive):** `POST /api/ai/trips/:slug/ask`. It is public for published trips (owners and admins can use it on previews), rate-limited, with questions up to 300 characters.

- **Context:** the package's public fields plus its upcoming departures, built from the same data as `GET /trips/:slug`. It never includes bookings or private data.
- **Model output:** `{ answer, sources: ['inclusions' | 'itinerary' | 'departures' | …], answered: boolean }`. When the data doesn't contain the answer, `answered` is `false` and the reply says "The organiser hasn't shared this. Ask them directly.", with the organiser's contact link.
- **Server:** checks that numbers in the answer appear in the context (the same grounding helper as Studio, extracted into a shared util).
- **With no AI configured:** return `503 AI_NOT_CONFIGURED`. The UI hides the panel and shows nothing broken.

**Client:** a compact "Ask about this trip" card on `TripDetailPage` with 3–4 suggested questions built from fields that are missing or present, plus an answer block with source chips that scroll to the relevant section.

**Tests:** private data is never in the context (assert on the built context); ungrounded numbers are stripped; an unpublished trip returns 404 to the public.

## M5: Marketplace polish

- **Organiser Overview as an action queue:** pending requests (oldest first), departures with a deadline within 7 days, drafts with publish blockers, and confirmed bookings not fully paid. Reuse `/operator/stats` and add fields to it additively.
- **Rejecting a confirmed booking (I4):**
  - if payments exist, require a refund note and record it in `history`;
  - the UI states that refunds are handled offline.
- **Traveller status clarity:** My trips groups bookings into Upcoming, Requested and Past. The booking page shows a clear timeline from `history`.
- **Deferred:** email notifications. Instead, document this and show an "Organiser usually replies via phone or WhatsApp" note, using only the operator's real contact details.

**Tests:** the reject-with-payments rule; the additive `stats` fields.

## M6: QA, accessibility, performance and release

Follow `.agents/skills/test-and-qa` and `accessibility`:

- Test as every role.
- Check 360, 768 and 1280px widths.
- Check keyboard-only use, reduced motion and VoiceOver basics.
- Run Lighthouse on Home, Explore and Trip detail.
- Do the honesty check (every number traces to the API).
- Update the README (features, AI configuration, known limitations).
- Deploy with the single-service `render.yaml` Blueprint, or add the static-site rewrite. Optionally remove the legacy Atlas collections, **only with your approval**.

## Smallest set of database and API changes

**Database: no schema changes are required for V0.1.**

| Change | Type | Needed for |
| --- | --- | --- |
| GridFS bucket `uploads` (`uploads.files` and `uploads.chunks`) | New collections, created automatically | M0 persistent uploads |
| `Booking.history` entry with the refund note | Existing field, new use | M5 |

There are deliberately **no** new `TripPackage` fields (difficulty, pace and so on). The matcher works only from data organisers already provide; adding fields would invite invented values.

**API: everything is additive, and existing contracts are unchanged.**

| Endpoint | Change |
| --- | --- |
| `POST /api/uploads` | Same request and response; the returned `url` now points to `/api/uploads/:id` |
| `GET /api/uploads/:id` | **New.** Public image delivery from GridFS |
| `POST /api/ai/match` | **New.** Public, rate-limited trip matcher |
| `POST /api/ai/trips/:slug/ask` | **New.** Public, rate-limited, grounded Q&A |
| `GET /api/operator/stats` | Additive fields for the action queue |
| `POST /api/operator/bookings/:id/reject` | Extra validation when payments exist |
| `POST /api/reports` | Validates that the target exists |
| `GET /api/trips` | Optional `region` filter (only if M2 needs it) |
| Rate limiting | Middleware on `/auth/login`, `/auth/register`, `/reports` and `/ai/*` |

The existing `/api/ai/status` and `/api/ai/extract-package` stay operator- and admin-only. The new traveller AI routes are mounted on the same router, ahead of the role guard.

## Decisions needed from you before M2

1. **The scroll-animation prototype:** do you have it? If so, add it to the repo; if not, M2 builds it from scratch.
2. **Illustrations:** generate original SVG illustrations in code, or will you supply artwork?
3. **Legacy Atlas data:** keep it (harmless), or remove it (destructive, needs your explicit approval)?
