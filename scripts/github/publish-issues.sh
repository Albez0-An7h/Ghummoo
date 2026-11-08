#!/usr/bin/env bash
# Publishes the issue drafts in docs/github-issues/ as GitHub issues. Only run after the owners
# have approved the drafts. Requires an authenticated GitHub CLI and the labels (create-labels.sh).
#   scripts/github/publish-issues.sh                       # dry run: lists every issue and its labels
#   scripts/github/publish-issues.sh --apply               # creates all issues
#   scripts/github/publish-issues.sh --apply easy/issue-01.md medium/issue-07.md   # only these
# Each draft's first line is "# Title"; the labels are read from its "**Labels:**" line.
# Created issues are recorded in docs/github-issues/.published so re-runs skip them.
set -euo pipefail
REPO="${REPO:-shekhar-narayan-mishra/Ghummoo}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)/docs/github-issues"
APPLY=false
if [[ "${1:-}" == "--apply" ]]; then APPLY=true; shift; fi
LEDGER="$ROOT/.published"; touch "$LEDGER"

files=()
if [[ $# -gt 0 ]]; then for f in "$@"; do files+=("$ROOT/$f"); done
else while IFS= read -r f; do files+=("$f"); done < <(find "$ROOT" -path '*/issue-*.md' | sort); fi

for f in "${files[@]}"; do
  rel="${f#$ROOT/}"
  if grep -qxF "$rel" "$LEDGER"; then echo "skip (already published): $rel"; continue; fi
  title="$(head -1 "$f" | sed 's/^# *//')"
  labels="$(grep -m1 '\*\*Labels:\*\*' "$f" | sed -E 's/.*\*\*Labels:\*\*([^·]*).*/\1/' | grep -oE '`[^`]+`' | tr -d '`' | paste -sd, -)"
  if $APPLY; then
    body="$(mktemp)"; tail -n +2 "$f" > "$body"
    label_args=(); IFS=',' read -ra list <<< "$labels"; for l in "${list[@]}"; do label_args+=(--label "$l"); done
    url="$(gh issue create --repo "$REPO" --title "$title" "${label_args[@]}" --body-file "$body")"
    rm -f "$body"
    echo "$rel" >> "$LEDGER"
    echo "created: $url  ($rel)"
  else
    echo "would create: [$labels] $title  ($rel)"
  fi
done
$APPLY || echo "Dry run only. Re-run with --apply after the owners approve the drafts."
