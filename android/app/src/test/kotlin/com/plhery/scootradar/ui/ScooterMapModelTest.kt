package com.plhery.scootradar.ui

import android.app.UiModeManager
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterDockLine
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.addingTimeInterval
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.lungernRegion
import com.plhery.scootradar.scooter
import com.plhery.scootradar.testController
import com.plhery.scootradar.ui.chrome.FloatingMapControls
import com.plhery.scootradar.ui.chrome.LocationIssueCard
import com.plhery.scootradar.ui.chrome.MapStatusBanner
import com.plhery.scootradar.ui.dock.CardFigureRow
import com.plhery.scootradar.ui.dock.CardFigures
import com.plhery.scootradar.ui.dock.FoldedDockLine
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.zurichRegion
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.GraphicsMode
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.TimeZone

// The screen's tests of ios/ScootRadarTests/ScooterMapModelTests.swift, with the map left out.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMapModelTest {
    @get:Rule
    val compose = createComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()

    @Before
    fun setUp() {
        // The iPhone's tests run in English, in Switzerland's time.
        Locale.setDefault(Locale.US)
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    /** The appearance is the window's, so a sheet over the screen has it too. */
    @Test
    fun chosenAppearanceIsThatOfTheWholeWindow() {
        // Night in Switzerland, where the map opens.
        val night = Instant.parse("2026-10-24T23:00:00+02:00")
        val model = testController(scope, now = { night })
        compose.setContent { ScooterMapScreen(controller = model, map = {}) }
        val window = shadowOf(ApplicationProvider.getApplicationContext<android.content.Context>().getSystemService(UiModeManager::class.java))
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_YES }

        model.setAppearance(ScooterAppearance.Light)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_NO }

        model.setAppearance(ScooterAppearance.Dark)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_YES }

        // System gives the choice back to the phone.
        model.setAppearance(ScooterAppearance.System)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_AUTO }
    }

    // The views of the main states. Nothing is compared: each state is built and drawn once, so a view that
    // throws on some state fails here.
    @Test
    fun mainStatesOfTheDockRenderWithoutCrashing() {
        val origin = GeoPoint(47.3779, 8.5417)
        val bay = ScooterParking(
            id = "dott:bay", provider = "dott", name = "Rue Faidherbe",
            latitude = 47.3769, longitude = 8.5417, mandatory = true,
        )
        val priced = Scooter(
            provider = "lime", latitude = 47.3769, longitude = 8.5417, battery = 82, rangeMeters = 24_000,
            vehicleID = "priced", deepLink = null,
            rentalURIs = ScooterRentalURIs(ios = "https://li.me/ride", android = null, web = null),
            distanceMeters = 0.0,
            pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
        )
        val clock = TestClock()
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(priced, scooter(id = "bare", provider = "bird", battery = null)),
                meta = ScooterResponseMetadata(
                    partial = true,
                    failedSources = listOf("national:voi_zurich"),
                    generatedAt = iso(clock.now),
                    truncated = true,
                    totalVehicles = 5_412,
                    parkingStatus = "stale",
                    expiresAt = iso(clock.now.addingTimeInterval(300.0)),
                ),
                parking = listOf(bay),
            ),
        )
        val model = controllers.make(api, clock)
        val renderer = Renderer(compose) { clock.now }

        if (model.dock !is ScooterDockContent.Finding) fail("Expected the first load")
        renderer.assertRenders("finding") { ScooterControlDock(model) }

        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        if (model.dock !is ScooterDockContent.Summary) fail("Expected the summary")
        renderer.assertRenders("summary with notices") { ScooterControlDock(model) }

        // The scooter card: without an origin and without a price, then with everything.
        model.selectScooter("bird:bare")
        if (model.dock !is ScooterDockContent.Scooter) fail("Expected the scooter card")
        renderer.assertRenders("scooter without origin, price or link") { ScooterControlDock(model) }
        model.setUserLocation(origin)
        model.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 5), ScooterProvider.Lime)
        model.selectScooter("lime:priced")
        renderer.assertRenders("scooter with a pass") { ScooterControlDock(model) }
        model.setSearchedDestination(MapDestination(title = "Zürich HB", point = origin))
        renderer.assertRenders("scooter from a place") { ScooterControlDock(model) }
        model.setSearchedDestination(null)

        model.selectParking(bay.id)
        if (model.dock !is ScooterDockContent.Parking) fail("Expected the bay card")
        renderer.assertRenders("parking bay") { ScooterControlDock(model) }

        // One provider chosen: its chip is the selected one, with its count.
        model.clearSelection()
        model.showProviders(setOf(ScooterProvider.Lime))
        val chosen = model.dock as? ScooterDockContent.Summary ?: return fail("Expected the summary")
        assertEquals(listOf(ScooterProvider.Lime), chosen.summary.chips.filter { it.isSelected }.map { it.provider })
        renderer.assertRenders("summary with a provider chosen") { ScooterControlDock(model) }

        // Filters that hide everything.
        model.showProviders(setOf(ScooterProvider.Pony))
        if (model.dock !is ScooterDockContent.FiltersHideEverything) fail("Expected the filters card")
        renderer.assertRenders("filters hide everything") { ScooterControlDock(model) }
        model.resetFilters()
        model.selectParking(bay.id)

        // A failed refresh: in the dock, and at the top of a card.
        api.setFailure(ScooterAPIError.Offline())
        model.retryLoad()
        val refreshFailed = controllers.waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }
        assertTrue(refreshFailed)
        renderer.assertRenders("parking bay while offline") { ScooterControlDock(model) }
        model.clearSelection()
        renderer.assertRenders("refresh failed") { ScooterControlDock(model) }

        // Out of date: the data expired and the refresh after that failed.
        clock.advance(400.0)
        model.retryLoad()
        val expired = controllers.waitUntil {
            api.calls == 3 && model.loadIssue.value is ScooterLoadIssue.OutOfDate && !model.isLoading.value
        }
        assertTrue(expired)
        if (model.dock !is ScooterDockContent.OutOfDate) fail("Expected the out-of-date card")
        renderer.assertRenders("out of date") { ScooterControlDock(model) }

        // Outside coverage.
        val outsideAPI = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val outside = controllers.make(outsideAPI)
        outside.updateViewport(lungernRegion, zoom = 14)
        val outsideLoaded = controllers.waitUntil { outsideAPI.calls == 1 && outside.lastUpdated.value != null && !outside.isLoading.value }
        assertTrue(outsideLoaded)
        if (outside.dock !is ScooterDockContent.OutsideCoverage) fail("Expected the coverage card")
        renderer.assertRenders("outside coverage") { ScooterControlDock(outside) }

        // A first load that failed.
        val failing = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        failing.setFailure(ScooterAPIError.HttpStatus(503))
        val waiting = controllers.make(failing)
        waiting.refresh()
        val failed = controllers.waitUntil { failing.calls == 1 && waiting.loadIssue.value != null && !waiting.isLoading.value }
        assertTrue(failed)
        if (waiting.dock !is ScooterDockContent.Waiting) fail("Expected the waiting dock")
        renderer.assertRenders("waiting") { ScooterControlDock(waiting) }
    }

    /** The search bar's states are the search's own tests (app-d). */
    @Test
    fun topOfTheMapRendersWithoutCrashing() {
        val renderer = Renderer(compose)
        for (failure in ScooterLoadFailure.entries) {
            renderer.assertRenders("banner: ${failure.rawValue}") {
                MapStatusBanner(message = failure.message, actionTitle = localized("Try again"), onAction = {})
            }
        }

        // German has the longest reasons and the longest button.
        val german = inGerman { ScooterLoadFailure.entries.map { it to (it.message to localized("Try again")) } }
        for ((failure, texts) in german) {
            renderer.assertRenders("German banner: ${failure.rawValue}") {
                MapStatusBanner(message = texts.first, actionTitle = texts.second, onAction = {})
            }
        }

        for (issue in listOf(ScooterLocationIssue.Denied, ScooterLocationIssue.Restricted, ScooterLocationIssue.NotFound)) {
            renderer.assertRenders("location card: $issue") {
                LocationIssueCard(issue = issue, onOpenSettings = {}, onSearchPlace = {}, onRetry = {}, onDismiss = {})
            }
        }

        val model = controllers.make(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        renderer.assertRenders("Near me") { FloatingMapControls(model) }
    }

    /** Beside its button a long reason was cut after three lines as soon as the text was larger than standard. */
    @Test
    fun theLoadFailedBannerShowsItsWholeSentenceAtEveryTextSize() {
        val (sentence, button) = inGerman {
            localized("ScootRadar is busy right now. Try again in a moment.") to localized("Try again")
        }
        assertTrue(sentence, sentence.startsWith("ScootRadar ist"))

        // A 375 pt phone leaves the banner 351 pt.
        val renderer = Renderer(compose)
        fun height(message: String, size: DynamicTypeSize): Int =
            renderer.height(RenderPass(dark = false, size, 351.dp)) {
                MapStatusBanner(message = message, actionTitle = button, onAction = {})
            }

        val standard = height(sentence, DynamicTypeSize.Large)
        assertTrue("Three lines beside the button", standard > height("Kurz.", DynamicTypeSize.Large))
        for (size in listOf(DynamicTypeSize.XLarge, DynamicTypeSize.XXLarge, DynamicTypeSize.XXXLarge, DynamicTypeSize.Accessibility3)) {
            assertTrue("$size", height(sentence, size) > standard)
        }
        // Nothing caps the lines: twice the text is taller at every size.
        for (size in DynamicTypeSize.entries) {
            assertTrue("$size", height("$sentence $sentence", size) > height(sentence, size))
        }
    }

    /**
     * A 375-point phone's card gives its figures 321 points and keeps them side by side; a 320-point window's gives
     * them 266 and puts the third under the other two, so that the price keeps its ride length.
     */
    @Test
    fun theCardsFiguresGoTwoOverOneOnlyInAWindowNarrowerThanAPhone() {
        assertFalse(CardFigures.wraps(3, 321.dp))
        assertTrue(CardFigures.wraps(3, 266.dp))
        assertFalse(CardFigures.wraps(2, 266.dp))
        assertFalse(CardFigures.wraps(3, null))

        val renderer = Renderer(compose)
        fun size(width: Dp): IntSize {
            var size = IntSize.Zero
            renderer.height(RenderPass(dark = false, DynamicTypeSize.Large, width)) {
                CardFigureRow(Modifier.onSizeChanged { size = it }) {
                    Box(Modifier.fillMaxWidth().height(50.dp))
                    Box(Modifier.fillMaxWidth().height(60.dp))
                    Box(Modifier.fillMaxWidth().height(40.dp))
                }
            }
            return size
        }
        with(compose.density) {
            assertEquals(IntSize(321.dp.roundToPx(), 60.dp.roundToPx()), size(321.dp))
            assertEquals(IntSize(266.dp.roundToPx(), 60.dp.roundToPx() + 8.dp.roundToPx() + 40.dp.roundToPx()), size(266.dp))
        }
    }

    @Test
    fun theUsualFoldedLinesFitOneLineOfThePanelInEveryLanguage() {
        val renderer = Renderer(compose)
        fun height(line: ScooterDockLine, width: Dp, size: DynamicTypeSize = DynamicTypeSize.Large): Float =
            renderer.height(RenderPass(dark = false, size, width)) { FoldedDockLine(line) } / compose.density.density

        // The panel inside the card's padding.
        val width = (380 - 32).dp
        val oneLine = height(ScooterDockLine(mark = ScooterDockLine.Mark.Symbol("scooter"), title = "1"), width)
        assertTrue(oneLine > 0)
        // A line too long for the panel is drawn taller.
        val tooLong = ScooterDockLine(mark = ScooterDockLine.Mark.Symbol("scooter"), title = "1", details = List(5) { "≈12 min walk" })
        assertTrue(height(tooLong, width) > oneLine)

        for (language in ScooterLanguage.entries) {
            ScooterLanguage.current = language
            val count = 3_784.formatted(language.locale)
            val minutes = stringFormat(localized("%lld min"), 12L)
            val walk = stringFormat(localized("≈%lld min walk"), 12L)
            val lines = listOf(
                ScooterDockLine(
                    mark = ScooterDockLine.Mark.Symbol("scooter"),
                    title = "$count ${localized("scooters")}",
                    status = ScooterDockStatus.UpdatedMinutesAgo(59),
                ),
                ScooterDockLine(
                    mark = ScooterDockLine.Mark.Provider(ScooterProvider.Publibike),
                    title = "950 m",
                    details = listOf("PubliBike", minutes),
                    status = ScooterDockStatus.UpdatedMinutesAgo(59),
                ),
                ScooterDockLine(mark = ScooterDockLine.Mark.Provider(ScooterProvider.Publibike), title = "PubliBike", details = listOf(walk, "950 m")),
            )
            for (line in lines) {
                assertEquals("$language: ${line.parts}", oneLine, height(line, width), 1f)
                assertTrue("$language: ${line.parts}", height(line, (420 - 32).dp, DynamicTypeSize.Accessibility5) > oneLine)
            }
        }
    }

    /** What `strings` says in German: the app's text as the German bundle has it. */
    private fun <T> inGerman(strings: () -> T): T {
        val shown = ScooterLanguage.current
        ScooterLanguage.current = ScooterLanguage.De
        try {
            return strings()
        } finally {
            ScooterLanguage.current = shown
        }
    }

    private fun iso(date: Instant): String = DateTimeFormatter.ISO_INSTANT.format(date.truncatedTo(ChronoUnit.SECONDS))
}
