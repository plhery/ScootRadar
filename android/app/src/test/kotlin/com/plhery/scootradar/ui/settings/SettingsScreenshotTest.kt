package com.plhery.scootradar.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.performScrollToNode
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterCreditsList
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.LocalClock
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
import java.net.URI
import java.time.Instant
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * The settings sheet and each of its pages (ui.md UI-070 to UI-089), light and dark, at font scale 1.0 and 2.0,
 * over a plain stand-in for the map. The providers under Passes and the credits' sources are the test's own, so
 * that nothing in data/ changes them.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class SettingsScreenshotTest(private val state: SettingsState, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private val appVersion = ScooterLinks.appVersion

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
        ScooterLinks.appVersion = "1.2.0"
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLinks.appVersion = appVersion
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun settings() {
        val clock = TestClock()
        val model = controllers.make(EmptyScooterAPI, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        state.reach(model, clock.now)
        useFontScale(look.fontScale)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = look.dark, reduceMotion = true) {
                    Box(Modifier.fillMaxSize().background(if (look.dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
                    IosSheet(isPresented = true, onDismiss = {}, detents = state.detents, title = "Settings") { bottomInset ->
                        ScooterSettingsSheet(
                            controller = model,
                            bottomInset = bottomInset,
                            defaults = InMemoryScooterDefaults(),
                            onDone = {},
                            passProviders = passProviders,
                            sources = sources(),
                            pages = state.pages,
                        )
                    }
                }
            }
        }
        compose.waitForIdle()
        state.scrolledTo()?.let { text ->
            compose.onNode(hasScrollAction()).performScrollToNode(hasText(text))
            compose.waitForIdle()
        }
        compose.screenshot("settings/${state.fileName}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = SettingsState.entries.flatMap { state -> Look.entries.map { arrayOf(state, it) } }
    }
}

/** The sheet at its first height and taller, and each of its pages, as a rider reaches them. */
enum class SettingsState(
    val detents: List<SheetDetent> = listOf(SheetDetent.Large),
    val pages: List<SettingsPage> = listOf(SettingsPage.Root),
) {
    Medium(detents = listOf(SheetDetent.Medium, SheetDetent.Large)),
    Root,
    About {
        override fun scrolledTo() = localized("Source code on GitHub")
    },
    Language(pages = listOf(SettingsPage.Root, SettingsPage.Language)),
    LanguageChosen(pages = listOf(SettingsPage.Root, SettingsPage.Language)) {
        override fun reach(model: ScooterMapController, now: Instant) {
            super.reach(model, now)
            model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.Fr))
        }
    },
    PassOff(pages = listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Bolt))),
    PassOn(pages = listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Lime))),
    PassExpired(pages = listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Voi))),
    Credits(pages = listOf(SettingsPage.Root, SettingsPage.Credits)),
    Privacy(pages = listOf(SettingsPage.Root, SettingsPage.Privacy)),
    Notices(pages = listOf(SettingsPage.Root, SettingsPage.Credits, SettingsPage.Notices)),
    Licence(pages = listOf(SettingsPage.Root, SettingsPage.Credits, SettingsPage.Notices, SettingsPage.Licence(openSourceNotices.first { it.file == "MapLibre.txt" }))),
    ;

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }

    /** A pass of each kind: none with Bolt, one with its benefits with Lime, and one that has run out with Voi. */
    open fun reach(model: ScooterMapController, now: Instant) {
        model.setRidePass(
            ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 15, expiryDate = now.plusSeconds(30L * 86_400)),
            ScooterProvider.Lime,
        )
        model.setRidePass(ProviderRidePass(enabled = true, expiryDate = now.minusSeconds(20L * 86_400)), ScooterProvider.Voi)
    }

    /** The text the page is scrolled to before it is taken, if it is not at its top. */
    open fun scrolledTo(): String? = null
}

/** The providers under Passes: those of Zürich's part of the map. */
private val passProviders = listOf(ScooterProvider.Bolt, ScooterProvider.Lime, ScooterProvider.Voi)

/** The credits' sources, without the countries data/ lists. */
private fun sources(): List<ScooterCreditsList.Source> = listOf(
    ScooterCreditsList.Source(localized("Mobility data sources"), URI("https://opentransportdata.swiss/en/cookbook/shared-mobility/")),
    ScooterCreditsList.Source(localized("French mobility data"), URI("https://transport.data.gouv.fr/datasets?type=vehicles-sharing")),
    ScooterCreditsList.Source(localized("Address search by Geoapify"), URI("https://www.geoapify.com/")),
    ScooterCreditsList.Source(localized("Address data © OpenStreetMap contributors"), URI("https://www.openstreetmap.org/copyright")),
)
