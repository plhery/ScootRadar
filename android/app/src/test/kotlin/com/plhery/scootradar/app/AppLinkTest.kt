package com.plhery.scootradar.app

import android.content.Intent
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterMapLink
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

// UI-377, X-AD08: the links MainActivity is opened with, as the manifest's filter lets them through.

@RunWith(AndroidJUnit4::class)
class AppLinkTest {
    private fun view(address: String) = Intent(Intent.ACTION_VIEW, Uri.parse(address))

    @Test
    fun aLinkToTheMapOpensItsPlaceInTheApp() {
        val zurich = AppLink.Map(ScooterMapLink(origin = GeoPoint(latitude = 47.3769, longitude = 8.5417), minimumBattery = 30))
        for (address in listOf(
            "https://scootradar.com/map?origin=47.3769,8.5417&minBattery=30",
            "https://scootradar.com/map/?origin=47.3769,8.5417&minBattery=30",
            "https://www.scootradar.com/map?origin=47.3769,8.5417&minBattery=30",
            // The map was at "/" before the landing page.
            "https://scootradar.com/?origin=47.3769,8.5417&minBattery=30",
        )) {
            assertEquals(address, zurich, AppLink.of(view(address)))
        }
        // The map as the rider left it.
        assertEquals(AppLink.Map(ScooterMapLink()), AppLink.of(view("https://scootradar.com/map")))
        assertEquals(AppLink.Map(ScooterMapLink(minimumBattery = 30)), AppLink.of(view("https://scootradar.com/map/?minBattery=30")))
    }

    @Test
    fun theLandingPageGoesOnToTheBrowser() {
        for (address in listOf(
            "https://scootradar.com/",
            "https://www.scootradar.com/",
            "https://scootradar.com/?utm_source=mail",
            // As the iPhone's association file has it: "/" is the map's only with an origin.
            "https://scootradar.com/?tile=dark",
            "https://scootradar.com/?minBattery=30",
            "https://scootradar.com/?origin=",
            // An origin that isn't one.
            "https://scootradar.com/?origin=%FF",
        )) {
            val uri = Uri.parse(address)
            assertEquals(address, AppLink.Page(uri), AppLink.of(Intent(Intent.ACTION_VIEW, uri)))
        }

        val browser = AppLink.browser(Uri.parse("https://scootradar.com/"))
        assertEquals(Intent.ACTION_VIEW, browser.action)
        assertEquals(Uri.parse("https://scootradar.com/"), browser.data)
        assertTrue(browser.hasCategory(Intent.CATEGORY_BROWSABLE))
        // A browser, chosen by a web address of no site rather than by the link, which this app's filter takes.
        val selector = browser.selector!!
        assertEquals(Intent.ACTION_VIEW, selector.action)
        assertEquals(setOf(Intent.CATEGORY_BROWSABLE), selector.categories)
        assertEquals("https", selector.data?.scheme)
        assertNull(selector.data?.host)
    }

    @Test
    fun theLauncherOpensNoLink() {
        assertNull(AppLink.of(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)))
        assertNull(AppLink.of(Intent(Intent.ACTION_VIEW)))
        // A recent's or the launcher's intent may carry the link's data without its action.
        assertNull(AppLink.of(Intent(Intent.ACTION_MAIN, Uri.parse("https://scootradar.com/map"))))
    }
}
