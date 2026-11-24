#!/usr/bin/env bash
# check-fdroid-version.py against a published index listing version 12: an older version code, the same one with the
# same APK or another, a newer one, and an index without the app.
set -eu
check=$(dirname "$0")/check-fdroid-version.py
apk=0b161beb11900f608198a96dc257b5548cda5d4ac080ef6f3d08ea62f468508e
other=5f3c2a0e9d4b7c1a8e6f2d0b9a7c5e3f1d8b6a4c2e0f9d7b5a3c1e8f6d4b2a0c
# As fdroid writes it: each version under its APK's SHA-256, which its file names again.
index="{\"packages\":{\"com.plhery.scootradar\":{\"versions\":{\"$apk\":{\"file\":{\"name\":\"/com.plhery.scootradar_12.apk\",\"sha256\":\"$apk\"},\"manifest\":{\"versionCode\":12}}}}}}"

# Runs the check of version $1 with SHA-256 $2 on the index, which should refuse it with a message holding $3.
refuses() {
  local said
  if said=$(echo "$index" | python3 "$check" "$1" "$2" 2>&1); then
    echo "FAIL: version $1 with $2 went through" >&2
    exit 1
  fi
  case $said in
    *"$3"*) ;;
    *) echo "FAIL: version $1 with $2: $said" >&2; exit 1 ;;
  esac
}

refuses 11 "$other" 'Version 12 is already published'
refuses 11 "$apk" 'Version 12 is already published'
# The same version code: a run cut off is run again with the same APK, never with another (week review of
# 24 November 2026, A1).
echo "$index" | python3 "$check" 12 "$apk"
refuses 12 "$other" "Version 12 is already published with another APK (SHA-256 $apk; this one's is $other)"
echo "$index" | python3 "$check" 13 "$other"
echo '{"packages":{}}' | python3 "$check" 1 "$other"
echo 'check-fdroid-version.py: 6 cases pass'
