package com.plhery.scootradar.ui.settings

import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * A pass's row under Settings › Passes on a 320-dp screen, where a phone's display size is set larger: the name keeps
 * its one line and the status the rest while the status shows whole in it; where it would not, the name wraps and the
 * status shows whole, as the iPhone's HStack shares the row.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w320dp-h569dp-xhdpi")
class PassRowTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val clock = TestClock()
    private val model = controllers.make(EmptyScooterAPI, clock)

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.Fr
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    private fun show(provider: ScooterProvider) {
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = false, reduceMotion = true) {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = null,
                        onDone = {},
                        passProviders = listOf(provider),
                        sources = emptyList(),
                    )
                }
            }
        }
        compose.waitForIdle()
    }

    private fun laidOut(text: String): TextLayoutResult {
        val node = compose.onNode(hasText(text), useUnmergedTree = true).fetchSemanticsNode()
        val results = mutableListOf<TextLayoutResult>()
        node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
        return results.single()
    }

    private val TextLayoutResult.isCut get() = multiParagraph.didExceedMaxLines || (0 until lineCount).any { isLineEllipsized(it) }

    @Test
    fun aLongNameWrapsSoThatItsPassStatusShowsWhole() {
        show(ScooterProvider.Publibike)

        // On one line, the name left "Non configuré" 46 dp, "Non c…".
        assertFalse(laidOut("Non configuré").isCut)
        assertEquals(2, laidOut("PubliBike / Velospot").lineCount)
    }

    @Test
    fun aShortNameKeepsItsLineAndLeavesTheStatusTheRest() {
        model.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 15, expiryDate = clock.now.plusSeconds(30L * 86_400)), ScooterProvider.Bolt)
        show(ScooterProvider.Bolt)

        // Two lines in the rest of the row; in half of it, the second would be cut.
        val status = laidOut("Déverrouillage gratuit · 15 min gratuites")
        assertFalse(status.isCut)
        assertEquals(2, status.lineCount)
        assertEquals(1, laidOut("Bolt").lineCount)
    }
}
