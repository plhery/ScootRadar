package com.plhery.scootradar

import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.LaunchArgumentDefaults
import com.plhery.scootradar.app.ScooterApplication
import org.junit.After
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric

// X-AD27 in the build for F-Droid's catalog, which takes no library that isn't free software: Google Play's review
// library isn't one, so there is no store to ask for a rating, even in a debug build launched with ReviewPromptDue,
// and the map waits for no moment to ask (ScooterMapScreen's reviewRequester). The play build's ask is
// MainActivityReviewTest's. Nor is Play Integrity's, so the build has no pass for the server (StorePass), whose play
// build's is PlayIntegrityTest's. CI runs this class alone of the fdroid build's tests.

@RunWith(AndroidJUnit4::class)
class MainActivityStoreReviewTest {
    @Before
    fun standIn() {
        MainActivity.mapStandIn = { }
    }

    @After
    fun tearDown() {
        MainActivity.mapStandIn = null
    }

    @Test
    fun theFDroidBuildAsksNoStoreForARating() {
        val application = ApplicationProvider.getApplicationContext<ScooterApplication>()
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            .setClass(application, MainActivity::class.java)
            .putExtra(LaunchArgumentDefaults.REVIEW_PROMPT_DUE, true)
        val activity = Robolectric.buildActivity(MainActivity::class.java, intent).setup().get()
        assertNull(activity.reviewRequester)
    }

    @Test
    fun theFDroidBuildHasNoPassForTheServer() {
        val application = ApplicationProvider.getApplicationContext<ScooterApplication>()
        assertNull(application.container.api.pass)
    }
}
