package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.os.Bundle
import android.os.SystemClock
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.MainActivity
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.testController
import com.plhery.scootradar.map.zurichStart
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import java.io.File
import java.util.Locale
import java.util.concurrent.CopyOnWriteArrayList
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The search and the language page on a phone (ui.md UI-009 to UI-012, UI-074): a place searched for and chosen
 * moves the map there; the keyboard lifts the open search and leaves the dock where it was; Return with no place
 * found puts the keyboard away; and a language chosen
 * in Settings shows the app in it at once, in the same activity, over the same map, with no scooters asked for
 * again. The screens are kept in the run's additional output, as search-*.png and language-*.png.
 */
@RunWith(AndroidJUnit4::class)
class SearchAndLanguageTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private var scenario: ActivityScenario<ComponentActivity>? = null
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private var recreations: Application.ActivityLifecycleCallbacks? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())

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
    fun aPlaceSearchedForAndChosenMovesTheMapThere() {
        val controller = show()
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhofplatz")
        compose.waitUntil(10_000) { compose.onAllNodes(hasText("3011 Bern, Switzerland")).fetchSemanticsNodes().isNotEmpty() }
        screenshot("search-results")

        compose.onNodeWithText("3011 Bern, Switzerland").performClick()
        compose.waitUntil(10_000) { controller.viewport.value.contains(bern) }
        compose.waitForIdle()
        assertEquals("Bahnhofplatz", controller.searchedDestination.value?.title)
        // The bar says where the map is now.
        compose.onNodeWithText("Bahnhofplatz", useUnmergedTree = true).assertExists()
        screenshot("search-chosen")
    }

    /**
     * The keyboard limits the open search: places that reach it scroll above it. The dock, made way for the search,
     * stays where it was (`.ignoresSafeArea(.keyboard, edges: .bottom)`). Back puts the keyboard away, then closes the
     * search, then the scooter's card.
     */
    @Test
    fun theKeyboardLiftsTheOpenSearchAndLeavesTheDockWhereItWas() {
        val controller = show(scooters, streets)
        compose.runOnIdle { controller.selectScooter("lime:a") }
        compose.waitForIdle()
        val dock = bounds(DOCK_TAG)
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhofstrasse")
        compose.waitUntil(10_000) { imeBottom() > 0 && compose.onAllNodes(hasText("Bahnhofstrasse 1")).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
        val screen = screenshot("search-keyboard")
        val island = bounds(SEARCH_ISLAND_TAG)
        val keyboardTop = screen.height - imeBottom()
        val places = compose.onNode(hasAnyAncestor(hasTestTag(SEARCH_ISLAND_TAG)) and SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange))
        assertTrue("the places scroll", places.fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange].maxValue() > 0)
        assertTrue("$island over a keyboard from $keyboardTop", island.bottom <= keyboardTop + 1)

        // The keyboard put away with the search still open: the dock hasn't moved.
        val madeWay = bounds(DOCK_TAG)
        scenario?.onActivity { WindowCompat.getInsetsController(it.window, it.window.decorView).hide(WindowInsetsCompat.Type.ime()) }
        compose.waitUntil(10_000) { imeBottom() == 0 }
        compose.waitForIdle()
        compose.onNodeWithText("Cancel").assertExists()
        assertEquals(madeWay, bounds(DOCK_TAG))

        // Back, as the phone's own key: the keyboard first, then the search, then the card.
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performClick()
        compose.waitUntil(10_000) { imeBottom() > 0 }
        compose.waitForIdle()
        back()
        compose.waitUntil(10_000) { imeBottom() == 0 }
        compose.waitForIdle()
        compose.onNodeWithText("Cancel").assertExists()
        back()
        compose.waitUntil(10_000) { compose.onAllNodesWithText("Cancel").fetchSemanticsNodes().isEmpty() }
        compose.waitForIdle()
        assertEquals("lime:a", controller.selectedScooterID.value)
        assertEquals(dock, bounds(DOCK_TAG))
        back()
        compose.waitUntil(10_000) { controller.selectedScooterID.value == null }
    }

    /** Return with no place found puts the keyboard away and leaves the search open, as the iOS 27 simulator does. */
    @Test
    fun returnWithNoPlaceFoundPutsTheKeyboardAway() {
        show(addressSearch = streets)
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Nowhere")
        compose.waitUntil(10_000) { imeBottom() > 0 && compose.onAllNodes(hasText("No places found.")).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performImeAction()
        compose.waitUntil(10_000) { imeBottom() == 0 }
        compose.waitForIdle()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertIsNotFocused()
        compose.onNodeWithText("Cancel").assertExists()
        compose.onNodeWithText("No places found.").assertExists()
    }

    @Test
    fun aLanguageChosenInSettingsShowsTheAppInItWithoutANewActivityOrLoad() {
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        try {
            lateinit var controller: ScooterMapController
            lateinit var activity: MainActivity
            scenario.onActivity {
                activity = it
                controller = ViewModelProvider(it)[ScooterMapViewModel::class.java].controller
            }
            // A phone just started can take half a minute to reach the network.
            compose.waitUntil(60_000) {
                (controller.lastUpdated.value != null || controller.loadIssue.value != null) && !controller.isLoading.value
            }
            // The live server may still be collecting its feeds: its answer then asks to be asked again in a moment
            // (followUpMs), a load of the server's own. Other loads keep 10 s from the last one (minimumAttemptGap),
            // longer than what follows, so the language is chosen once the server asks for nothing more, or after
            // half a minute. A feed stale for longer keeps it asking every few seconds.
            val calm = SystemClock.uptimeMillis() + 30_000
            while (SystemClock.uptimeMillis() < calm &&
                (controller.isLoading.value || controller.responseMetadata.value?.refreshing == true)
            ) {
                Thread.sleep(200)
            }
            compose.waitUntil(10_000) { !controller.isLoading.value }
            compose.waitForIdle()
            // When each load began (true) and ended (false).
            val loads = CopyOnWriteArrayList<Pair<Long, Boolean>>()
            scope.launch { controller.isLoading.drop(1).collect { loads += SystemClock.uptimeMillis() to it } }
            val serverAsksAgain = controller.responseMetadata.value?.refreshing == true
            val followUp = controller.responseMetadata.value?.followUpMs?.toLong() ?: 2_000L
            if (serverAsksAgain) {
                // Its next question then comes a whole followUpMs after an answer, after the choice.
                val since = SystemClock.uptimeMillis()
                compose.waitUntil(30_000) { loads.any { (at, loading) -> !loading && at > since } }
            }
            val viewport = controller.viewport.value
            val lastUpdated = controller.lastUpdated.value

            compose.onNodeWithContentDescription("Settings").performClick()
            // At its first height the sheet shows the top of each page: the rows are reached as TalkBack reaches them.
            compose.onNodeWithText("English").performSemanticsAction(SemanticsActions.OnClick)
            val chosen = SystemClock.uptimeMillis()
            compose.onNodeWithText("Français").performSemanticsAction(SemanticsActions.OnClick)
            compose.waitUntil(10_000) { compose.onAllNodes(title("Langue")).fetchSemanticsNodes().isNotEmpty() }
            Thread.sleep(2_000)
            compose.waitForIdle()
            screenshot("language-french")

            assertEquals("fr", AppCompatDelegate.getApplicationLocales().toLanguageTags())
            assertEquals(ScooterLanguage.Fr, controller.language.value)
            scenario.onActivity { assertSame("the same activity", activity, it) }
            assertTrue("${viewport.describe()} then ${controller.viewport.value.describe()}", viewport.isNear(controller.viewport.value))
            // None began as the language changed: none at all, unless the server was still asking again, and then
            // each when it asked, followUpMs after the load before it ended.
            val began = loads.filter { (_, loading) -> loading }.map { it.first }
            if (serverAsksAgain) {
                for (at in began.filter { it >= chosen }) {
                    val ended = loads.last { (end, loading) -> !loading && end < at }.first
                    assertTrue("a load ${at - chosen} ms after the choice, ${at - ended} ms after the last ended", at - ended >= followUp - 500)
                }
            } else {
                assertEquals("loads at ${began.map { it - chosen }} ms", 0, began.size)
                assertEquals(lastUpdated, controller.lastUpdated.value)
            }
        } finally {
            scenario.onActivity { ViewModelProvider(it)[ScooterMapViewModel::class.java].controller.setLanguageChoice(ScooterLanguageChoice.Automatic) }
            scenario.close()
        }
    }

    /** The screen over the live map, with a controller of [api]'s scooters, or none, and [addressSearch]'s places. */
    private fun show(api: ScooterAPIClient? = null, addressSearch: AddressSearchAPIClient = places): ScooterMapController {
        val controller = if (api == null) testController(scope) else testController(scope, api)
        setContent {
            ScooterMapScreen(
                controller = controller,
                map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                addressSearch = addressSearch,
            )
        }
        compose.waitUntil(60_000) { controller.lastUpdated.value != null && !controller.isLoading.value }
        compose.waitForIdle()
        return controller
    }

    private fun setContent(content: @Composable () -> Unit) {
        // Edge to edge, as MainActivity is: otherwise the window takes the keyboard's insets and the screen never
        // hears of it. As in DockOverTheMapTest, an activity remade just after launch shows the screen too.
        fun ComponentActivity.present() {
            enableEdgeToEdge()
            setContent(content = content)
        }
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState != null) (activity as? ComponentActivity)?.present()
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
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity { it.present() }
    }

    private fun title(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

    /** The phone's Back key, which goes to the keyboard first while there is one. */
    private fun back() = InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)

    /** How far the keyboard reaches up the window, in pixels: 0 without one. */
    private fun imeBottom(): Int {
        var bottom = 0
        scenario?.onActivity { activity ->
            bottom = ViewCompat.getRootWindowInsets(activity.window.decorView)?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0
        }
        return bottom
    }

    private fun bounds(tag: String): Rect {
        val node = compose.onNodeWithTag(tag).fetchSemanticsNode()
        val position = node.positionOnScreen
        return Rect(position.x, position.y, position.x + node.size.width, position.y + node.size.height)
    }

    /** The screen now, kept as [name].png in the run's additional output. */
    private fun screenshot(name: String): Bitmap {
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
        return bitmap
    }

    private companion object {
        val bern = GeoPoint(46.9481, 7.4396)

        /** A search that finds the same three places for anything typed. */
        val places = object : AddressSearchAPIClient {
            override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = listOf(
                AddressSearchResult(47.3779, 8.5403, "Bahnhofplatz, 8001 Zürich, Switzerland", "Bahnhofplatz", "8001 Zürich, Switzerland", true),
                AddressSearchResult(bern.latitude, bern.longitude, "Bahnhofplatz, 3011 Bern, Switzerland", "Bahnhofplatz", "3011 Bern, Switzerland", true),
                AddressSearchResult(69.5779, 20.2198, "Bahnhof, Lyngen, Norway", "Bahnhof", "Lyngen, Norway", false),
            )
        }

        /** Fifteen streets for anything typed but "Nowhere": more than fit above the keyboard. */
        val streets = object : AddressSearchAPIClient {
            override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> =
                if (query == "Nowhere") {
                    emptyList()
                } else {
                    (1..15).map { AddressSearchResult(47.3779, 8.5403, "Bahnhofstrasse $it, 8001 Zürich, Switzerland", "Bahnhofstrasse $it", "8001 Zürich, Switzerland", true) }
                }
        }

        /** One of Lime's scooters at the start of the map, to have a card open. */
        val scooters = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(
                vehicles = listOf(
                    Scooter(
                        provider = "lime", latitude = 47.3772, longitude = 8.5421, battery = 70, rangeMeters = null,
                        vehicleID = "a", deepLink = null, rentalURIs = null, distanceMeters = 0.0,
                    ),
                ),
            )
        }

        fun GeoBounds.describe() = "$south,$west…$north,$east"

        /** The same part of the map, but for a millionth of a degree at its edges. */
        fun GeoBounds.isNear(other: GeoBounds) =
            listOf(south - other.south, west - other.west, north - other.north, east - other.east).all { kotlin.math.abs(it) < 1e-6 }
    }
}
