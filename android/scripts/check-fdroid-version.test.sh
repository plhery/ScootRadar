#!/usr/bin/env bash
set -eu
check=$(dirname "$0")/check-fdroid-version.py
index='{"packages":{"com.plhery.scootradar":{"versions":{"hash":{"manifest":{"versionCode":12}}}}}}'
if echo "$index" | python3 "$check" 11; then exit 1; fi
echo "$index" | python3 "$check" 12
echo "$index" | python3 "$check" 13
echo '{"packages":{}}' | python3 "$check" 1
