# Fix the five `react-hooks/set-state-in-effect` lint warnings

**Difficulty:** Easy · **Category:** Code quality · **Labels:** `enhancement`, `frontend`, `easy` · **Estimated effort:** 3–5 hours · **First-time contributor:** No (needs a working knowledge of React effects; the booking flow must behave exactly as before)

## Problem
`npm run lint` reports five `react-hooks/set-state-in-effect` warnings. They are listed as engineering debt in `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`. Each one sets state synchronously inside an effect, which causes an extra render and is discouraged by React.

| File | Line | What the effect does |
| --- | --- | --- |
| `client/src/lib/auth.jsx` | 14 | Calls `refresh()` on mount, which sets `user` and `loading` |
| `client/src/pages/BookPage.jsx` | 54 | Picks the first bookable departure when the chosen one is not bookable |
| `client/src/pages/BookPage.jsx` | 56 | Clamps `seats` to `maxSeats` |
| `client/src/pages/BookPage.jsx` | 58 | Resizes the traveller list to `seats` and pre-fills traveller 1 from the account |
| `client/src/pages/TripDetailPage.jsx` | 218 | Resets departure, seats and open itinerary days when the trip loads |

Note: the TripDetailPage warning is the reset effect on line 218, not the compare-tray effect just below it (lines 221-226), which only writes a CSS variable and is not flagged.

## Why it matters
Clean lint output makes new warnings visible. The booking page is the most important traveller flow, so its state logic should be simple and predictable.

## Current behaviour
Lint passes with warnings; the behaviour is correct but renders twice when these values change.

## Expected behaviour
The five warnings are gone, with no behaviour change. Patterns that fit (see the React docs page "You might not need an effect"):

- Derive values during render instead of storing them: e.g. `const effectiveDeparture = dep?.isBookable ? dep : firstBookable`, `const effectiveSeats = Math.min(seats, maxSeats)`.
- Resize the traveller list in the event handler that changes `seats`, not in an effect.
- For TripDetailPage, reset per-trip state by rendering the inner component with `key={trip._id}`, or the "store the previous value and compare during render" pattern.
- For `auth.jsx`, set state in the promise callback of a fetch started inside the effect (with an ignore flag on unmount), keeping `refresh` for callers.

## Acceptance criteria
- [ ] `npm run lint` reports no `set-state-in-effect` warnings.
- [ ] The rule is not disabled or suppressed with comments.
- [ ] Booking page: changing departure, seats (including above the remaining seats), and traveller pre-fill from the signed-in account work as before.
- [ ] Trip detail page: navigating from one trip to another resets the chosen departure, seats and open itinerary days.
- [ ] Sign-in state still loads on first visit and after `login`/`logout`.
- [ ] `npm test`, `npm run build` and `npm run test:e2e` pass (A9–A13 and B10–B13 cover these pages).

## Suggested approach
Fix one file per commit so each change can be reviewed on its own. Once all five are gone, maintainers may choose to change the rule from `warn` to `error` in `client/eslint.config.js:28`.

## Relevant files
- `client/src/lib/auth.jsx`
- `client/src/pages/BookPage.jsx`
- `client/src/pages/TripDetailPage.jsx`
- `client/eslint.config.js`

## Testing requirements
Run lint, the client unit tests and the Playwright suite. Check the booking page by hand with a keyboard, at 360px width, and with reduced motion.

## Dependencies
None. `easy/09` also touches `client/src/lib/auth.jsx`; land one before starting the other.
