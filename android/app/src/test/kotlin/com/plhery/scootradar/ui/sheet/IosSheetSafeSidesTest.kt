package com.plhery.scootradar.ui.sheet

import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// X.md X-AD34: what the dock keeps clear of down a side of the window (SafeSidesTest), the sheets the dock opens,
// Filters and Settings, keep clear of too.

/**
 * A phone on its side in split screen, a window 430 wide and 412 high that the app cannot keep upright, its
 * navigation bar's 48 down a side: the sheet's colour reaches the window's edges, as the iPhone's sheets reach under
 * the safe area, and what it shows, its Done and Reset and the switches at the rows' ends, stays clear of the bar,
 * where taps on them would go to the bar's buttons.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w430dp-h412dp-mdpi")
class IosSheetSafeSidesTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private lateinit var view: View
    private var content = Rect.Zero

    private val sheet = SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Filters")

    @Test
    fun aBarDownTheRightKeepsWhatTheSheetShowsClearOfIt() = withBar(Insets.of(0, 0, 48, 0))

    @Test
    fun aBarDownTheLeftKeepsWhatTheSheetShowsClearOfIt() = withBar(Insets.of(48, 0, 0, 0))

    /** Right to left, the bar is still on the window's side it is on. */
    @Test
    fun rightToLeftABarDownTheLeftKeepsWhatTheSheetShowsClearOfIt() = withBar(Insets.of(48, 0, 0, 0), LayoutDirection.Rtl)

    private fun withBar(bar: Insets, direction: LayoutDirection = LayoutDirection.Ltr) {
        compose.setContent {
            view = LocalView.current
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                ScootTheme(dark = false) {
                    // Filters in a window under 700 high: the large height only, edge to edge.
                    IosSheet(isPresented = true, onDismiss = {}, detents = listOf(SheetDetent.Large), title = "Filters") {
                        Box(Modifier.fillMaxSize().onGloballyPositioned { content = it.boundsInRoot() })
                    }
                }
            }
        }
        compose.waitForIdle()
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder().setInsets(WindowInsetsCompat.Type.navigationBars(), bar).build()
            ViewCompat.dispatchApplyWindowInsets(view, insets)
        }
        compose.waitForIdle()

        val frame = compose.onNode(sheet).fetchSemanticsNode().boundsInRoot
        assertEquals("the sheet's left edge", 0f, frame.left, 0.5f)
        assertEquals("the sheet's right edge", 430f, frame.right, 0.5f)
        assertEquals("what it shows, from the left", bar.left.toFloat(), content.left, 0.5f)
        assertEquals("what it shows, to the right", 430f - bar.right, content.right, 0.5f)
    }
}
