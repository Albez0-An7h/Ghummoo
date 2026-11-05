# ghumo AI

**Your next group trip, minus the chaos.**

Ghumo AI is a marketplace for fixed-departure group trips run by independent travel organisers.
Travellers discover, compare and request bookings in one place instead of across Instagram DMs,
WhatsApp groups and forms. Organisers manage packages, departures, seats and booking requests
from one dashboard, and **AI Package Studio** turns an unstructured social-media caption into a
structured listing for them to review.

> Built for CoNSTruct 2.0 Track B (Level Up) by transforming the earlier *Ghummoo* local-guide
> project. See [docs/ARCHITECTURE_AUDIT.md](docs/ARCHITECTURE_AUDIT.md) for what was kept,
> refactored and replaced. The original code is preserved on the `backup/ghummoo-legacy` branch.

---

## Quick start (local)

Requires **Node.js 20.19+** (Vite 8). No database install is needed.

```bash
npm run setup      # installs root, server and client dependencies
npm run dev        # API on :5050, web app on http://localhost:5173
```

With no `MONGODB_URI` set, the server starts an **embedded MongoDB** (via `mongodb-memory-server`).
Data persists in `server/.data/`, and demo data is seeded automatically on first boot. The first
start downloads a ~66 MB `mongod` binary into `server/.cache/`.

Single-process production mode (what Replit runs):

```bash
npm run build      # builds client/dist
npm start          # Express serves the API and the built app on $PORT (default 5050)
```

| Script | What it does |
|---|---|
| `npm run setup` | Install all dependencies |
| `npm run dev` | API (nodemon) + Vite dev server with `/api` proxy |
| `npm run build` | Production build of the client |
| `npm start` | Start the server; serves `client/dist` if it exists |
| `npm run seed` | **Wipes** the database and reloads demo data (refuses in production without `--force`) |
| `npm test` | API acceptance tests on a throwaway embedded DB |
| `npm run lint` | ESLint on the client |

## Demo accounts

All demo accounts share the password **`GhumoDemo#2026`** (override with the `DEMO_PASSWORD` env var before seeding).

| Role | Email | Use it to |
|---|---|---|
| Traveller | `traveller@ghumo.demo` | Browse, book, see *My trips* and trip updates |
| Operator (approved) | `operator@ghumo.demo` | Wandering Pahadi Co.: packages, departures, bookings, AI Studio |
| Operator (approved) | `altitude@` / `northeast@` / `desert@` / `island@ghumo.demo` | Other demo organisers |
| Operator (pending) | `newoperator@ghumo.demo` | See the pending-approval experience |
| Admin | `admin@ghumo.demo` | Approve operators, verify businesses, moderate listings, handle reports |

**Demo data is honest.** Every seeded record is flagged `isDemo` and labelled "Demo" in the UI.
No bookings, reviews, payments or "Verified" badges are seeded. These only appear through real use.
One verification submission (clearly marked demo) is seeded so the admin verification flow can be shown.

### 3-minute judge walkthrough
1. Open the homepage → **Explore Trips** → filter by *Weekend getaways* and a budget.
2. Open **Manali & Kasol Escape** → pick a departure and 2 travellers → **Request to book**.
3. Log in as the traveller, add traveller details, review the policies, and submit. You get a booking reference.
4. Log out, then log in as `operator@ghumo.demo` → **Bookings** → open the request → **Confirm**.
   Optionally record an offline payment.
5. Open the departure (Overview → Next departures) → post a **Trip update**. Log back in as the
   traveller and it appears on the booking page.
6. As the operator: **Packages → New package**, or **AI Package Studio** (needs an AI key), then add a
   departure and publish.
7. As `admin@ghumo.demo`: approve *Coastal Weekenders*, and verify Wandering Pahadi Co. The Verified
   badge then appears on its trips.

---

## Environment variables

Copy `server/.env.example` to `server/.env`. Everything is optional locally.

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5050` | Not 5000: macOS AirPlay Receiver uses that port |
| `MONGODB_URI` | *(unset → embedded DB)* | Set for production, e.g. MongoDB Atlas |
| `SEED_ON_EMPTY` | on for embedded | `true` also seeds an empty external DB on first boot; `false` disables it |
| `JWT_SECRET` | dev fallback | **Required when `NODE_ENV=production`** |
| `JWT_EXPIRES_IN` | `7d` | |
| `CLIENT_URL` | `http://localhost:5173` | CORS allow-list (comma-separated); only needed when the client is hosted on another origin |
| `AI_PROVIDER` | auto | `anthropic` or `openai` (any OpenAI-compatible API) |
| `ANTHROPIC_API_KEY` | | Server-side only |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL` | | Server-side only; the base URL lets you use Gemini/Groq/etc. OpenAI-compatible endpoints |
| `AI_MODEL` | `claude-sonnet-5-5` / `gpt-4.1-mini` | Optional override. A comma-separated list is tried in order when a model is busy (503/429) |
| `UPLOAD_DIR` | `server/uploads` | Package photo uploads |
| `VITE_API_URL` (client) | *(same origin)* | Only if the API is hosted separately |

### AI Package Studio with Google Gemini

```
AI_PROVIDER=openai
OPENAI_API_KEY=your-gemini-key
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash,gemini-flash-latest,gemini-flash-lite-latest
```

Gemini's free tier is sometimes overloaded, which is why a fallback list is useful.
Older names such as `gemini-2.5-flash` are no longer available to new keys.

## Database setup

- **Local/demo:** nothing to do (embedded MongoDB).
- **Production:** create a free MongoDB Atlas cluster, allow network access from your host, and set
  `MONGODB_URI`. On first deploy, either set `SEED_ON_EMPTY=true` for one boot or run
  `npm run seed -- --force` once.
- Note: the Atlas URI in the old `server/.env` points to a cluster that no longer exists
  (DNS NXDOMAIN), so it has been commented out.

## Deploying to Replit

The repo includes a `.replit` file.

1. Import the GitHub repo into Replit (Node.js).
2. In **Secrets**, add `JWT_SECRET` (long random string) and, recommended, `MONGODB_URI` plus
   `SEED_ON_EMPTY=true`. Add an AI key to enable AI Package Studio.
3. Press **Run** (`npm run replit` = setup → build → start) or **Deploy**
   (build: `npm run setup && npm run build`, run: `npm start`).

Without `MONGODB_URI` the app falls back to the embedded DB. That works for a quick preview, but
deployment filesystems are ephemeral, so data resets on redeploy. Use Atlas for the checkpoint link.

> **Not yet verified:** the Replit deployment itself hasn't been tested from this environment.
> The production build and `npm start` were tested locally (see below).

## Deploying to Render

**Recommended: one web service** (`render.yaml` is included). Express serves the API and the built
web app from the same origin, so there are no CORS settings, cross-site cookie problems or
static-site rewrite rules to configure.

1. Render dashboard → **New → Blueprint** → select this repo.
2. Fill in `MONGODB_URI` (MongoDB Atlas, with Network Access allowing `0.0.0.0/0`) and, for AI
   Package Studio, `OPENAI_API_KEY` (your Gemini key). `JWT_SECRET` is generated for you.
3. Deploy. The demo data loads automatically into the empty database.

Or configure a web service manually: build `npm run setup && npm run build`, start `npm start`,
health check `/api/health`, with the same environment variables. Don't set `VITE_API_URL`.

### Troubleshooting: pages stuck on loading placeholders

The web app is waiting for an API that never answers. Open `<api-url>/api/health`:

- **It never responds:** the API process is crashing and Render keeps restarting it. Check the
  service **Logs**. The usual cause is a `MONGODB_URI` pointing at a cluster that no longer exists
  (the old Ghummoo cluster is gone).
- **It returns 503 with a `database` message:** the server is up but can't reach MongoDB. The
  message says why (wrong host, wrong password, or Atlas Network Access blocking Render).

If you keep the **old split setup** (static site `ghummoo-client` + API `ghummoo-api`):
- On the API, set `CLIENT_URL=https://ghummoo-client.onrender.com` (CORS) and a valid `MONGODB_URI`.
- On the static site, add a **Rewrite** rule `/*` → `/index.html`, so links like `/trips` don't 404.
- Logins rely on a cross-site cookie (`SameSite=None`), which Safari and strict tracking protection
  block. The single-service setup doesn't have this problem.

---

## Architecture

```
client/   React 19 · React Router 7 · Tailwind CSS 4 · lucide-react · react-hot-toast · axios
server/   Express 4 · Mongoose 8 · JWT (httpOnly cookie) · multer · helmet
          src/models       User, Operator, OperatorVerification, TripPackage, TripDeparture,
                           Booking (+ Traveler subdocs), PaymentRecord, TripAnnouncement, Review, Report
          src/routes       auth · trips · organisers · bookings · operator · admin · ai · reports · uploads
          src/services     trips (card shaping), seats (atomic holds), ai (provider + grounding)
          test/            node:test API acceptance tests
```

- **One frontend, one backend, one database** (MongoDB).
- **Server-side role-based authorisation:** `traveler`, `operator` and `admin` are enforced in
  middleware. Ownership is checked on every booking, package and departure query. Users can't
  self-register as admin.
- **Seat safety:** seats are held with one atomic conditional update
  (`seatsAvailable >= n` → `$inc: -n`), so concurrent requests can't oversell. Seats are released on
  rejection or cancellation, and capacity can't be lowered below seats already held.
- **Honest booking:** there's no payment gateway, so the flow is a *booking request*. It holds seats,
  generates a reference (`GHM-XXXXXX`), and the organiser confirms. The UI never claims a payment
  succeeded. Operators can record offline payments, and revenue is computed only from those records.
- **AI Package Studio:** `POST /api/ai/extract-package` calls the configured provider server-side
  with a strict "don't invent" prompt and structured output (Anthropic tool use or OpenAI JSON mode).
  The server then:
  - clears any price or capacity that doesn't literally appear in the source text;
  - drops past or invalid dates;
  - computes missing-field warnings itself (capacity, cancellation policy, pickup time, hotel
    category, …).

  If no key is set, the UI shows a setup message and links to manual creation. There's no fake
  parser.
- **Trust:**
  - The Verified badge appears only after an admin reviews submitted business details.
  - Listing approval is a separate step.
  - Cancellation policy and exclusions are shown again before submitting, with an explicit
    acknowledgement.
  - Reviews only come from confirmed, completed bookings.
  - Any logged-in user can report a listing, and admins can remove or restore listings.
- **Trip community (MVP):** each departure has a persistent updates board (announcement, pickup,
  instructions, itinerary). It's visible only to the operator and travellers with a *confirmed*
  booking on that departure.

## Status

### Acceptance tests

| # | Test | Result |
|---|---|---|
| 1 | Homepage loads | ✅ browser-verified |
| 2 | Discover & filter packages | ✅ API test + browser |
| 3 | Trip detail page | ✅ API test + browser |
| 4 | Select departure & request booking | ✅ browser end-to-end |
| 5 | Booking persisted | ✅ API test |
| 6 | Operator sees reservation | ✅ API test + browser |
| 7 | Operator creates package | ✅ API test |
| 8 | Operator adds departure | ✅ API test |
| 9 | Availability updates | ✅ API test (hold, release on reject/cancel) |
| 10 | No overselling | ✅ API test (6 concurrent requests for 3 seats → exactly 3 succeed) |
| 11 | AI Studio returns structured data with a key | ✅ verified with Google Gemini: sample caption → structured draft, with missing capacity/policy/pickup flagged, and saved as a draft from the UI |
| 12 | Responsive on mobile | ✅ no horizontal overflow at 360px on all public and operator pages; mobile booking bar and filter drawer |
| 13 | Production build | ✅ `npm run build`; `npm start` serves the SPA and deep links |
| 14 | No critical runtime errors | ✅ no console errors in the tested flows |

### Not done / future
- Online payments (PaymentRecord model is ready, no gateway integrated).
- Real-time trip chat (the updates board is the MVP foundation).
- Email/WhatsApp notifications to operators on new requests.
- Image uploads are stored on local disk (`server/uploads`), which is ephemeral on most hosts. Use
  image URLs, or add object storage for production.
- Advanced analytics, traveller matching, AI recommendations.
