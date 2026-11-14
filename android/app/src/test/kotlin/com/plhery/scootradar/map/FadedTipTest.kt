package com.plhery.scootradar.map

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.text.TextLayoutResult
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import java.time.Instant
import java.time.ZoneId
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * A faded scooter's tip, "Lime · last seen Fri 14:02" over "May have moved · new positions on the way", shows both
 * whole at large text on a small phone, in every language, inside the map: its title was one line and its subtitle
 * two, cut with an ellipsis, so that at 2.0 on a 320 dp phone 15 of the 18 titles lost their time (fresh-eyes review
 * of 14 November 2026, S7). The iPhone's ScooterLastSeenTipView wraps both.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class FadedTipTest {
    @get:Rule
    val compose = createComposeRule()
    private val locale = java.util.Locale.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @After
    fun tearDown() {
        resetFontScale()
        java.util.Locale.setDefault(locale)
        ScooterLanguage.launchLocale = launchLocale
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
    }

    @Test
    @Config(qualifiers = "w320dp-h569dp-xhdpi")
    fun wholeAt2On320() = assertWhole(scale = 2f, width = 320)

    @Test
    @Config(qualifiers = "w360dp-h640dp-xhdpi")
    fun wholeAt15On360() = assertWhole(scale = 1.5f, width = 360)

    @Test
    @Config(qualifiers = "w412dp-h915dp-xxhdpi")
    fun wholeAt2On412() = assertWhole(scale = 2f, width = 412)

    private fun assertWhole(scale: Float, width: Int) {
        useFontScale(scale)
        java.util.Locale.setDefault(java.util.Locale.forLanguageTag("de-CH"))
        ScooterLanguage.launchLocale = { java.util.Locale.forLanguageTag("de-CH") }
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        val now = Instant.parse("2026-11-14T13:00:00Z")
        val seen = listOf("today" to Instant.parse("2026-11-14T12:32:00Z"), "yesterday" to Instant.parse("2026-11-13T13:02:00Z"))
        var title by mutableStateOf<String?>(null)
        var subtitle by mutableStateOf<String?>(null)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.fillMaxSize()) {
                    title?.let { PinCallout(it, anchor = { ScreenPoint(width / 2.0, 400.0) }, dark = false, subtitle = subtitle) }
                }
            }
        }
        val cut = mutableListOf<String>()
        for (language in ScooterLanguage.entries) {
            ScooterLanguage.current = language
            for ((day, at) in seen) {
                val words = stringFormat(localized("%1\$@ · last seen %2\$@"), "Lime", ScooterDockStatus.seenTime(at, now))
                val under = localized("May have moved · new positions on the way")
                compose.runOnIdle {
                    title = words
                    subtitle = under
                }
                compose.waitForIdle()
                val bubble = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
                for (text in listOf(words, under)) {
                    if (!shownWhole(text)) cut += "${language.rawValue} $day '$text'"
                }
                if (bubble.left.value < 7.5f || bubble.right.value > width - 7.5f) {
                    cut += "${language.rawValue} $day outside the map: ${bubble.left}..${bubble.right}"
                }
                compose.runOnIdle { title = null }
                compose.waitForIdle()
            }
        }
        assertTrue("cut at $scale on $width dp: ${cut.size}\n${cut.joinToString("\n")}", cut.isEmpty())
    }

    /** Whether [text] is laid out to its end, on no line cut with an ellipsis. */
    private fun shownWhole(text: String): Boolean {
        val node = compose.onAllNodes(
            SemanticsMatcher("text $text") { node -> node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == text } == true },
            useUnmergedTree = true,
        ).fetchSemanticsNodes().first()
        val results = mutableListOf<TextLayoutResult>()
        node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
        val layout = results.first()
        val last = layout.lineCount - 1
        return (0..last).none { layout.isLineEllipsized(it) } &&
            layout.getLineEnd(last, visibleEnd = true) >= text.trimEnd().length &&
            !layout.didOverflowHeight
    }
}
