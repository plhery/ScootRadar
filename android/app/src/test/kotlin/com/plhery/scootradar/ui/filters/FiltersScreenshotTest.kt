package com.plhery.scootradar.ui.filters

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterFiltering
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

/**
 * The filters sheet in each of its states (ui.md UI-060 to UI-066), light and dark, at font scale 1.0 and 2.0, over
 * a plain stand-in for the map. The providers and their counts are the test's own, so that nothing in data/ changes
 * them.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class FiltersScreenshotTest(private val state: FiltersState, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun filters() {
        useFontScale(look.fontScale)
        compose.setContent {
            ScootTheme(dark = look.dark, reduceMotion = true) {
                Box(Modifier.fillMaxSize().background(if (look.dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
                IosSheet(isPresented = true, onDismiss = {}, detents = state.detents, title = "Filters") { bottomInset ->
                    FilterSheetContent(
                        minimumBattery = state.minimumBattery,
                        entries = state.entries,
                        hasActiveFilters = state.minimumBattery > 0 || state.entries.any { !it.isEnabled },
                        showResults = state.showResults(),
                        bottomInset = bottomInset,
                        onChooseMinimum = {},
                        onToggle = {},
                        onReset = {},
                        onDone = {},
                    )
                }
            }
        }
        compose.waitForIdle()
        compose.screenshot("filters/${state.fileName}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = FiltersState.entries.flatMap { state -> Look.entries.map { arrayOf(state, it) } }
    }
}

/**
 * The sheet's states: at the medium height a phone opens it at, at the large one a short phone does, with filters
 * chosen, with a provider not sharing data, where no provider operates, and while the scooters are being found.
 */
enum class FiltersState(
    val detents: List<SheetDetent> = listOf(SheetDetent.Medium, SheetDetent.Large),
    val minimumBattery: Int = 0,
    val entries: List<ScooterProviderEntry> = zurich,
    /** How many scooters the map shows; null while it is finding them. */
    private val shown: Int? = 32,
) {
    Medium,
    Large(detents = listOf(SheetDetent.Large)),
    Chosen(
        detents = listOf(SheetDetent.Large),
        minimumBattery = 60,
        entries = zurich.map { if (it.provider == ScooterProvider.Bird) it.copy(isEnabled = false) else it.copy(isSelected = true) },
        shown = 12,
    ),
    ProviderDown(
        detents = listOf(SheetDetent.Large),
        entries = listOf(entry(ScooterProvider.Voi, 0, isDown = true)) + zurich.filter { it.provider != ScooterProvider.Voi },
        shown = 29,
    ),
    NoProviders(entries = emptyList(), shown = 0),
    Finding(shown = null);

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }

    fun showResults(): String = shown?.let { ScooterFiltering.showResultsTitle(it) } ?: localized("Finding scooters…")
}

/** Zürich's providers in the catalogue's order, as the sheet lists them. */
private val zurich = listOf(
    entry(ScooterProvider.Bolt, 9),
    entry(ScooterProvider.Bird, 6),
    entry(ScooterProvider.Lime, 14),
    entry(ScooterProvider.Voi, 3),
)

private fun entry(provider: ScooterProvider, count: Int, isDown: Boolean = false) =
    ScooterProviderEntry(provider = provider, count = count, isEnabled = true, isSelected = false, isDown = isDown)
