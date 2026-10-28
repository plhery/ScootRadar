#!/bin/bash
# The rider's location tests (map/RiderLocationTest) on the emulator on port 5660, one at a time.
#
# Revoking a permission ends the app's process, and the test's with it, so the app is reset here after each test
# rather than in the test: its data cleared, which on Android 12 also forgets the rider's answers to the dialog,
# its location permissions revoked, and location on. The fixes come from the emulator's GPS, which only the host can feed: a fix at
# Zürich's main station every 2 s, for the tests named "…WithAFix".
#
# Usage, from android/ after `./gradlew :app:assembleDebug :app:assembleDebugAndroidTest`:
#   app/src/androidTest/rider-location-pass.sh <folder for the screens>
set -u
screens=${1:?the folder for the screens}
serial=emulator-5660
app=com.plhery.scootradar
runner=$app.test/androidx.test.runner.AndroidJUnitRunner
output=/sdcard/Android/media/$app/additional_test_output

device() { ADB_MDNS=0 adb -s "$serial" "$@"; }

reset() {
    device shell pm clear "$app" > /dev/null
    for permission in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do
        device shell pm revoke "$app" "android.permission.$permission" 2> /dev/null
    done
    device shell cmd location set-location-enabled true
    device shell appops set 2000 android:mock_location default
}

failures=0
run() {
    local test=$1 fixer=
    if [[ $test == *WithAFix ]]; then
        (while true; do device emu geo fix 8.5402 47.3782 > /dev/null; sleep 2; done) &
        fixer=$!
    fi
    echo "== $test"
    # Raw, each test's code: 0 when it passed, and -3 or -4 when it was skipped, which "OK (1 test)" says as well.
    result=$(device shell am instrument -r -w -e class "$app.map.RiderLocationTest#$test" -e riderLocationPass true -e additionalTestOutputDir "$output" "$runner")
    if [[ $result == *"INSTRUMENTATION_STATUS_CODE: 0"* && $result != *"INSTRUMENTATION_STATUS_CODE: -"* ]]; then
        echo "$result" | grep -E "^OK|^Time"
    else
        failures=$((failures + 1))
        echo "$result" | grep -m 3 -E "INSTRUMENTATION_STATUS_CODE: -|Error|Exception|RiderLocationTest.kt"
    fi
    [[ -n $fixer ]] && kill "$fixer"
    device pull "$output/." "$screens" > /dev/null 2>&1
}

device install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk > /dev/null
device install -r app/build/outputs/apk/debug/app-debug.apk > /dev/null
mkdir -p "$screens"

reset; run noFixWithinFiveSecondsSaysTheRiderCouldNotBeFound
reset; run theDialogRefusedShowsTheLocationCard
reset; run locationOffShowsTheCardWhoseSettingsAreTheLocationSwitch
reset; run theDialogAllowedMovesTheMapToTheRiderWithAFix
# The same app, started again: what it stored stays.
run theRiderLocatedOnceIsRememberedAfterARestartWithAFix
reset; run aTurnOfThePhoneKeepsTheDotAndItsBeamWithAFix
reset; run theBeamPointsTheWayTheRiderFacesOnATurnedAndTiltedMapWithAFix
reset

echo "$failures failed"
exit $((failures > 0))
