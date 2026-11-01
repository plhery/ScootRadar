package com.plhery.scootradar.app

import com.plhery.scootradar.BuildConfig
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// Android's own: which of the app's builds send to Umami (AppContainer.sendsAnalytics). The iPhone app sends from
// its release builds and from the simulator only with -analytics-smoke-test (ScooterAnalytics.swift:29-30); Android
// has builds the iPhone has not, made from release to be measured on an emulator, and they must count nowhere.

class AnalyticsBuildTypeTest {
    @Test
    fun theReleaseBuildTypeSends() {
        assertTrue(AppContainer.sendsAnalytics("release", smokeTest = false))
    }

    /** The Baseline Profile plugin's builds, not debuggable but run on the emulator, send nothing. */
    @Test
    fun theBuildsMadeFromReleaseToMeasureItSendNothing() {
        assertFalse(AppContainer.sendsAnalytics("benchmarkRelease", smokeTest = false))
        assertFalse(AppContainer.sendsAnalytics("nonMinifiedRelease", smokeTest = false))
    }

    @Test
    fun aDebugBuildSendsOnlyForTheSmokeTest() {
        assertFalse(AppContainer.sendsAnalytics("debug", smokeTest = false))
        assertTrue(AppContainer.sendsAnalytics("debug", smokeTest = true))
    }

    /** The unit tests run on the debug build, whose BuildConfig names its build type. */
    @Test
    fun theTestsBuildIsTheDebugBuildType() {
        assertEquals("debug", BuildConfig.BUILD_TYPE)
    }
}
