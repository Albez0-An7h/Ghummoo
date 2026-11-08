# Publishing the issue drafts on GitHub

*Nothing has been published. Do this only after both owners have read and approved the drafts in `docs/github-issues/`.*

## Before you start

1. **The licence is chosen.** Inviting contributors to an unlicensed repository leaves their contributions in legal limbo.
2. **`staging` exists** ([MANUAL_ACTIONS.md](MANUAL_ACTIONS.md) G2). The issues tell contributors to branch from it.
3. **medium/07 is decided.** The split of `routes/operator.js` should be done by a maintainer *before* outside contributors start on issues that touch that file (easy/02, medium/02, medium/12, medium/13). Either do medium/07 first, or publish those issues later.
4. **Read every draft.** Delete or edit any you don't agree with. The drafts are suggestions, not commitments.

## Option A: GitHub CLI (recommended)

```bash
brew install gh            # macOS; see https://cli.github.com for other systems
gh auth login              # GitHub.com → HTTPS → log in with a web browser
gh auth status             # should show the account that owns the repository
```

Create the labels first:

```bash
scripts/github/create-labels.sh            # dry run
scripts/github/create-labels.sh --apply
```

Then publish the issues:

```bash
scripts/github/publish-issues.sh           # dry run: prints each title and its labels
scripts/github/publish-issues.sh --apply   # publishes every draft not yet published
# or publish a chosen subset:
scripts/github/publish-issues.sh --apply easy/issue-01.md easy/issue-06.md medium/issue-07.md
```

How the script works:
- It reads the title from the first line (`# …`) and the labels from the `**Labels:**` line.
- It posts the rest of the file as the issue body.
- It records each published file in `docs/github-issues/.published`, so running it again never creates duplicates.
- Set `REPO=owner/name` to target another repository, such as a fork for a rehearsal.

## Option B: by hand in the browser

For each file:
1. Go to the repository → **Issues → New issue**. The bug and feature forms appear; for a draft, choose **"Open a blank issue"**. If blank issues are disabled by `.github/ISSUE_TEMPLATE/config.yml`, maintainers can still create one through the CLI, or temporarily set `blank_issues_enabled: true`.
2. Title: the first line of the file, without `# `.
3. Body: everything after the first line.
4. Labels: those in the file's **Labels** line. Create any missing label under **Issues → Labels → New label**.
5. **Submit new issue.**

## After publishing

- **Pin** a "Start here" issue: the text is in [OPEN_SOURCE_LAUNCH_PLAN.md](OPEN_SOURCE_LAUNCH_PLAN.md) §7.5. Pin it with the issue's **⋯ menu → Pin issue**.
- Optionally create a **Project** board (Projects → New project → Board) with the columns *Ready*, *In progress*, *In review* and *Done*.
- Replace the folder references in the issue bodies ("medium/07 should land first") with the real issue numbers (`#12`) by editing each issue once all are created.
- Assign an issue only when someone asks for it. If an assignee is quiet for 7 days, check in, and unassign them after 14.
