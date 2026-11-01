// The app's Baseline Profile and its startup, measured (X-AD30): UiAutomator journeys run on a device against
// :app's release builds that the Baseline Profile plugin makes, signed with the local debug key:
// nonMinifiedRelease, which the profile is recorded on, and benchmarkRelease, minified as release, which is measured.
// Analytics sends from neither (AppContainer.sendsAnalytics). Never run by CI or a plain build: they need a device,
// with no other UiAutomation client connected to it (an agent's snapshot helper takes it, and the run fails).
//
// - The profile: ./gradlew :app:generateReleaseBaselineProfile, with one device or emulator connected, rooted below
//   Android 13 (adb root). It is saved in app/src/release/generated/baselineProfiles.
// - Startup: ./gradlew :baselineprofile:connectedBenchmarkReleaseAndroidTest
//   -Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.enabledRules=Macrobenchmark
plugins {
    alias(libs.plugins.android.test)
    alias(libs.plugins.baselineprofile)
}

android {
    namespace = "com.plhery.scootradar.baselineprofile"
    compileSdk = 37

    defaultConfig {
        minSdk = 31
        targetSdk = 37
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        // The lane has only emulators, where Macrobenchmark refuses to measure unless told that the numbers are
        // only indicative.
        testInstrumentationRunnerArguments["androidx.benchmark.suppressErrors"] = "EMULATOR"
    }

    targetProjectPath = ":app"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}

baselineProfile {
    // The device connected, never a Gradle Managed Device, which would download a system image and make an AVD.
    useConnectedDevices = true
}

dependencies {
    implementation(libs.androidx.test.ext.junit)
    implementation(libs.uiautomator)
    implementation(libs.benchmark.macro.junit4)
}
