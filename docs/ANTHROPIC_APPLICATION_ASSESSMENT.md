# Claude for Open Source: application assessment

*Prepared 8 November 2026. Status: **assessment only. Nothing has been submitted.** The applicant must submit any application personally (manual action A1 in [MANUAL_ACTIONS.md](MANUAL_ACTIONS.md)).*

## 0. Whose eligibility this covers

The programme is for **individual people**, judged by their own GitHub account. This assessment covers the GitHub account **`shekhar-narayan-mishra`**, which owns the Ghumo repository and made all 36 commits. The collaborator `vedansha07` (identified by the owner on 8 November 2026) would need a separate assessment of their own account. It has **not** been assessed here.

## 1. The published criteria (verified)

Source: the programme terms at https://www.anthropic.com/claude-for-oss-terms, fetched 8 November 2026. The application form is linked from https://claude.com/open-source-max.

**Maintainer track (§2.1): meet any one.**

| Criterion | Threshold |
| --- | --- |
| Dependents | 500+ dependent repositories **or** 100+ dependent packages |
| Downloads | 200,000+ monthly downloads, in aggregate, across public registries |
| Foundation role | Listed committer or maintainer of a recognised foundation or language project |
| Merged PRs | 100+ merged PRs into public repositories you don't own, in the 12 months before applying |
| Contributors | A repository you maintain has 20+ unique external contributors with merged PRs in the last 12 months |
| OpenSSF | A repository you maintain has an OpenSSF criticality score ≥ 0.4 |

The terms add: "trivial, duplicative, or automated activity may be discounted".

**Ecosystem Impact track (§2.2).** Discretionary, with no numeric threshold. It is for someone who maintains or significantly contributes to a project "the ecosystem meaningfully depends on", with a written explanation.

**General requirements (§2.3) for every applicant:**
- 18 or older;
- resident where Claude.ai is offered;
- a GitHub account in good standing that is **at least two years old**;
- public open-source activity in the **last 90 days**;
- maintains or contributes to at least one project under an **OSI-approved licence**;
- not connected to Anthropic.

**Other terms.**
- Acceptance is discretionary, and meeting a threshold does not guarantee it.
- The benefit can be **revoked for false information or metric manipulation**.
- Places are capped at 10,000 recipients, with rolling review.
- The window can close at any time.

## 2. Evidence for `shekhar-narayan-mishra`

Everything below comes from the public GitHub API on 8 November 2026.

| Fact | Value | Source |
| --- | --- | --- |
| Account created | 10 October 2024, about 2 years 1 month ago | `GET /users/shekhar-narayan-mishra` |
| Public repositories | 36 (24 own, 12 forks) | Same |
| Stars on own repositories | 0 on every own repository | `GET /users/…/repos` |
| Ghumo repository | Public, **no licence**, 0 stars, 1 fork, 0 issues, 0 external contributors | `GET /repos/shekhar-narayan-mishra/Ghummoo`, `git log` |
| PRs to repositories the account doesn't own | 6 ever; **4 merged in the last 12 months** | Search API |
| Those 4 merged PRs | 3 to `Imposon/Clinical_No_show` (no licence, 0 stars); 1 to **`shikijs/shiki`** (MIT, about 13.9k stars), #1154, merged 1 December 2025 | Search API |
| Packages published to npm or PyPI | None found | — |
| Public activity in the last 90 days | Yes: pushes to `Ghummoo` in November 2026 | Git history |

## 3. Criterion by criterion

| Criterion | Status | Notes |
| --- | --- | --- |
| §2.3 account at least two years old | **Met**, but only just | Created October 2024 |
| §2.3 public activity in the last 90 days | **Met** | |
| §2.3 contributes to an OSI-licensed project | **Met** | The merged PR to `shikijs/shiki` (MIT). Ghumo itself does **not** count until it has a licence |
| Dependents (500 repositories or 100 packages) | **Not met** | No published packages; Ghumo has no dependents |
| Downloads (200k a month) | **Not met** | Nothing published |
| Foundation role | **Not met** | No evidence |
| 100 external merged PRs in 12 months | **Not met** | 4 of 100 |
| 20 external contributors on a maintained repository | **Not met** | 0 |
| OpenSSF score ≥ 0.4 | **Not met** | Not computed. The score is driven by dependents, contributors, organisations and activity; a repository with no dependents or contributors would score far below 0.4 |
| §2.2 Ecosystem Impact | **Very unlikely** today | No project that others depend on |

**Verdict: not eligible today under any §2.1 criterion.** An Ecosystem Impact application would have nothing to point to that the ecosystem depends on.

## 4. Ambiguities, explained

- **"Repositories you don't own"**: PRs to a friend's or classmate's repository count by the letter of the rule. The terms let Anthropic discount trivial activity, though, and 3 of the 4 PRs here went to a small unlicensed repository.
- **"Maintain"** means having commit or merge rights and actively reviewing and merging. Owning a repository nobody else contributes to does not show maintenance of a community project.
- **"Unique external contributors"** means people other than the maintainers whose PRs were merged. Co-founders are not external.
- **Private startup work** counts for nothing. Only public, OSI-licensed open source matters, so the Ghumo marketplace contributes only after it is licensed and has outside contributors or users.

## 5. Legitimate ways to build real eligibility

These are worth doing for their own sake. **Do not do them to reach a threshold faster.** Splitting PRs, swapping PRs with friends, or opening trivial PRs is exactly what the terms say can be discounted or revoked.

1. **License Ghumo** (see [LICENSING_RECOMMENDATION.md](LICENSING_RECOMMENDATION.md)), so it is an OSI-licensed project you maintain.
2. **Publish the grounded-extraction library** (issue hard/01) to npm. Real adoption, measured in dependents and downloads, is the route that reflects real value.
3. **Grow external contributors honestly** using the issue roadmap ([GITHUB_ISSUE_ROADMAP.md](GITHUB_ISSUE_ROADMAP.md)). Twenty unique external contributors with merged PRs in 12 months is achievable for a project people find useful. It needs responsive review, which is a time commitment.
4. **Keep contributing upstream**, as with the `shiki` PR: substantive fixes to projects you actually use (Express, Mongoose, Vite, Playwright, React Router).
5. **Re-assess in 6 to 12 months**, using the same evidence table.

## 6. Limits of applying early

- Applying now would probably be declined, and decisions cannot be appealed.
- Re-applying is allowed but not guaranteed. A weak first application doesn't help.
- Capacity is capped and the window can close without notice. If it closes before eligibility is real, the honest outcome is simply not getting the benefit. **Ghumo must not depend on it.** The project already runs with Gemini, OpenAI-compatible APIs or no AI at all.

## 7. Draft answers, to use only once a criterion is honestly met

> **GitHub profile:** https://github.com/shekhar-narayan-mishra
>
> **Project:** Ghumo AI (https://github.com/shekhar-narayan-mishra/Ghummoo), an open-source group-travel marketplace for independent organisers in India, licensed under <licence>. I maintain it and review all contributions.
>
> **Eligibility basis:** <state the one criterion that is met, with a link that proves it: e.g. the npm page of `<package>` showing its dependents, or the repository's contributor graph showing N external contributors in the last 12 months>.
>
> **How I will use Claude:** reviewing contributor PRs, writing tests for the booking and seat logic, and evaluating the AI extraction library against real (consented) organiser posts.

If no criterion is met, the only honest use of the Ecosystem Impact field is to explain who depends on the project. Today the answer would be "no one yet", and in that case **do not apply**.

## 8. Facts, assumptions and missing evidence

| Type | Items |
| --- | --- |
| **Verified facts** | The criteria text (programme terms page); the account's age and repository counts; Ghumo's visibility, licence status and fork; the four merged external PRs; single-author history |
| **Assumptions** | That the applicant would be `shekhar-narayan-mishra`; that no packages are published under another name; that the OpenSSF score would be below 0.4 (not computed) |
| **Missing evidence** | An assessment of the collaborator `vedansha07`'s account; any packages on other registries; foundation roles; contributions under other accounts or emails |
