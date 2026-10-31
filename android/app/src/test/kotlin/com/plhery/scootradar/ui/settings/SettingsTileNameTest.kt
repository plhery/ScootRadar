package com.plhery.scootradar.ui.settings

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import kotlin.math.abs
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

// The tiles' names in ios/ScootRadar/Views/ScooterSettingsTiles.swift: `.lineLimit(1).minimumScaleFactor(0.75)`.

/**
 * A tile's name that doesn't fit its tile at three quarters of its size is cut short with "…", as iOS's one line
 * is, and not by the tile's edge: Automatic at font scale 1.3 on a phone 360 wide (ScootRadar_Phone_Min, X-M15).
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w360dp-h640dp-xhdpi")
class SettingsTileNameTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val model = controllers.make(EmptyScooterAPI, TestClock())

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun aTilesNameThatDoesNotFitIsCutShortNotByTheTilesEdge() {
        val cut = mutableListOf<String>()
        val tiles = tilesNames()
        for ((name, layout) in tiles) {
            // Wider than the room it is given, and not ended with "…": the tile's edge cuts it.
            val wide = (0 until layout.lineCount).any { layout.getLineRight(it) - layout.getLineLeft(it) > layout.size.width + 1 }
            if (wide) cut += "$name (${layout.multiParagraph.width} of ${layout.size.width})"
        }
        assertTrue("the six tiles' names laid out, ${tiles.size} found", tiles.size >= NAMES.size)
        assertEquals("the tiles' names cut by the tile's edge", emptyList<String>(), cut)
    }

    /**
     * `.minimumScaleFactor(0.75)`: a name that doesn't fit its tile at its size is drawn smaller first, down to three
     * quarters of it, and only cut short with "…" at three quarters. The size drawn is read from the span of the
     * name's first four letters, against theirs laid out at its size and at three quarters of it: the layout TalkBack
     * is handed keeps the style asked for, not the size drawn.
     */
    @Test
    fun aTilesNameThatDoesNotFitShrinksBeforeItIsCutShort() {
        val tiles = tilesNames()
        val wrong = mutableListOf<String>()
        val seen = mutableListOf<String>()
        var tooWide = 0
        for ((name, layout) in tiles) {
            val input = layout.layoutInput
            val measurer = TextMeasurer(input.fontFamilyResolver, input.density, input.layoutDirection, cacheSize = 0)
            fun laidOut(style: TextStyle) = measurer.measure(input.text, style, softWrap = false, maxLines = 1)
            val own = laidOut(input.style)
            val threeQuarters = laidOut(input.style.copy(fontSize = with(input.density) { (input.style.fontSize.toDp() * 0.75f).toSp() }))
            fun TextLayoutResult.span(): Float = getBoundingBox(minOf(4, name.length) - 1).right - getBoundingBox(0).left
            val drawn = layout.span()
            val fits = own.size.width <= layout.size.width
            val cutShort = layout.isLineEllipsized(0)
            seen += "$name %.1f px, %.1f at its size, %.1f at three quarters, %d of %d wide%s"
                .format(drawn, own.span(), threeQuarters.span(), own.size.width, layout.size.width, if (cutShort) ", cut short" else "")
            if (!fits) tooWide++
            when {
                fits && abs(drawn - own.span()) > 1 -> wrong += "$name, which fits, not drawn at its size"
                !fits && drawn > own.span() - 1 -> wrong += "$name, wider than its tile, drawn at its size"
                drawn < threeQuarters.span() - 1 -> wrong += "$name drawn under three quarters of its size"
                cutShort && abs(drawn - threeQuarters.span()) > 1 -> wrong += "$name cut short above three quarters of its size"
            }
        }
        assertTrue("the six tiles' names laid out, ${tiles.size} found", tiles.size >= NAMES.size)
        assertEquals("the tiles' names drawn as `.minimumScaleFactor(0.75)` draws them: $seen", emptyList<String>(), wrong)
        // Automatic at 1.3 doesn't fit a tile on a phone 360 wide at its size.
        assertTrue("a name wider than its tile: $seen", tooWide > 0)
    }

    /** The tiles' names laid out under Automatic at font scale 1.3, each with its layout. */
    private fun tilesNames(): List<Pair<String, TextLayoutResult>> {
        useFontScale(1.3f)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                // As the phone's dock opens it, at the medium detent.
                IosSheet(true, onDismiss = {}, listOf(SheetDetent.Medium, SheetDetent.Large), "Settings") {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = InMemoryScooterDefaults(),
                        onDone = {},
                        passProviders = listOf(ScooterProvider.Bolt),
                        sources = emptyList(),
                        pages = listOf(SettingsPage.Root),
                    )
                }
            }
        }
        compose.waitForIdle()
        return NAMES.flatMap { name ->
            compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.Text, listOf(AnnotatedString(name))), useUnmergedTree = true)
                .fetchSemanticsNodes()
                .map { node ->
                    val results = mutableListOf<TextLayoutResult>()
                    node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
                    name to results.single()
                }
        }
    }

    private companion object {
        val NAMES = listOf("Automatic", "System", "Light", "Dark", "Quiet", "Standard")
    }
}
