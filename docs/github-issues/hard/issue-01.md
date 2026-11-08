# Extract the grounded AI extraction core into a standalone package

**Difficulty:** Hard · **Category:** Architecture / open source · **Labels:** `architecture`, `ai`, `backend`, `hard` · **Estimated effort:** 1–2 weeks · **First-time contributor:** No (maintainer-led; blocked on a licence decision and changes code every AI feature depends on)

## Problem
The parts of AI Package Studio that would be useful outside Ghumo are mixed with app code:

- `server/src/services/ai/provider.js`: Anthropic tool-use and OpenAI-compatible adapters, model fallback over a comma-separated `AI_MODEL` list (OpenAI-compatible path only, lines 115-145), timeouts via `AbortSignal.timeout`, retry on busy responses, the `AiError` codes (lines 5-10), a minimal JSON-Schema validator (`validate`, lines 50-66) and an injectable `fetch` (`setFetch`, line 24). It reads `process.env` directly (`getConfig`, lines 26-40).
- `server/src/services/ai/index.js`: grounding (`numbersInText`, `numberInText`, lines 69-88) and `normalise()` (lines 90-152), which mixes generic rules (clear ungrounded numbers, compute `missing` in code) with travel-specific fields and checks (hotel category, pickup point).

`docs/OPEN_SOURCE_STRATEGY.md` recommends publishing this core as a package, and `docs/OPEN_SOURCE_ARCHITECTURE.md` proposes the layout and interface (`packages/grounded-extract`, `createProvider`, `extract({ text, profile, provider })`).

## Why it matters
A small, dependency-free library with an explicit "no ungrounded numbers, deterministic missing fields" contract is reusable for any extraction task (listings, invoices, events). Separating it also gives the app a cleaner boundary and lets the grounding rules be tested on their own.

## Current behaviour
All of this lives in `server/src/services/ai/`. It is used by Studio (`server/src/routes/ai.js`), discovery interpretation (`server/src/services/discovery/interpret.js`) and Ask This Trip (`server/src/services/discovery/ask.js`); `server/src/routes/discover.js` reads `status()`.

## Expected behaviour
Following `docs/OPEN_SOURCE_ARCHITECTURE.md`:

- `packages/grounded-extract/` with `src/providers/` (Anthropic, OpenAI-compatible), `schema.js` (validator), `grounding.js`, `extract.js`, `errors.js`, its own `test/` (no network, injected `fetch`), a README, and a non-travel example profile.
- **No dependency** on Mongo, Mongoose, Express or `process.env`. Configuration is passed in; the server keeps env parsing.
- The server consumes it via `"grounded-extract": "file:../packages/grounded-extract"`. `server/src/services/ai/index.js` becomes the travel profile (schema, prompt, travel checks).
- **Move first, change nothing:** API responses, error codes and status codes are unchanged; no client change.

## Acceptance criteria
- [ ] Licence for the package approved by the owners (see notes) before the PR is merged; nothing is published to npm in this issue.
- [ ] `server/test/api.test.js` (T11), `server/test/hardening.test.js` and `server/test/discovery.test.js` pass **unchanged**.
- [ ] `npm run test:e2e` passes (Studio, discovery and Ask journeys use `e2e/ai-stub.js`).
- [ ] The package has its own tests for providers (via injected `fetch`), validator, grounding and `extract()`, run by `npm test`.
- [ ] `grep -r "process.env\|mongoose\|express" packages/grounded-extract/src` finds nothing.
- [ ] The package never logs keys or request bodies.
- [ ] Only one copy of the provider code exists after the PR.

## Suggested approach
1. Create the package and move `provider.js` pieces as they are; re-export from `server/src/services/ai/provider.js` so callers don't change in the first commit.
2. Move `numbersInText`/`numberInText`; then split `normalise()` into a generic step (driven by `groundedNumbers` and `required` in the profile) and travel clean-up.
3. Replace `getConfig()` with a server-side function that builds the provider from env.
4. Add the example profile and README last.

## Relevant files
- `server/src/services/ai/provider.js`, `server/src/services/ai/index.js`
- `server/src/services/discovery/interpret.js`, `server/src/services/discovery/ask.js`
- `server/src/routes/ai.js`, `server/src/routes/discover.js`
- `docs/OPEN_SOURCE_ARCHITECTURE.md`, `docs/OPEN_SOURCE_STRATEGY.md`, `docs/LICENSING_RECOMMENDATION.md`
- Root and `server/` `package.json`, `.github/workflows/ci.yml` (package tests must run in CI)

## Testing requirements
Server suite unchanged and green, package tests green, e2e green. Compare Studio output for a few captions before and after on the stub; it must be identical.

## Dependencies
- Owner approval of the open-source scope and the package licence (`docs/OPEN_SOURCE_STRATEGY.md`, `docs/LICENSING_RECOMMENDATION.md` recommends Apache-2.0).
- `easy/12` should land first. For `medium/01`, see the ordering note in that issue.

## Notes for maintainers
- Maintainer-led; announce a freeze on `server/src/services/ai/` while it is open.
- Discovery uses a different, weaker grounding check: `numberGrounded` in `server/src/services/discovery/interpret.js:46` matches digit substrings, so a budget of 500 counts as grounded by "15,000", which Studio's `numberInText` deliberately rejects. Decide whether the package offers one rule for both, and file any behaviour change separately so this PR stays a move.
- Anthropic calls have no model fallback today, only the OpenAI-compatible path does. Keep that as is in the move.
