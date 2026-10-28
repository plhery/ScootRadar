package com.plhery.scootradar.ui

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.map.testController
import com.plhery.scootradar.ui.filters.ScooterFilterSheet
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.settings.SettingsPage
import com.plhery.scootradar.ui.settings.openSourceNotices
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
import com.plhery.scootradar.ui.theme.ScootTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.time.Instant

/**
 * The search, the filters and each page of the settings in each of the app's nine languages at the largest text
 * size a phone offers, 2.0, on a small phone: no text is cut off or runs out of its room. The screens with one are
 * kept in the run's additional output, as fit-<language>-<screen>.png.
 */
@RunWith(AndroidJUnit4::class)
class TextFitsTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private var scenario: ActivityScenario<ComponentActivity>? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val language = ScooterLanguage.current

    @After
    fun tearDown() {
        scenario?.close()
        scope.cancel()
        ScooterLanguage.current = language
    }

    @Test
    fun noTextIsCutOffInAnyLanguageAtTheLargestTextSize() {
        val controller = testController(scope)
        val now = Instant.now()
        controller.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 15, expiryDate = now.minusSeconds(86_400)), ScooterProvider.Bolt)
        controller.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 15, expiryDate = now.plusSeconds(30L * 86_400)), ScooterProvider.Lime)
        var shown by mutableStateOf<Shown>(Shown.Map)
        var languageShown by mutableStateOf(ScooterLanguage.En)
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity { activity ->
            activity.setContent {
                val density = LocalDensity.current
                CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 2f)) {
                    key(shown, languageShown) { Screen(shown, controller) }
                }
            }
        }
        compose.waitForIdle()

        val cut = mutableListOf<String>()
        for (language in ScooterLanguage.entries) {
            scenario?.onActivity {
                controller.setLanguageChoice(ScooterLanguageChoice.Language(language))
                languageShown = language
            }
            for (screen in Shown.all) {
                scenario?.onActivity { shown = screen }
                compose.waitForIdle()
                if (screen == Shown.Search) openSearch()
                val texts = overflowing()
                if (texts.isNotEmpty()) {
                    cut += "${language.rawValue} ${screen.name}: ${texts.joinToString(" | ")}"
                    screenshot("fit-${language.rawValue}-${screen.name}")
                }
                if (screen == Shown.Search) closeKeyboard()
            }
        }
        scenario?.onActivity { controller.setLanguageChoice(ScooterLanguageChoice.Automatic) }
        assertTrue(cut.joinToString("\n"), cut.isEmpty())
    }

    /**
     * The texts on the screen cut off, by their words and how. A line wider than its text's box, lines below its
     * bottom, or a text cut short with "…". Cut short is allowed where iOS cuts short too: the one line of a sheet's
     * title, as UIKit's inline bar, so long as a part of it is left, and the search bar's text (lineLimit and
     * minimumScaleFactor in SwissAddressSearch.swift).
     *
     * Not `hasVisualOverflow`: the layout a text gives its semantics is laid out across all the room it was offered,
     * wider than the text itself, and says its lines overflow when none does.
     */
    private fun overflowing(): List<String> =
        compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsActions.GetTextLayoutResult), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .mapNotNull { node ->
                val results = mutableListOf<TextLayoutResult>()
                node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
                val layout = results.firstOrNull() ?: return@mapNotNull null
                val paragraph = layout.multiParagraph
                val lines = 0 until layout.lineCount
                val wide = lines.any { layout.getLineRight(it) - layout.getLineLeft(it) > layout.size.width + 1 }
                val tall = paragraph.height > layout.size.height + 1
                val short = paragraph.didExceedMaxLines || lines.any { layout.isLineEllipsized(it) }
                if (!wide && !tall && !short) return@mapNotNull null
                val title = layout.lineCount == 1 && node.config.contains(SemanticsProperties.Heading) &&
                    layout.size.width >= paragraph.intrinsics.maxIntrinsicWidth / 3
                if (!wide && !tall && (title || node.isIn(SEARCH_ISLAND_TAG))) return@mapNotNull null
                val words = node.config.getOrNull(SemanticsProperties.Text)?.joinToString(" ") { it.text }
                    ?: node.config.getOrNull(SemanticsProperties.EditableText)?.text
                val how = listOfNotNull("at the side".takeIf { wide }, "at the bottom".takeIf { tall }, "with …".takeIf { short })
                "\"$words\" cut ${how.joinToString(" and ")} (${layout.size.width}×${layout.size.height} px)"
            }

    private fun SemanticsNode.isIn(tag: String): Boolean =
        generateSequence(this) { it.parent }.any { it.config.getOrNull(SemanticsProperties.TestTag) == tag }

    /** The search open, with the places found for what was typed. */
    private fun openSearch() {
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhof")
        compose.waitUntil(10_000) { compose.onAllNodes(hasText("Lyngen", substring = true), useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
    }

    /** The keyboard the search opened, put away before the next screen. */
    private fun closeKeyboard() {
        scenario?.onActivity { WindowCompat.getInsetsController(it.window, it.window.decorView).hide(WindowInsetsCompat.Type.ime()) }
        compose.waitUntil(10_000) {
            var bottom = 0
            scenario?.onActivity { bottom = ViewCompat.getRootWindowInsets(it.window.decorView)?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0 }
            bottom == 0
        }
    }

    private fun screenshot(name: String) {
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    /** What is shown: the map with its search bar, open or not, the filters, or a page of the settings. */
    private sealed class Shown(val name: String) {
        object Map : Shown("map")
        object Search : Shown("search")
        object Filters : Shown("filters")
        class Settings(name: String, val pages: List<SettingsPage>) : Shown(name)

        companion object {
            // Lazy: the objects above are not made yet while their parent class is.
            val all: List<Shown> by lazy {
                listOf(
                    Map,
                    Search,
                    Filters,
                    Settings("settings", listOf(SettingsPage.Root)),
                    Settings("language", listOf(SettingsPage.Root, SettingsPage.Language)),
                    Settings("pass-expired", listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Bolt))),
                    Settings("pass-off", listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Voi))),
                    Settings("credits", listOf(SettingsPage.Root, SettingsPage.Credits)),
                    Settings("privacy", listOf(SettingsPage.Root, SettingsPage.Privacy)),
                    Settings("notices", listOf(SettingsPage.Root, SettingsPage.Credits, SettingsPage.Notices)),
                    Settings(
                        "licence",
                        listOf(SettingsPage.Root, SettingsPage.Credits, SettingsPage.Notices, SettingsPage.Licence(openSourceNotices.first())),
                    ),
                )
            }
        }
    }

    @Composable
    private fun Screen(shown: Shown, controller: ScooterMapController) {
        when (shown) {
            Shown.Map, Shown.Search -> ScooterMapScreen(
                controller = controller,
                map = { dark -> Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA))) },
                addressSearch = places,
            )
            Shown.Filters -> ScootTheme(dark = false) {
                IosSheet(isPresented = true, onDismiss = {}, detents = listOf(SheetDetent.Large), title = "") { inset ->
                    ScooterFilterSheet(controller, inset, onDone = {})
                }
            }
            is Shown.Settings -> ScootTheme(dark = false) {
                IosSheet(isPresented = true, onDismiss = {}, detents = listOf(SheetDetent.Large), title = "") { inset ->
                    ScooterSettingsSheet(
                        controller,
                        inset,
                        defaults = null,
                        onDone = {},
                        passProviders = listOf(ScooterProvider.Bolt, ScooterProvider.Lime, ScooterProvider.Voi),
                        pages = shown.pages,
                    )
                }
            }
        }
    }

    private companion object {
        /** Long names, as places have them, with a covered city and a place without data. */
        val places = object : AddressSearchAPIClient {
            override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = listOf(
                AddressSearchResult(47.3779, 8.5403, "Bahnhofplatz, 8001 Zürich, Switzerland", "Bahnhofplatz", "8001 Zürich, Switzerland", true),
                AddressSearchResult(69.5779, 20.2198, "Bahnhof, Lyngen, Norway", "Bahnhof", "Lyngen, Norway", false),
            )
        }
    }
}
