# GitHub issue roadmap

*There are 30 drafts in `docs/github-issues/`, none published yet. Each came from a verified gap in the code, checked against the files it names. None was invented to reach a target count. Publishing instructions are in [GITHUB_ISSUE_PUBLICATION_GUIDE.md](GITHUB_ISSUE_PUBLICATION_GUIDE.md).*

## Totals

| Difficulty | Count | `good first issue` |
| --- | --- | --- |
| Easy | 14 | 8 |
| Medium | 13 | 0 |
| Hard | 3 | 0 |
| **Total** | **30** | **8** |

## All issues

| ID | Title | Area | First-timer | Depends on |
| --- | --- | --- | --- | --- |
| easy/01 | Validate and length-limit phone and emergency-contact fields | backend + frontend | ✅ | — |
| easy/02 | Validate offline payment record fields before saving | backend | ✅ | after medium/07 |
| easy/03 | Check uploaded image file signatures instead of trusting Content-Type | backend, security | | — (coordinate with medium/04) |
| easy/04 | Make `npm run seed` refuse to wipe a remote database without `--force` | backend, devops | ✅ | — |
| easy/05 | Hide database error details from public responses in production | backend, security | | — |
| easy/06 | Unit tests for server text utilities | testing | ✅ | — |
| easy/07 | Unit tests for client formatting and trip-query helpers | testing, frontend | ✅ | — |
| easy/08 | Fix the five `set-state-in-effect` lint warnings | frontend | | coordinate with easy/09 (`lib/auth.jsx`) |
| easy/09 | Resolve the `only-export-components` lint warnings | frontend | | after medium/08 (`main.jsx`) |
| easy/10 | Add ESLint to the server | devops | | best before many server PRs |
| easy/11 | Dockerfile and docker-compose with MongoDB | devops | | — |
| easy/12 | Warn when an ungrounded seat capacity is cleared | ai | ✅ | before medium/01 and hard/01 (same file) |
| easy/13 | Test traveller cancellation edge cases | testing | ✅ | — |
| easy/14 | Rate-limit content reports and check the target exists | backend | ✅ | — |
| medium/01 | Ground departure dates and durations | ai | | the order with hard/01 is agreed by maintainers |
| medium/02 | Make offline payment recording atomic | backend | | after medium/07 |
| medium/03 | Limit seat holds from pending booking requests | backend | | **maintainer policy decision** |
| medium/04 | Persistent photo storage behind a storage adapter | backend | | — |
| medium/05 | Optional MongoDB-backed rate-limit store | backend | | — |
| medium/06 | Revocable sessions ("sign out everywhere") | backend, security | | — |
| medium/07 | Split `routes/operator.js` (pure refactor) | architecture | | **maintainer-led; do first** |
| medium/08 | Remove the `/v01` prototype or put it behind a flag | frontend | | **owner approval** |
| medium/09 | Automated accessibility checks in Playwright | testing | | — |
| medium/10 | The review flow end to end, with a completed-trip fixture | testing | | — |
| medium/11 | Request IDs and structured request logging | backend, devops | | — |
| medium/12 | Record a refund or acknowledgement when declining a paid booking | backend | | after medium/07 |
| medium/13 | Make departure capacity edits atomic | backend | | after medium/07 |
| hard/01 | Extract the grounded extraction core into a package | ai, architecture | | **licence approval**; maintainer-led |
| hard/02 | Evaluation harness for AI Package Studio | ai, testing | | **data-consent decision**; best after hard/01 |
| hard/03 | Email notifications and password reset | backend | | **choice of email provider** |

## Order of work

**Wave 0 (maintainers, before inviting contributors):**
- medium/07: the `operator.js` split.
- Decide medium/03 (the policy) and medium/08 (the prototype).

**Wave 1 (can all run in parallel, no shared files):**
- easy/01, 04, 05, 06, 07, 11, 13, 14;
- medium/05, 06, 09, 10, 11.

**Wave 2 (after medium/07):**
- easy/02, then medium/02;
- medium/12 and medium/13. They all touch `routes/operator.js`, so run them one after another or have maintainers coordinate them.

**AI track (in order, one at a time):**
1. easy/12;
2. medium/01 and hard/01, in the order the maintainers agree;
3. hard/02.

**Frontend track:**
1. medium/08;
2. easy/09;
3. easy/08, coordinated with easy/09 on `lib/auth.jsx`.

**Uploads:** easy/03 and medium/04 both edit `routes/uploads.js`. Do easy/03 first, or fold it into medium/04.

## Files where conflicts are likely

| File | Issues |
| --- | --- |
| `server/src/routes/operator.js` | easy/02, medium/02, 07, 12, 13 |
| `server/src/services/ai/index.js` | easy/12, medium/01, hard/01 |
| `server/src/routes/auth.js`, `models/User.js` | easy/01, medium/06, hard/03 |
| `server/src/app.js` | easy/05, medium/04, medium/11 |
| `server/src/routes/bookings.js` | easy/01, medium/03, medium/12 |
| `server/src/routes/uploads.js` | easy/03, medium/04 |
| `client/src/main.jsx` | easy/09, medium/08 |
| `client/src/lib/auth.jsx` | easy/08, easy/09 |

Rule of thumb: assign only **one open PR per hot-spot file at a time**.

## Issues that need maintainers

Maintainers own these, or must decide before work starts:
- medium/03: what the seat-hold policy is.
- medium/07: a large refactor.
- medium/08: what to keep from the prototype.
- hard/01: the package API and the licence.
- hard/02: consent for real organiser content.
- hard/03: the choice of email provider.

## Considered and not filed

- **Adding TypeScript:** a large change with no clear payoff yet. Better discussed in an issue if contributors ask for it.
- **An OpenAPI spec:** `API_REFERENCE.md` covers the need for now.
- **Pagination for `GET /api/trips`:** not needed at the current catalogue size. Revisit when there are about 1,000 or more listings.
- **Account enumeration on registration:** an accepted V0.1 trade-off, already documented.
- **Formatting-only or "fix a typo" tasks:** not real work.
- **The three 500-instead-of-4xx bugs found during this audit:** already fixed and tested (see `CHANGELOG.md`).
