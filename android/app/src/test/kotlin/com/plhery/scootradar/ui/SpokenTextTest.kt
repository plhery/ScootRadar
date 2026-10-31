package com.plhery.scootradar.ui

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.chrome.ZoneLegend
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.zurichRegion
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

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
}
