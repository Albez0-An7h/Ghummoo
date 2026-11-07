---
name: test-and-qa
description: Use before reporting any Ghumo AI milestone as done. Covers which automated tests to write, the commands to run, manual QA passes and the report format.
---

# Test and QA

A milestone is done only when its tests pass, the build succeeds, and the changed flows have been checked in a browser.

## Automated tests

- **Server tests** are in `server/test/` and run with `node --test` (`npm test` from the repo root).
  - They use an in-memory MongoDB. They never touch `server/.data` or a real `MONGODB_URI`.
- **Add tests for important business logic:**
  - booking and seat holds;
  - status transitions;
  - role and access checks (traveller, organiser and admin can only see their own data);
  - filters and sorting;
  - AI grounding (no invented prices or capacities, missing fields listed);
  - any new validation.
- For every new endpoint, test the happy path, validation failure, unauthenticated or wrong-role access, and the not-found case.
- AI tests must not call a real provider. Test `normalise` and the not-configured path, or stub `fetch`.
- Concurrency-sensitive logic (seats) gets a parallel-request test, like the existing oversell test.

## Commands to run

```bash
npm test        # server tests
npm run lint    # client ESLint (fix errors; note any new warnings)
npm run build   # production client build must succeed
```

**Never run `npm run seed` against a real database without approval.** It wipes collections.

## Manual QA pass (changed flows only, plus a quick smoke test)

1. Run `npm run dev` (API on :5050, web on :5173).
2. **Smoke test:** home loads trips; explore filters work; a trip detail page opens; sign in with a demo account (see README); My trips loads.
3. **Changed flows:** happy path, empty state, error state (stop the API or force a 4xx), and a slow network (DevTools 3G).
4. **Roles:** check the same screen as a traveller, an organiser and an admin, where relevant. Private data must not leak across roles.
5. **Widths:** 360px, 768px and 1280px. No horizontal scroll, and tap targets at least 44px.
6. **Keyboard only, plus reduced motion** (see `accessibility` and `motion-performance`).
7. **Honesty check:** every price, seat count, date, review and status on screen traces back to API data. Demo content is labelled, and nothing claims online payment.
8. **Console:** no errors or React warnings on the changed pages.

## Report format

End each milestone with:

- **Changed files:** a grouped list with one line each on why.
- **Tests:** what was added, and the `npm test`, lint and build results (paste the summary lines).
- **Manual QA:** what was checked and at which widths and roles.
- **Known limitations:** anything not done, not verified, or deliberately left out.
- **Next steps:** the smallest sensible next milestone.

Report failures as they are. Never mark a step passed that wasn't run.
