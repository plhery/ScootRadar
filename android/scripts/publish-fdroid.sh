#!/usr/bin/env bash
# Puts a release's APK, the fdroid build signed with ScootRadar's upload key, in ScootRadar's F-Droid repository
# and on GitHub Releases. Play's own copy doesn't go there: Play protects the copies it signs, and they refuse to open on
# a phone without the Play Store.
#
#   scripts/publish-fdroid.sh <fdroid.apk> <commit> [notes.md]
#
# <fdroid.apk> is `./gradlew :app:assembleFdroidRelease -Pscootradar.uploadKey=<upload.properties>` from a clean checkout
# of <commit>, the commit on main the release was built from, which its GitHub release and tag,
# android-<versionName>-<versionCode>, point at. SCOOTRADAR_FDROID_DIR names the repository's folder on this Mac, made by `fdroid init`, whose config.yml and key
# stay outside every git tree. The repository keeps the newest release alone; the older ones stay on GitHub Releases.
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
# The fdroid flavor carries no Google library: no Play In-App Review, Play Integrity, Play Core, Play services or Firebase.
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
# The APK is that commit's build: the version code and name its build.gradle.kts gives, or the tag would name a commit
# that builds another version.
gradle=$(git -C "$android" show "$target:android/app/build.gradle.kts" 2>/dev/null) || gradle=
builtCode=$(sed -n 's/^[[:space:]]*versionCode = \([0-9]*\)[[:space:]]*$/\1/p' <<<"$gradle")
builtName=$(sed -n 's/^[[:space:]]*versionName = "\([^"]*\)"[[:space:]]*$/\1/p' <<<"$gradle")
if [ "$builtCode" != "$code" ] || [ "$builtName" != "$name" ]; then
  echo "$apk is $name ($code), but $target builds ${builtName:-no version name} (${builtCode:-no version code}): build it from that commit" >&2
  exit 1
fi

# The release's tag is the commit it was built from, which has to be on GitHub's main already. It goes up through this
# checkout's own remote: a ref on a commit that carries .github/workflows needs a credential that may write workflows,
# which gh's token may lack. A tag of that name on another commit stops everything here, before anything is published.
git -C "$android" fetch -q origin main
if ! git -C "$android" merge-base --is-ancestor "$target" FETCH_HEAD; then
  echo "$target is not on GitHub's main" >&2
  exit 1
fi
# Serialize writers sharing this signed repository and pin the remote snapshot used for the version check. The lock
# names the run that holds it, and goes when the run ends, with the folder the branch is made in: by an error, Ctrl-C,
# kill or a closed terminal too. Only a run that can't end so, killed with -9 or by the Mac going down, leaves it, and the
# next run says whether its run still runs, where it failed with a bare "mkdir: File exists" until 24 November 2026.
lock="$dir/.publication-lock"
site=
if ! mkdir "$lock" 2>/dev/null; then
  # mkdir's own words when something else is in the way, as a folder that doesn't exist.
  [ -d "$lock" ] || mkdir "$lock"
  holder=$(cat "$lock/holder" 2>/dev/null) || holder=
  running=$(ps -p "${holder%% *}" -o command= 2>/dev/null) || running=
  case $running in
    *publish-fdroid.sh*) echo "Another run of publish-fdroid.sh holds $lock (pid $holder): wait for it to end" >&2 ;;
    *) echo "$lock is left by a run that no longer runs${holder:+ (pid $holder)}, cut off before it could remove it (kill -9, the Mac going down). Check $dir, remove the lock (rm -r '$lock') and run again" >&2 ;;
  esac
  exit 1
fi
unlock() {
  if [ -n "$site" ]; then rm -rf "$site"; fi
  rm -f "$lock/holder"
  rmdir "$lock"
}
trap unlock EXIT
echo "$$ since $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$lock/holder"
# A version code is published with one APK: the same APK again, as when a run cut off is run again, or a new version
# code. Another APK under it stops here, before anything is pushed (check-fdroid-version.py).
sha256=$(shasum -a 256 "$apk" | cut -d' ' -f1)
check="$android/scripts/check-fdroid-version.py"
remoteRef=$(git -C "$android" ls-remote origin refs/heads/fdroid)
published=${remoteRef%%[[:space:]]*}
if [ -n "$published" ]; then
  git -C "$android" fetch -q origin "$published"
  git -C "$android" show "$published:repo/index-v2.json" | python3 "$check" "$code" "$sha256" ||
    { echo "Stopped at the index on GitHub's fdroid branch ($published): nothing was pushed or published" >&2; exit 1; }
fi
if [ -f "$dir/repo/index-v2.json" ]; then
  python3 "$check" "$code" "$sha256" < "$dir/repo/index-v2.json" ||
    { echo "Stopped at the index in $dir/repo, which a run cut off may have left unpushed: nothing was pushed or published" >&2; exit 1; }
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
printf '# ScootRadar for F-Droid\n\nAdd this repository in F-Droid: %s\n' "$address" > "$site/README.md"
git -C "$site" init -q -b fdroid
git -C "$site" add README.md repo ':!repo/status'
git -C "$site" commit -q -m "ScootRadar $name ($code)"
git -C "$site" -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
  push -q "--force-with-lease=refs/heads/fdroid:$published" "https://github.com/$github.git" fdroid:refs/heads/fdroid

# The same APK on GitHub Releases, on the tag above: published with it, a draft left by a run cut off finished, or the run
# stops (publish-github-release.sh).
cp "$apk" "$site/scootradar-$name-$code.apk"
{
  printf 'ScootRadar for Android %s (%s), built from %s without Google'"'"'s libraries and signed with ScootRadar'"'"'s own key.\n\n' \
    "$name" "$code" "$target"
  printf '%s\n\n' "$uninstall"
  printf 'In F-Droid, add the repository %s\n' "$address"
  if [ -n "$notes" ]; then printf '\n'; cat "$notes"; fi
} > "$site/notes.md"
"$android/scripts/publish-github-release.sh" "$github" "$tag" "$site/scootradar-$name-$code.apk" \
  "ScootRadar for Android $name ($code)" "$site/notes.md"
echo "$address"
