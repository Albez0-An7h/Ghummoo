# Ghumo AI: proprietary boundaries

*Status: **PROPOSED**. This sets out what must never be published and how the repository keeps it out. It applies whichever licence option the owners choose.*

## 1. Never commit or publish

| Category | Examples | Where it belongs instead |
| --- | --- | --- |
| Secrets | `server/.env`, API keys (Anthropic, OpenAI, Gemini), `JWT_SECRET`, `MONGODB_URI` with credentials, host tokens, GitHub tokens | The host's secret store (Render or Replit Secrets), GitHub Actions secrets, a password manager |
| Personal data | Traveller names, phones, emails, ages, emergency contacts, trip-group messages, organiser contact details, uploaded photos of real people | The production database and object storage only |
| Database exports and backups | `mongodump` output, CSV traveller manifests, `server/.data/`, `server/uploads/` | Encrypted storage outside Git |
| Real organiser content | Captions and brochures pasted into AI Package Studio | Production only. For an evaluation corpus, use only content whose organisers agreed in writing, anonymised, in a **private** repository |
| Business-confidential material | Pricing and commission models, the organiser pipeline, investor decks, partnership terms, unit economics | A private workspace (Drive or Notion), never this repository |
| Internal security and moderation signals | Fraud heuristics, ban lists, moderation notes | A private repository or the admin database |

## 2. How the repository enforces this today

- `.gitignore` excludes `.env`, `server/.env`, `.data/`, `uploads/`, `*.sqlite`, `test-results/` and `e2e/quality-metrics.json`.
- `server/.env.example` holds placeholders only.
- Seed data is marked `isDemo: true` and contains no real people. Phone numbers use the `+91 90000…` test range.
- In production, the demo admin no longer receives the public demo password (`server/src/seedData.js`).
- `e2e/04-security.spec.js` scans the built client bundle for secret patterns.
- The new CI workflow (`.github/workflows/ci.yml`) runs gitleaks on every pull request.

## 3. To enable in GitHub

These are manual steps; see [MANUAL_ACTIONS.md](MANUAL_ACTIONS.md).

- Secret scanning and **push protection** (Settings → Code security).
- Private vulnerability reporting.
- Branch protection on `main` and `staging`, so nothing reaches them without review.

## 4. Brand and trademark boundary

The code licence, once chosen, should **not** grant rights to:
- the names "Ghumo" and "Ghumo AI";
- the logo and favicon;
- the custom landmark and landscape illustrations, if the owners decide they are brand art.

A short `TRADEMARKS.md` would state that forks must rename the product. That file is not added yet because it depends on the licence decision.

## 5. Working rule for contributors and maintainers

> If a file would let someone identify a real traveller or organiser, sign in to a real system, or learn non-public business terms, it does not belong in this repository.

Reviewers should reject any PR that adds such material. If something slips through, follow [SECURITY.md](../SECURITY.md):
1. Rotate the secret first.
2. Then remove it. Removal alone is not enough on a public, forked repository.
