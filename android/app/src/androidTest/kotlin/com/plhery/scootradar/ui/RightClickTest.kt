package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.InputDevice
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isDialog
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.toSize
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.testController
import com.plhery.scootradar.map.zurichStart
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.sheet.MENU_TAG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Locale

/**
 * X-AD22 on a device: a right click, sent as the system's input sends one (a MotionEvent from SOURCE_MOUSE with
 * BUTTON_SECONDARY, through UiAutomation, so through the window manager's dispatch), from a mouse or from a trackpad
 * (whose two-finger click Android sends as a finger from the mouse's source), does nothing on the map, on the bar's
 * Settings button, on a row of the Settings sheet or on the search bar, and opens the search field's own menu; a left
 * click acts on each. Around Settings' calendar and the card's menu, windows of their own, a right click leaves them
 * open. For
 * ScootRadar_Phone_Min, ScootRadar_Fold folded and open, and ScootRadar_Tablet; the screens are kept in the run's
 * additional output, as right-click-*.png.
 *
 * The button's own press and release events (ACTION_BUTTON_PRESS and _RELEASE) need their action button, which only
 * MotionEvent.setActionButton sets, a test API hidden from the SDK that API 31 and 37 let a test reach by reflection
 * (logged as allowed); where it can't be reached, the down and up are sent alone. MapLibre's own gestures ignore a press
 * of any button but the primary (MapGestureDetector.onTouchEvent), so the map's part holds without the screen's filter
 * too; the rest doesn't.
 */
@RunWith(AndroidJUnit4::class)
class RightClickTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())
    private var scenario: ActivityScenario<ComponentActivity>? = null
    private var recreations: Application.ActivityLifecycleCallbacks? = null

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scenario?.close()
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        scope.cancel()
        ScooterLanguage.current = language
        Locale.setDefault(locale)
    }

    @Test
    fun aRightClickDoesNothingButOpenTheSearchFieldsMenuWhereALeftClickActs() = rightClicksOnTheScreen(Clicker.Mouse)

    @Test
    fun aTrackpadsRightClickDoesNothingButOpenTheSearchFieldsMenuWhereALeftClickActs() = rightClicksOnTheScreen(Clicker.Trackpad)

    private fun rightClicksOnTheScreen(clicker: Clicker) {
        Log.i("RightClickTest", if (setActionButton != null) "clicks with the button's press and release" else "clicks of a down and an up alone")
        val controller = show()
        val name = clicker.name.lowercase()
        fun click(at: Offset, button: Int) = click(at, button, clicker)

        // The map: a right click beside the chosen scooter leaves it chosen; a left click there, a tap, lets it go.
        onMain { controller.selectScooter(scooter.id) }
        compose.waitForIdle()
        Thread.sleep(1_500)
        val onTheMap = compose.onRoot().fetchSemanticsNode().let { it.positionOnScreen + Offset(it.size.width * 0.7f, it.size.height * 0.3f) }
        screenshot("right-click-$name-map")
        click(onTheMap, MotionEvent.BUTTON_SECONDARY)
        // MapLibre takes a tap once the double tap's time is past.
        Thread.sleep(1_000)
        assertEquals("chosen after a right click on the map", scooter.id, controller.selectedScooterID.value)
        click(onTheMap, MotionEvent.BUTTON_PRIMARY)
        assertTrue("let go after a left click on the map at $onTheMap", waitFor(5_000) { controller.selectedScooterID.value == null })

        // The bar's Settings button opens nothing on a right click, Settings on a left one.
        val zones = hasText(localized("Ride and parking zones"))
        val settings = hasContentDescription(localized("Settings"))
        click(center(settings), MotionEvent.BUTTON_SECONDARY)
        Thread.sleep(1_000)
        assertTrue("Settings closed after a right click on its button", shown(zones).not())
        click(center(settings), MotionEvent.BUTTON_PRIMARY)
        compose.waitUntil(5_000) { shown(zones) }
        Thread.sleep(1_000)

        // A row of the sheet: its switch turns on a left click alone. At a phone's first height the row may be below
        // the screen's foot: the sheet is pulled up first.
        if (center(zones).y > screenHeight() * 0.85f) {
            compose.onNode(title(localized("Settings"))).performTouchInput { swipeUp(startY = centerY, endY = centerY - screenHeight() / 2, durationMillis = 400) }
            compose.waitForIdle()
            Thread.sleep(1_000)
        }
        assertTrue("the row on the screen at ${center(zones)}", center(zones).y < screenHeight() * 0.85f)
        screenshot("right-click-$name-settings")
        val showsZones = controller.showsZones.value
        click(center(zones), MotionEvent.BUTTON_SECONDARY)
        Thread.sleep(500)
        assertEquals("the zones' switch after a right click on its row", showsZones, controller.showsZones.value)
        click(center(zones), MotionEvent.BUTTON_PRIMARY)
        assertTrue("the zones' switch turned by a left click on its row", waitFor(3_000) { controller.showsZones.value != showsZones })
        device.pressBack()
        compose.waitUntil(5_000) { !shown(zones) }
        Thread.sleep(1_000)

        // The search bar opens on a left click alone; in the open search, a left click on the field opens no menu, a
        // right click its own.
        val field = hasTestTag(SEARCH_FIELD_TAG)
        val island = hasTestTag(SEARCH_ISLAND_TAG)
        click(center(island), MotionEvent.BUTTON_SECONDARY)
        Thread.sleep(1_000)
        assertTrue("the search closed after a right click on its bar", !shown(field))
        click(center(island), MotionEvent.BUTTON_PRIMARY)
        compose.waitUntil(5_000) { shown(field) }
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhofstrasse")
        compose.waitForIdle()
        val menu = hasText("Select all")
        click(center(field), MotionEvent.BUTTON_PRIMARY)
        Thread.sleep(1_000)
        assertTrue("no menu after a left click on the field", !shown(menu))
        click(center(field), MotionEvent.BUTTON_SECONDARY)
        compose.waitUntil(5_000) { shown(menu) }
        screenshot("right-click-$name-field-menu")
    }

    /**
     * Settings' calendar, a window of its own: a right click above it, below it and beside it (where its window leaves
     * room at its sides), outside what it shows, leaves it open, from a mouse and from a trackpad alike; a left click
     * there closes it. On a phone the calendar's window is as tall as the calendar, so above and below it are outside
     * the window, which is handed the press all the same.
     */
    @Test
    fun aRightClickAroundTheCalendarLeavesItOpen() {
        val controller = show()
        // Lime's pass, valid through a fortnight from now: Settings lists it under Passes, and its page has the date.
        onMain { controller.setRidePass(ProviderRidePass(enabled = true, expiryDate = Instant.now().plus(14, ChronoUnit.DAYS)), ScooterProvider.Lime) }
        click(center(hasContentDescription(localized("Settings"))), MotionEvent.BUTTON_PRIMARY, Clicker.Mouse)
        val pass = hasText(localized("Pass active"), substring = true) and hasClickAction()
        compose.waitUntil(5_000) { shown(pass) }
        Thread.sleep(1_000)
        compose.onAllNodes(pass).onFirst().performSemanticsAction(SemanticsActions.OnClick)
        val date = hasText(localized("Valid through"), substring = true) and hasClickAction()
        compose.waitUntil(5_000) { shown(date) }
        Thread.sleep(1_000)
        val calendar = isDialog()
        for (clicker in Clicker.entries) {
            val name = clicker.name.lowercase()
            compose.onAllNodes(date).onFirst().performSemanticsAction(SemanticsActions.OnClick)
            compose.waitUntil(5_000) { shown(calendar) }
            Thread.sleep(1_000)
            val shows = bounds(calendar)
            val room = 30f
            val spots = buildList {
                if (shows.top > room * 2) add("above" to Offset(shows.center.x, shows.top - room))
                if (shows.bottom < screenHeight() - room * 2) add("below" to Offset(shows.center.x, shows.bottom + room))
                if (shows.left > room * 2) add("beside" to Offset(shows.left - room, shows.center.y))
            }
            Log.i("RightClickTest", "the calendar at $shows on a ${device.displayWidth}x${device.displayHeight} screen: $spots")
            assertTrue("a place outside the calendar at $shows", spots.isNotEmpty())
            screenshot("right-click-$name-calendar")
            for ((where, at) in spots) {
                click(at, MotionEvent.BUTTON_SECONDARY, clicker)
                Thread.sleep(500)
                assertTrue("the calendar open after a right click $where it at $at", shown(calendar))
            }
            click(spots.first().second, MotionEvent.BUTTON_PRIMARY, clicker)
            assertTrue("the calendar closed after a left click ${spots.first().first} it", waitFor(5_000) { !shown(calendar) })
            Thread.sleep(500)
        }
    }

    /**
     * The card's price menu, a window of its own: a right click on the map past it, or in its shadow's room, leaves it
     * open, from a mouse and from a trackpad alike, as Settings' calendar (PLAN §10); a left click on the map closes it.
     */
    @Test
    fun aRightClickOutsideTheMenuLeavesItOpen() {
        val controller = show()
        onMain { controller.selectScooter(scooter.id) }
        val price = hasContentDescription(stringFormat(localized("Ride estimate, %lld minutes. Change duration."), controller.rideEstimateMinutes.value.toLong()))
        compose.waitUntil(5_000) { shown(price) }
        Thread.sleep(1_500)
        val menu = hasTestTag(MENU_TAG)
        val density = application.resources.displayMetrics.density
        for (clicker in Clicker.entries) {
            val name = clicker.name.lowercase()
            click(center(price), MotionEvent.BUTTON_PRIMARY, Clicker.Mouse)
            compose.waitUntil(5_000) { shown(menu) }
            Thread.sleep(1_000)
            val shows = bounds(menu)
            // The menu's window is the menu and its shadow's room, 56 points around it.
            val window = shows.inflate(56 * density)
            val past = listOf(
                Offset(device.displayWidth / 2f, screenHeight() * 0.15f),
                Offset(device.displayWidth / 2f, screenHeight() * 0.85f),
                Offset(device.displayWidth * 0.1f, screenHeight() / 2f),
                Offset(device.displayWidth * 0.9f, screenHeight() / 2f),
            ).first { !window.inflate(20 * density).contains(it) }
            val shadow = Offset(shows.center.x, if (shows.top - window.top > 20 * density) shows.top - 10 * density else shows.bottom + 10 * density)
            Log.i("RightClickTest", "the menu at $shows, its window about $window; past it at $past, in its shadow at $shadow")
            screenshot("right-click-$name-menu")
            click(past, MotionEvent.BUTTON_SECONDARY, clicker)
            Thread.sleep(500)
            assertTrue("the menu open after a right click past it at $past", shown(menu))
            click(shadow, MotionEvent.BUTTON_SECONDARY, clicker)
            Thread.sleep(500)
            assertTrue("the menu open after a right click in its shadow at $shadow", shown(menu))
            click(past, MotionEvent.BUTTON_PRIMARY, clicker)
            assertTrue("the menu closed after a left click past it", waitFor(5_000) { !shown(menu) })
            Thread.sleep(500)
        }
    }

    /**
     * What clicks: a mouse, or a trackpad, whose two-finger click Android sends as a finger from the mouse's source,
     * which Compose takes for a mouse's (MotionEventAdapter).
     */
    private enum class Clicker(val tool: Int) {
        Mouse(MotionEvent.TOOL_TYPE_MOUSE),
        Trackpad(MotionEvent.TOOL_TYPE_FINGER),
    }

    /**
     * [clicker]'s click with [button] at [at] on the screen, as the system sends it: down with the button held, its
     * press, its release, and up.
     */
    private fun click(at: Offset, button: Int, clicker: Clicker) {
        val down = SystemClock.uptimeMillis()
        send(MotionEvent.ACTION_DOWN, at, button, down, down, clicker)
        if (setActionButton != null) {
            send(MotionEvent.ACTION_BUTTON_PRESS, at, button, down, down, clicker, actionButton = button)
            send(MotionEvent.ACTION_BUTTON_RELEASE, at, 0, down, down + 60, clicker, actionButton = button)
        }
        send(MotionEvent.ACTION_UP, at, 0, down, down + 60, clicker)
        compose.waitForIdle()
    }

    private fun send(action: Int, at: Offset, buttons: Int, downTime: Long, time: Long, clicker: Clicker, actionButton: Int = 0) {
        val event = MotionEvent.obtain(
            downTime, time, action, 1,
            arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = clicker.tool }),
            arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = if (buttons == 0) 0f else 1f }),
            0, buttons, 1f, 1f, 0, 0, InputDevice.SOURCE_MOUSE, 0,
        )
        if (actionButton != 0) setActionButton?.invoke(event, actionButton)
        try {
            assertTrue("injected: $event", instrumentation.uiAutomation.injectInputEvent(event, true))
        } finally {
            event.recycle()
        }
    }

    /** Where the first node [matcher] finds is, on the screen. */
    private fun bounds(matcher: SemanticsMatcher): Rect =
        compose.onAllNodes(matcher).onFirst().fetchSemanticsNode().let { Rect(it.positionOnScreen, it.size.toSize()) }

    /** The middle of the first node [matcher] finds, on the screen. */
    private fun center(matcher: SemanticsMatcher): Offset =
        compose.onAllNodes(matcher).onFirst().fetchSemanticsNode().let { it.positionOnScreen + Offset(it.size.width / 2f, it.size.height / 2f) }

    private fun shown(matcher: SemanticsMatcher) = compose.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()

    private fun screenHeight(): Float = device.displayHeight.toFloat()

    private fun title(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

    /** The screen over the live map, with Lime's scooter in the middle of Zürich and no places to search. */
    private fun show(): ScooterMapController {
        val controller = testController(scope, api = oneScooter)
        val content: @Composable () -> Unit = {
            ScooterMapScreen(
                controller = controller,
                map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                addressSearch = noPlaces,
            )
        }
        // The first launch after the app is installed makes a new activity once, about two seconds in, which shows
        // the screen too.
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState == null || activity !is ComponentActivity) return
                activity.enableEdgeToEdge()
                activity.setContent(content = content)
            }
            override fun onActivityStarted(activity: Activity) = Unit
            override fun onActivityResumed(activity: Activity) = Unit
            override fun onActivityPaused(activity: Activity) = Unit
            override fun onActivityStopped(activity: Activity) = Unit
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
            override fun onActivityDestroyed(activity: Activity) = Unit
        }
        application.registerActivityLifecycleCallbacks(recreated)
        recreations = recreated
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity {
            it.enableEdgeToEdge()
            it.setContent(content = content)
        }
        compose.waitUntil(60_000) { controller.lastUpdated.value != null && !controller.isLoading.value }
        Thread.sleep(3_000)
        compose.waitForIdle()
        return controller
    }

    /** Whether `condition` holds within `timeoutMillis`, asked every 50 ms. */
    private fun waitFor(timeoutMillis: Long, condition: () -> Boolean): Boolean {
        val end = System.currentTimeMillis() + timeoutMillis
        while (System.currentTimeMillis() < end) {
            if (condition()) return true
            Thread.sleep(50)
        }
        return condition()
    }

    private fun <T> onMain(block: () -> T): T {
        var result: Result<T>? = null
        instrumentation.runOnMainSync { result = runCatching(block) }
        return result!!.getOrThrow()
    }

    /** The screen now, kept as [name].png in the run's additional output. */
    private fun screenshot(name: String) {
        val bitmap = instrumentation.uiAutomation.takeScreenshot() ?: return
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    private companion object {
        /** Lime's scooter in the middle of Zürich, where the map opens, with its price, so that its card has the menu. */
        val scooter = Scooter(
            provider = "lime", latitude = 47.3769, longitude = 8.5417, battery = 82, vehicleID = "a", distanceMeters = 0.0,
            pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
        )

        val oneScooter = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = listOf(scooter))
        }

        val noPlaces = object : AddressSearchAPIClient {
            override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = emptyList()
        }

        /** MotionEvent.setActionButton, where the run lets a test reach it. */
        val setActionButton = runCatching { MotionEvent::class.java.getMethod("setActionButton", Int::class.javaPrimitiveType) }.getOrNull()
    }
}
