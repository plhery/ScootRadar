#!/usr/bin/env bash
# Puts a release's APK on GitHub Releases, on its tag, and checks it is published there with that APK.
#
#   scripts/publish-github-release.sh <repo> <tag> <apk> <title> <notes.md>
#
# <apk> is uploaded under its own file name. A release published with that APK stays as it is. `gh release create` makes
# the release a draft, uploads the APK and then publishes it, and deletes the draft on a failure only if GitHub can still
# be reached: a run cut off between the two leaves a draft, which `gh release view` finds, so the next run finishes it
# (the APK uploaded again if it isn't there whole, then published) rather than take it for a release made. A release
# already holding another APK of that name is left as it is, and the run stops.
set -euo pipefail

repo=$1
tag=$2
apk=$3
title=$4
notes=$5
asset=$(basename "$apk")
digest="sha256:$(shasum -a 256 "$apk" | cut -d' ' -f1)"
errors=$(mktemp)
trap 'rm -f "$errors"' EXIT

# Whether the release is a draft, then the digest of its APK of that name if one is uploaded whole.
release() {
  gh release view "$tag" --repo "$repo" --json isDraft,assets --jq "[(.isDraft | tostring),
    ([.assets[] | select(.name == \"$asset\" and .state == \"uploaded\") | .digest] | first // \"\")] | @tsv"
}

if state=$(release 2>"$errors"); then
  draft=${state%%$'\t'*}
  uploaded=${state#*$'\t'}
  if [ -n "$uploaded" ] && [ "$uploaded" != "$digest" ]; then
    echo "$tag on GitHub Releases holds another $asset ($uploaded, this one is $digest): left as it is" >&2
    exit 1
  fi
  if [ -z "$uploaded" ]; then
    echo "$tag on GitHub Releases lacks $asset: uploading it" >&2
    gh release upload "$tag" "$apk" --repo "$repo" --clobber
  fi
  if [ "$draft" = true ]; then
    echo "$tag is a draft on GitHub Releases, left by a run cut off: publishing it" >&2
    gh release edit "$tag" --repo "$repo" --verify-tag --draft=false --prerelease=false --title "$title" --notes-file "$notes"
  elif [ -n "$uploaded" ]; then
    echo "$tag is on GitHub Releases already" >&2
  fi
elif grep -q 'release not found' "$errors"; then
  gh release create "$tag" "$apk" --repo "$repo" --verify-tag --title "$title" --notes-file "$notes"
else
  cat "$errors" >&2
  echo "$tag could not be read on GitHub Releases" >&2
  exit 1
fi

state=$(release)
if [ "$state" != "false"$'\t'"$digest" ]; then
  echo "$tag is not published on GitHub Releases with this $asset (draft, digest: $state)" >&2
  exit 1
fi
