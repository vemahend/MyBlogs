#!/usr/bin/env bash

set -euo pipefail

# Run from the repository folder even when called from elsewhere.
repository_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repository_dir"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: publish.sh must be stored inside a Git repository."
  exit 1
fi

# Find the largest commit subject matching #<number>.
last_number="$({ git log --format='%s' 2>/dev/null || true; } \
  | awk '/^#[0-9]+$/ { number = substr($0, 2) + 0; if (number > max) max = number } END { print max + 0 }')"

# This repository's numbered sequence begins at #4.
if (( last_number < 3 )); then
  next_number=4
else
  next_number=$((last_number + 1))
fi

commit_message="#${next_number}"

git add .

if git diff --cached --quiet; then
  echo "Nothing to commit. No files were pushed."
  exit 0
fi

echo "Creating commit ${commit_message}..."
git commit -m "$commit_message"

current_branch="$(git branch --show-current)"
if [[ -z "$current_branch" ]]; then
  echo "Commit created, but push was skipped because Git is in detached HEAD state."
  exit 1
fi

if git rev-parse --abbrev-ref '@{upstream}' >/dev/null 2>&1; then
  git push
else
  echo "Setting origin/${current_branch} as the upstream branch..."
  git push --set-upstream origin "$current_branch"
fi

echo "Successfully pushed commit ${commit_message}."
