package com.plhery.scootradar.ui

import android.content.Context
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.rightClick
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.testController
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.sheet.IosMenu
import com.plhery.scootradar.ui.theme.ScootTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.util.Locale

// X-AD22: an iPad's pointer acts with its primary button; UIKit's tap recognizers, the map's among them
// (ScooterMapView.swift:326-331), answer that button alone unless told otherwise (UITapGestureRecognizer.h,
// buttonMaskRequired), and the app gives nothing a context menu. A right click does nothing.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w411dp-h891dp-mdpi")
@OptIn(ExperimentalTestApi::class)
class SecondaryClickTest {
    @get:Rule
    val compose = createComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    /** The map's stand-in: a View, as MapLibre's map is, that keeps the touches and the wheel's turns it is given. */
    private class MapStandIn(context: Context) : View(context) {
        val touches = mutableListOf<Int>()
        var wheel = 0

        override fun onTouchEvent(event: MotionEvent): Boolean {
            touches += event.actionMasked
            return true
        }

        override fun onGenericMotionEvent(event: MotionEvent): Boolean {
            if (event.actionMasked == MotionEvent.ACTION_SCROLL) wheel += 1
            return true
        }
    }

    private fun searchBarShows() = compose.onAllNodesWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNodes().isNotEmpty()

    /**
     * A right click on the bar's Settings button opens nothing, and one on the map gives the map no touch, so no tap;
     * a left click on each still acts, and the wheel still reaches the map.
     */
    @Test
    fun aRightClickOnTheScreenDoesNothingWhereALeftClickActs() {
        val analytics = RecordingAnalytics()
        lateinit var map: MapStandIn
        compose.setContent {
            ScooterMapScreen(
                controller = testController(scope),
                map = { AndroidView({ MapStandIn(it).also { view -> map = view } }, Modifier.fillMaxSize()) },
                analytics = analytics.analytics,
                glassBlurs = false,
            )
        }
        compose.waitForIdle()
        // Between the search bar and the dock, the map alone.
        val onTheMap = compose.onRoot().fetchSemanticsNode().size.let { Offset(it.width / 2f, it.height * 0.4f) }

        compose.onRoot().performMouseInput { rightClick(onTheMap) }
        compose.waitForIdle()
        assertEquals("the map's touches from a right click", emptyList<Int>(), map.touches)
        compose.onNodeWithContentDescription("Settings").performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("the search bar shows, Settings unopened", searchBarShows())
        assertTrue(analytics.names.toString(), "settings_open" !in analytics.names)

        compose.onRoot().performMouseInput {
            moveTo(onTheMap)
            scroll(1f)
        }
        compose.waitForIdle()
        assertTrue("the wheel reaches the map", map.wheel > 0)
        compose.onRoot().performMouseInput { click(onTheMap) }
        compose.waitForIdle()
        assertEquals(listOf(MotionEvent.ACTION_DOWN, MotionEvent.ACTION_UP), map.touches)
        compose.onNodeWithContentDescription("Settings").performMouseInput { click() }
        compose.waitUntil { "settings_open" in analytics.names }
    }

    /** The menu is a window of its own: a right click on a row chooses nothing, a left click chooses it. */
    @Test
    fun aRightClickOnAMenusRowChoosesNothing() {
        var chosen: Int? = null
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.fillMaxSize()) {
                    IosMenu(expanded = true, onDismiss = {}, choices = listOf("5 min", "10 min", "15 min"), chosen = 1, onChoose = { chosen = it })
                }
            }
        }
        compose.waitForIdle()
        val row = compose.onNode(hasText("15 min") and hasClickAction())
        row.performMouseInput { rightClick() }
        compose.waitForIdle()
        assertNull(chosen)
        row.performMouseInput { click() }
        compose.waitForIdle()
        assertEquals(2, chosen)
    }
}
