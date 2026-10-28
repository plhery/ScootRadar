package com.plhery.scootradar

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterMapLink
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController

// UI-377, X-AD08: what MainActivity does with the link it is opened with, or given while it runs, as
// ScooterMapScreen.swift:144-150's onOpenURL. The activity is only created: the screen, and the map with it, is
// composed once the window shows, so the links wait in the channel the screen reads.

@RunWith(AndroidJUnit4::class)
class MainActivityLinksTest {
    private val mapLink = "https://scootradar.com/map?minBattery=30"
    private val page = "https://scootradar.com/"

    private fun view(address: String) = Intent(Intent.ACTION_VIEW, Uri.parse(address))
        .setClass(ApplicationProvider.getApplicationContext(), MainActivity::class.java)

    private fun launcher() = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        .setClass(ApplicationProvider.getApplicationContext(), MainActivity::class.java)

    private fun created(intent: Intent, taskRoot: Boolean = true): ActivityController<MainActivity> =
        Robolectric.buildActivity(MainActivity::class.java, intent).also { shadowOf(it.get()).setIsTaskRoot(taskRoot) }.create()

    private val MainActivity.shownLink: ScooterMapLink? get() = links.tryReceive().getOrNull()

    private val Activity.startedActivity: Intent? get() = shadowOf(this).nextStartedActivity

    @Test
    fun aLinkThatStartsTheAppShowsItsPlaceOnceAndNotAgainWhenTheActivityIsMadeAgain() {
        val activity = created(view(mapLink))

        assertEquals(ScooterMapLink(minimumBattery = 30), activity.get().shownLink)
        assertNull(activity.get().startedActivity)
        assertFalse(activity.get().isFinishing)

        // A font size changed: the activity is made again from its first intent, which it has shown already.
        val saved = Bundle().also { activity.saveInstanceState(it) }
        val again = Robolectric.buildActivity(MainActivity::class.java, view(mapLink)).create(saved)
        assertNull(again.get().shownLink)
    }

    @Test
    fun aLinkThatComesWhileTheAppRunsIsShownAndKeptAsTheIntent() {
        val activity = created(launcher())
        assertNull(activity.get().shownLink)

        val link = view("https://scootradar.com/map?origin=47.3769,8.5417")
        activity.newIntent(link)

        assertEquals(ScooterMapLink(origin = GeoPoint(latitude = 47.3769, longitude = 8.5417)), activity.get().shownLink)
        assertEquals(link, activity.get().intent)
        assertFalse(activity.get().isFinishing)
    }

    @Test
    fun aPageOfTheSiteGoesToTheBrowserAndAnAppOpenedOnlyForItCloses() {
        val opened = created(view(page)).get()
        val browser = opened.startedActivity!!
        assertEquals(Intent.ACTION_VIEW, browser.action)
        assertEquals(Uri.parse(page), browser.data)
        assertEquals("https", browser.selector?.data?.scheme)
        assertTrue(opened.isFinishing)
        assertNull(opened.shownLink)

        // Opened over another app's task, it isn't the root: the rider goes back to that app from the browser.
        val over = created(view(page), taskRoot = false).get()
        assertEquals(Uri.parse(page), over.startedActivity?.data)
        assertFalse(over.isFinishing)

        // While the map shows, it stays open behind the browser.
        val running = created(launcher())
        running.newIntent(view(page))
        assertEquals(Uri.parse(page), running.get().startedActivity?.data)
        assertFalse(running.get().isFinishing)
    }

    @Test
    fun aLinkBroughtBackFromRecentsOpensNothing() {
        val map = created(view(mapLink).addFlags(Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)).get()
        assertNull(map.shownLink)

        val site = created(view(page).addFlags(Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)).get()
        assertNull(site.startedActivity)
        assertFalse(site.isFinishing)
    }

    @Test
    fun theLauncherOpensNoLink() {
        val activity = created(launcher()).get()

        assertNull(activity.shownLink)
        assertNull(activity.startedActivity)
        assertFalse(activity.isFinishing)
    }
}
