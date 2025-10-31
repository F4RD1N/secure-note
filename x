#!/usr/bin/env bash
set -euo pipefail

BRANCH=main
DAYS_AGO=7

git checkout "$BRANCH"
git branch -f backup-main

# گرفتن لیست commit‌ها از قدیمی به جدید
commits=( $(git rev-list --reverse "$BRANCH") )
n=${#commits[@]}
if [ "$n" -eq 0 ]; then
  echo "No commits found."
  exit 1
fi
echo "Found $n commits."

start_ts=$(date -d "$DAYS_AGO days ago" +%s)
end_ts=$(date +%s)

case_block="case \"\$GIT_COMMIT\" in\n"

for h in "${commits[@]}"; do
  # تولید timestamp تصادفی بین start_ts و end_ts
  rand_ts=$(( start_ts + RANDOM % (end_ts - start_ts + 1) ))
  datestr=$(date -u -d "@$rand_ts" +"%a, %d %b %Y %T +0000")
  case_block="${case_block}  ${h})\n    export GIT_AUTHOR_DATE='${datestr}'\n    export GIT_COMMITTER_DATE='${datestr}'\n    ;;\n"
done

case_block="${case_block}esac\n"

echo -e "\nApplying random dates to ${n} commits...\n"

git filter-branch --env-filter "$(printf "%s" "$case_block")" -- --all

echo "Done. Inspect with: git log --pretty=fuller --date=iso"
echo "When satisfied, push with: git push origin $BRANCH --force-with-lease"
