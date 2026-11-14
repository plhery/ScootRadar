package com.plhery.scootradar.ui

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
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.dock.LocalCoverageCounts
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
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
 * The dock's buttons where their labels are longest, in each of the app's languages. On a phone of 320 dp with the text
 * at its largest, a button alone on its row wraps its label to a second line rather than cutting it short: the card's
 * "Open in Lime" and Directions or "Open in Maps" stacked, and Try again on the card of positions out of date, where
 * "Ouvrir dans Li…", "Opna Lime-ap…" and "Erneut versu…" were cut on their one line (ctl-0130-sra); and Try again
 * under a failed refresh's status, "Opnieuw prob…". At the standard size, the card's two buttons side by side keep
 * a line each.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DockButtonsWrapTest {
    @get:Rule
    val compose = createComposeRule()

    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
    }

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    @Config(qualifiers = "w320dp-h569dp-xhdpi")
    fun atTheLargestTextOnASmallPhoneALabelAloneOnItsRowWrapsWhole() {
        val problems = mutableListOf<String>()
        val wrapped = sortedSetOf<String>()
        every(fontScale = 2f, scenes) { at ->
            for ((words, layout) in texts()) {
                if (layout.multiParagraph.didExceedMaxLines || (0 until layout.lineCount).any { layout.isLineEllipsized(it) }) {
                    problems += "$at: \"$words\" cut short in ${layout.lineCount} lines"
                }
                if (layout.lineCount > 1 && words in labels()) wrapped += words
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
        // The labels that were cut, now on two lines.
        for (label in listOf("Ouvrir dans Lime", "Opna Lime-appið", "Erneut versuchen", "Tentar novamente", "Openen in Kaarten")) {
            assertTrue("$label in $wrapped", label in wrapped)
        }
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp-xhdpi")
    fun atTheStandardSizeTheCardsButtonsSideBySideKeepALineEach() {
        val problems = mutableListOf<String>()
        var sideBySide = 0
        every(fontScale = 1f, listOf(MatrixScene.ScooterCard)) { at ->
            val openIn = stringFormat(localized("Open in %@"), ScooterProvider.Lime.displayName)
            val buttons = texts().filter { (words, _) -> words == openIn || words == localized("Directions") }
            assertEquals(at, 2, buttons.size)
            if (buttons.map { it.second.size.height }.distinct().size == 1) sideBySide++
            for ((words, layout) in buttons) if (layout.lineCount != 1) problems += "$at: \"$words\" in ${layout.lineCount} lines"
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
        assertEquals("side by side in every language", ScooterLanguage.entries.size, sideBySide)
    }

    private val scenes = listOf(
        MatrixScene.ScooterCard,
        MatrixScene.OutOfDate,
        MatrixScene.RefreshFailed,
        MatrixScene.WalkNoRoute,
        MatrixScene.WalkNoLocation,
    )

    /** The labels of the dock's buttons, in the language shown. */
    private fun labels(): Set<String> = setOf(
        stringFormat(localized("Open in %@"), ScooterProvider.Lime.displayName),
        localized("Open in Maps"),
        localized("Directions"),
        localized("Try again"),
    )

    /** Each scene in each language at the font scale, from a new screen: [check] on it. */
    private fun every(fontScale: Float, scenes: List<MatrixScene>, check: (String) -> Unit) {
        useFontScale(fontScale)
        var shown by mutableStateOf<Pair<ScooterMapController, TestClock>?>(null)
        compose.setContent {
            val (model, clock) = shown ?: return@setContent
            key(model) {
                CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                    ScooterMapScreen(
                        controller = model,
                        map = { Box(Modifier.fillMaxSize().background(Color(0xFFF1EFEA))) },
                        glassBlurs = false,
                    )
                }
            }
        }
        for (language in ScooterLanguage.entries) {
            ScooterLanguage.current = language
            for (scene in scenes) {
                val controllers = TestControllers()
                try {
                    val clock = TestClock()
                    val model = scene.make(controllers, clock)
                    compose.runOnIdle { shown = model to clock }
                    compose.waitForIdle()
                    check("${language.rawValue} ${scene.name} at $fontScale")
                } finally {
                    compose.runOnIdle { shown = null }
                    compose.waitForIdle()
                    controllers.close()
                }
            }
        }
    }

    /** The texts laid out on the screen, but the search bar's, which shrinks its own: each with its layout. */
    private fun texts(): List<Pair<String, TextLayoutResult>> =
        compose.onAllNodes(SemanticsMatcher("anything") { true }, useUnmergedTree = true).fetchSemanticsNodes()
            .filterNot { node -> node.ancestry().any { it.config.getOrNull(SemanticsProperties.TestTag) == SEARCH_ISLAND_TAG } }
            .mapNotNull { node ->
                val words = node.config.getOrNull(SemanticsProperties.Text)?.joinToString(" ") { it.text } ?: return@mapNotNull null
                val results = mutableListOf<TextLayoutResult>()
                node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
                results.firstOrNull()?.let { words to it }
            }

    private fun SemanticsNode.ancestry(): Sequence<SemanticsNode> = generateSequence(this) { it.parent }
}
