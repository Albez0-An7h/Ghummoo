# Ghumo AI V0.1: data dictionary

*Source of truth: `server/src/models/`. **New** marks something added in the V0.1 data-foundation milestone; everything else existed before it. Visibility: **public**, **owner**, **operator** (only the owning organiser), **admin**.*

## 1. Domains

| Domain | Models | Who writes it | Stored where |
| --- | --- | --- | --- |
| India content (editorial) | `Landscape` **New**, `Place` **New** (cities and destinations, with embedded landmarks and assets) | Ghumo team, as content-as-code in `server/src/content/india.js` | MongoDB, upserted by `migrations/v0_1.js` |
| Marketplace | `Operator`, `OperatorVerification`, `TripPackage`, `TripDeparture`, `Booking`, `PaymentRecord`, `TripAnnouncement`, `Review`, `Report` | Organisers, travellers, admins through the API | MongoDB |
| Identity | `User` | Users and the seed | MongoDB |

**Rule:** places never store package IDs, and packages never copy place content. The only bridge is the two reference arrays on `TripPackage`.

## 2. India content model

### 2.1 `Landscape` (**New**; collection `landscapes`)

| Field | Type | Rules | Notes |
| --- | --- | --- | --- |
| `slug` | String | required, unique | `himalayas`, `rivers-valleys`, `desert`, `coast`, `northeast`, `culture-heritage` |
| `name` | String | required, max 60 | |
| `order` | Number | | Display order |
| `tagline` | String | max 120 | |
| `intro` | String | max 600 | Editorial, with no distance, time or season claims |
| `palette` | `{ primary, secondary, ink }` | required; `#RRGGBB` | Illustration and section theming only, never UI chrome |
| `packageCategories` | [enum `TripPackage.CATEGORIES`] | | Secondary hint only; the real link goes package → place → landscape |
| `assets` | [Asset] | | Scene artwork |
| `contentStatus` | `draft` or `published` | default `published` | Drafts are hidden from the API |

Visibility: public (read-only API).

### 2.2 `Place` (**New**; collection `places`): cities and destinations

| Field | Type | Rules | Notes |
| --- | --- | --- | --- |
| `slug` | String | required, unique | |
| `name` | String | required | |
| `kind` | `city` or `destination` | required | A **city** is somewhere travellers depart from or visit (it can be a departure city). A **destination** is somewhere a trip goes |
| `placeType` | enum | required | `metro`, `city`, `town`, `village`, `hill_station`, `valley`, `lake`, `beach`, `backwaters`, `national_park`, `pilgrimage`, `region` |
| `state` | String | required | Indian state or union territory |
| `country` | String | default `India` | |
| `featured` | Boolean | | `true` means it is one of the curated **city directory** entries (only `kind: city`) |
| `order` | Number | | Directory order |
| `aliases` | [String] | lowercase | Alternative names used for package matching (`bombay`, `cherrapunji`) |
| `intro` | String | max 600 | Editorial introduction |
| `theme` | `{ name, palette }` | palette uses the same rules as Landscape | City theme |
| `landscapes` | [ObjectId → `Landscape`] | | |
| `landmarks` | [Landmark] | embedded | |
| `highlights` | [String] | max 120 each | "Destination highlights" |
| `experiences` | [enum `EXPERIENCES`] | | Experience categories |
| `nearby` | [ObjectId → `Place`] | no self-reference | **Means "commonly visited together or from here"; no distance or travel time is implied** |
| `assets` | [Asset] | | |
| `contentStatus` | `draft` or `published` | | |

**Validation for `featured: true`:** must be a `city`, and must have an intro, a palette, at least one landmark and at least one landscape (`pre('validate')`).

**Related package IDs** for a city or destination are **derived, not stored**. See section 4.

### 2.3 Embedded `Landmark`

| Field | Type | Rules |
| --- | --- | --- |
| `slug` | String | required |
| `name` | String | required, max 120 |
| `kind` | enum `LANDMARK_KINDS` | `fort`, `palace`, `tomb`, `monument`, `memorial`, `temple`, `mosque`, `church`, `synagogue`, `shrine`, `ghat`, `garden`, `lake`, `island`, `museum`, `observatory`, `station`, `bridge`, `waterfront`, `caves`, `market` |
| `description` | String | max 280; one factual line |
| `asset` | Asset or null | |

Landmarks are embedded rather than a separate model because each belongs to exactly one place and is never queried on its own. They can move into a model later if landmark pages are needed.

### 2.4 Embedded `Asset` (images and visual assets)

| Field | Type | Rules |
| --- | --- | --- |
| `kind` | `photo`, `illustration` or `scene` | required |
| `key` | String | required; a stable reference such as `illustration/landmark/hawa-mahal` or `scene/himalayas` |
| `url` | String | required when `status` is `available` |
| `alt` | String | **required** (accessibility) |
| `credit`, `licence` | String | required in practice for photos |
| `status` | `planned` or `available` | `planned` means the artwork isn't produced yet, and the UI shows a palette placeholder |

All seeded assets are `planned`, so no image is claimed that we don't have. Illustration files will live at `client/src/assets/<key>.svg`.

### 2.5 Vocabularies (`server/src/models/contentConstants.js`)

- **`EXPERIENCES`:** `heritage_walks`, `architecture`, `food_trails`, `spiritual`, `markets_crafts`, `arts_culture`, `nature`, `trekking`, `river_water`, `wildlife`, `beaches`.

## 3. Marketplace model

### 3.1 `TripPackage` (**Extended**)

| Field | Type | Notes |
| --- | --- | --- |
| `operator` | ObjectId → `Operator` | Owner |
| `title`, `slug`, `summary`, `overview` | String | Title and description |
| `destination` | String | Organiser's own wording, e.g. "Manali & Kasol" |
| `region`, `country` | String | |
| `startLocation` | String | Organiser's wording for the departure city |
| **`destinationRefs`** | [ObjectId → `Place`] | **New.** Structured destinations. Empty means "not linked yet" |
| **`departureCityRefs`** | [ObjectId → `Place` with `kind: city`] | **New.** Structured departure cities (more than one allowed) |
| `categories` | [enum] | `weekend`, `mountains`, `adventure`, `international`, `cultural`, `beach`, `wildlife`, `spiritual`, `trek` |
| `durationDays`, `durationNights` | Number or null | **null means not stated** |
| `basePrice`, `currency` | Number or null, String | The default departure price |
| `itinerary` | [{ day, title, description, meals, stay }] | |
| `highlights`, `inclusions`, `exclusions` | [String] | |
| `accommodation`, `transport`, `meals` | String | Stay and transport details |
| `pickupInfo`, `cancellationPolicy` | String | Policies. V0.1 keeps a single free-text cancellation policy; no structured refund tiers |
| `groupSize` | String | |
| `coverImage`, `images` | String, [String] | |
| `status` | `draft`, `published`, `unpublished` or `removed` | Publication status. `publishBlockers()` lists what's required to publish |
| `source`, `aiWarnings` | `manual` or `ai`, [String] | Studio provenance |
| `isDemo` | Boolean | Demo label |

**Never-invent rule:** missing values stay `null` or empty, and the UI renders "Not stated by organiser". The Studio grounding check and `publishBlockers()` enforce this.

**Linking rules (`migrations/v0_1.js`):**
- An exact, case-insensitive match of the package's own `destination` or `startLocation` text (whole string, or parts split on `, & / + and`) against a place's `name`, slug words or `aliases`.
- Departure cities match only `kind: city`.
- Existing links are never overwritten, and a package with no match stays unlinked (for example Bali).
- Organisers may set links explicitly through the API, which validates the IDs and checks that departure cities are cities.

### 3.2 `TripDeparture` (**Extended**)

| Field | Type | Notes |
| --- | --- | --- |
| `package`, `operator` | ObjectId | Package ID |
| `startDate`, `endDate` | Date | Return on or after departure |
| `price` | Number | **Price override:** defaults to `basePrice` when created. Organisers may set a different price per departure, which applies to new bookings only (bookings snapshot `pricePerSeat`) |
| `totalCapacity` | Number (1–500) | Total seats. Can't drop below held seats |
| `seatsAvailable` | Number | Seats not held by a requested or confirmed booking. Changed only by `services/seats.js` |
| **`confirmedSeats`** | Number | **New.** Seats on confirmed bookings: +seats on confirm, −seats when a confirmed booking is cancelled or declined. Can be recomputed with `npm run migrate -- --recount` |
| `bookingDeadline` | Date or null | Defaults to `startDate` |
| `pickupPoint`, `reportingTime` | String | |
| `status` | `open`, `closed` or `cancelled` | Organiser-controlled |
| `availability` | *derived* | **New, not stored:** `available`, `sold_out`, `booking_closed`, `closed`, `cancelled` or `departed`. Computed in `services/trips.js#availabilityOf` and returned with every public departure |

**Invariants:**
- `0 ≤ seatsAvailable ≤ totalCapacity`.
- `confirmedSeats ≤ totalCapacity − seatsAvailable` (held seats = requested + confirmed).

### 3.3 Other marketplace models (unchanged)

| Model | Purpose | Visibility |
| --- | --- | --- |
| `Operator` | Business profile, `status` (approval), `verifiedAt` (badge), `isDemo` | Public fields on approved operators; full record for the owner and admins |
| `OperatorVerification` | Registration details and admin decision | Owner and admin |
| `Booking` | Request with travellers (subdocuments), contact, status `requested`, `confirmed`, `rejected` or `cancelled`, `history[]`, price snapshot | Owner, the trip's operator, admin |
| `PaymentRecord` | Offline payment recorded by the operator (`gateway: 'offline'`) | Operator and admin |
| `TripAnnouncement` | Trip-group board post per departure | Operator; travellers confirmed on that departure |
| `Review` | One per confirmed, completed booking | Public (author's first name only) |
| `Report` | Abuse or quality report | Reporter (create) and admin |
| `User` | Account, role `traveler`, `operator` or `admin` | Self and admin |

## 4. Derived relationships (computed at request time)

| Relationship | How | Endpoint |
| --- | --- | --- |
| Trips **to** a place | Published packages from approved operators where `destinationRefs ∋ place` | `GET /api/india/places/:slug` → `relatedPackages.to` |
| Trips **from** a city | Same filter, with `departureCityRefs ∋ city` | `relatedPackages.from` |
| Trips to **nearby** places | `destinationRefs ∩ place.nearby`, excluding the "to" list | `relatedPackages.nearby` |
| Trips in a **landscape** | `destinationRefs ∩ { places with landscape }` | `GET /api/india/landscapes/:slug` → `trips` |
| Trip and place counts | The same filters, counted | `GET /api/india/landscapes`, `GET /api/india/cities` |
| A trip's places | Resolve the two reference arrays | `GET /api/trips/:slug` → `places` |

All of these reuse `services/trips.js#listCards`, so drafts, removed listings and unapproved operators are excluded everywhere.

## 5. Seed and migration strategy

| Step | What | When | Safe in production? |
| --- | --- | --- | --- |
| Content upsert | `content/india.js` → `Landscape` and `Place`, matched by slug, fully validated, references resolved (unknown slugs fail loudly) | Every boot (`AUTO_MIGRATE` is on by default), `npm run migrate`, `npm run seed` | Yes. Never deletes; removed entries stay until removed deliberately |
| Package linking | Fills **empty** link arrays from package text | Same as above, plus on every organiser package create or update | Yes. Never overwrites |
| Seat backfill | Sets `confirmedSeats` where it's missing; `--recount` recomputes everywhere | Boot (missing only), `npm run migrate -- --recount` | Yes. Derived from bookings |
| Demo marketplace | Operators, packages and departures, all `isDemo: true`. No bookings, reviews, payments or verified badges | Empty database (`seedIfEmpty`), or `npm run seed` (**destructive**; refuses in production without `--force`) | Seed-if-empty only adds data |

**The seed content contains:**
- 6 landscapes;
- 10 featured cities: Delhi, Jaipur, Varanasi, Mumbai, Bengaluru, Kolkata, Kochi, Guwahati, Srinagar and Lucknow, each with 3–5 landmarks;
- 29 supporting places: non-directory cities such as Agra, Chandigarh, Jodhpur, Jaisalmer and Mysuru, plus destinations referenced by the directory or by the demo packages.

Content honesty is enforced by a test (`server/test/india.test.js`) that fails on distance, time, season or superlative wording and on any asset that isn't `planned`.

**Demo marketplace:**
- 10 demo packages: 9 published from approved demo organisers, plus 1 draft from a pending organiser.
- Each carries `isDemo: true` and is badged "Demo" in the UI.
- No bookings, reviews, payments or verified badges are seeded.
- The live Atlas database also holds legacy collections from the old app. They are untouched and unused (removing them needs approval).

## 6. Tests for the new relationships (`server/test/india.test.js`)

1. Six landscapes, and ten complete directory cities. Every `nearby` reference resolves.
2. Content claims guard (no distances, times, seasons or superlatives); all assets are `planned`.
3. Validation rejects incomplete featured cities, featured destinations and unknown references.
4. The migration is idempotent, and manual links are never overwritten.
5. Linking uses exact matches only; Bali stays unlinked; departure cities are cities only; partial words never match.
6. The API serves landscapes, the city directory and place detail with to, from and nearby trips, and returns 404s for unknown slugs.
7. Related packages never include drafts, unpublished listings or pending organisers.
8. Trip detail exposes its places. The organiser API validates links and auto-links from text.
9. `confirmedSeats` follows confirm, cancel and decline; recount repairs drift; `availability` becomes `sold_out`.
