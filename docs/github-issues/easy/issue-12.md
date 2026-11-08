# AI Package Studio: warn when an ungrounded seat capacity is cleared

**Difficulty:** Easy · **Category:** AI grounding · **Labels:** `good first issue`, `bug`, `ai`, `backend`, `easy` · **Estimated effort:** 1–2 hours · **First-time contributor:** Yes (a two-line change with an existing pattern right above it, plus one test)

## Problem
`normalise()` in `server/src/services/ai/index.js` checks the model's numbers against the organiser's original text. For price it clears the value **and** explains why (lines 92-96):

```js
warnings.push(`Price ${price} could not be found in the text and was cleared`);
```

For seat capacity it clears the value silently (line 98):

```js
if (capacity != null && !numberInText(capacity, text)) capacity = null;
```

## Why it matters
AGENTS.md: AI output must be grounded in real data, and when the data doesn't have the answer the product says so. If the model returns a capacity of 20 that the post never mentioned, the organiser should see that a value was proposed and rejected, just as for price. Otherwise they only see "Seat capacity" in the missing list and cannot tell whether the AI misread their post.

## Current behaviour
- A hallucinated capacity is set to `null` and "Seat capacity" appears in `missing` (line 144), with no warning.
- `server/test/api.test.js` (T11, around line 296) asserts that the capacity is cleared but not that a warning is produced.

## Expected behaviour
When a capacity is cleared because it is not in the text, `warnings` contains `Seat capacity <n> could not be found in the text and was cleared`, matching the price wording. Studio already lists every warning (`client/src/pages/operator/StudioPage.jsx:229`), so no client change is needed.

## Acceptance criteria
- [ ] An ungrounded capacity produces the warning above and `draft.capacity === null`.
- [ ] A grounded capacity (the number appears in the text) is kept with no warning.
- [ ] A `null` or missing capacity produces no warning (the missing-field list still covers it).
- [ ] The missing-field list is still computed in code, not by the model.
- [ ] `npm test` passes.

## Suggested approach
Mirror the price block: after the grounding check fails, push the warning and set `capacity = null`.

## Relevant files
- `server/src/services/ai/index.js` (`normalise`)
- `server/test/hardening.test.js` (existing grounding tests, line 63)
- `client/src/pages/operator/StudioPage.jsx` (displays warnings; no change expected)

## Testing requirements
Add a test next to the grounding test in `server/test/hardening.test.js` (or in a new `server/test/ai-normalise.test.js`) that calls `normalise()` directly with:
1. text without the capacity number and `capacity: 20` → warning present, capacity `null`;
2. text containing "20 seats" and `capacity: 20` → kept, no warning;
3. `capacity: null` → no capacity warning.

## Dependencies
None. `medium/01` and `hard/01` edit the same function; this small change should land first.
