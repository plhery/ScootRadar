#!/bin/zsh
# Archives a Release build of the iOS app and uploads it to App Store Connect,
# where it goes through processing and then appears in TestFlight. It never
# submits anything for review.
#
# Signing and the upload use an App Store Connect API key (Users and Access ›
# Integrations › Team Keys, role App Manager or Admin): the .p8 file in
# ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8, and
#
#   ASC_KEY_ID=<key id> ASC_ISSUER_ID=<issuer id> scripts/upload-ios-app.sh
#
# The build number is the number of commits on HEAD, so each new commit on main
# uploads a higher one; set SCOOTRADAR_BUILD_NUMBER to choose another.

set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd)"
PROJECT_PATH="$PROJECT_ROOT/ios/ScootRadar.xcodeproj"
EXPORT_OPTIONS="$PROJECT_ROOT/ios/ExportOptions.plist"
KEY_ID="${ASC_KEY_ID:?Set ASC_KEY_ID to the App Store Connect API key ID.}"
ISSUER_ID="${ASC_ISSUER_ID:?Set ASC_ISSUER_ID to the App Store Connect issuer ID.}"
KEY_PATH="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$KEY_ID.p8}"
BUILD_NUMBER="${SCOOTRADAR_BUILD_NUMBER:-$(git -C "$PROJECT_ROOT" rev-list --count HEAD)}"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/scootradar-upload.XXXXXX")"
ARCHIVE_PATH="$WORK_DIR/ScootRadar.xcarchive"

if [[ ! -f "$KEY_PATH" ]]; then
  print -u2 "No API key at $KEY_PATH"
  exit 1
fi

AUTH=(
  -allowProvisioningUpdates
  -authenticationKeyPath "$KEY_PATH"
  -authenticationKeyID "$KEY_ID"
  -authenticationKeyIssuerID "$ISSUER_ID"
)

VERSION="$(awk '/MARKETING_VERSION/ { gsub(";", "", $3); print $3; exit }' "$PROJECT_PATH/project.pbxproj")"
print "1/2 Archiving ScootRadar $VERSION ($BUILD_NUMBER)…"
xcodebuild archive \
  -project "$PROJECT_PATH" \
  -scheme ScootRadar \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  "${AUTH[@]}" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  -quiet

print "2/2 Uploading to App Store Connect…"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$WORK_DIR/export" \
  "${AUTH[@]}"

print
print "Uploaded build $BUILD_NUMBER. It appears in App Store Connect › TestFlight once Apple has processed it."
print "The archive is kept at $ARCHIVE_PATH"
