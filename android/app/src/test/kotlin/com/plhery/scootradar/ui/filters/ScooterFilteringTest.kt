package com.plhery.scootradar.ui.filters

import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.shrunk
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

// The filter sheet's test in ios/ScootRadarTests/ScooterFilteringTests.swift (T078); the rest of that file is
// :core's ScooterFilteringTest and the map's.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
// The narrowest phone, tall enough that Filters opens at its medium height, where the sheet floats 8 dp in.
@Config(qualifiers = "w360dp-h780dp-xhdpi")
class ScooterFilteringTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    /**
     * "Indifférent" is the longest word for "Any". Side by side until the text is very large, the presets must hold
     * it on one line, shrunk at most as far as they may be, on the narrowest phone, at the largest text size that
     * keeps them side by side: 1.3, the last of Android's sizes under the accessibility ones (UI-134). The segment
     * is the one laid out in the sheet at its medium height, not a full width's.
     */
    @Test
    fun theLongestBatteryPresetFitsItsSegmentAtTheLargestStandardTextSize() {
        val labels = listOf(
            ScooterLanguage.En, ScooterLanguage.De, ScooterLanguage.Fr, ScooterLanguage.It, ScooterLanguage.Nl,
            ScooterLanguage.Nb, ScooterLanguage.Pt, ScooterLanguage.Es, ScooterLanguage.Is,
        ).associateWith { language ->
            ScooterLanguage.current = language
            batteryPresetLabel(0)
        }
        ScooterLanguage.current = ScooterLanguage.Fr
        useFontScale(1.3f)

        lateinit var measurer: TextMeasurer
        lateinit var density: Density
        compose.setContent {
            measurer = rememberTextMeasurer()
            density = LocalDensity.current
            ScootTheme(dark = false) {
                IosSheet(isPresented = true, onDismiss = {}, detents = listOf(SheetDetent.Medium, SheetDetent.Large), title = "Filters") {
                    FilterSheetContent(
                        minimumBattery = 0,
                        entries = emptyList(),
                        hasActiveFilters = false,
                        showResults = "Show 36 scooters",
                        bottomInset = 0.dp,
                        onChooseMinimum = {},
                        onToggle = {},
                        onReset = {},
                        onDone = {},
                    )
                }
            }
        }
        compose.waitForIdle()

        assertTrue(density.fontScale == 1.3f)
        // 360 dp less the sheet's 8 dp each side, 20 dp margins, 4 dp inside the control and three 4 dp gaps.
        val segment = compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.RadioButton)).onFirst()
            .fetchSemanticsNode().size.width
        assertEquals((360 - 16 - 40 - 8 - 12) / 4f, segment / density.density, 0.5f)
        val style = batteryPresetStyle(selected = true).let { it.copy(fontSize = shrunk(it.fontSize, PRESET_MINIMUM_SCALE, density)) }
        for ((language, any) in labels) {
            val width = measurer.measure(any, style, maxLines = 1, softWrap = false, density = density).size.width
            assertTrue(
                "${language.rawValue}: $any is ${width / density.density} dp wide, over ${segment / density.density}",
                width <= segment,
            )
        }
    }
}
