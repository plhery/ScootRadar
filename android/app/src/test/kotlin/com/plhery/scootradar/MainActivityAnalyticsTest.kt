package com.plhery.scootradar

import android.content.Intent
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.AppContainer
import com.plhery.scootradar.app.LaunchArgumentDefaults
import com.plhery.scootradar.app.ScooterApplication
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric

// Events go to Umami from a debug build only when it is started for the smoke test, as the iPhone app's simulator
// only with -analytics-smoke-test (ScooterAnalytics.swift:29-30, docs/analytics.md): a phone a developer runs, or
// a test, counts nowhere. A release always sends, which a debug build's tests can't run.

@RunWith(AndroidJUnit4::class)
class MainActivityAnalyticsTest {
    @Before
    fun debugBuild() = assumeTrue(BuildConfig.DEBUG)

    /** The app's container once MainActivity was started with [extras]. */
    private fun startedWith(vararg extras: Pair<String, Any?>): AppContainer {
        val application = ApplicationProvider.getApplicationContext<ScooterApplication>()
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            .setClass(application, MainActivity::class.java)
            .putExtras(bundleOf(*extras))
        Robolectric.buildActivity(MainActivity::class.java, intent).create()
        return application.container
    }

    @Test
    fun aDebugBuildSendsNothing() {
        assertFalse(startedWith().analytics.sends)
    }

    @Test
    fun aDebugBuildStartedWithAnotherLaunchArgumentSendsNothing() {
        assertFalse(startedWith("ReviewPromptDue" to true).analytics.sends)
    }

    @Test
    fun aDebugBuildStartedForTheSmokeTestSends() {
        assertTrue(startedWith(LaunchArgumentDefaults.ANALYTICS_SMOKE_TEST to true).analytics.sends)
    }
}
