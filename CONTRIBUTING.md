# Contributing to Ghumo AI

Thanks for helping. Ghumo AI is a marketplace for fixed-departure group trips in India, run by independent organisers. This guide explains how to go from "I found an issue" to "my change is merged".

> **Licence status.** The project's licence has not been chosen yet (see `docs/LICENSING_RECOMMENDATION.md`). Until a `LICENSE` file exists, maintainers will not merge outside contributions. You are welcome to open issues and discuss them in the meantime.

## The ten steps

1. **Find an issue.** Look for issues labelled `good first issue` or `help wanted`. `docs/GITHUB_ISSUE_ROADMAP.md` shows which issues can be worked on in parallel and which depend on others.
2. **Understand it.** Read the issue's acceptance criteria and its relevant files. Ask questions in the issue. Comment "I'd like to work on this" and wait for a maintainer to assign you, so two people don't do the same work.
3. **Set up.** Follow [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md). It takes about five minutes and needs no database or API key.
4. **Branch from `staging`.**
   ```bash
   git fetch origin
   git switch -c feature/short-description origin/staging   # or fix/short-description
   ```
5. **Implement the change.** Keep it focused on the issue. Follow the rules below.
6. **Add tests.** Business logic needs tests in `server/test/` (run with `node --test`). Client logic goes in `client/test/`. See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md).
7. **Run the checks.**
   ```bash
   npm run lint && npm test && npm run build
   npm run test:e2e     # if your change can affect a browser journey
   ```
8. **Open a PR against `staging`**, not `main`. Fill in the template and link the issue ("Closes #12").
9. **Respond to review.** CI must be green. A maintainer reviews within a few days. Push follow-up commits to the same branch; don't force-push after review has started unless asked.
10. **Merge.** A maintainer squash-merges into `staging`. Changes reach `main` in the next release PR ([docs/BRANCHING_AND_RELEASE_WORKFLOW.md](docs/BRANCHING_AND_RELEASE_WORKFLOW.md)).

## Branches

| Branch | Purpose | Who merges |
| --- | --- | --- |
| `main` | Stable, released code | Maintainers, through a release PR from `staging` |
| `staging` | Integration branch; every contribution lands here first | Maintainers, after review and green CI |
| `feature/<name>` | New functionality, branched from `staging` | — |
| `fix/<name>` | Bug fixes, branched from `staging` | — |

Neither `main` nor `staging` accepts direct pushes.

## Product rules every change must respect

These come from `AGENTS.md` and are not negotiable.

- **Never invent data.** Prices, seats, reviews, organisers, availability, inclusions and booking status come from the database or from the organiser's own text. If the data doesn't answer a question, the UI says so.
- **AI must be grounded.** A number in an AI draft must appear in the source text. Missing-field lists are computed in code, never by the model.
- **No payment gateway exists.** Bookings are requests, and organisers record payments offline. Don't add copy that suggests online payment.
- **Protect private data.** Phones, emails and manifests are visible only to the roles allowed to see them. Never log request bodies.
- **Accessibility.** Every feature must work on mobile, with a keyboard and with reduced motion.
- **Design tokens.** Colours come from `client/src/index.css`. Never put hex values in components. Don't use blue or purple UI accents.

## Engineering rules

- Reuse the existing auth, role guards, models and booking logic. Don't add a second API, a second data model or a parallel UI kit.
- **Avoid new dependencies.** If you need one, explain in the PR why existing code can't do it, and give its size and maintenance status.
- Validate every input on both the server and the client.
- Every data view needs loading, error and empty states.
- Never commit `.env` files, keys, database dumps or real personal data. If you commit a secret by mistake, tell a maintainer privately at once: the secret must be rotated, not just deleted.
- Keep PRs small. One issue per PR.

## Commit messages

Use the conventional style already in the history: `feat: …`, `fix: …`, `test: …`, `docs: …`, `style: …`, `chore: …`. Write in the imperative ("add", not "added").

## Licensing of contributions

Once a licence is chosen, contributions are accepted under that licence. The owners will also decide between:
- the Developer Certificate of Origin, where you sign off each commit with `git commit -s`;
- a contributor licence agreement.

This file will be updated with the exact requirement. Only submit work you wrote yourself or have the right to contribute.

## Code review checklist (for reviewers)

- [ ] The change matches the issue's acceptance criteria and does nothing unrelated.
- [ ] Tests cover the new behaviour and fail without the change.
- [ ] No invented data, no new online-payment claims, no private data exposed to the wrong role.
- [ ] Inputs are validated on the server. Errors return 4xx with a readable message, not 500.
- [ ] No secrets or personal data in code, fixtures, screenshots or logs.
- [ ] No unnecessary dependency. Any API contract change is documented.
- [ ] UI: keyboard, mobile width, reduced motion and colour tokens checked.
- [ ] CI is green.

## Getting help

Ask in the issue you are working on. For anything security-related, see [SECURITY.md](SECURITY.md). Everyone taking part must follow the [Code of Conduct](CODE_OF_CONDUCT.md).
