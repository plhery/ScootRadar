package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.sheet.FORM_SHEET_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Settings, open, speaks the language chosen in it at once: what TalkBack reads of the sheet itself, the dimmed map's
 * Close, the drag indicator's name and height, and the pane's title, as of the form beside a panel. They kept the
 * language the sheet opened in until it closed (after French, English read "Fermer" and "Poignée de feuille"), as the
 * sheet stays open through the change and only its content is laid out again (app-bf).
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w1280dp-h800dp-mdpi")
class OpenSheetLanguageTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun theSheetSpeaksTheLanguageChosenWhileItIsOpen() {
        val model = showSettings(width = 402.dp)
        assertSpoken(close = "Close", title = "Settings")
        assertGrabber("Sheet Grabber", "Half screen")

        choose(model, ScooterLanguage.Fr)
        assertSpoken(close = "Fermer", title = "Réglages", gone = listOf("Close", "Sheet Grabber"))
        assertGrabber("Poignée de feuille", "Fiche sur la moitié de l’écran")

        choose(model, ScooterLanguage.En)
        assertSpoken(close = "Close", title = "Settings", gone = listOf("Fermer", "Poignée de feuille"))
        assertGrabber("Sheet Grabber", "Half screen")
    }

    @Test
    fun theFormBesideAPanelSpeaksTheLanguageChosenWhileItIsOpen() {
        val model = showSettings(width = 1280.dp)
        assertEquals("Settings' form", true, shows(hasTestTag(FORM_SHEET_TAG)))
        assertSpoken(close = "Close", title = "Settings")

        choose(model, ScooterLanguage.De)
        assertSpoken(close = "Schliessen", title = "Einstellungen", gone = listOf("Close"))
    }

    /** The screen, Settings open from the dock or the panel. */
    private fun showSettings(width: Dp): ScooterMapController {
        val clock = TestClock()
        val model = DockState.ScooterCard.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                Box(Modifier.width(width).fillMaxHeight()) {
                    ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
                }
            }
        }
        compose.waitForIdle()
        compose.onNodeWithContentDescription("Settings").performClick()
        compose.waitForIdle()
        return model
    }

    private fun choose(model: ScooterMapController, language: ScooterLanguage) {
        compose.runOnIdle { model.setLanguageChoice(ScooterLanguageChoice.Language(language)) }
        compose.waitForIdle()
    }

    private fun shows(matcher: SemanticsMatcher) = compose.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()

    private fun assertSpoken(close: String, title: String, gone: List<String> = emptyList()) {
        assertEquals("the dimmed map's $close", true, shows(hasContentDescription(close)))
        assertEquals("the pane titled $title", true, shows(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, title)))
        for (old in gone) assertEquals("$old, of the language before", false, shows(hasContentDescription(old)))
    }

    private fun assertGrabber(name: String, height: String) {
        assertEquals(
            "the drag indicator, $name, $height",
            true,
            shows(hasContentDescription(name) and SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, height)),
        )
    }
}
