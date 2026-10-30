package com.plhery.scootradar.ui.settings

import android.app.Application
import android.content.ClipboardManager
import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.app.AppContainer
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowToast

// Where the app sends the rider out of it (ui.md UI-384): Settings' links and Mail in ScooterControls.swift:2529-2542,
// the long walk's Maps in ScooterMapScreen.swift:619-622, as Android's intents and the browser take them.

/** Feedback is a mail to iOS's address, a link opens its page, and a long walk Google Maps' directions. */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class ExternalDestinationsTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val application: Application = ApplicationProvider.getApplicationContext()
    private val controllers = TestControllers()
    private val model = controllers.make(EmptyScooterAPI, TestClock())
    private val version = ScooterLinks.appVersion
    private val opened = mutableListOf<String>()

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
        ScooterLinks.appVersion = "1.0.1"
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLinks.appVersion = version
    }

    private fun show(pages: List<SettingsPage>) {
        compose.setContent {
            val browser = object : UriHandler {
                override fun openUri(uri: String) {
                    opened += uri
                }
            }
            CompositionLocalProvider(LocalUriHandler provides browser) {
                ScootTheme(dark = false, reduceMotion = true) {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = null,
                        onDone = {},
                        passProviders = listOf(ScooterProvider.Lime),
                        sources = emptyList(),
                        pages = pages,
                    )
                }
            }
        }
        compose.waitForIdle()
    }

    /** "Send feedback" writes to hello@scootradar.com, the subject naming the version as URLComponents writes it. */
    @Test
    fun feedbackIsAMailToTheAddressWithTheVersionInItsSubject() {
        show(listOf(SettingsPage.Root))
        compose.onNodeWithText("Send feedback").performScrollTo().performClick()
        compose.waitForIdle()

        val mail = shadowOf(application).nextStartedActivity
        assertEquals(Intent.ACTION_SENDTO, mail.action)
        assertEquals("mailto:hello@scootradar.com?subject=ScootRadar%201.0.1%20feedback", mail.dataString)
        assertTrue("not the browser", opened.isEmpty())
    }

    /**
     * X-AD39: with no mail app on the phone, which some Android phones have none of, "Send feedback" copies the
     * address and says so, where the iPhone always has Mail or offers it again.
     */
    @Test
    fun withNoMailAppTheAddressIsCopiedAndTheRiderToldSo() {
        shadowOf(application).checkActivities(true)
        show(listOf(SettingsPage.Root))
        compose.onNodeWithText("Send feedback").performScrollTo().performClick()
        compose.waitForIdle()

        assertNull(shadowOf(application).nextStartedActivity)
        val clip = application.getSystemService(ClipboardManager::class.java).primaryClip!!
        assertEquals("hello@scootradar.com", clip.getItemAt(0).text.toString())
        assertEquals(
            "No mail app found. The address hello@scootradar.com was copied to the clipboard.",
            ShadowToast.getTextOfLatestToast(),
        )
        assertTrue("not the browser", opened.isEmpty())
    }

    /** The source code and the privacy notice open their pages, in the browser. */
    @Test
    fun theWebLinksOpenTheirPages() {
        show(listOf(SettingsPage.Root))
        // Down the page, below the fold.
        compose.onNodeWithText("Source code on GitHub").performScrollTo().performClick()
        compose.onNodeWithText("Privacy").performScrollTo().performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Read the privacy notice").performClick()
        compose.waitForIdle()

        assertEquals(listOf("https://github.com/plhery/ScootRadar", "https://scootradar.com/privacy"), opened)
        assertNull("nothing but the browser", shadowOf(application).nextStartedActivity)
    }

    /**
     * A walk too long for the map opens Google Maps' walking directions to the scooter or the bay, as
     * WalkingDirectionsTest has the URL, from outside an activity.
     */
    @Test
    fun aLongWalkOpensGoogleMapsWalkingDirections() {
        val container = AppContainer(application)
        val scooter = Scooter(
            provider = "lime", latitude = 45.75, longitude = 4.85, battery = 80,
            rangeMeters = null, vehicleID = "s1", deepLink = null, rentalURIs = null, distanceMeters = 0.0,
        )
        container.openInMaps(ScooterWalkTarget.Scooter(scooter))
        val walk = shadowOf(application).nextStartedActivity
        assertEquals(Intent.ACTION_VIEW, walk.action)
        assertTrue(walk.flags and Intent.FLAG_ACTIVITY_NEW_TASK != 0)
        val url = Uri.parse(walk.dataString)
        assertEquals("https://www.google.com/maps/dir/", url.buildUpon().clearQuery().build().toString())
        assertEquals(
            mapOf("api" to "1", "destination" to "45.75,4.85", "travelmode" to "walking"),
            url.queryParameterNames.associateWith { url.getQueryParameter(it) },
        )

        val bay = ScooterParking(id = "dott:bay", provider = "dott", name = "", latitude = 47.0, longitude = -0.5, mandatory = false)
        container.openInMaps(ScooterWalkTarget.Parking(bay))
        assertEquals(
            "https://www.google.com/maps/dir/?api=1&destination=47%2C-0.5&travelmode=walking",
            shadowOf(application).nextStartedActivity.dataString,
        )
    }
}
