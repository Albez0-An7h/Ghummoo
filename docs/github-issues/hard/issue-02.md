# Evaluation harness for AI Package Studio extraction

**Difficulty:** Hard · **Category:** AI quality · **Labels:** `ai`, `testing`, `backend`, `devops`, `hard` · **Estimated effort:** 1–2 weeks (plus time to gather consented data) · **First-time contributor:** No (needs a data-consent decision, careful labelling and CI secret handling)

## Problem
There is no way to measure how well AI Package Studio extracts trips from real organiser posts. The only checks are unit tests of the grounding rules (`server/test/hardening.test.js`, `server/test/api.test.js` T11) and e2e tests against a deterministic stub (`e2e/ai-stub.js`) that returns the same canned draft for every caption. `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` ("AI provider") notes that provider quality was tested only against that stub.

## Why it matters
Without measurements, a prompt change, a model change (`AI_MODEL`) or a grounding change can make extraction worse unnoticed. The most important number for Ghumo is how often the output contains a value that is not in the source text, because AGENTS.md forbids invented prices, dates and capacities.

## Current behaviour
No corpus, no labels, no metrics.

## Expected behaviour
- **Corpus:** organiser posts used **only with each organiser's written consent**, anonymised (names, phone numbers, UPI IDs, handles removed), each with hand-labelled expected fields (title, destination, price, currency, duration, departure dates, capacity, inclusions, exclusions, pickup, cancellation policy). `docs/PROPRIETARY_BOUNDARIES.md` requires real organiser content to stay in a **private** repository. The public repository holds only the format, the scripts and a small **synthetic** sample written for the purpose.
- **Script** (e.g. `npm run eval:studio`) that runs extraction (`extractPackage` in `server/src/services/ai/index.js`, or the package from `hard/01` if it has landed) over every case with the configured provider and reports, per field: precision, recall and exact-match rate; overall a **hallucinated-value rate**: values present in the output but absent from the source text, checked with the same grounding functions the app uses.
- Output as a readable table and a JSON file, with provider, model and corpus version recorded.
- **CI:** runs on every PR against `e2e/ai-stub.js` and the synthetic sample. This checks the harness works (the stub's answers are fixed, so the scores say nothing about model quality). An optional, manually triggered job runs against a real provider using a repository secret and the private corpus.

## Acceptance criteria
- [ ] A maintainer has recorded the data-consent decision and where the private corpus lives.
- [ ] The public repository contains no real organiser text or personal data.
- [ ] The script runs locally with no key (against the stub) and with a configured provider.
- [ ] Per-field precision/recall and the hallucinated-value rate are reported; definitions are documented in the README of the harness.
- [ ] The CI job against the stub runs in `.github/workflows/ci.yml` (or a separate workflow) and fails if the harness errors.
- [ ] The real-provider job runs only on manual trigger, never on PRs from forks, and never prints the key or full captions.

## Suggested approach
Store cases as one JSON file per post: `{ id, text, expected: { … }, notes }`. Compare normalised values (trimmed, case-folded strings; sets for lists; ISO dates). Reuse `numberInText` (and the date check from `medium/01`, once it exists) for the hallucination metric so the metric and the product use the same rule. Start the stub the same way `playwright.config.js` does.

## Relevant files
- `server/src/services/ai/index.js`, `server/src/services/ai/provider.js`
- `e2e/ai-stub.js`, `playwright.config.js`
- `.github/workflows/ci.yml`
- `docs/PROPRIETARY_BOUNDARIES.md`, `docs/OPEN_SOURCE_STRATEGY.md`

## Testing requirements
Unit tests for the scoring functions (precision/recall on lists, date comparison, hallucination detection) with small fixed inputs. The CI job against the stub must pass.

## Dependencies
- Maintainer decision on data consent and corpus storage.
- Works better after `hard/01` (package) and `medium/01` (date grounding), but does not require them.
