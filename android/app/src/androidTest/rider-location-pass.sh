#!/bin/bash
# The rider's location tests (map/RiderLocationTest) on the emulator on port 5660, one at a time.
#
# Revoking a permission ends the app's process, and the test's with it, so the app is reset here after each test
# rather than in the test: its data cleared, which on Android 12 also forgets the rider's answers to the dialog,
# its location permissions revoked, and location on. The fixes come from the emulator's GPS, which only the host can feed: a fix at
# Zürich's main station every 2 s, for the tests named "…WithAFix". An emulator without GPS (ScootRadar_Tablet,
# hw.gps=no, as a Wi-Fi tablet) takes no fix from the host: with `providers` after the folder, the fixes go to test
# providers in place of its own, as the shell may set them.
#
# Usage, from android/ after `./gradlew :app:assembleDebug :app:assembleDebugAndroidTest`:
#   app/src/androidTest/rider-location-pass.sh <folder for the screens> [providers]
set -u
screens=${1:?the folder for the screens}
fixes=${2:-gps}
if [[ $fixes != gps && $fixes != providers ]]; then
    echo "The fixes come from gps or providers, not $fixes" >&2
    exit 2
fi
serial=emulator-5660
app=com.plhery.scootradar
runner=$app.test/androidx.test.runner.AndroidJUnitRunner
output=/sdcard/Android/media/$app/additional_test_output

device() { ADB_MDNS=0 adb -s "$serial" "$@"; }

# The test providers gone, which would otherwise outlive a test whose instrumentation died before its tearDown and
# shadow the emulator's GPS: the shell removes them only while it may mock locations.
removeTestProviders() {
    device shell appops set 2000 android:mock_location allow
    for provider in fused gps network; do
        device shell cmd location providers remove-test-provider $provider > /dev/null 2>&1
    done
    device shell appops set 2000 android:mock_location default
}

reset() {
    device shell pm clear "$app" > /dev/null
    for permission in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do
        device shell pm revoke "$app" "android.permission.$permission" 2> /dev/null
    done
    device shell cmd location set-location-enabled true
    removeTestProviders
}

# The loop feeding fixes, while a test runs: stopped after it, and whenever the pass ends, finished or interrupted (a
# background job of a script ignores the ^C that ends the script).
fixer=
stopFixes() {
    if [[ -n $fixer ]]; then
        kill "$fixer" 2> /dev/null
        wait "$fixer" 2> /dev/null
        fixer=
    fi
}
# The screen's ignoring of apps' orientations, turned off for the turn test, given back too.
ignored=0
restoreOrientationRequest() {
    if [[ $ignored == 1 ]]; then
        device shell wm set-ignore-orientation-request true
        ignored=0
    fi
}
trap 'stopFixes; removeTestProviders; restoreOrientationRequest' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

failures=0
run() {
    local test=$1
    if [[ $test == *WithAFix && $fixes == providers ]]; then
        device shell appops set 2000 android:mock_location allow
        for provider in fused gps network; do
            device shell cmd location providers add-test-provider $provider
            device shell cmd location providers set-test-provider-enabled $provider true
        done
        # The test's tearDown removes the providers before the loop is stopped: a fix set then has none to go to.
        (while true; do
            for provider in fused gps network; do
                device shell cmd location providers set-test-provider-location $provider --location 47.3782,8.5402 --accuracy 5 > /dev/null 2>&1
            done
            sleep 2
        done) &
        fixer=$!
    elif [[ $test == *WithAFix ]]; then
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
    stopFixes
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
# A phone keeps the app upright as it asks; a resizable emulator's screen ignores every app's orientation, as a
# large screen does, until told not to.
ignored=$(device shell wm get-ignore-orientation-request | grep -c true)
device shell wm set-ignore-orientation-request false
reset; run aTurnOfThePhoneKeepsTheScreenUprightAndTheDotAndItsBeamWithAFix
restoreOrientationRequest
reset; run theBeamPointsTheWayTheRiderFacesOnATurnedAndTiltedMapWithAFix
reset

echo "$failures failed"
exit $((failures > 0))
