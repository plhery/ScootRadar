#!/usr/bin/env bash
# Tells CI's iOS or end-to-end jobs whether a file they test changed since $BASE: the commit
# production is at, which CI last passed on, or a pull request's base. It writes needed=true or
# needed=false to $GITHUB_OUTPUT, and needed=true whenever it cannot tell, as when $BASE is unknown.
# Nothing else is ever left untested: the web job's checks, lint and unit tests run on every commit.
set -uo pipefail

case "${1:-}" in
  # The app is built and tested from ios/ alone (no file of the Xcode project lies outside it).
  ios) tests='the iOS tests'; relevant() { grep -qE '^(ios/|\.github/workflows/ci\.yml$|scripts/ci-changed\.sh$)'; } ;;
  # The website reads neither the apps, docs/ nor the Markdown files at the top of the repository.
  # (android.yml builds and tests the Android app.)
  e2e) tests='the end-to-end tests'; relevant() { grep -qvE '^(ios/|android/|docs/|[^/]+\.md$)'; } ;;
  *) echo "Usage: $0 ios|e2e" >&2; exit 2 ;;
esac

output=${GITHUB_OUTPUT:-/dev/stdout}
if base=$(git merge-base "${BASE:-}" HEAD) \
  && files=$(git diff --name-only --no-renames "$base" HEAD) \
  && [ -n "$files" ] && ! relevant <<< "$files"; then
  echo "::notice title=Skipped $tests::No file they test changed since ${base::7} ($BASE)."
  echo "needed=false" >> "$output"
else
  echo "needed=true" >> "$output"
fi
