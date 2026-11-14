package com.plhery.scootradar.ui.dock

import android.icu.text.BreakIterator
import android.provider.Settings
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.AndroidFormats
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.theme.ScootTheme
import java.time.Instant
import java.time.ZoneId
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * A time stays on one line wherever a sentence wraps: Android 12's ICU writes "10:13 AM" with a plain space, and the
 * dock's offline line broke before "AM" at 360 dp, "You’re offline · showing 10:13" over "AM" (the lane's device
 * notes of 14 November 2026). Portugal's "10:13 da manhã" and Canadian French's "10 h 13" have plain spaces inside.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DockStatusTimeTest {
    @get:Rule
    val compose = createComposeRule()

    private val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    private val formats = AndroidFormats(context)
    private val skeleton = ScooterDateFormat.skeleton
    private val launchLocale = ScooterLanguage.launchLocale

    @After
    fun tearDown() {
        Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, null)
        ScooterDateFormat.skeleton = skeleton
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        ScooterLanguage.launchLocale = launchLocale
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    @Config(sdk = [31])
    fun aTimeHasNoLineBreakInsideItInAnyLanguageOnAndroid12() = assertTimesWhole()

    @Test
    fun aTimeHasNoLineBreakInsideItInAnyLanguage() = assertTimesWhole()

    /**
     * Every language of the app, with its own countries' clocks and the 12-hour ones of the US, Canada, India and
     * Australia, by the locale's clock and the phone's 12- and 24-hour settings: the time alone, with its weekday and
     * with its zone. No line breaks between its hour and its minutes or day period, by ICU's own line breaking.
     */
    private fun assertTimesWhole() {
        val countries = mapOf(
            "en" to listOf("GB", "CH"),
            "de" to listOf("CH", "DE"),
            "fr" to listOf("CH", "FR", "CA"),
            "it" to listOf("IT", "CH"),
            "nl" to listOf("NL", "BE"),
            "nb" to listOf("NO"),
            "pt" to listOf("PT", "BR"),
            "es" to listOf("ES", "MX"),
            "is" to listOf("IS"),
        )
        val zurich = ZoneId.of("Europe/Zurich")
        val morning = Instant.parse("2026-11-14T09:13:00Z")
        val evening = Instant.parse("2026-11-14T21:47:00Z")
        val broken = mutableListOf<String>()
        var twelveHour = 0
        for ((language, own) in countries) {
            for (country in own + listOf("US", "CA", "IN", "AU")) {
                val locale = Locale(language, country)
                for (clock in listOf(null, "12", "24")) {
                    Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, clock)
                    for (instant in listOf(morning, evening)) {
                        val time = formats.skeleton("jm", instant, zurich, locale)
                        if (!time.any(Char::isDigit) || time.count(Char::isLetter) > 0) twelveHour++
                        for (skeleton in listOf("jm", "Ejm", "jmz")) {
                            val text = formats.skeleton(skeleton, instant, ZoneId.of("America/New_York").takeIf { skeleton == "jmz" } ?: zurich, locale)
                            val shown = if (skeleton == "jmz") formats.skeleton("jm", instant, ZoneId.of("America/New_York"), locale) else time
                            val at = text.indexOf(shown)
                            if (at < 0) {
                                broken += "$locale $clock $skeleton: '$shown' not in '$text'"
                                continue
                            }
                            val lines = BreakIterator.getLineInstance(locale).apply { setText(text) }
                            val inside = generateSequence(lines.first()) { lines.next().takeIf { it != BreakIterator.DONE } }
                                .filter { it > at && it < at + shown.length }
                                .toList()
                            if (inside.isNotEmpty()) broken += "$locale $clock $skeleton: '${text.replace('\u00A0', '_')}' breaks at $inside"
                        }
                    }
                }
            }
        }
        assertTrue("only ${twelveHour} times with a day period", twelveHour > 100)
        assertTrue("${broken.size} times break:\n${broken.joinToString("\n")}", broken.isEmpty())
    }

    /** The offline line itself, laid out at every width from 120 to 420 dp: its time is never split. */
    @Test
    @Config(sdk = [31])
    fun theOfflineLinesTimeIsNeverSplitOnAndroid12() {
        ScooterDateFormat.skeleton = formats::skeleton
        ScooterDateFormat.timeZone = { ZoneId.of("America/New_York") }
        ScooterLanguage.launchLocale = { Locale.US }
        ScooterLanguage.current = ScooterLanguage.En
        val status = ScooterDockStatus.Offline(showing = Instant.parse("2026-11-14T15:13:00Z"))
        val time = ScooterDockStatus.clockTime(status.showing)
        assertTrue(time, time.startsWith("10:13") && time.endsWith("AM"))
        var width by mutableIntStateOf(120)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.width(width.dp)) { DockStatusLabel(status) }
            }
        }
        val split = mutableListOf<String>()
        var wrapped = 0
        for (next in 120..420) {
            compose.runOnIdle { width = next }
            compose.waitForIdle()
            val layout = laidOut(status.text)
            if (layout.lineCount > 1) wrapped++
            val at = status.text.indexOf(time)
            val ends = (0 until layout.lineCount - 1).map { layout.getLineEnd(it) }
            if (ends.any { it > at && it < at + time.length }) split += "$next dp: lines end at $ends of '${status.text}'"
        }
        assertTrue("the line wrapped at only $wrapped widths", wrapped > 20)
        assertTrue(split.joinToString("\n"), split.isEmpty())
    }

    private fun laidOut(text: String): TextLayoutResult {
        val node = compose.onAllNodes(
            SemanticsMatcher("text $text") { node -> node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == text } == true },
            useUnmergedTree = true,
        ).fetchSemanticsNodes().first()
        val results = mutableListOf<TextLayoutResult>()
        node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
        return results.first()
    }
}
