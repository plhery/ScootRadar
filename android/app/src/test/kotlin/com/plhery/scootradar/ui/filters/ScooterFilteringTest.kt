package com.plhery.scootradar.ui.filters

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.hasActiveFilters
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterUnits
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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

    private val controllers = TestControllers()

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterUnits.current = ScooterUnits.Automatic
    }

    /**
     * Issue #12: the slider sets the controller's minimum range in metres, the filters' only minimum, and Reset puts
     * it back to Any. In miles, chosen in Settings, a step is a mile.
     */
    @Test
    fun theSliderSetsTheRangeAndResetPutsItBackToAny() {
        ScooterLanguage.current = ScooterLanguage.En
        val defaults = InMemoryScooterDefaults()
        defaults.set("metric", forKey = "units")
        val model = controllers.make(EmptyScooterAPI, defaults = defaults)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                ScooterFilterSheet(model, bottomInset = 0.dp, onDone = {})
            }
        }
        compose.waitForIdle()
        val slider = compose.onNodeWithContentDescription("Range")

        slider.performSemanticsAction(SemanticsActions.SetProgress) { it(5f) }
        compose.waitForIdle()
        assertEquals(5_000, model.minimumRange.value)
        assertTrue(model.hasActiveFilters)

        model.setUnits(ScooterUnits.Imperial)
        compose.waitForIdle()
        slider.performSemanticsAction(SemanticsActions.SetProgress) { it(3f) }
        compose.waitForIdle()
        assertEquals(4_828, model.minimumRange.value)

        compose.onNode(hasText("Reset")).performClick()
        compose.waitForIdle()
        assertEquals(0, model.minimumRange.value)
        assertFalse(model.hasActiveFilters)
    }
}
