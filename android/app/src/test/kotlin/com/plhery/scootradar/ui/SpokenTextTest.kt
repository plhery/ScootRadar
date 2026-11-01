package com.plhery.scootradar.ui

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestCatalog
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.chrome.ZoneLegend
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.zurichRegion
import java.time.Instant
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/**
 * TalkBack 16 reads the styles of a text aloud, "start 34 pixels, bold, 542, end 34 pixels, start 30 pixels, scooters
 * on this map": the texts drawn in several styles give it their words, and their links, only, as VoiceOver reads them
 * (app-ai's TalkBack pass, X-M19).
 */
@RunWith(AndroidJUnit4::class)
class SpokenTextTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    /** The text TalkBack is given where [words] are shown. */
    private fun spoken(words: String): AnnotatedString = compose.onAllNodesWithText(words, substring = true, useUnmergedTree = true)
        .fetchSemanticsNodes().single().config[SemanticsProperties.Text].single()

    @Test
    fun theDocksCountIsReadAsItsWords() {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(
                    scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421),
                    scooter(id = "b", provider = "voi", latitude = 47.3765, longitude = 8.5430),
                ),
            ),
        )
        val model = controllers.make(api)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
        compose.setContent { ScootTheme(dark = true, reduceMotion = true) { ScooterControlDock(model) } }
        compose.waitForIdle()

        val count = spoken("2 scooters on this map")
        assertEquals(emptyList<Any>(), count.spanStyles)
        assertEquals(emptyList<Any>(), count.paragraphStyles)
    }

    @Test
    fun aCitysRuleIsReadWithItsLinkAndWithoutTheLinksLook() {
        val rule = CityRuleZone(
            id = "zurich",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            firstDay = "2026-05-01",
            hours = emptyList(),
            source = "https://example.com/zurich",
            lines = listOf(listOf(GeoPoint(47.3769, 8.5417), GeoPoint(47.3779, 8.5427))),
        )
        compose.setContent {
            ScootTheme(dark = true, reduceMotion = true) {
                ZoneLegend(state = ScooterZoneState.Shown, count = 0, rules = listOf(CityRuleZone.Shown(rule, inForce = true)))
            }
        }
        compose.waitForIdle()

        val line = spoken("Stadt Zürich")
        assertEquals(emptyList<Any>(), line.spanStyles)
        val links = line.getLinkAnnotations(0, line.length)
        assertEquals("Stadt Zürich", links.single().let { line.substring(it.start, it.end) })
        val link = links.single().item as LinkAnnotation.Url
        assertEquals("https://example.com/zurich", link.url)
        assertEquals(null, link.styles)
    }

    /**
     * The whole screen, past the two texts above: the dock's count, the legend's city line and a scooter's card on a
     * phone give TalkBack no styles (review-app-ai T2).
     */
    @Test
    @Config(qualifiers = PHONE)
    fun nothingOnThePhonesScreenIsReadWithItsStyles() {
        val model = zurich()
        show(model)
        compose.onNode(hasText("Stadt Zürich", substring = true)).assertExists()
        compose.onNode(hasText("2 scooters", substring = true)).assertExists()
        assertEquals(emptyList<String>(), styledTexts())

        compose.runOnIdle { model.selectScooter("lime:a") }
        compose.waitForIdle()
        compose.onNode(hasText("CHF", substring = true)).assertExists()
        assertEquals("a scooter's card", emptyList<String>(), styledTexts())
    }

    /**
     * A folded panel's line, whose parts are drawn in their styles with a dot between them, is read as its label: its
     * parts, without the styles (FoldedDockLine, review-app-ai T2).
     */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun aFoldedPanelsLineIsReadAsItsParts() {
        // Located: the card's line has the walk after the name.
        val model = zurich(located = true)
        show(model)
        compose.runOnIdle {
            model.selectScooter("lime:a")
            model.setPanelCollapsed(true)
        }
        compose.waitForIdle()

        val line = compose.onNode(hasClickAction() and hasAnyAncestor(hasTestTag(DOCK_TAG)))
        val label = line.fetchSemanticsNode().config[SemanticsProperties.ContentDescription].single()
        assertTrue("the card's parts: $label", label.startsWith("Lime, "))
        assertEquals(emptyList<String>(), styledTexts())
    }

    private fun show(model: ScooterMapController) {
        val clock = TestClock()
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
            }
        }
        compose.waitForIdle()
    }

    /** The texts TalkBack is given that carry styles, which TalkBack 16 reads aloud. */
    private fun styledTexts(): List<String> = compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.Text), useUnmergedTree = true)
        .fetchSemanticsNodes()
        // What a button's own label replaced is listed in the tests' tree, but not given to TalkBack.
        .filter { node -> generateSequence(node.parent) { it.parent }.none { it.config.isClearingSemantics } }
        .flatMap { it.config[SemanticsProperties.Text] }
        .filter { it.spanStyles.isNotEmpty() || it.paragraphStyles.isNotEmpty() }
        .map { it.text }

    /**
     * Zürich at a street's zoom: a Lime with its prices, an operator's zone and a city's parking place. Not [located],
     * the dock counts the scooters.
     */
    private fun zurich(located: Boolean = false): ScooterMapController {
        val catalog = (TestCatalog.catalog as ScooterCatalog.Listed).copy(ruleZones = listOf(cityZone))
        val model = controllers.make(ZurichAPI(), defaults = InMemoryScooterDefaults(), catalog = catalog)
        if (located) {
            model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
            assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        }
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(
            controllers.waitUntil {
                model.lastUpdated.value != null && !model.isLoading.value &&
                    model.zoneState.value == ScooterZoneState.Shown && model.mapRuleZones.value.isNotEmpty()
            },
        )
        return model
    }

    private class ZurichAPI : ScooterAPIClient by StubScooterAPI(
        ScooterResponse(
            vehicles = listOf(
                scooter(
                    id = "a",
                    provider = "lime",
                    latitude = 47.3772,
                    longitude = 8.5421,
                    pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
                ),
                scooter(id = "b", provider = "voi", latitude = 47.3765, longitude = 8.5430),
            ),
        ),
    ) {
        override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = listOf(operatorZone), pending = false, truncated = false)
    }

    private companion object {
        val operatorZone = ScooterZone(
            id = "voi:slow",
            provider = "voi",
            kind = ScooterZoneKind.Slow,
            polygons = listOf(listOf(square(GeoPoint(47.3760, 8.5400), 0.002))),
        )

        val cityZone = CityRuleZone(
            id = "zurich-parking-1",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            kind = ScooterZoneKind.Parking,
            source = "https://example.com/zurich",
            ring = square(GeoPoint(47.3769, 8.5417), 0.0001),
        )

        fun square(at: GeoPoint, side: Double) = listOf(
            at, GeoPoint(at.latitude, at.longitude + side), GeoPoint(at.latitude + side, at.longitude + side),
            GeoPoint(at.latitude + side, at.longitude), at,
        )
    }
}
