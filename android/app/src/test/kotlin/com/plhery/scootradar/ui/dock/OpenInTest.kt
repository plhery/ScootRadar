package com.plhery.scootradar.ui.dock

import android.app.Application
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.TrackedEvent
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.offset
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.ScooterMapScreen
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.GraphicsMode
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// LOG-280 and LOG-328: the card's "Open in" (ScooterControls.swift:1626-1652) says rental_open, and opens the
// scooter, or the operator's app where the feed links none, as Voi's, Dott's and Bolt's rider maps don't (LOG-278),
// or where no link to the scooter opens. Only the scooter or the operator's app opening is noted for the rating; a
// tap that opens nothing is felt to fail. LOG-409: the card is in the language chosen at once, without the activity
// being made again.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class OpenInTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val analytics = RecordingAnalytics()
    private val defaults = InMemoryScooterDefaults()
    private val application: Application = ApplicationProvider.getApplicationContext()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val rider = GeoPoint(latitude = 47.3769, longitude = 8.5417)
    private val haptics = RecordingHaptics()
    private var phone: Phone? = null

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun openInNotesTheTapSaysRentalOpenAndOpensTheScooter() {
        val target = scooterNearby("lime", ScooterRentalURIs(ios = null, android = "https://lime.bike/vehicle/1", web = null))
        val link = checkNotNull(target.rentalURL)
        showCard(target)

        compose.onNodeWithText(openIn(target)).performClick()
        compose.waitForIdle()

        assertEquals(listOf(TrackedEvent("rental_open", provider = "lime")), analytics.events)
        // The return from the ride may be the moment to ask for a rating.
        assertEquals(controllers.now()(), defaults.date("review-rental-opened-at"))
        val opened = shadowOf(application).nextStartedActivity
        assertEquals(Intent.ACTION_VIEW, opened.action)
        assertEquals(link.toString(), opened.dataString)
        assertTrue(haptics.types.isEmpty())
    }

    @Test
    fun withoutTheOperatorsAppALinkInItsOwnSchemeFallsBackToItsStorePage() {
        // Bolt's feed gives only links in Bolt's own scheme, and this phone has no Bolt app: only the browser
        // takes a link, a web one.
        val link = "bolt://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=1"
        val target = scooterNearby("bolt", ScooterRentalURIs(ios = link, android = link, web = null))
        val bolt = checkNotNull(ScooterProvider.Bolt.app).link
        showCard(target) { it.data?.scheme == "https" && !it.isForAnApp }

        compose.onNodeWithText(openIn(target)).performClick()
        compose.waitForIdle()

        // The tap says rental_open as for any scooter its feed links, whatever opens.
        assertEquals(listOf(TrackedEvent("rental_open", provider = "bolt")), analytics.events)
        // Bolt's link, then its app's, an app first: its page opens in the browser and sends the phone to the store.
        val asked = checkNotNull(phone).started.map { it.dataString to it.isForAnApp }
        assertEquals(listOf(link to false, bolt to true, bolt to false), asked)
        // The store is no ride to be back from.
        assertNull(defaults.date("review-rental-opened-at"))
        assertTrue(haptics.types.isEmpty())
    }

    @Test
    fun aTapThatOpensNothingIsNotNotedAndIsFeltToFail() {
        // Bolt Hopp's links are in its own scheme, and the catalog gives it no app to fall back on.
        val link = "bolt-hopp://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=8d8f81ed"
        val target = scooterNearby("bolt_hopp", ScooterRentalURIs(ios = null, android = link, web = null))
        assertNull(target.providerInfo?.app)
        showCard(target) { false }

        compose.onNodeWithText(openIn(target)).performClick()
        compose.waitForIdle()

        assertEquals(listOf(TrackedEvent("rental_open", provider = "bolt_hopp")), analytics.events)
        assertEquals(listOf(link), checkNotNull(phone).started.map { it.dataString })
        assertNull(defaults.date("review-rental-opened-at"))
        assertEquals(listOf(HapticFeedbackType.Reject), haptics.types)
    }

    @Test
    fun withoutALinkToTheScooterOpenInOpensTheOperatorsApp() {
        val provider = ScooterProvider.entries.first { scooter(id = "s1", provider = it.rawValue).operatorApp != null }
        val target = scooterNearby(provider.rawValue, rentalURIs = null)
        showCard(target)

        compose.onNodeWithText(openIn(target)).performClick()
        compose.waitForIdle()

        assertEquals(listOf(TrackedEvent("rental_open", provider = provider.rawValue, result = "app")), analytics.events)
        // The app took it: the return from the ride may be the moment to ask for a rating.
        assertNotNull(defaults.date("review-rental-opened-at"))
        assertNotNull(shadowOf(application).nextStartedActivity)
    }

    @Test
    fun aVoiScooterFromTheRiderMapOpensVoisApp() = opensTheOperatorsApp(ScooterProvider.Voi)

    @Test
    fun aDottScooterFromTheRiderMapOpensDottsApp() = opensTheOperatorsApp(ScooterProvider.Dott)

    @Test
    fun aBoltScooterFromTheRiderMapOpensBoltsApp() = opensTheOperatorsApp(ScooterProvider.Bolt)

    /** LOG-278: the rider maps link no scooter, so the card opens the app on the link it claims, an app first. */
    private fun opensTheOperatorsApp(provider: ScooterProvider) {
        val target = scooterNearby(provider.rawValue, rentalURIs = null)
        val app = checkNotNull(target.operatorApp)
        assertEquals(checkNotNull(provider.app).link, app.link)
        showCard(target)

        compose.onNodeWithText(openIn(target)).performClick()
        compose.waitForIdle()

        assertEquals(listOf(TrackedEvent("rental_open", provider = provider.rawValue, result = "app")), analytics.events)
        val opened = shadowOf(application).nextStartedActivity
        assertEquals(Intent.ACTION_VIEW, opened.action)
        assertEquals(app.link, opened.dataString)
        assertTrue("an app, not a browser", opened.flags and Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER != 0)
        assertNull("the app took it", shadowOf(application).nextStartedActivity)
    }

    @Test
    fun theCardIsInTheLanguageChosenAtOnce() {
        val target = scooterNearby("lime", ScooterRentalURIs(ios = null, android = "https://lime.bike/vehicle/1", web = null))
        val model = showCard(target)
        val english = openIn(target)
        compose.onNodeWithText(english).assertExists()

        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.Fr))
        compose.waitForIdle()

        assertEquals(ScooterLanguage.Fr, ScooterLanguage.current)
        val french = openIn(target)
        assertNotEquals(english, french)
        compose.onNodeWithText(french).assertExists()
        compose.onAllNodesWithText(english).assertCountEquals(0)
    }

    /** A scooter 300 m east of the rider, whom the map has located. */
    private fun scooterNearby(provider: String, rentalURIs: ScooterRentalURIs?): Scooter {
        val place = rider.offset(east = 300, north = 0)
        return scooter(id = "s1", provider = provider, latitude = place.latitude, longitude = place.longitude, rentalURIs = rentalURIs)
    }

    /**
     * The screen with the scooter's card open, its chrome tracking with the recording analytics and the recording
     * haptics; with [takes], on a [phone] whose apps take the links that it says.
     */
    private fun showCard(target: Scooter, takes: ((Intent) -> Boolean)? = null): ScooterMapController {
        val model = controllers.make(
            StubScooterAPI(ScooterResponse(vehicles = listOf(target))),
            locationManager = FakeLocationManager(),
            defaults = defaults,
        )
        model.setUserLocation(rider)
        model.updateViewport(MapRegion(rider, latitudeDelta = 0.01, longitudeDelta = 0.01), zoom = 17)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        model.selectScooter(target.id)
        compose.setContent {
            val context = LocalContext.current
            val shown = remember { takes?.let { Phone(context, it).also { made -> phone = made } } ?: context }
            CompositionLocalProvider(LocalContext provides shown, LocalHapticFeedback provides haptics) {
                ScooterMapScreen(controller = model, map = {}, analytics = analytics.analytics)
            }
        }
        compose.waitForIdle()
        return model
    }

    private fun openIn(target: Scooter): String = stringFormat(localized("Open in %@"), target.providerName)

    /** A phone whose apps take the links that `takes` says, and that keeps what was asked of it. */
    private class Phone(base: Context, private val takes: (Intent) -> Boolean) : ContextWrapper(base) {
        val started = mutableListOf<Intent>()

        override fun startActivity(intent: Intent) {
            started += intent
            if (!takes(intent)) throw ActivityNotFoundException()
        }
    }

    private val Intent.isForAnApp: Boolean get() = flags and Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER != 0
}

/** The haptics the screen asks for. */
private class RecordingHaptics : HapticFeedback {
    val types = mutableListOf<HapticFeedbackType>()

    override fun performHapticFeedback(hapticFeedbackType: HapticFeedbackType) {
        types += hapticFeedbackType
    }
}
