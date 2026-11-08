# Resolve the `react-refresh/only-export-components` lint warnings

**Difficulty:** Easy · **Category:** Code quality · **Labels:** `enhancement`, `frontend`, `easy` · **Estimated effort:** 3–5 hours · **First-time contributor:** No (touches many shared files; must be one coordinated PR by one contributor)

## Problem
`npm run lint` reports 45 `react-refresh/only-export-components` warnings. Vite's Fast Refresh can only hot-reload a module that exports components alone, so these files force a full page reload during development. Production is unaffected.

The warnings fall into two groups:

**31 in `client/src/main.jsx` (lines 18-80).** The entry file declares the lazy route components and the `ScrollToTop`, `PublicLayout` and `App` components but exports nothing, so the rule reports every component in it.

**14 in 10 files that export helpers next to components:**

| File | Non-component exports |
| --- | --- |
| `client/src/components/ui.jsx` | `cx` |
| `client/src/design/BookingProgress.jsx` | `NEXT_STEP`, `bookingStepIndex` |
| `client/src/design/Compare.jsx` | `useCompare` |
| `client/src/design/context.jsx` | `usePaths`, `usePlaces`, `useSaved` |
| `client/src/lib/auth.jsx` | `useAuth`, `homeFor` |
| `client/src/pages/operator/Onboarding.jsx` | `ORGANISER_TYPES` |
| `client/src/pages/operator/ProfilePage.jsx` | `REG_TYPES` |
| `client/src/scenes/cities.jsx` | `CITY_SCENES` |
| `client/src/scenes/landscapes.jsx` | `LANDSCAPE_SCENES` |
| `client/src/scenes/parts.jsx` | `archPath` |

## Why it matters
Clean lint output makes real problems visible, and working hot reload speeds up design work.

## Current behaviour
45 warnings; the rule is set to `warn` in `client/eslint.config.js:27`.

## Expected behaviour
- Constants and plain helpers move to sibling modules (e.g. `design/bookingSteps.js`, `scenes/sceneMaps.js`, `lib/authContext.js`), and every importer is updated.
- Hooks that read a context (`useAuth`, `useCompare`, `usePaths`…) move with their context object into a non-component module, leaving only the provider component in the `.jsx` file.
- For `main.jsx`, move `App`, `PublicLayout` and `ScrollToTop` into `client/src/App.jsx` so `main.jsx` only renders. (An ESLint override for the entry file is an alternative; maintainers decide.)
- No behaviour, route or visual change.

## Acceptance criteria
- [ ] `npm run lint` reports no `only-export-components` warnings, without disabling the rule.
- [ ] No circular imports are introduced.
- [ ] `npm test`, `npm run build` and `npm run test:e2e` pass.
- [ ] The production bundle has the same lazy chunks (check the `vite build` output for the route chunks).

## Suggested approach
Work file by file, one commit each, running `npm run lint` and `npm run build` after every move. Use your editor's "find references" for every moved export.

## Relevant files
The 11 files above, `client/src/main.jsx`, `client/eslint.config.js`, and every module that imports the moved exports.

## Testing requirements
Lint, client unit tests, build and the Playwright suite. Open a few pages in `npm run dev` and edit a component to confirm hot reload no longer forces a full reload.

## Dependencies
- `easy/08` also edits `client/src/lib/auth.jsx`; land it first or coordinate.
- `medium/08` (remove or flag the `/v01` prototype) edits `client/src/main.jsx` and changes the importers of these modules. Agree the order with maintainers.

## Notes for maintainers
This change touches many widely imported files and will conflict with almost any open frontend PR. Assign it to one contributor, ask for it as a single PR, and merge it quickly after review, ideally when few other frontend PRs are open.
