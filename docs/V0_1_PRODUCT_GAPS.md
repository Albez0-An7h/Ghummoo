# Ghumo AI V0.1: product gaps

*This compares the V0.1 product brief in `AGENTS.md` with what exists today (see `V0_1_CODEBASE_AUDIT.md`). Labels follow the audit: **Working**, **Partial**, **Untested**, **Missing** and **Improve**.*

The current product is a solid, honest **marketplace core**: listings, booking requests, an organiser dashboard, AI Package Studio and admin moderation.

V0.1 is mostly about the first two pillars, which are thin or absent today:

- **Immersive India discovery** is limited to one hero photo and a destination grid.
- **AI-assisted trip discovery** does not exist for travellers. AI is organiser-only.

## Pillar 1: Immersive India discovery

| Capability | Today | Status | Gap |
| --- | --- | --- | --- |
| Home hero | One editorial photo, headline, search panel, category chips | **Working** | It doesn't tell an India story; it reads as a generic travel hero |
| Destinations page (`/destinations`) | A grid of destination names aggregated from package strings (`/trips/meta`), linking to `/trips?destination=` | **Partial** | No regions, no editorial content, no landmark illustrations, no "why go / best season" information. Destinations exist only if a package mentions them |
| Destination or region detail | None | **Missing** | No page that introduces a place and then shows its real trips |
| Custom Indian landmark illustrations | None | **Missing** | A brand requirement in `AGENTS.md` |
| Atmospheric landscape scenes and scroll storytelling | None. **No scroll-animation prototype exists in the repo or any branch** | **Missing** | Must be built, or the prototype must be added to the repo first |
| Motion system | `animate-fade-up`, hover transitions, `FlightCursor` | **Partial** | No scroll reveals or scene transitions. The reduced-motion base is in place |
| Seasonality ("where to go in December") | None. Packages have dates, not seasons | **Missing** | Can be derived from real departure months; no invented data |

**Honesty constraint:** editorial destination copy (history, best season, culture) is *content*, not marketplace data. It must be written and reviewed, labelled as a guide, and never mixed with trip facts. Trip facts (prices, seats, dates, inclusions) still come only from the API.

## Pillar 2: AI-assisted trip discovery and decision-making

| Capability | Today | Status | Gap |
| --- | --- | --- | --- |
| AI provider plumbing | Server-side Anthropic or OpenAI-compatible (Gemini), model fallback, timeouts | **Working** | Reusable as it is |
| AI Package Studio (organisers) | Caption → grounded draft plus missing fields | **Working / Improve** | Add a capacity-dropped warning and a rate limit |
| **Trip matcher (travellers)** | None | **Missing** | A traveller describes what they want (budget, month, days, from-city, vibe) and gets ranked **real** published trips with a plain reason for each. It must never recommend a trip that isn't in the database, and must say so when nothing fits |
| **Ask about this trip** | None | **Missing** | Answers questions ("Is food included?", "What time is pickup?") using only that package and its departures. It must reply "The organiser hasn't said" when the data is silent, and point to the source section |
| Compare trips | None | **Missing** (optional) | Side-by-side facts for 2–3 trips. Can be deterministic, needing no AI. **Defer** unless time allows |
| AI explaining missing info before booking | None | **Missing** (optional) | Could reuse the "Ask" grounding to list unanswered essentials (pickup, stay type). **Fold into Ask** |
| Traveller AI availability | `/api/ai/*` is restricted to operators and admins | **Missing** | Public AI endpoints need rate limiting and an input size cap |

**Product rule check:** neither feature is a site-wide chatbot. The matcher is a structured form with results, placed on Home and Explore. "Ask" is a compact panel on the trip detail page with suggested questions. Both must work, or degrade with a clear message, when no AI key is configured. The matcher can fall back to deterministic filtering.

## Pillar 3: Marketplace for travellers and organisers

| Capability | Today | Status | Gap |
| --- | --- | --- | --- |
| Listings, filters, detail | Full | **Working** | |
| Booking request with atomic seats | Full | **Working** | |
| Honest payment copy (offline only) | Booking page notice, `PaymentRecord.gateway='offline'` | **Working** | Keep it. Don't add a gateway in V0.1 |
| Traveller cancellation | Implemented | **Untested** | Needs a test and a browser check. Policy text is free-form |
| Trip board (announcements) | Implemented; locked until confirmed | **Untested** | Needs a test and a browser check |
| Reviews after trip | Implemented | **Untested** | No completed trips in the seed data, so it has never been exercised. Test with a fixture |
| Notifications (traveller confirmed or declined; organiser new request) | None | **Missing** | No email provider exists. **V0.1 smallest:** in-app attention states (status badges, a "needs action" queue for organisers, status change visible in My trips). Email is deferred |
| Organiser "what needs me today" | Counters only | **Improve** | Turn the Overview into an action queue: pending requests, departures closing soon, missing publish info |
| Organiser onboarding UI | Implemented | **Untested** | Needs a browser pass |
| Image uploads | Local disk | **Improve (critical for production)** | Photos vanish on redeploy. Move to GridFS |
| Reject after payment | Allowed with no refund trail | **Improve** | Guard it or record a refund note |
| Saved trips or wishlist | None | **Missing** | **Defer.** Not needed for the V0.1 promise |
| Password reset and email verification | None | **Missing** | **Defer** (needs an email provider). Document it as a known limitation |
| Admin | Approvals, verification, moderation, reports | **Working / Untested** | Reports and restore need tests. No user management (defer) |

## Cross-cutting

| Area | Status | Gap |
| --- | --- | --- |
| Rate limiting | **Missing** | Login, register, reports and every AI endpoint |
| Accessibility | **Improve** | Modal focus trap and focus return, tab arrow keys, focus and title on route change, contrast spot-check of `text-muted` at small sizes |
| Mobile | **Working** | All pages were checked at 360px during the transformation. Any new discovery sections must be re-checked |
| Reduced motion | **Working** (base) | Every new scroll or scene effect must have a static fallback |
| Performance | **Working** | Main JS is about 110 kB gzip. New illustrations and scenes must be lazy-loaded and budgeted (see `.agents/skills/motion-performance`) |
| Tests | **Partial** | 8 API tests. Cancellation, trip board, reviews, payments, reports, onboarding, uploads and the new AI endpoints need coverage. There are no client tests (add Playwright smoke tests only if time allows) |
| Demo labelling | **Working** | Demo badges on cards, detail pages and organisers, plus a footer note. New AI answers must also note when a trip is a demo listing |
| Deployment | **Partial** | The live static site lacks its SPA rewrite. The single-service Blueprint (`render.yaml`) avoids this entirely |

## Explicitly out of scope for V0.1

These are deferred, and the product must not claim them:

- online payments or a payment gateway;
- email or SMS notifications, password reset, email verification;
- a traveller-to-traveller community or chat;
- wishlists, comparisons and loyalty;
- a native app or multi-language support;
- an AI chatbot on every page.
