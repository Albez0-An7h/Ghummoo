#!/usr/bin/env bash
# Creates or updates the project's issue labels. Requires an authenticated GitHub CLI (gh auth login).
#   scripts/github/create-labels.sh            # dry run: prints what it would do
#   scripts/github/create-labels.sh --apply    # creates/updates labels on the repository
set -euo pipefail
REPO="${REPO:-shekhar-narayan-mishra/Ghummoo}"
APPLY=false; [[ "${1:-}" == "--apply" ]] && APPLY=true
DIR="$(cd "$(dirname "$0")" && pwd)"
while IFS=$'\t' read -r name color desc; do
  [[ -z "$name" ]] && continue
  if $APPLY; then
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force
  else
    echo "would create/update label: $name (#$color) — $desc"
  fi
done < "$DIR/labels.tsv"
$APPLY || echo "Dry run only. Re-run with --apply to change $REPO."
