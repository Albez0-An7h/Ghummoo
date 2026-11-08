# Open-source launch plan

*Status: **PROPOSED**. Nothing has been announced or posted. Every post below is a draft for the owners to edit and publish themselves.*

## 0. Preconditions: do not announce before these are done

- [ ] A licence is chosen and added ([LICENSING_RECOMMENDATION.md](LICENSING_RECOMMENDATION.md)).
- [ ] V0.1 is merged into `main`, `staging` is created, and branch protection is on.
- [ ] CI is green on `main`.
- [ ] Issues are published, with labels ([GITHUB_ISSUE_PUBLICATION_GUIDE.md](GITHUB_ISSUE_PUBLICATION_GUIDE.md)).
- [ ] The conduct contact email is set (`CODE_OF_CONDUCT.md`), and private vulnerability reporting is on.
- [ ] At least one maintainer has time blocked out to answer issues and PRs within 48 hours for the first month. **Announcing and then not replying does more harm than not announcing.**

## 1. What is actually worth announcing

Be specific and modest. The honest pitch:
1. **A complete, runnable, honest marketplace.** `npm run setup && npm run dev` runs it with no database or keys. It is a realistic codebase for learning and contributing: React 19, Express, Mongo, Playwright, and LLM features with fallbacks.
2. **Grounded LLM extraction.** An LLM may not invent a number that isn't in the source, and missing fields are computed in code. This is a useful pattern for anyone building extraction, and later a package of its own.
3. **Real first issues** that have acceptance criteria and tests.

Do **not** claim users, organisers, bookings, traction, performance numbers or "production-ready".

## 2. Where to share (in order) and how

| When | Where | Angle | Etiquette |
| --- | --- | --- | --- |
| Launch day | Personal LinkedIn and X | The founders' story and what is open | Plain post, one link |
| Launch week | **Hacker News "Show HN"**, once only | The grounding technique and the honest-marketplace rules, not the startup pitch | Be in the thread to answer questions. Don't ask friends to upvote |
| Launch week | dev.to or Hashnode article | "Stopping an LLM from inventing prices: grounding extraction in code", with code from `services/ai/` | Technical, with a link to the repository |
| Week 2 | r/node, r/reactjs, r/opensource (read each subreddit's self-promotion rules first) | One post each, tailored to that community, never cross-posted at the same time | Follow the 9:1 contribution norms. Skip a community whose rules don't allow it |
| Week 2 | Indian developer communities: college clubs and local JS or Node meetups | Good first issues for students; the India travel context | Offer to mentor first PRs |
| Ongoing | up-for-grabs.net, goodfirstissue.dev (they pick up the `good first issue` label automatically once the repository qualifies), firsttimersonly | Listing only | Keep the labels accurate |
| When the library ships | npm, with a README and examples; then a "Show HN" for the library alone | The library as a tool | — |

**Don't:** DM strangers asking for stars, join star-exchange groups, post in unrelated communities, or post the same text in many places.

## 3. Onboarding early users and contributors

- Pin a **"Start here"** issue that links CONTRIBUTING, LOCAL_SETUP and the five best first issues.
- Assign within 24 hours. If an assignee goes quiet for 7 days, ask politely, then free the issue.
- Review the first PRs generously: pair through review comments, and fix small nits yourself in a follow-up instead of blocking.
- Thank contributors by name in the release notes (credit is opt-in).
- After two merged PRs, invite a contributor to take a medium issue. After five, consider triage rights.

## 4. Collecting feedback

- Turn on GitHub **Discussions**, with the categories "Q&A", "Ideas" and "Show and tell". Keep issues for actionable work.
- Ask every first-time contributor one question: "What was the hardest part of getting set up?" Fix the docs from the answers.
- For the product itself, real organiser and traveller feedback comes from pilots, not from GitHub. Keep the two separate.

## 5. Keeping the project active, honestly

- A visible **release every 2 to 4 weeks** from `staging` to `main`, with a changelog.
- A monthly roadmap update in Discussions: what shipped, what is next, which issues are open.
- Triage on a fixed weekday. Close stale issues with a kind note.
- Add new issues only when genuine work appears. Never pad the backlog.

## 6. Building trust

- The CI badge, the security policy and the licence are visible in the README.
- Respond to security reports within 5 working days.
- Say what isn't done: the limitations section in the README stays honest.
- Never fake activity. Contributor and star counts should reflect real interest.

## 7. Drafts

### 7.1 Repository description (up to 350 characters)

> Open-source group-travel marketplace for independent trip organisers in India. React + Express + MongoDB. AI turns organiser captions into listings without inventing prices, dates or seats. Runs locally with no database or API key.

### 7.2 Topics

`travel` `marketplace` `india` `group-travel` `react` `express` `mongodb` `mongoose` `vite` `tailwindcss` `llm` `structured-extraction` `ai-grounding` `playwright` `good-first-issue` (only once such issues exist)

### 7.3 Launch announcement (LinkedIn / blog)

> We've opened up Ghumo AI, the group-travel marketplace we've been building for independent trip organisers in India.
>
> Organisers today sell trips through Instagram captions and WhatsApp threads. Ghumo turns that into structured, comparable listings with real seat inventory and booking requests. Its AI Package Studio drafts a listing from a caption, but it is not allowed to invent anything: a price or seat count that isn't in the organiser's own text is cleared, and every missing detail is listed for the organiser to fill in.
>
> It's early. There are no payments, and we haven't onboarded organisers yet. But the codebase is complete and runs locally with one command. If you'd like to contribute, we've written up issues with clear acceptance criteria, including good first issues.
>
> Repository: https://github.com/shekhar-narayan-mishra/Ghummoo · Licence: <licence>

### 7.4 Developer-community post (Show HN style)

> **Show HN: Grounding LLM extraction so it can't invent prices (from an open-source travel marketplace)**
>
> We built a marketplace where small organisers paste an Instagram caption and get a structured trip listing. The hard part wasn't extraction; it was stopping the model from confidently filling in prices, dates and seat counts that the caption never mentioned.
>
> What worked for us:
> 1. A schema with nullable fields, and a prompt that says "null if not stated".
> 2. Never trusting the model's numbers. A price or capacity is kept only if that number appears as a whole token in the source (supporting "₹12,999", "1,25,000", "15k" and "1.2 lakh"); otherwise it is cleared, with a warning.
> 3. Computing the "missing information" list in code, not by the model.
> 4. One code path for Anthropic tool use and OpenAI-compatible JSON mode (we use Gemini), with model fallback and typed errors. There is a deterministic fallback when no key is set.
>
> Code: `server/src/services/ai/` in https://github.com/shekhar-narayan-mishra/Ghummoo. The whole app runs with `npm run setup && npm run dev` (embedded MongoDB, demo data). Known gaps: dates aren't grounded yet, and we have no evaluation set of real posts. Both are open issues if you want to help.

### 7.5 Contributor onboarding announcement (pinned issue or Discussion)

> **Start here: contributing to Ghumo AI**
>
> 1. Read CONTRIBUTING.md (the 10 steps) and set up locally with docs/LOCAL_SETUP.md. It takes about 5 minutes and needs no keys.
> 2. Pick an issue labelled `good first issue`, and comment to be assigned.
> 3. Branch from `staging`, add tests, and open your PR against `staging`.
>
> Good first issues right now: <links>. Questions? Ask in the issue. We aim to reply within 2 working days.

### 7.6 Roadmap announcement (Discussion)

> **Roadmap: next 3 months**
>
> - **Now: make the core reliable.** Persistent photos, seat-hold limits, atomic payment records, a refund trail.
> - **Next: prove AI Package Studio.** Date grounding, an evaluation harness on consented real organiser posts, and extracting the grounded-extraction library.
> - **Then: organiser productivity.** Email notifications and account recovery.
>
> Not planned: a payment gateway, a site-wide chatbot, or anything that shows data we don't have. Full roadmap: docs/ROADMAP.md. Every item links to an issue.
