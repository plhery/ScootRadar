package com.plhery.scootradar.ui

import androidx.activity.BackEventCompat
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.settings.SettingsPage
import com.plhery.scootradar.ui.sheet.IosFormSheet
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
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

// X.md X-AD02 and ui.md UI-210: Android's back gesture, drawn out, as iOS's swipe. A sheet shrinks with it, as an
// iOS sheet follows a swipe down, and a page of Settings slides with it, as a NavigationStack's page follows a swipe
// from the edge; let go, each goes on from where the gesture left it, and called off, each stays. The search, which
// iOS has no gesture for, is in BackOrderTest. The gesture's progress comes through the dispatcher, as Android 14 and
// later send it.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class PredictiveBackTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

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

    private var isPresented by mutableStateOf(true)

    private fun pane(title: String) = SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, title)

    /** Where [matcher]'s node is drawn, in the window's points, as far as the screen shows it. */
    private fun frame(matcher: SemanticsMatcher): Rect {
        val bounds = compose.onNode(matcher).fetchSemanticsNode().boundsInRoot
        val density = compose.density.density
        return Rect(bounds.left / density, bounds.top / density, bounds.right / density, bounds.bottom / density)
    }

    /** Where [matcher]'s node starts, in the window's points, on the screen or off it. */
    private fun start(matcher: SemanticsMatcher): Float = compose.onNode(matcher).fetchSemanticsNode().positionInRoot.x / compose.density.density

    /** A back gesture from the screen's start edge, drawn out to [progress]. */
    private fun drawOut(progress: Float) {
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackStarted(event(0f)) }
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(progress)) }
        compose.waitForIdle()
    }

    private fun callOff() {
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackCancelled() }
        compose.waitForIdle()
    }

    /** The gesture let go, and the screen [frames] frames on, still moving. */
    private fun letGo(frames: Int = 3) {
        compose.mainClock.autoAdvance = false
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        repeat(frames) { compose.mainClock.advanceTimeByFrame() }
    }

    /** The rest of what was moving. */
    private fun settle() {
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
    }

    private fun event(progress: Float) = BackEventCompat(touchX = 0f, touchY = 400f, progress = progress, swipeEdge = BackEventCompat.EDGE_LEFT)

    /** Filters on a phone: at the large height, 390 wide; half drawn out, 3% smaller, toward the screen's foot. */
    @Test
    fun aSheetShrinksWithTheGestureAndGoesDownAsSmallAsTheGestureLeftIt() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                IosSheet(isPresented, onDismiss = { isPresented = false }, listOf(SheetDetent.Large), "Filters") { Box(Modifier.fillMaxSize()) }
            }
        }
        compose.waitForIdle()
        val sheet = pane("Filters")
        assertEquals(390f, frame(sheet).width, 0.5f)

        drawOut(0.5f)
        assertEquals(390f * 0.97f, frame(sheet).width, 0.5f)
        assertEquals("toward the screen's foot", 844f, frame(sheet).bottom, 0.5f)
        callOff()
        assertEquals("called off, it is whole again", 390f, frame(sheet).width, 0.5f)
        assertTrue(isPresented)

        drawOut(0.5f)
        val top = frame(sheet).top
        letGo()
        assertFalse(isPresented)
        assertEquals("as small as the gesture left it", 390f * 0.97f, frame(sheet).width, 0.5f)
        assertTrue("on its way down: ${frame(sheet).top}", frame(sheet).top > top + 1f)
        settle()
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
    }

    /** Settings beside a panel: the form, 540 wide, does as the sheet does. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun aFormSheetShrinksWithTheGestureAndGoesDownAsSmallAsTheGestureLeftIt() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                IosFormSheet(isPresented, onDismiss = { isPresented = false }, title = "Settings") { Box(Modifier.fillMaxSize()) }
            }
        }
        compose.waitForIdle()
        val form = pane("Settings")
        assertEquals(540f, frame(form).width, 0.5f)
        val foot = frame(form).bottom

        drawOut(0.5f)
        assertEquals(540f * 0.97f, frame(form).width, 0.5f)
        assertEquals(foot, frame(form).bottom, 0.5f)
        callOff()
        assertEquals(540f, frame(form).width, 0.5f)
        assertTrue(isPresented)

        drawOut(0.5f)
        letGo()
        assertFalse(isPresented)
        assertEquals("as small as the gesture left it", 540f * 0.97f, frame(form).width, 0.5f)
        assertTrue("on its way down", frame(form).bottom > foot + 1f)
        settle()
        assertTrue(compose.onAllNodes(form).fetchSemanticsNodes().isEmpty())
    }

    private val page = SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange)
    private val privacy = page and hasAnyDescendant(hasText("Share anonymous usage"))
    private val settings = page and hasAnyDescendant(hasText("Map & data credits"))

    private fun title(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

    /** Settings' sheet, 390 wide, with Privacy over Settings. */
    private fun privacyOverSettings(reduceMotion: Boolean) {
        val clock = TestClock()
        val model = controllers.make(EmptyScooterAPI, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = false, reduceMotion = reduceMotion) {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = InMemoryScooterDefaults(),
                        onDone = { },
                        passProviders = emptyList(),
                        sources = emptyList(),
                        pages = listOf(SettingsPage.Root, SettingsPage.Privacy),
                    )
                }
            }
        }
        compose.waitForIdle()
    }

    /**
     * Privacy over Settings, 390 wide: half drawn out, Privacy is half way to the screen's end and Settings a sixth of
     * the width from its place, as a third of the way slid back; both titles are there, cross-fading. Called off,
     * Privacy is back in its place; let go, it goes on from half way.
     */
    @Test
    fun aSettingsPageFollowsTheGestureGoesWhenItIsLetGoAndStaysWhenItIsCalledOff() {
        privacyOverSettings(reduceMotion = false)
        assertEquals(0f, start(privacy), 0.5f)
        assertTrue(compose.onAllNodes(settings).fetchSemanticsNodes().isEmpty())

        drawOut(0.5f)
        assertEquals(195f, start(privacy), 1f)
        assertEquals(-65f, start(settings), 1f)
        compose.onNode(title("Privacy")).assertExists()
        compose.onNode(title("Settings")).assertExists()

        callOff()
        assertEquals(0f, start(privacy), 0.5f)
        assertTrue("Settings is under Privacy again", compose.onAllNodes(settings).fetchSemanticsNodes().isEmpty())
        assertTrue(compose.onAllNodes(title("Settings")).fetchSemanticsNodes().isEmpty())

        drawOut(0.5f)
        letGo(frames = 2)
        val after = start(privacy)
        assertTrue("on from half way, not from its place: $after", after >= 195f && after < 390f)
        settle()
        compose.onNode(title("Settings")).assertExists()
        assertTrue(compose.onAllNodes(privacy).fetchSemanticsNodes().isEmpty())
        assertTrue(compose.onAllNodes(title("Privacy")).fetchSemanticsNodes().isEmpty())
    }

    /**
     * Remove animations: as a tap's push and pop swap the pages at once, nothing moves while the gesture is drawn
     * out. Privacy stays alone in its place, and its title alone, until the gesture is let go; then Settings is there.
     */
    @Test
    fun underRemoveAnimationsTheSettingsPageStaysUntilTheGestureIsLetGo() {
        privacyOverSettings(reduceMotion = true)

        drawOut(0.5f)
        assertEquals(0f, start(privacy), 0.5f)
        assertTrue("Settings is under Privacy", compose.onAllNodes(settings).fetchSemanticsNodes().isEmpty())
        assertTrue("Privacy's title alone", compose.onAllNodes(title("Settings")).fetchSemanticsNodes().isEmpty())
        callOff()
        assertEquals(0f, start(privacy), 0.5f)

        drawOut(0.5f)
        letGo(frames = 1)
        settle()
        assertEquals(0f, start(settings), 0.5f)
        compose.onNode(title("Settings")).assertExists()
        assertTrue(compose.onAllNodes(privacy).fetchSemanticsNodes().isEmpty())
    }
}
