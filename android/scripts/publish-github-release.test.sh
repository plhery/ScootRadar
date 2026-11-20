#!/usr/bin/env bash
# publish-github-release.sh against a fake gh holding one release: none, a draft left by a run cut off (with or without
# its APK whole), a release published with or without it, or with another APK of that name.
set -eu
publish=$(cd "$(dirname "$0")" && pwd)/publish-github-release.sh
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir "$work/bin"
cat > "$work/bin/gh" <<'GH'
#!/usr/bin/env bash
# A fake `gh release` for one release, kept in $GH_STATE/release.json; each call that changes it is logged in $GH_STATE/log.
set -eu
state=$GH_STATE/release.json
[ "$1" = release ] || exit 2
command=$2
shift 3
file=
if [ "${1:-}" != "${1#-}" ]; then :; else file=${1:-}; fi
asset() { jq -n --arg name "$(basename "$file")" --arg digest "sha256:$(shasum -a 256 "$file" | cut -d' ' -f1)" \
  '{name: $name, state: "uploaded", digest: $digest}'; }
echo "$command" >> "$GH_STATE/log"
case $command in
  view)
    if [ -n "${GH_DOWN:-}" ]; then echo 'error connecting to api.github.com' >&2; exit 1; fi
    if [ ! -f "$state" ]; then echo 'release not found' >&2; exit 1; fi
    while [ "$1" != --jq ]; do shift; done
    jq -r "$2" "$state" ;;
  upload)
    jq --argjson asset "$(asset)" '.assets = [(.assets[] | select(.name != $asset.name)), $asset]' "$state" > "$state.new"
    mv "$state.new" "$state" ;;
  edit)
    jq '.isDraft = false' "$state" > "$state.new"
    mv "$state.new" "$state" ;;
  create)
    jq -n --argjson asset "$(asset)" --argjson draft "${GH_CREATE_LEAVES_DRAFT:-false}" \
      '{isDraft: $draft, assets: [$asset]}' > "$state" ;;
  *) exit 2 ;;
esac
GH
chmod +x "$work/bin/gh"
apk=$work/scootradar-1.5.1-13.apk
echo 'the APK' > "$apk"
echo 'another APK' > "$work/other.apk"
digest="sha256:$(shasum -a 256 "$apk" | cut -d' ' -f1)"
other="sha256:$(shasum -a 256 "$work/other.apk" | cut -d' ' -f1)"
echo notes > "$work/notes.md"

# Runs the publisher on a release that starts as $1 (JSON, or empty for none); $2 is whether it should succeed, $3 the
# changes it should make to the release, in order, and the rest the environment for the fake gh.
case_() {
  local start=$1 expected=$2 changes=$3
  shift 3
  export GH_STATE=$work/state
  rm -rf "$GH_STATE"
  mkdir "$GH_STATE"
  touch "$GH_STATE/log"
  if [ -n "$start" ]; then echo "$start" > "$GH_STATE/release.json"; fi
  local result=ok
  env PATH="$work/bin:$PATH" "$@" "$publish" plhery/ScootRadar android-1.5.1-13 "$apk" title "$work/notes.md" \
    2>"$work/stderr" || result=failed
  local made
  made=$(grep -v '^view$' "$GH_STATE/log" | tr '\n' ' ' | sed 's/ $//') || true
  if [ "$result" != "$expected" ] || [ "$made" != "$changes" ]; then
    echo "FAIL: from ${start:-no release}: $result with [$made], expected $expected with [$changes]" >&2
    cat "$work/stderr" >&2
    exit 1
  fi
}

uploaded() { printf '{"name":"scootradar-1.5.1-13.apk","state":"%s","digest":"%s"}' "$1" "$2"; }

case_ '' ok 'create'
case_ '{"isDraft":true,"assets":[]}' ok 'upload edit'
case_ "{\"isDraft\":true,\"assets\":[$(uploaded starter '')]}" ok 'upload edit'
case_ "{\"isDraft\":true,\"assets\":[$(uploaded uploaded "$digest")]}" ok 'edit'
case_ "{\"isDraft\":false,\"assets\":[$(uploaded uploaded "$digest")]}" ok ''
case_ '{"isDraft":false,"assets":[]}' ok 'upload'
case_ "{\"isDraft\":true,\"assets\":[$(uploaded uploaded "$other")]}" failed ''
case_ "{\"isDraft\":false,\"assets\":[$(uploaded uploaded "$other")]}" failed ''
case_ '' failed '' GH_DOWN=1
case_ '' failed 'create' GH_CREATE_LEAVES_DRAFT=true
echo 'publish-github-release.sh: 10 cases pass'
