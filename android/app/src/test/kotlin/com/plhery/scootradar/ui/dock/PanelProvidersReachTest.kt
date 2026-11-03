package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

/**
 * The panel's list of providers in a 7-inch tablet's window, Zürich's seven under the nearest scooter and the data's
 * age, "Updated 2 min ago": each row can be reached, the card scrolling where they don't all fit. In English, and in
 * Dutch, whose headline takes two lines ("tot de dichtstbijzijnde / deelstep").
 *
 * The windows are a tablet's under its status bar (24 dp) and its navigation's handle (32 dp), which Robolectric
 * doesn't draw: 1088×612 dp on ScootRadar_Tablet at 2176×1224, and 960×600, a 7-inch tablet's own. In both the list
 * is taller than the card's room. It scrolled there, but its cut fell in the top of PubliBike's row, under Voi, where
 * nothing of the row shows: the card's foot now fades while more is below (FitOrScrollTest). Upright, 600×960, the
 * window has the phone's dock and its providers' chips, not the panel.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PanelProvidersReachTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        Locale.setDefault(locale)
    }

    @Test
    @Config(qualifiers = "w1088dp-h556dp-xhdpi")
    fun inATabletsLandscapeWindowEveryProviderCanBeScrolledToInEnglish() = everyRowReached("en-US", scrolls = true)

    @Test
    @Config(qualifiers = "w1088dp-h556dp-xhdpi")
    fun inATabletsLandscapeWindowEveryProviderCanBeScrolledToInDutch() = everyRowReached("nl-NL", scrolls = true)

    @Test
    @Config(qualifiers = "w960dp-h544dp-xhdpi")
    fun inASevenInchTabletsLandscapeWindowEveryProviderCanBeScrolledTo() = everyRowReached("nl-NL", scrolls = true)

    /** On the 10-inch, 1280×800 dp, all of them fit: no scroll and no fade. */
    @Test
    @Config(qualifiers = "w1280dp-h744dp-xhdpi")
    fun inATenInchTabletsWindowEveryProviderFits() = everyRowReached("nl-NL", scrolls = false)

    /**
     * Each provider's row scrolled to, whole inside the card's content; the card scrolling or not as [scrolls] says,
     * and, where it scrolls, the last row not whole in it before it is scrolled to: the reason it must scroll.
     */
    private fun everyRowReached(tag: String, scrolls: Boolean) {
        val region = Locale.forLanguageTag(tag)
        Locale.setDefault(region)
        ScooterLanguage.launchLocale = { region }
        ScooterLanguage.current = ScooterLanguage.entries.first { it.rawValue == region.language }
        show()
        val scroll = compose.onAllNodes(inDock and SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange))
            .fetchSemanticsNodes()
        if (!scrolls) {
            assertTrue("$tag: the card scrolls where all should fit", scroll.isEmpty())
        } else {
            assertTrue("$tag: the card doesn't scroll", scroll.size == 1)
        }
        val content = scroll.singleOrNull()?.boundsInRoot ?: compose.onNode(hasTestTag(DOCK_TAG)).fetchSemanticsNode().boundsInRoot
        if (scrolls) {
            val last = row(providers.last().second).fetchSemanticsNode()
            assertTrue(
                "$tag: ${providers.last().second}'s row whole in the card's content unscrolled, ${last.boundsInRoot} in $content",
                last.boundsInRoot.height < last.size.height - 0.5f,
            )
        }
        val problems = mutableListOf<String>()
        for ((_, name) in providers) {
            val row = row(name)
            if (scrolls) row.performScrollTo()
            compose.waitForIdle()
            // Its bounds are what the card's content leaves of it: whole where they are as tall as the row.
            val node = row.fetchSemanticsNode()
            val bounds = node.boundsInRoot
            if (!content.holds(bounds) || bounds.height < node.size.height - 0.5f) {
                problems += "$tag: $name's row ${node.size.height} high, ${bounds.height} of it in the card's content $content"
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    private fun Rect.holds(other: Rect) =
        other.top >= top - 0.5f && other.bottom <= bottom + 0.5f && other.left >= left - 0.5f && other.right <= right + 0.5f

    private val inDock = hasAnyAncestor(hasTestTag(DOCK_TAG))

    /** The row in the dock TalkBack reads as the provider's: "Voi, 2 scooters". */
    private fun row(name: String) = compose.onNode(
        inDock and SemanticsMatcher("the row of $name") { node ->
            node.config.getOrNull(SemanticsProperties.ContentDescription).orEmpty().any { it.startsWith("$name, ") }
        },
    )

    /**
     * The panel over Zürich at a street's zoom, its seven providers fewer each, so PubliBike's row is the last, the
     * rider beside a Bird, and the data two minutes old.
     */
    private fun show() {
        val clock = TestClock()
        val scooters = providers.flatMapIndexed { index, (provider, _) ->
            List(providers.size - index) { n ->
                scooter(id = "$index-$n", provider = provider, latitude = 47.3760 + n * 0.0003, longitude = 8.5390 + index * 0.0004)
            }
        }
        val api = StubScooterAPI(ScooterResponse(vehicles = scooters))
        val model = controllers.make(api, clock, defaults = InMemoryScooterDefaults())
        model.setUserLocation(GeoPoint(47.3761, 8.5391))
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        clock.advance(150.0)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(
                    controller = model,
                    map = { Box(Modifier.fillMaxSize().background(Color(0xFFF1EFEA))) },
                    glassBlurs = false,
                )
            }
        }
        compose.waitForIdle()
    }

    private companion object {
        /** Zürich's providers, each with its name as the dock's rows have it, in the order of their counts. */
        val providers = listOf(
            "bird" to "Bird", "lime" to "Lime", "hopp" to "Hopp", "bolt" to "Bolt", "dott" to "Dott", "voi" to "Voi",
            "publibike" to "PubliBike / Velospot",
        )
    }
}
