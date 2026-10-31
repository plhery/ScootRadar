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
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.performClick
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
// later send it. Its edges (review-app-v findings 5 and 6): a gesture begun while a tapped page is still coming in,
// and a sheet shown again before it is down; and one begun while a page is still going (review-app-yz finding 1),
// which moves nothing, as iOS's swipe from the edge does not begin during a pop.

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

    /** How wide [matcher]'s node is drawn, frame by frame for [frames] frames, the clock held. */
    private fun widths(matcher: SemanticsMatcher, frames: Int): List<Float> =
        (1..frames).map { compose.mainClock.advanceTimeByFrame(); frame(matcher).width }

    /**
     * Filters let go all the way out and shown again 4 frames on, before it is down: it eases back from as small as
     * the gesture left it, 6% smaller, to its full size on the sheet's own spring, as it comes back up, not whole
     * again in one frame.
     */
    @Test
    fun aSheetShownAgainBeforeItIsDownEasesBackToItsFullSize() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                IosSheet(isPresented, onDismiss = { isPresented = false }, listOf(SheetDetent.Large), "Filters") { Box(Modifier.fillMaxSize()) }
            }
        }
        compose.waitForIdle()
        val sheet = pane("Filters")
        drawOut(1f)
        letGo(frames = 4)
        assertFalse(isPresented)
        assertEquals("as small as the gesture left it", 390f * 0.94f, frame(sheet).width, 0.5f)

        compose.runOnUiThread { isPresented = true }
        val back = widths(sheet, frames = 4)
        assertTrue("easing back, not whole at once: $back", back.all { it < 388f } && back.zipWithNext().all { (a, b) -> b >= a - 0.01f })
        assertTrue("on its way: $back", back.last() > back.first())
        settle()
        assertEquals(390f, frame(sheet).width, 0.5f)
        assertTrue(isPresented)
    }

    /** Settings beside a panel, let go and shown again before it is down: the form does as the sheet does. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun aFormSheetShownAgainBeforeItIsDownEasesBackToItsFullSize() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                IosFormSheet(isPresented, onDismiss = { isPresented = false }, title = "Settings") { Box(Modifier.fillMaxSize()) }
            }
        }
        compose.waitForIdle()
        val form = pane("Settings")
        drawOut(1f)
        letGo(frames = 4)
        assertFalse(isPresented)
        assertEquals("as small as the gesture left it", 540f * 0.94f, frame(form).width, 0.5f)

        compose.runOnUiThread { isPresented = true }
        val back = widths(form, frames = 4)
        assertTrue("easing back, not whole at once: $back", back.all { it < 538f } && back.zipWithNext().all { (a, b) -> b >= a - 0.01f })
        assertTrue("on its way: $back", back.last() > back.first())
        settle()
        assertEquals(540f, frame(form).width, 0.5f)
        assertTrue(isPresented)
    }

    private val page = SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange)
    private val privacy = page and hasAnyDescendant(hasText("Share anonymous usage"))
    private val settings = page and hasAnyDescendant(hasText("Map & data credits"))

    private fun title(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

    /** Settings' sheet, 390 wide, with Privacy over Settings. */
    private fun privacyOverSettings(reduceMotion: Boolean) = settingsSheet(listOf(SettingsPage.Root, SettingsPage.Privacy), reduceMotion)

    /** Settings' sheet, 390 wide, with [pages] open. */
    private fun settingsSheet(pages: List<SettingsPage>, reduceMotion: Boolean) {
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
                        pages = pages,
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
     * A back gesture begun while Privacy, tapped, is still coming in, 200 ms after the tap: the push ends at once, as
     * iOS lets a push end before any swipe moves a page, and Privacy follows the gesture from its place, Settings
     * under it from a third of the way, on the next frames, not once the push has run its course: half drawn out,
     * Privacy half way to the screen's end and Settings a sixth of the width from its place. Called off, Privacy is
     * in its place.
     */
    @Test
    fun aGestureBegunWhileATappedPageIsComingInFollowsItFromThePagesPlace() {
        privacyComingIn()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackStarted(event(0f)) }
        compose.mainClock.advanceTimeByFrame()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(0.5f)) }
        repeat(3) { compose.mainClock.advanceTimeByFrame() }
        assertEquals(195f, start(privacy), 1f)
        assertEquals(-65f, start(settings), 1f)
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(0.7f)) }
        repeat(2) { compose.mainClock.advanceTimeByFrame() }
        assertEquals(273f, start(privacy), 1f)
        assertEquals(-39f, start(settings), 1f)

        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackCancelled() }
        settle()
        assertEquals(0f, start(privacy), 0.5f)
        assertTrue("Settings is under Privacy again", compose.onAllNodes(settings).fetchSemanticsNodes().isEmpty())
        compose.onNode(title("Privacy")).assertExists()
    }

    /** The same gesture let go: Privacy goes on from where the gesture left it, and Settings is there. */
    @Test
    fun aGestureBegunWhileATappedPageIsComingInGoesWhenItIsLetGo() {
        privacyComingIn()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackStarted(event(0f)) }
        compose.mainClock.advanceTimeByFrame()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(0.5f)) }
        repeat(3) { compose.mainClock.advanceTimeByFrame() }
        assertEquals(195f, start(privacy), 1f)

        letGo(frames = 2)
        val after = start(privacy)
        assertTrue("on from half way, not from its place: $after", after >= 195f && after < 390f)
        settle()
        assertEquals(0f, start(settings), 0.5f)
        compose.onNode(title("Settings")).assertExists()
        assertTrue(compose.onAllNodes(privacy).fetchSemanticsNodes().isEmpty())
        assertTrue(compose.onAllNodes(title("Privacy")).fetchSemanticsNodes().isEmpty())
    }

    /** Settings alone, Privacy tapped and 200 ms on its way in, the clock held. */
    private fun privacyComingIn() {
        settingsSheet(listOf(SettingsPage.Root), reduceMotion = false)
        compose.mainClock.autoAdvance = false
        compose.onNode(hasText("Privacy")).performClick()
        // The tap's push begins once what it posted has run.
        compose.waitForIdle()
        compose.mainClock.advanceTimeBy(200)
        val coming = start(privacy)
        assertTrue("Privacy on its way in: $coming", coming > 1f && coming < 389f)
    }

    private val credits = page and hasAnyDescendant(hasText("OpenFreeMap · OpenStreetMap"))
    private val licences = page and hasAnyDescendant(hasText("Gson", substring = true))

    /** Where [matcher]'s node starts, in the window's points, or null where it is gone. */
    private fun startOrNull(matcher: SemanticsMatcher): Float? =
        compose.onAllNodes(matcher).fetchSemanticsNodes().singleOrNull()?.let { it.positionInRoot.x / compose.density.density }

    /** Open-source licences over Map & data credits over Settings, 390 wide. */
    private fun licencesOverCreditsOverSettings(reduceMotion: Boolean = false) =
        settingsSheet(listOf(SettingsPage.Root, SettingsPage.Credits, SettingsPage.Notices), reduceMotion)

    /** The licences let go of half drawn out: 3 frames on, they run out from half way, the clock held. */
    private fun licencesLetGo() {
        licencesOverCreditsOverSettings()
        drawOut(0.5f)
        letGo(frames = 3)
        val going = start(licences)
        assertTrue("the licences on their way out: $going", going > 195.5f && going < 300f)
    }

    /** Back tapped on the licences: 4 frames on, they are on their way out on a pop's spring, the clock held. */
    private fun licencesBackTapped() {
        licencesOverCreditsOverSettings()
        compose.mainClock.autoAdvance = false
        compose.onNode(hasContentDescription("Back")).performClick()
        repeat(4) { compose.mainClock.advanceTimeByFrame() }
        val going = start(licences)
        assertTrue("the licences on their way out: $going", going > 1f && going < 300f)
    }

    /**
     * A second gesture begun as the licences go, drawn out to 0.3 then 0.5 over 6 frames, the clock held. As iOS's
     * swipe does not begin during a pop, the licences run out as they were: on the screen and further out each
     * frame, not gone; Map & data credits comes in under them from a third of the way, not drawn along by the
     * gesture, and Settings stays under it.
     */
    private fun aSecondGestureMovesNothing() {
        val path = mutableListOf(start(licences))
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackStarted(event(0f)) }
        compose.mainClock.advanceTimeByFrame()
        for (progress in listOf(0.3f, 0.3f, 0.3f, 0.5f, 0.5f, 0.5f)) {
            compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(progress)) }
            compose.mainClock.advanceTimeByFrame()
            val going = startOrNull(licences)
            assertTrue("the licences gone ${path.size} frames after the gesture began: $path", going != null)
            path += going!!
            val under = start(credits)
            assertTrue("the credits drawn along by the gesture at $progress: $under ($path)", under <= 0.5f)
            assertTrue("Settings comes in at $progress ($path)", compose.onAllNodes(settings).fetchSemanticsNodes().isEmpty())
        }
        assertTrue("the licences run out, further each frame: $path", path.zipWithNext().all { (a, b) -> b > a })
        assertTrue("the licences on the screen: $path", path.last() < 390f)
    }

    /** Once all is still: the credits alone in their place with their title, the licences gone and Settings under. */
    private fun assertTheCreditsAreAloneInPlace() {
        settle()
        val place = startOrNull(credits)
        assertTrue("the credits taken away too", place != null)
        assertEquals(0f, place!!, 0.5f)
        compose.onNode(title("Map & data credits")).assertExists()
        assertTrue("the licences gone", compose.onAllNodes(licences).fetchSemanticsNodes().isEmpty())
        assertTrue("Settings under the credits", compose.onAllNodes(settings).fetchSemanticsNodes().isEmpty())
        assertTrue(compose.onAllNodes(title("Settings")).fetchSemanticsNodes().isEmpty())
    }

    /**
     * Review-app-yz finding 1: the licences let go of half drawn out run out, and a second gesture begun on their
     * way, drawn out and called off, moves nothing: they run out, and the credits are alone in their place.
     */
    @Test
    fun aGestureBegunWhileALetGoPageIsGoingLeavesItToRunOutAndCalledOffChangesNothing() {
        licencesLetGo()
        aSecondGestureMovesNothing()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackCancelled() }
        assertTheCreditsAreAloneInPlace()
    }

    /** The same second gesture let go takes no page away: the credits stay, Settings under them. */
    @Test
    fun aGestureBegunWhileALetGoPageIsGoingTakesNoOtherPageWhenItIsLetGo() {
        licencesLetGo()
        aSecondGestureMovesNothing()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        assertTheCreditsAreAloneInPlace()
    }

    /** Back tapped on the licences, and a gesture begun as they go, drawn out and called off: it moves nothing. */
    @Test
    fun aGestureBegunWhileATappedBackPageIsGoingLeavesItToRunOutAndCalledOffChangesNothing() {
        licencesBackTapped()
        aSecondGestureMovesNothing()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackCancelled() }
        assertTheCreditsAreAloneInPlace()
    }

    /** The same gesture let go takes no page away. */
    @Test
    fun aGestureBegunWhileATappedBackPageIsGoingTakesNoOtherPageWhenItIsLetGo() {
        licencesBackTapped()
        aSecondGestureMovesNothing()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        assertTheCreditsAreAloneInPlace()
    }

    /**
     * Android 12, which sends no gesture's progress, only Back as it is let go: a Back while the licences go takes
     * no page away either.
     */
    @Test
    fun aBackWithoutAGestureWhileAPageIsGoingTakesNoOtherPage() {
        licencesBackTapped()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        repeat(2) { compose.mainClock.advanceTimeByFrame() }
        assertTrue("the licences still going", startOrNull(licences) != null)
        assertTheCreditsAreAloneInPlace()
    }

    /**
     * Settings' sheet with Privacy over Settings, Back tapped: while Privacy goes, the last page over Settings, a
     * gesture is still Settings' own, not the sheet's under it: drawn out, the sheet keeps its size, also once Privacy
     * is gone under the held gesture; let go, the sheet stays up, Settings in it.
     */
    @Test
    fun aGestureBegunWhileTheLastPageGoesLeavesTheSheetUp() {
        val clock = TestClock()
        val model = controllers.make(EmptyScooterAPI, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = false, reduceMotion = false) {
                    IosSheet(isPresented, onDismiss = { isPresented = false }, listOf(SheetDetent.Large), "Settings") { bottomInset ->
                        ScooterSettingsSheet(
                            controller = model,
                            bottomInset = bottomInset,
                            defaults = InMemoryScooterDefaults(),
                            onDone = { isPresented = false },
                            passProviders = emptyList(),
                            sources = emptyList(),
                            pages = listOf(SettingsPage.Root, SettingsPage.Privacy),
                        )
                    }
                }
            }
        }
        compose.waitForIdle()
        val sheet = pane("Settings")
        compose.mainClock.autoAdvance = false
        compose.onNode(hasContentDescription("Back")).performClick()
        repeat(4) { compose.mainClock.advanceTimeByFrame() }
        assertTrue("Privacy on its way out", startOrNull(privacy) != null)

        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackStarted(event(0f)) }
        compose.mainClock.advanceTimeByFrame()
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(0.5f)) }
        repeat(3) { compose.mainClock.advanceTimeByFrame() }
        assertEquals("the sheet drawn along by the gesture", 390f, frame(sheet).width, 0.5f)
        // Held on until Privacy is gone, then let go.
        repeat(60) { compose.mainClock.advanceTimeByFrame() }
        assertTrue("Privacy gone", compose.onAllNodes(privacy).fetchSemanticsNodes().isEmpty())
        assertEquals("the sheet drawn along by the gesture once Privacy is gone", 390f, frame(sheet).width, 0.5f)
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        settle()
        assertTrue("the sheet closed", isPresented)
        assertEquals(390f, frame(sheet).width, 0.5f)
        assertEquals(0f, start(settings), 0.5f)
        assertTrue(compose.onAllNodes(privacy).fetchSemanticsNodes().isEmpty())
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

    /**
     * Remove animations: Back tapped on the licences puts the credits in their place in the frame of the tap, and no
     * page is going then, as none is on the iPhone, whose pop has no animation. A Back right after it takes the credits
     * away too: in the tap's frame, or 1 or 2 frames on, while the pages' transition still ran out its snap, it was
     * taken for a Back during a pop and did nothing (review-app-aa-ab finding 3). Settings is alone in its place.
     */
    @Test
    fun underRemoveAnimationsABackInTheFrameOfATappedBackTakesTheNextPage() = backAfterATappedBack(frames = 0)

    @Test
    fun underRemoveAnimationsABackAFrameAfterATappedBackTakesTheNextPage() = backAfterATappedBack(frames = 1)

    @Test
    fun underRemoveAnimationsABackTwoFramesAfterATappedBackTakesTheNextPage() = backAfterATappedBack(frames = 2)

    /** The same with a gesture begun a frame after the tap, drawn out half way and let go. */
    @Test
    fun underRemoveAnimationsAGestureJustAfterATappedBackTakesTheNextPageWhenItIsLetGo() =
        backAfterATappedBack(frames = 1, gesture = true)

    private fun backAfterATappedBack(frames: Int, gesture: Boolean = false) {
        licencesOverCreditsOverSettings(reduceMotion = true)
        compose.mainClock.autoAdvance = false
        compose.onNode(hasContentDescription("Back")).performClick()
        repeat(frames) { compose.mainClock.advanceTimeByFrame() }
        if (gesture) {
            compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackStarted(event(0f)) }
            compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackProgressed(event(0.5f)) }
            compose.mainClock.advanceTimeByFrame()
        }
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        settle()
        val place = startOrNull(settings)
        assertTrue("Settings back $frames frames after the tap", place != null)
        assertEquals(0f, place!!, 0.5f)
        compose.onNode(title("Settings")).assertExists()
        assertTrue("the credits gone", compose.onAllNodes(credits).fetchSemanticsNodes().isEmpty())
        assertTrue("the licences gone", compose.onAllNodes(licences).fetchSemanticsNodes().isEmpty())
    }
}
