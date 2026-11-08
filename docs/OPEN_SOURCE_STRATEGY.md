# Ghumo AI: open-source strategy

*Status: **PROPOSED, REQUIRES OWNER APPROVAL**. Nothing in this document has been applied. No licence, visibility change or publication has been made.*

## 1. Starting point

These facts constrain every option. Evidence is in [PROJECT_AUDIT.md](PROJECT_AUDIT.md) §1.

- The GitHub repository `shekhar-narayan-mishra/Ghummoo` is **already public**, with full history on four branches, and has **one public fork**, owned by the collaborator `vedansha07`.
- There is **no licence**, so others may read the code but have no right to copy, modify or redistribute it.
- The project was built on an earlier project (*Ghummoo*). Whether anyone else contributed to that code, and how the two owners hold the copyright, must be confirmed before anything is licensed. (The CoNSTruct 2.0 competition carries no ownership restrictions, as confirmed by the owners.)

So the decision is not "should we open-source the startup?" The decision is **what to license, under which terms, and what to move out of public view from now on.**

## 2. Where the value of the code actually lies

Ghumo's commercial moat is **not** in this code. A competitor with the full source still lacks:
- organiser supply and relationships;
- traveller demand and brand trust;
- real trip data and booking history;
- the operations that verify organisers and handle fulfilment.

The code is a well-built but conventional Express, Mongo and React marketplace.

Most of the code is application-specific. One part is genuinely reusable and unusual: **grounded structured extraction**, which turns messy text into a schema-valid record. A model may not introduce numbers that are absent from the source, missing fields are computed in code rather than by the model, and the same contract works with Anthropic and with OpenAI-compatible APIs (Gemini). Many developers building LLM extraction need exactly this guard-rail, and few small libraries provide it.

## 3. Component classification

### A. Open-source candidates

| Component | Purpose | Implementation today | Dependencies | Reusability and value to outside developers | Extraction complexity | Security concerns | Commercial implications | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Grounded extraction core** | Provider-agnostic structured output with grounding and deterministic missing fields | `server/src/services/ai/provider.js` (Anthropic and OpenAI-compatible adapters, model fallback, timeouts, typed errors, a minimal JSON-Schema validator, injectable `fetch`); `numberInText` and `normalise` in `services/ai/index.js` | None beyond Node 20 `fetch` | **High.** It applies to any domain where LLMs extract records from free text: listings, invoices, job posts, event pages | Medium. The provider layer is already standalone; `normalise()` mixes generic grounding with travel fields and needs splitting into a generic engine and a travel "profile" | Must never log keys; it already doesn't. Prompt-injection in the input is mitigated by the grounding rules, which don't trust the model's numbers | Low risk. The travel profile and prompts can stay in the app if wanted; publishing the engine reveals little | **Open-source as a standalone package under Apache-2.0** (hard/01) |
| **Developer documentation, examples and tests** | Help people run and contribute | `docs/`, `server/test/`, `e2e/` | — | Medium | Low | None, if it contains no real data | Positive (credibility) | Publish with whichever code is licensed |

### B. Keep proprietary (never publish)

| Item | Why |
| --- | --- |
| Production data: travellers, organisers, bookings, payment records, messages, reports | Personal data and confidential business data |
| Production configuration and secrets (`.env`, host dashboards, database URIs, API keys) | Security |
| Real organiser content used for AI evaluation, unless each organiser has agreed to publication | Consent; it is third-party content |
| Commission, pricing and growth strategy, organiser pipeline, investor and partnership material | Commercially sensitive, and not in the repository today. Keep it that way |
| Internal moderation playbooks and fraud signals, once they exist | Publishing them helps abusers |

None of category B is in the repository today. [PROPRIETARY_BOUNDARIES.md](PROPRIETARY_BOUNDARIES.md) explains how to keep it out.

### C. Requires owner approval before any licence

| Item | Question to resolve |
| --- | --- |
| **The whole marketplace application** (`server/`, `client/`) | License it at all? Under which licence (§4)? |
| **Code from the legacy *Ghummoo* project** (`backup/ghummoo-legacy`, commits before `56ad883`) | Did anyone other than the committer write any of it (team members, course work)? |
| **Brand assets**: the "Ghumo AI" name and logo, and the custom landmark and landscape illustrations (`client/src/scenes/`) | Normally excluded from a code licence and kept as trademarks or brand art. Decide explicitly |
| **Editorial content**: Explore India copy (`server/src/content/india.js`, `client/src/v01/data/india.generated.json`) | Was it written by the founders? It could be licensed CC BY 4.0, or kept all-rights-reserved |
| **Third-party photos** (Unsplash URLs in `server/src/seedData.js` and `client/src/v01/data/packages.js`) | They cannot be relicensed. Keep them hotlinked and outside the licence grant |
| **GSAP** dependency | Not OSI-licensed. Acceptable as a dependency, but decide whether to replace it so the stack is fully open |

### D. Potential value, but needs refactoring first

| Component | Today | What would be needed | Verdict |
| --- | --- | --- | --- |
| **Atomic seat-inventory helpers** (`server/src/services/seats.js`) | About 45 lines, bound to the `TripDeparture` and `Booking` Mongoose models | Generic "capacity counter" helpers that take a model and field names, plus docs on hold, confirm and release semantics | Low standalone value: the pattern is short and well known. **Keep it in the app** and document the pattern instead |
| **Deterministic discovery engine** (`server/src/services/discovery/prefs.js`, `engine.js`) | Natural-language preferences become hard constraints, then a ranking with reasons, then alternatives that "miss by one", with an optional AI interpretation layer | Decouple it from the trip-card shape. Define a generic item and constraint interface | Possible later. Only worth it if outside users ask for it. **Not now** |
| **In-memory rate limiter** (`server/src/middleware/rateLimit.js`) | Small and app-specific | — | **Don't publish**: mature libraries such as `express-rate-limit` already exist |

## 4. Licensing options for the application

| Option | What it means | Pros | Cons |
| --- | --- | --- | --- |
| **1. Open app (AGPL-3.0) and open library (Apache-2.0)** | Anyone may run and modify Ghumo, but a modified hosted version must publish its source. The extraction library is permissive | Contributors work on a real, runnable product, the most attractive thing for contributors. AGPL discourages closed SaaS clones. It is honest about a repository that is already public | Some companies avoid AGPL. If the founders later want closed features that include outside contributions, they need contributors' permission (a CLA) |
| **2. Library only** | Make the app repository private; `vedansha07` also deletes the public fork or makes it private (a fork does not follow the original into private). Publish the library in a new public repository | The clearest separation between product and open source | The library is small, so there is less for contributors to do. The app code that has already been read cannot be withdrawn |
| **3. Everything permissive (MIT or Apache-2.0)** | Anyone may do anything, including closed hosted clones | Maximum adoption and simplest for contributors | Gives competitors a free head start; the owners keep only the brand |

**Recommendation: option 1**, with these conditions:
- the brand assets are excluded and covered by a trademark notice;
- contributors sign off with the DCO;
- a CLA is used for the app repository only if the founders want to keep the right to relicense.

Use **option 2** if the founders consider the app's code itself a competitive asset. Note that this audit found little in it that a competent team couldn't rebuild.

The details are in [LICENSING_RECOMMENDATION.md](LICENSING_RECOMMENDATION.md). This is not legal advice.

## 5. Recommended public scope

These steps happen only after approval.

1. **Now:**
   - Add the licence the owners choose.
   - Add a trademark and brand notice.
   - Confirm copyright ownership in writing and check the legacy *Ghummoo* contributors.
2. **Then:**
   - Publish the contributor infrastructure added in this audit: CI, templates, CONTRIBUTING and the issue drafts.
3. **Then:**
   - Extract the grounded-extraction package (hard/01) into `packages/`.
   - Publish it to npm under the agreed name, once its API and tests are stable.
4. **Later, only on demand:** consider the discovery engine.

## 6. What open-source success should look like

Measure these, not stars:
- outside contributors whose PRs merge and who come back;
- issues filed by people using the library;
- downstream projects depending on the package;
- time to first response on issues and PRs.

Do not run campaigns that buy or trade stars, and do not split tasks artificially to inflate contributor counts.
