package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.core.view.ViewCompat
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
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.testController
import com.plhery.scootradar.map.zurichStart
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
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
import java.io.File
import java.util.Locale
import java.util.concurrent.atomic.AtomicInteger

/**
 * The search and the language page on a phone (ui.md UI-009 to UI-012, UI-074): a place searched for and chosen
 * moves the map there; the keyboard lifts the open search and leaves the dock where it was; and a language chosen
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

    @Test
    fun theKeyboardLiftsTheOpenSearchAndLeavesTheDockWhereItWas() {
        show()
        val dock = bounds(DOCK_TAG)
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.waitUntil(10_000) { imeBottom() > 0 }
        compose.waitForIdle()
        val screen = screenshot("search-keyboard")
        val island = bounds(SEARCH_ISLAND_TAG)
        val keyboardTop = screen.height - imeBottom()
        assertTrue("$island over a keyboard from $keyboardTop", island.bottom <= keyboardTop + 1)

        // Back closes the keyboard, then the search; the dock comes back where it was.
        scenario?.onActivity { it.onBackPressedDispatcher.onBackPressed() }
        compose.waitUntil(10_000) { imeBottom() == 0 && compose.onAllNodesWithTag(DOCK_TAG).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
        assertEquals(dock, bounds(DOCK_TAG))
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
            compose.waitForIdle()
            val viewport = controller.viewport.value
            val lastUpdated = controller.lastUpdated.value
            val loads = AtomicInteger()
            scope.launch { controller.isLoading.drop(1).collect { if (it) loads.incrementAndGet() } }

            compose.onNodeWithContentDescription("Settings").performClick()
            // At its first height the sheet shows the top of each page: the rows are reached as TalkBack reaches them.
            compose.onNodeWithText("English").performSemanticsAction(SemanticsActions.OnClick)
            compose.onNodeWithText("Français").performSemanticsAction(SemanticsActions.OnClick)
            compose.waitUntil(10_000) { compose.onAllNodes(title("Langue")).fetchSemanticsNodes().isNotEmpty() }
            Thread.sleep(2_000)
            compose.waitForIdle()
            screenshot("language-french")

            assertEquals("fr", AppCompatDelegate.getApplicationLocales().toLanguageTags())
            assertEquals(ScooterLanguage.Fr, controller.language.value)
            scenario.onActivity { assertSame("the same activity", activity, it) }
            assertTrue("${viewport.describe()} then ${controller.viewport.value.describe()}", viewport.isNear(controller.viewport.value))
            assertEquals(0, loads.get())
            assertEquals(lastUpdated, controller.lastUpdated.value)
        } finally {
            scenario.onActivity { ViewModelProvider(it)[ScooterMapViewModel::class.java].controller.setLanguageChoice(ScooterLanguageChoice.Automatic) }
            scenario.close()
        }
    }

    /** The screen over the live map, with a controller of an empty map and a search of three places. */
    private fun show(): ScooterMapController {
        val controller = testController(scope)
        setContent {
            ScooterMapScreen(
                controller = controller,
                map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                addressSearch = places,
            )
        }
        compose.waitUntil(60_000) { controller.lastUpdated.value != null && !controller.isLoading.value }
        compose.waitForIdle()
        return controller
    }

    private fun setContent(content: @Composable () -> Unit) {
        // As in DockOverTheMapTest: an activity remade just after launch shows the screen too.
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState != null) (activity as? ComponentActivity)?.setContent(content = content)
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
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity { it.setContent(content = content) }
    }

    private fun title(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

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

        fun GeoBounds.describe() = "$south,$west…$north,$east"

        /** The same part of the map, but for a millionth of a degree at its edges. */
        fun GeoBounds.isNear(other: GeoBounds) =
            listOf(south - other.south, west - other.west, north - other.north, east - other.east).all { kotlin.math.abs(it) < 1e-6 }
    }
}
