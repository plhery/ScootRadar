package com.plhery.scootradar.ui

import android.view.View
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterChromeLayout.Dock
import com.plhery.scootradar.core.model.ScooterChromeLayout.Panel
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// UI-110, UI-114: rememberChromeLayout as the screen calls it, holding the last layout and measuring inside the safe
// area. ChromeLayoutTest has the thresholds themselves.

/**
 * The layout the screen gets as it is resized in a tablet's window across, which is regular both ways throughout:
 * the layout it has holds from one size to the next, and a bar down the side takes its share of the width.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w1280dp-h800dp-mdpi")
class ChromeLayoutCompositionTest {
    @get:Rule
    val compose = createComposeRule()

    private var width by mutableStateOf(1280.dp)
    private var layout: ScooterChromeLayout? = null
    private lateinit var view: View

    private fun show() {
        compose.setContent {
            view = LocalView.current
            layout = rememberChromeLayout(width)
        }
    }

    private fun at(width: Dp): ScooterChromeLayout? {
        this.width = width
        compose.waitForIdle()
        return layout
    }

    @Test
    fun aWindowResizedAcrossTheLineKeepsItsLayoutUntilTheMapIsTooNarrow() {
        show()
        // The panel opens with 20 dp to spare, and stays down to 760.
        assertEquals(Panel, at(1280.dp))
        assertEquals(Panel, at(770.dp))
        assertEquals(Dock, at(750.dp))
        // The dock stays in turn until there is room for the panel and the 20 dp.
        assertEquals(Dock, at(770.dp))
        assertEquals(Panel, at(780.dp))
    }

    @Test
    fun aNavigationBarDownTheSideTakesItsShareOfTheWidth() {
        width = 800.dp
        show()
        compose.waitForIdle()
        assertEquals(Panel, layout)
        // A tablet's three-button navigation down the left, as it is in a window turned sideways: 752 dp is left.
        compose.runOnIdle {
            val bar = WindowInsetsCompat.Builder()
                .setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.of(48, 0, 0, 0))
                .build()
            ViewCompat.dispatchApplyWindowInsets(view, bar)
        }
        compose.waitForIdle()
        assertEquals(Dock, layout)
    }
}
