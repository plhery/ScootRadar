package com.plhery.scootradar.ui

import android.content.Context
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.rightClick
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.testController
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.settings.SettingsPage
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
import org.robolectric.shadows.ShadowDialog
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.Locale

// X-AD22: an iPad's pointer acts with its primary button; UIKit's tap recognizers, the map's among them
// (ScooterMapView.swift:326-331), answer that button alone unless told otherwise (UITapGestureRecognizer.h,
// buttonMaskRequired), and the app gives nothing a context menu. A right click does nothing, but in a text field, whose
// edit menu it opens.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w411dp-h891dp-mdpi")
@OptIn(ExperimentalTestApi::class)
class SecondaryClickTest {
    @get:Rule
    val compose = createComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val controllers = TestControllers()
    private val zone = ZoneId.of("Europe/Zurich")

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
        ScooterDateFormat.timeZone = { zone }
    }

    @After
    fun tearDown() {
        scope.cancel()
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
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

    /**
     * The search field is the one place a right click means something, as UITextField's edit menu on an iPad
     * (UIEditMenuInteraction): it opens the field's own menu there, and on the open search's Cancel beside it, nothing.
     */
    @Test
    fun aRightClickOnTheSearchFieldOpensItsMenu() {
        val noPlaces = object : AddressSearchAPIClient {
            override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = emptyList()
        }
        compose.setContent {
            ScooterMapScreen(controller = testController(scope), map = { Box(Modifier.fillMaxSize()) }, glassBlurs = false, addressSearch = noPlaces)
        }
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.waitUntil { compose.onAllNodesWithTag(SEARCH_FIELD_TAG).fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhofstrasse")
        compose.waitForIdle()
        val menu = hasText("Select all")
        assertTrue("no menu yet", compose.onAllNodes(menu).fetchSemanticsNodes().isEmpty())

        compose.onNodeWithText(localized("Cancel")).performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("the search stays open after a right click on Cancel", compose.onAllNodesWithTag(SEARCH_FIELD_TAG).fetchSemanticsNodes().isNotEmpty())
        assertTrue("no menu from Cancel", compose.onAllNodes(menu).fetchSemanticsNodes().isEmpty())

        compose.onNodeWithTag(SEARCH_FIELD_TAG).performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("the field's menu", compose.onAllNodes(menu).fetchSemanticsNodes().isNotEmpty())
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

    /** Bolt's pass, valid through 14 November 2026 at noon, its page shown and its calendar opened from the date. */
    private fun openTheCalendar(): ScooterMapController {
        val clock = TestClock()
        val model = controllers.make(EmptyScooterAPI, clock)
        model.setRidePass(ProviderRidePass(enabled = true, expiryDate = noon(14)), ScooterProvider.Bolt)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = false, reduceMotion = true) {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = InMemoryScooterDefaults(),
                        onDone = {},
                        passProviders = listOf(ScooterProvider.Bolt),
                        sources = emptyList(),
                        pages = listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Bolt)),
                    )
                }
            }
        }
        compose.onNodeWithText("Nov 14, 2026", useUnmergedTree = true).performClick()
        compose.waitUntil { compose.onAllNodes(day(20)).fetchSemanticsNodes().isNotEmpty() }
        return model
    }

    private fun noon(day: Int) = ZonedDateTime.of(2026, 11, day, 12, 0, 0, 0, zone).toInstant()

    /** A day of November 2026 in the calendar: its button, which reads the whole date. */
    private fun day(day: Int) = hasText("November $day, 2026", substring = true) and hasClickAction()

    private val toTyping = hasContentDescription("Switch to text input mode")
    private val toCalendar = hasContentDescription("Switch to calendar input mode")

    /**
     * Settings' calendar is a window of its own, which the screen's filter doesn't reach: a right click on a day picks
     * nothing, nor does one on Done or on the button to type the date, as the iPhone's DatePicker under an iPad's
     * pointer; a left click picks the day and Done keeps it.
     */
    @Test
    fun aRightClickInTheCalendarPicksNoDay() {
        val model = openTheCalendar()
        compose.onNode(day(14)).assertIsSelected()

        compose.onNode(day(20)).performMouseInput { rightClick() }
        compose.waitForIdle()
        compose.onNode(day(20)).assertIsNotSelected()
        compose.onNode(day(14)).assertIsSelected()
        compose.onNodeWithText(localized("Done")).performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("the calendar stays open", compose.onAllNodes(day(20)).fetchSemanticsNodes().isNotEmpty())
        assertEquals(noon(14), model.ridePass(ScooterProvider.Bolt).expiryDate)
        compose.onNode(toTyping).performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("still the calendar, not the field", compose.onAllNodes(hasSetTextAction()).fetchSemanticsNodes().isEmpty())

        compose.onNode(day(20)).performMouseInput { click() }
        compose.waitForIdle()
        compose.onNode(day(20)).assertIsSelected()
        compose.onNodeWithText(localized("Done")).performMouseInput { click() }
        compose.waitUntil { compose.onAllNodes(day(20)).fetchSemanticsNodes().isEmpty() }
        assertEquals(noon(20), model.ridePass(ScooterProvider.Bolt).expiryDate)
    }

    /**
     * Typing the date, its field is a text field as the search's: a right click opens its menu there, and on the button
     * above it, back to the calendar, does nothing.
     */
    @Test
    fun aRightClickOnTheCalendarsDateFieldOpensItsMenu() {
        openTheCalendar()
        compose.onNode(toTyping).performMouseInput { click() }
        compose.waitUntil { compose.onAllNodes(hasSetTextAction()).fetchSemanticsNodes().isNotEmpty() }
        val menu = hasText("Select all")
        assertTrue("no menu yet", compose.onAllNodes(menu).fetchSemanticsNodes().isEmpty())

        compose.onNode(toCalendar).performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("still the field, not the calendar", compose.onAllNodes(hasSetTextAction()).fetchSemanticsNodes().isNotEmpty())
        assertTrue("no menu from the button", compose.onAllNodes(menu).fetchSemanticsNodes().isEmpty())

        compose.onNode(hasSetTextAction()).performMouseInput { rightClick() }
        compose.waitForIdle()
        assertTrue("the field's menu", compose.onAllNodes(menu).fetchSemanticsNodes().isNotEmpty())
    }

    /** A mouse's [action] at ([x], [y]) in a window, with [buttons] down. */
    private fun mouse(action: Int, x: Float, y: Float, buttons: Int): MotionEvent = MotionEvent.obtain(
        SystemClock.uptimeMillis(), SystemClock.uptimeMillis(), action, 1,
        arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_MOUSE }),
        arrayOf(MotionEvent.PointerCoords().apply { this.x = x; this.y = y }),
        0, buttons, 1f, 1f, 0, 0, InputDevice.SOURCE_MOUSE, 0,
    )

    /** A click with [button] in the calendar's window, beside the calendar, where a tap closes it. */
    private fun clickBesideTheCalendar(button: Int) {
        val window = ShadowDialog.getLatestDialog().window!!.decorView
        window.dispatchTouchEvent(mouse(MotionEvent.ACTION_DOWN, 2f, 2f, button))
        window.dispatchTouchEvent(mouse(MotionEvent.ACTION_UP, 2f, 2f, 0))
        compose.waitForIdle()
    }

    /**
     * Beside the calendar, in its window but outside the content, where Compose's dialog closes on any click (no View
     * takes it), a right click leaves it open, as an iPad's popover under one; a left click closes it.
     */
    @Test
    fun aRightClickBesideTheCalendarLeavesItOpen() {
        openTheCalendar()
        clickBesideTheCalendar(MotionEvent.BUTTON_SECONDARY)
        assertTrue("the calendar stays open", compose.onAllNodes(day(20)).fetchSemanticsNodes().isNotEmpty())
        clickBesideTheCalendar(MotionEvent.BUTTON_PRIMARY)
        assertTrue("a left click closes it", compose.onAllNodes(day(20)).fetchSemanticsNodes().isEmpty())
    }
}
