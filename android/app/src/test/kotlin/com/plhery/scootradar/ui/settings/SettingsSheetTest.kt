package com.plhery.scootradar.ui.settings

import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId

/**
 * What the settings sheet does with a tap (ui.md UI-070 to UI-089, UI-210): its pages come and go, and each
 * choice is the controller's at once.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class SettingsSheetTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val clock = TestClock()
    private val model = controllers.make(EmptyScooterAPI, clock)
    private val defaults = InMemoryScooterDefaults()
    private var done = 0

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
    }

    private fun show(pages: List<SettingsPage> = listOf(SettingsPage.Root)) {
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = false, reduceMotion = true) {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = defaults,
                        onDone = { done += 1 },
                        passProviders = listOf(ScooterProvider.Bolt, ScooterProvider.Lime),
                        sources = emptyList(),
                        pages = pages,
                    )
                }
            }
        }
        compose.waitForIdle()
    }

    private fun title(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

    @Test
    fun aPageOpensFromItsRowAndBackTakesItAway() {
        show()
        compose.onNodeWithText("Map & data credits").performClick()
        compose.waitForIdle()
        compose.onNode(title("Map & data credits")).assertExists()

        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        compose.waitForIdle()
        compose.onNode(title("Settings")).assertExists()
        assertEquals(0, done)
    }

    @Test
    fun theBackButtonTakesAPageAwayAndDoneClosesTheSheet() {
        show(listOf(SettingsPage.Root, SettingsPage.Privacy))
        compose.onNodeWithContentDescription("Back").performClick()
        compose.waitForIdle()
        compose.onNode(title("Settings")).assertExists()

        compose.onNodeWithContentDescription("Done").performClick()
        assertEquals(1, done)
    }

    @Test
    fun aTileChoosesTheAppearanceAndTheMapStyleAtOnce() {
        show()
        compose.onNodeWithText("Dark").performClick()
        compose.onNodeWithText("Quiet").performClick()
        compose.waitForIdle()
        assertEquals(ScooterAppearance.Dark, model.appearance.value)
        assertEquals(AppleMapStyle.Quiet, model.mapStyle.value)
        compose.onNodeWithText("Dark").assertIsSelected()
        // Satellite stays out while the app has no imagery (NEEDS-USER #3).
        assertTrue(compose.onAllNodes(hasText("Satellite")).fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun choosingALanguageShowsTheSheetInItAtOnce() {
        show(listOf(SettingsPage.Root, SettingsPage.Language))
        compose.onNodeWithText("Français").performClick()
        compose.waitForIdle()
        assertEquals(ScooterLanguage.Fr, model.language.value)
        compose.onNode(title("Langue")).assertExists()
        compose.onNodeWithText("Français").assertIsSelected()
    }

    @Test
    fun thePassEditorKeepsEachChangeAsItIsMade() {
        show(listOf(SettingsPage.Root, SettingsPage.Pass(ScooterProvider.Bolt)))
        compose.onNodeWithText("I have a pass").assertIsOff().performClick()
        compose.waitForIdle()
        assertTrue(model.ridePass(ScooterProvider.Bolt).enabled)

        compose.onNodeWithText("Free unlock").performClick()
        compose.onNodeWithContentDescription("Free minutes available").performSemanticsAction(SemanticsActions.SetProgress) { it(20f) }
        compose.waitForIdle()
        assertTrue(model.ridePass(ScooterProvider.Bolt).freeUnlock)
        assertEquals(20, model.ridePass(ScooterProvider.Bolt).freeMinutes)

        // An expiry date starts a month from now, and goes again with the switch.
        compose.onNodeWithText("Has expiry date").performClick()
        compose.waitForIdle()
        val zone = ZoneId.of("Europe/Zurich")
        assertEquals(clock.now.atZone(zone).plusMonths(1).toInstant(), model.ridePass(ScooterProvider.Bolt).expiryDate)
        compose.onNodeWithText("Valid through").assertExists()
        compose.onNodeWithText("Has expiry date").assertIsOn().performClick()
        compose.waitForIdle()
        assertEquals(null, model.ridePass(ScooterProvider.Bolt).expiryDate)
    }

    @Test
    fun turningUsageOffIsKeptWhereAnalyticsReadsIt() {
        show(listOf(SettingsPage.Root, SettingsPage.Privacy))
        compose.onNodeWithText("Share anonymous usage").assertIsOn().performClick()
        compose.waitForIdle()
        assertTrue(defaults.bool(forKey = ScooterAnalytics.disabledKey))
        compose.onNodeWithText("Share anonymous usage").assertIsOff().performClick()
        assertFalse(defaults.bool(forKey = ScooterAnalytics.disabledKey))
    }
}
