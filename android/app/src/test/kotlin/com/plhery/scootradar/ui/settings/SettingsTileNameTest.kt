package com.plhery.scootradar.ui.settings

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
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

        val cut = mutableListOf<String>()
        val names = listOf("Automatic", "System", "Light", "Dark", "Quiet", "Standard")
        var tiles = 0
        for (name in names) {
            val nodes = compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.Text, listOf(AnnotatedString(name))), useUnmergedTree = true)
                .fetchSemanticsNodes()
            for (node in nodes) {
                val results = mutableListOf<TextLayoutResult>()
                node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
                val layout = results.single()
                tiles++
                // Wider than the room it is given, and not ended with "…": the tile's edge cuts it.
                val wide = (0 until layout.lineCount).any { layout.getLineRight(it) - layout.getLineLeft(it) > layout.size.width + 1 }
                if (wide) cut += "$name (${layout.multiParagraph.width} of ${layout.size.width})"
            }
        }
        assertTrue("the six tiles' names laid out, $tiles found", tiles >= names.size)
        assertEquals("the tiles' names cut by the tile's edge", emptyList<String>(), cut)
    }
}
