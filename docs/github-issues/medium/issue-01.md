# AI Package Studio: ground departure dates and durations in the source text

**Difficulty:** Medium · **Category:** AI grounding · **Labels:** `bug`, `ai`, `backend`, `testing`, `medium` · **Estimated effort:** 1–2 days · **First-time contributor:** No (needs careful parsing of informal Indian date formats and a good test corpus)

## Problem
`normalise()` in `server/src/services/ai/index.js:90-152` grounds price and capacity: a number is kept only if it appears as a whole number in the organiser's post (`numberInText`, lines 69-88). Dates and durations are not grounded:

- `departureDates` keeps any string shaped `YYYY-MM-DD` that parses and is today or later (line 101).
- `durationDays` and `durationNights` are kept as whatever integers the model returns (lines 113-114).

So a model that invents "2026-12-20" or "6 days" for a post that says neither produces a draft with a fabricated departure or duration.

## Why it matters
AGENTS.md: never invent availability; AI answers must use real data, and when the data doesn't have the answer, say so. A made-up departure date can become a real departure once the organiser accepts the draft, and travellers would book against it.

## Current behaviour
- Any future ISO date the model returns is accepted. Past dates are dropped silently, without a warning.
- Any integer duration is accepted.
- `missing` lists "Duration" and "Departure dates" only when the model itself returns nothing.

## Expected behaviour
- **Dates:** a returned date is kept only if the source text contains its day number and its month, written as a name (`December`), an abbreviation (`Dec`, `Sept`) or a number in a day-month pattern (`20/12`, `20-12`, `20.12`). Ordinals count (`20th Dec`, `Dec 20th`). The year may be absent (the prompt already tells the model to assume the next occurrence and warn).
- **Durations:** `durationDays` is kept only if the number appears in the text (`numberInText`), and likewise `durationNights`. `5D/4N`, `5 days 4 nights` and `4N/5D` all ground both values.
- Each cleared value adds a warning in the existing style, e.g. `Departure date 2026-12-20 could not be found in the text and was cleared`, `Duration 6 days could not be found in the text and was cleared`.
- Cleared values lead to the existing `missing` entries ("Departure dates", "Duration"), still computed in code.
- Past dates that are dropped also produce a warning.

## Acceptance criteria
- [ ] Dates with day and month present in the text are kept; dates whose day or month is absent are cleared with a warning.
- [ ] Ranges such as `20-22 Dec` ground the 20th (and the 22nd if returned).
- [ ] A day number appearing only inside another number (`120`, `2025`) does not ground a date.
- [ ] Durations follow the `numberInText` rule; ungrounded ones are cleared with a warning.
- [ ] `missing` is unchanged in shape and still computed in code.
- [ ] The e2e Studio journey (`e2e/02-organiser.spec.js`, B6–B7) still passes against `e2e/ai-stub.js`.
- [ ] `npm test` passes.

## Suggested approach
Add `dateInText(isoDate, text)` next to `numberInText`. Tokenise the text once into day/month pairs: month names and abbreviations within a few tokens of a 1–31 number, and `dd/mm`, `dd-mm`, `dd.mm` patterns. Then check membership. Keep it pure and exported for tests. Write the test cases first from real-looking captions (do not use real organisers' posts without permission).

## Relevant files
- `server/src/services/ai/index.js` (`normalise`, `numberInText`, `systemPrompt`)
- `server/test/hardening.test.js` (grounding tests, line 63), `server/test/api.test.js` (T11)
- `e2e/ai-stub.js` (returns `departureDates: []` and a 3D/2N duration)

## Testing requirements
Unit tests for `dateInText` (at least: month names, abbreviations, numeric `dd/mm`, ordinals, ranges, a missing month, a day only inside a larger number) and for `normalise` with grounded and ungrounded dates and durations.

## Dependencies
- `easy/12` edits the same function and should land first.
- `docs/OPEN_SOURCE_ARCHITECTURE.md` (section 7) plans `hard/01` first and this issue inside the new package (`packages/grounded-extract/src/grounding.js`). If `hard/01` is still waiting for licence approval, maintainers may let this land in the server first; `hard/01` then moves the code unchanged. Agree the order before starting.

## Notes for maintainers
Decide whether `dd/mm` is always day-first (the Indian convention) or whether ambiguous numeric dates (both values 12 or below) should be cleared with a warning instead.
