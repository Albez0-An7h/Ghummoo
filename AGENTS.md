# Ghumo AI: repository instructions

Work as the lead product engineer and design-minded technical architect for Ghumo AI. Read this file before changing anything. Each task-specific skill lives in `.agents/skills/<name>/SKILL.md`; load the ones that match the work (see the list at the end).

## Product

Ghumo AI is an AI-powered group travel marketplace. It starts with independent travel organisers and fixed-departure group trips in India.

**Promise:** help people discover India, find a group trip that fits them, understand what they are booking, and travel with a group.

**Three pillars**
1. Immersive India discovery.
2. AI-assisted trip discovery and decision-making.
3. A useful marketplace for travellers and independent organisers.

The goal is a cohesive, shippable **V0.1**, not a collection of disconnected prototypes.

## Product rules

- Usability comes before feature count. Don't add a feature just because it is technically possible.
- Don't turn every page into a chatbot. AI appears where it helps a decision.
- Avoid the generic SaaS dashboard look, including in operator and admin screens.
- **Never invent data.** That covers trip prices, seat counts, reviews, organisers, availability, inclusions and booking status. Everything shown comes from the database.
- AI answers and recommendations must use real package data from the API. When the data doesn't have the answer, say so.
- Label sample or demo content clearly. Seeded records carry `isDemo: true`.
- Never expose private traveller or organiser data (phones, emails, manifests) outside the roles allowed to see it.
- **No payment integration exists.** Bookings are requests, and organisers record payments manually (`PaymentRecord`). Don't claim online payments unless a real provider is implemented.
- Every important feature must work without animation, on mobile, with a keyboard, and with reduced motion.

## Design direction: Warm Tangerine Glass

| Token | Value | Tailwind name (`client/src/index.css`) |
| --- | --- | --- |
| Primary orange | `#F26A2E` | `brand` |
| Hover orange | `#DC571F` | `brand-hover` |
| Light background | `#FFF7EF` | `ivory` |
| Secondary background | `#F9F0E8` | `sand` |
| Main text | `#241F1B` | `ink` |
| Secondary text | `#81766D` | `muted` (use `subtle` `#6B6058` for small text) |
| Borders | `#EDE1D6` | `line` |

- The typeface is Manrope.
- Visuals: editorial travel photography, custom Indian landmark illustrations, atmospheric landscape scenes, and glass surfaces used selectively.
- The feel is distinctive, playful, premium and colourful, with no blue or purple UI accents.
- Motion is cinematic but usable and performant.
- `client/src/index.css` is the single source of truth for tokens. Add new tokens there, never as hex values inside components.

## Architecture (keep it)

- **Client** (`client/`): React 19, React Router 7, Tailwind 4 via `@tailwindcss/vite`, lucide-react, axios, and react-hot-toast.
  - Shared UI lives in `client/src/components/ui.jsx`; data loading uses `client/src/lib/useAsync.js`.
  - Routes are in `client/src/main.jsx`.
- **Server** (`server/`): Express 4, Mongoose 8, CommonJS.
  - Auth is a JWT in an httpOnly cookie, with role guards for `traveler`, `operator` and `admin`.
  - Models are in `server/src/models/` and routes in `server/src/routes/`.
  - Seat holds are atomic, in `server/src/services/seats.js`.
- **AI** (`server/src/services/ai/`): a server-side provider (Anthropic, or any OpenAI-compatible API such as Gemini).
  - Numbers are grounded: a price or capacity must literally appear in the source text.
  - The missing-field list is computed in code, not by the model.
- **Production:** a single Express service serves `client/dist`. Deployment is described in `render.yaml`. The API answers `503` with a reason while the database is unavailable.

## Engineering rules

- Inspect the existing code before changing it. Preserve working features and API contracts; document any change you must make.
- Reuse the existing auth, role checks, models and booking logic. Never replace the backend to simplify frontend work, and never create a duplicate app, API server or data model.
- Avoid new dependencies. Justify any you add (size, maintenance, why existing code can't do it).
- **Ask before** any destructive database command (`npm run seed` wipes data; so do `deleteMany` and `drop`) and any destructive Git command (force-push, reset, branch delete).
- Never read, print or commit `.env` files, API keys or secrets. `server/.env.example` documents the variables.
- Every data view needs loading, error and empty states. Every input needs validation on both client and server.
- Write tests for important new business logic in `server/test/` (run with `node --test`).
- Keep changes focused, and explain any architectural decision in the PR or report.
- Never add AI or assistant attribution (co-author trailers, "generated with" lines) to commits, PRs or files.

## Commands

```bash
npm run setup   # install root, server and client
npm run dev     # API on :5050, web on :5173
npm test        # server API tests
npm run lint    # client ESLint
npm run build   # production client build
```

Without `MONGODB_URI`, the server uses an embedded MongoDB in `server/.data` and seeds demo data automatically.

## Workflow for every milestone

1. Inspect the relevant files.
2. State the proposed changes.
3. Identify dependencies and risks.
4. Implement only that milestone.
5. Run the relevant tests, `npm run lint` and `npm run build`.
6. Report the changed files, tests, known limitations and next steps.

Don't silently skip a requirement. If a request conflicts with the architecture, explain the conflict and propose the smallest safe solution.

## Skills

| Skill | Use it when |
| --- | --- |
| `product-ux` | Shaping a flow, page or feature; deciding what to build or cut |
| `frontend-design` | Building or restyling UI in `client/` |
| `india-visual-storytelling` | Imagery, illustration, landmark art, destination storytelling |
| `motion-performance` | Animation, scroll effects, canvas, bundle size and loading speed |
| `accessibility` | Any UI change (always check it) |
| `test-and-qa` | Before reporting a milestone done |
