package com.plhery.scootradar.ui.dock

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.font.createFontFamilyResolver
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * The battery and the range under a scooter's name on its card, "100% battery, 26.8 km range", in every language the
 * app speaks and the regions that write it differently: on one line at the standard text size, in the dock of
 * ScootRadar_Phone_Min's 360 dp and in the panel of a 7-inch and a 10-inch tablet, ending before the close button and
 * shrunk to no less than 0.85 of its size; and with larger text, at font scale 1.3 and 2.0, wrapped whole rather than
 * cut. "73 % de batería, 26.8 km de autonomía" wrapped in a tablet's panel at the standard size.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class CardFactsLineTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val context: Context get() = ApplicationProvider.getApplicationContext()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun setUp() {
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp-xhdpi")
    fun onePhoneMinsDockTheFactsKeepToOneLine() = everyLanguage(1f) { at, facts -> oneLine(at, facts) }

    @Test
    @Config(qualifiers = "w1088dp-h612dp-xhdpi")
    fun inASevenInchTabletsPanelTheFactsKeepToOneLine() = everyLanguage(1f) { at, facts -> oneLine(at, facts) }

    @Test
    @Config(qualifiers = "w1280dp-h800dp-xhdpi")
    fun inATenInchTabletsPanelTheFactsKeepToOneLine() = everyLanguage(1f) { at, facts -> oneLine(at, facts) }

    @Test
    @Config(qualifiers = "w360dp-h640dp-xhdpi")
    fun withLargerTextOnPhoneMinTheFactsWrapWhole() {
        everyLanguage(1.3f) { at, facts -> whole(at, facts) }
        everyLanguage(2f) { at, facts -> whole(at, facts) }
    }

    @Test
    @Config(qualifiers = "w1088dp-h612dp-xhdpi")
    fun withLargerTextOnASevenInchTabletTheFactsWrapWhole() {
        everyLanguage(1.3f) { at, facts -> whole(at, facts) }
        everyLanguage(2f) { at, facts -> whole(at, facts) }
    }

    /** One line, not shrunk below 0.85 of its size, ending before the close button. */
    private fun oneLine(at: String, facts: Facts): String? {
        val line = facts.layout
        // The size the line is drawn at, against its style's, from its width: autoSize leaves the style as it was.
        val natural = TextMeasurer(createFontFamilyResolver(context), Density(context), LayoutDirection.Ltr)
            .measure(line.layoutInput.text, line.layoutInput.style).multiParagraph.width
        val scale = line.getLineRight(0) / natural
        val right = facts.left + line.getLineRight(0)
        println("$at: ${line.lineCount} line at ${"%.3f".format(Locale.ROOT, scale)}, ending ${facts.closeLeft - right} px before the close button")
        return when {
            line.lineCount != 1 || line.isLineEllipsized(0) -> "$at: ${line.lineCount} lines"
            scale < FACTS_MINIMUM_SCALE - 0.01f -> "$at: drawn at $scale of its size"
            right > facts.closeLeft -> "$at: ends at $right, past the close button at ${facts.closeLeft}"
            else -> null
        }
    }

    /** Every line whole inside the text's own box, none cut short. */
    private fun whole(at: String, facts: Facts): String? {
        val line = facts.layout
        val widest = (0 until line.lineCount).maxOf { line.getLineRight(it) }
        return when {
            line.multiParagraph.didExceedMaxLines || line.isLineEllipsized(line.lineCount - 1) -> "$at: cut short"
            widest > facts.width + 0.5f -> "$at: $widest wide in ${facts.width}"
            line.multiParagraph.height > facts.height + 0.5f -> "$at: ${line.multiParagraph.height} tall in ${facts.height}"
            else -> null
        }
    }

    /** The facts' layout, where their box starts and how big it is, and where the close button starts, in pixels. */
    private class Facts(val layout: TextLayoutResult, val left: Float, val width: Int, val height: Int, val closeLeft: Float)

    /** The card of a priced scooter 60 m away in each language, at the font scale; every problem found, at the end. */
    private fun everyLanguage(fontScale: Float, problem: (String, Facts) -> String?) {
        useFontScale(fontScale)
        var shown by mutableStateOf<Pair<String, ScooterMapController>?>(null)
        val clock = TestClock()
        compose.setContent {
            val (tag, model) = shown ?: return@setContent
            key(tag) {
                CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                    ScooterMapScreen(
                        controller = model,
                        map = { Box(Modifier.fillMaxSize().background(Color(0xFFF1EFEA))) },
                        glassBlurs = false,
                    )
                }
            }
        }
        val problems = mutableListOf<String>()
        for (tag in regions) {
            val region = Locale.forLanguageTag(tag)
            ScooterLanguage.launchLocale = { region }
            ScooterLanguage.current = ScooterLanguage.entries.first { it.rawValue == region.language }
            Locale.setDefault(region)
            val model = card(clock)
            compose.runOnIdle { shown = tag to model }
            compose.waitForIdle()
            val node = compose.onNodeWithTag(CARD_FACTS_TAG, useUnmergedTree = true).fetchSemanticsNode()
            val close = compose.onNodeWithContentDescription(localized("Close scooter details")).fetchSemanticsNode()
            val layouts = mutableListOf<TextLayoutResult>()
            node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
            val line = layouts.single()
            val facts = Facts(line, node.boundsInRoot.left, node.size.width, node.size.height, close.boundsInRoot.left)
            problem("$tag at $fontScale, \"${line.layoutInput.text}\"", facts)?.let { problems += it }
            compose.runOnIdle { shown = null }
            compose.waitForIdle()
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /** Lime's scooter, full and with 26.8 km in it, 60 m from the rider, chosen: walk, distance and price as figures. */
    private fun card(clock: TestClock): ScooterMapController {
        val lime = scooter(
            id = "a", provider = "lime", latitude = 47.3774, longitude = 8.5417, battery = 100, rangeMeters = 26_800,
            pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 40),
        )
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(lime)))
        val model = controllers.make(api, clock)
        model.setUserLocation(GeoPoint(47.3779, 8.5417))
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
        model.selectScooter("lime:a")
        check(model.dock is ScooterDockContent.Scooter) { "${model.dock}" }
        return model
    }

    private companion object {
        /** Each language the app speaks, in the regions that write its numbers or its units differently. */
        val regions = listOf(
            "en-US", "en-GB", "en-CH", "de-CH", "de-DE", "fr-CH", "fr-FR", "it-CH", "it-IT", "nl-NL", "nb-NO", "pt-PT",
            "pt-BR", "es-ES", "es-MX", "is-IS",
        )
    }
}
