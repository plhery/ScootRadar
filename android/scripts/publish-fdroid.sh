#!/usr/bin/env bash
# Puts a beta's APK, the fdroid build signed with ScootRadar's upload key, in the F-Droid repository of the Android beta
# and on GitHub Releases. Play's own copy doesn't go there: Play protects the copies it signs, and they refuse to open on
# a phone without the Play Store.
#
#   scripts/publish-fdroid.sh <fdroid.apk> <commit> [notes.md]
#
# <fdroid.apk> is `./gradlew :app:assembleFdroidRelease -Pscootradar.uploadKey=<upload.properties>` from a clean checkout
# of <commit>, the commit on main the release was built from, which its GitHub release and tag,
# android-<versionName>-<versionCode>, point at. SCOOTRADAR_FDROID_DIR names the repository's folder on this Mac, made by `fdroid init`, whose config.yml and key
# stay outside every git tree. The repository keeps the newest beta alone; the older ones stay on GitHub Releases.
set -euo pipefail

apk=$1
commit=$2
notes=${3:-}
dir=${SCOOTRADAR_FDROID_DIR:?SCOOTRADAR_FDROID_DIR names the F-Droid repository folder}
sdk=${ANDROID_HOME:?ANDROID_HOME names the Android SDK}
android=$(cd "$(dirname "$0")/.." && pwd)
tools=$(find "$sdk/build-tools" -mindepth 1 -maxdepth 1 | sort -V | tail -1)
app=com.plhery.scootradar
github=plhery/ScootRadar
# The certificate of ScootRadar's upload key, which signs the builds sent to Google Play too; Play re-signs its own copies.
upload=00931b285e987ca18242396561102042573963d278d75bd47e481af2a7ee65ed
# The APK installed from Google Play, or from this repository or GitHub before 18 November 2026, is signed by Google Play,
# so it has to go before this one goes on.
uninstall="If your ScootRadar came from Google Play, or from GitHub or the ScootRadar beta F-Droid repository before 18 November 2026, uninstall it first: this copy is signed with a different key."

certs=$("$tools/apksigner" verify --print-certs "$apk" 2>/dev/null) || certs=
digests=$(sed -n 's/.*certificate SHA-256 digest: //p' <<<"$certs" | sort -u)
if [ "$digests" != "$upload" ]; then
  echo "$apk is not signed with ScootRadar's upload key alone" >&2
  exit 1
fi
# The fdroid flavor carries no Google library: no Play In-App Review, Play Core, Play services or Firebase.
manifest=$("$tools/aapt2" dump xmltree --file AndroidManifest.xml "$apk")
if grep -Eq 'com\.google\.(firebase|android\.gms|mlkit|android\.play)' <<<"$manifest"; then
  echo "$apk carries Google's libraries: publish the fdroid build" >&2
  exit 1
fi
badging=$("$tools/aapt2" dump badging "$apk")
package=${badging%%$'\n'*}
code=$(sed -n "s/^package: name='$app' versionCode='\([0-9]*\)'.*/\1/p" <<<"$package")
name=$(sed -n "s/.* versionName='\([^']*\)'.*/\1/p" <<<"$package")
if [ -z "$code" ] || [ -z "$name" ]; then
  echo "$apk is not $app" >&2
  exit 1
fi
target=$(git -C "$android" rev-parse --verify "$commit^{commit}")
tag="android-$name-$code"

# The release's tag is the commit it was built from, which has to be on GitHub's main already. It goes up through this
# checkout's own remote: a ref on a commit that carries .github/workflows needs a credential that may write workflows,
# which gh's token may lack. A tag of that name on another commit stops everything here, before anything is published.
git -C "$android" fetch -q origin main
if ! git -C "$android" merge-base --is-ancestor "$target" FETCH_HEAD; then
  echo "$target is not on GitHub's main" >&2
  exit 1
fi
# Serialize writers sharing this signed repository and pin the remote snapshot used for the version check.
lock="$dir/.publication-lock"
mkdir "$lock"
trap 'rmdir "$lock"' EXIT
remoteRef=$(git -C "$android" ls-remote origin refs/heads/fdroid)
published=${remoteRef%%[[:space:]]*}
if [ -n "$published" ]; then
  git -C "$android" fetch -q origin "$published"
  git -C "$android" show "$published:repo/index-v2.json" | python3 "$android/scripts/check-fdroid-version.py" "$code"
fi
if [ -f "$dir/repo/index-v2.json" ]; then
  python3 "$android/scripts/check-fdroid-version.py" "$code" < "$dir/repo/index-v2.json"
fi
git -C "$android" push -q origin "$target:refs/tags/$tag"

# The index, signed with the repository's key. The site's icon is the repository's and the app's.
mkdir -p "$dir/metadata/$app/en-US" "$dir/older" "$dir/config"
cp "$android/../public/icon-512.png" "$dir/icon.png"
cp "$android/../public/icon-512.png" "$dir/metadata/$app/en-US/icon.png"
find "$dir/repo" -maxdepth 1 -name "${app}_*.apk" ! -name "${app}_$code.apk" -exec mv {} "$dir/older/" \;
cp "$apk" "$dir/repo/${app}_$code.apk"
cp "$android/fdroid/$app.yml" "$dir/metadata/$app.yml"
cp "$android/fdroid/antiFeatures.yml" "$dir/config/antiFeatures.yml"
(cd "$dir" && fdroid update)
fingerprint=$(keytool -printcert -jarfile "$dir/repo/index-v1.jar" | sed -n 's/^[[:space:]]*SHA256: //p' | tr -d ':')
address="https://raw.githubusercontent.com/$github/fdroid/repo?fingerprint=$fingerprint"

# The repository, alone on the branch fdroid, which raw.githubusercontent.com serves; fdroid's status files, which name
# this Mac's paths, stay out.
site=$(mktemp -d)
cp -R "$dir/repo" "$site/repo"
printf '# ScootRadar beta for F-Droid\n\nAdd this repository in F-Droid: %s\n' "$address" > "$site/README.md"
git -C "$site" init -q -b fdroid
git -C "$site" add README.md repo ':!repo/status'
git -C "$site" commit -q -m "ScootRadar $name ($code)"
git -C "$site" -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
  push -q "--force-with-lease=refs/heads/fdroid:$published" "https://github.com/$github.git" fdroid:refs/heads/fdroid

# The same APK on GitHub Releases, on the tag above. A release made already stays as it is.
if gh release view "$tag" --repo "$github" >/dev/null 2>&1; then
  echo "$tag is on GitHub Releases already" >&2
else
  cp "$apk" "$site/scootradar-$name-$code.apk"
  {
    printf 'ScootRadar for Android %s (%s), the beta, built from %s without Google'"'"'s libraries and signed with ScootRadar'"'"'s own key.\n\n' \
      "$name" "$code" "$target"
    printf '%s\n\n' "$uninstall"
    printf 'In F-Droid, add the repository %s\n' "$address"
    if [ -n "$notes" ]; then printf '\n'; cat "$notes"; fi
  } > "$site/notes.md"
  gh release create "$tag" "$site/scootradar-$name-$code.apk" --repo "$github" --verify-tag --prerelease \
    --title "ScootRadar for Android $name ($code), beta" --notes-file "$site/notes.md"
fi
echo "$address"
