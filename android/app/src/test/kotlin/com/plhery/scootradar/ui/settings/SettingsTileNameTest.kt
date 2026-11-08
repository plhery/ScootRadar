package com.plhery.scootradar.ui.settings

import androidx.activity.ComponentActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.isSelectable
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
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterAppearance
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
     * `.minimumScaleFactor(0.75)`: a name that doesn't fit its tile at its size is drawn smaller first, at the largest
     * size that fits, down to three quarters of it, and only cut short with "…" at three quarters. The size drawn is
     * read from the span of the name's first four letters (fewer if "…" comes sooner), against theirs laid out at its
     * size, at the largest that fits and at three quarters of it: the layout TalkBack is handed keeps the style asked
     * for, not the size drawn.
     * The app shrinks a quarter of a dp at a time, so the largest that fits is drawn up to a quarter of a dp under; a
     * shrink straight to three quarters is drawn under it (review-app-ah 3).
     * At font scale 1.45: since the names reach 3 in from the tiles' edges (app-bf), System fits its tile at 1.3.
     */
    @Test
    fun aTilesNameThatDoesNotFitShrinksBeforeItIsCutShort() {
        val tiles = tilesNames(fontScale = 1.45f)
        val wrong = mutableListOf<String>()
        val seen = mutableListOf<String>()
        var tooWide = 0
        var shrunk = 0
        for ((name, layout) in tiles) {
            val input = layout.layoutInput
            val measurer = TextMeasurer(input.fontFamilyResolver, input.density, input.layoutDirection, cacheSize = 0)
            fun laidOut(style: TextStyle) = measurer.measure(input.text, style, softWrap = false, maxLines = 1)
            val own = laidOut(input.style)
            val threeQuarters = laidOut(input.style.copy(fontSize = with(input.density) { (input.style.fontSize.toDp() * 0.75f).toSp() }))
            // Of the letters left before a "…": Automatic beside the check keeps three.
            val letters = minOf(4, name.length, layout.getLineEnd(0, visibleEnd = true))
            fun TextLayoutResult.span(): Float = getBoundingBox(letters - 1).right - getBoundingBox(0).left
            val drawn = layout.span()
            val fits = own.size.width <= layout.size.width
            val cutShort = layout.isLineEllipsized(0)
            // The largest size in pixels that fits the tile's room, to a hundredth of a pixel, down to three quarters.
            val room = input.constraints.maxWidth
            fun at(px: Float) = laidOut(input.style.copy(fontSize = with(input.density) { px.toSp() }))
            val ownPx = with(input.density) { input.style.fontSize.toPx() }
            var largest = ownPx * 0.75f
            var over = ownPx
            while (over - largest > 0.01f) {
                val middle = (largest + over) / 2
                if (at(middle).size.width <= room) largest = middle else over = middle
            }
            val step = with(input.density) { 0.25.dp.toPx() }
            val fitting = at(largest).span()
            seen += "$name %.1f px, %.1f at its size, %.1f at the largest that fits, %.1f at three quarters, %d of %d wide%s"
                .format(drawn, own.span(), fitting, threeQuarters.span(), own.size.width, room, if (cutShort) ", cut short" else "")
            if (!fits) tooWide++
            if (!fits && !cutShort) shrunk++
            when {
                fits && abs(drawn - own.span()) > 1 -> wrong += "$name, which fits, not drawn at its size"
                !fits && drawn > own.span() - 1 -> wrong += "$name, wider than its tile, drawn at its size"
                drawn < threeQuarters.span() - 1 -> wrong += "$name drawn under three quarters of its size"
                cutShort && abs(drawn - threeQuarters.span()) > 1 -> wrong += "$name cut short above three quarters of its size"
                !fits && !cutShort && (drawn > fitting + 1 || drawn < at(largest - step).span() - 1) ->
                    wrong += "$name not drawn at the largest size that fits"
            }
        }
        assertTrue("the six tiles' names laid out, ${tiles.size} found", tiles.size >= NAMES.size)
        assertEquals("the tiles' names drawn as `.minimumScaleFactor(0.75)` draws them: $seen", emptyList<String>(), wrong)
        // Automatic at 1.45 doesn't fit a tile on a phone 360 wide at its size, and System fits it smaller.
        assertTrue("a name wider than its tile: $seen", tooWide > 0)
        assertTrue("a name shrunk to fit, not cut short: $seen", shrunk > 0)
    }

    /**
     * The chosen tile says so by more than its colour: a check before its name, the two centred together, so that
     * its name stands right of the tile's middle by half the check and its gap, 3 (357f0c2c,
     * ScooterSettingsTiles.swift:42-54). The others' names are centred.
     */
    @Test
    @Config(qualifiers = "w360dp-h1000dp-xhdpi") // Tall enough for the medium detent to show the map's tiles.
    fun theChosenTileShowsACheckBeforeItsName() {
        showSettings()
        val tiles = compose.onAllNodes(isSelectable(), useUnmergedTree = true).fetchSemanticsNodes()
        val (chosen, others) = tiles.partition { it.config[SemanticsProperties.Selected] }
        assertEquals("an appearance and a map chosen", 2, chosen.size)
        assertTrue("${others.size} tiles not chosen", others.size >= 3)
        val density = compose.density.density
        // `checkmark.circle.fill` in the footnote, 13 points, at `.imageScale(.small)`: 13 × 1.2 × 0.8.
        val check = 13 * 1.2f * 0.8f
        fun offset(tile: SemanticsNode): Pair<String, Float> {
            val name = tile.children.single { SemanticsProperties.Text in it.config }
            assertTrue("${name.config[SemanticsProperties.Text]} on the screen", name.boundsInRoot.width > 0)
            return name.config[SemanticsProperties.Text].joinToString() to (name.boundsInRoot.center.x - tile.boundsInRoot.center.x) / density
        }
        for ((name, offset) in chosen.map(::offset)) assertEquals(name, (check + 3) / 2, offset, 0.5f)
        for ((name, offset) in others.map(::offset)) assertEquals(name, 0f, offset, 0.5f)
    }

    /**
     * The chosen tile's name reads whole beside its check on a phone 360 wide (ScootRadar_Phone_Min), the sheet floating
     * 8 in at its first height, at font scale 1.0: Automatic, the choice the app starts with, was cut to "Autom…" there
     * (app-be's release smoke), its row 5 dp too narrow at three quarters of its size. Every name is whole in every
     * language: Automatisch, Automatique, Automático, Automatico and Automatisk needed 4 to 11 dp more at three
     * quarters of their size, so German, Dutch, French, Spanish, Italian, Portuguese and Norwegian say Auto (app-bg).
     */
    @Test
    fun theChosenTilesNameReadsWholeOnAPhone360Wide() {
        var shown by mutableIntStateOf(0)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                IosSheet(true, onDismiss = {}, listOf(SheetDetent.Medium, SheetDetent.Large), "Settings") {
                    // Laid out again in the language set.
                    key(shown) { SettingsSheet() }
                }
            }
        }
        compose.waitForIdle()
        val styles = AppleMapStyle.entries - AppleMapStyle.Satellite
        val cut = mutableListOf<String>()
        var widths = emptySet<Float>()
        for (language in ScooterLanguage.entries) {
            for ((index, appearance) in ScooterAppearance.entries.withIndex()) {
                ScooterLanguage.current = language
                compose.runOnIdle {
                    model.setAppearance(appearance)
                    model.setMapStyle(styles[index % styles.size])
                    shown += 1
                }
                compose.waitForIdle()
                val chosen = compose.onAllNodes(isSelectable(), useUnmergedTree = true).fetchSemanticsNodes()
                    .filter { it.config[SemanticsProperties.Selected] }
                assertEquals("an appearance and a map chosen", 2, chosen.size)
                widths = widths + chosen.first().boundsInRoot.width / compose.density.density
                for (tile in chosen) {
                    val name = tile.children.single { SemanticsProperties.Text in it.config }
                    val results = mutableListOf<TextLayoutResult>()
                    name.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
                    if (results.single().isLineEllipsized(0)) cut += "${language.rawValue} ${name.config[SemanticsProperties.Text].joinToString()}"
                }
            }
        }
        // Four tiles across a sheet 344 wide, its sections 16 in, 10 apart.
        assertEquals(setOf(70.5f), widths)
        assertEquals("the chosen tiles' names cut short", emptyList<String>(), cut)
    }

    /** The tiles' names laid out under Automatic at a font scale, 1.3 unless given, each with its layout. */
    private fun tilesNames(fontScale: Float = 1.3f): List<Pair<String, TextLayoutResult>> {
        useFontScale(fontScale)
        showSettings()
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

    private fun showSettings() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                // As the phone's dock opens it, at the medium detent.
                IosSheet(true, onDismiss = {}, listOf(SheetDetent.Medium, SheetDetent.Large), "Settings") { SettingsSheet() }
            }
        }
        compose.waitForIdle()
    }

    @Composable
    private fun SettingsSheet() {
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

    private companion object {
        val NAMES = listOf("Automatic", "System", "Light", "Dark", "Quiet", "Standard")
    }
}
