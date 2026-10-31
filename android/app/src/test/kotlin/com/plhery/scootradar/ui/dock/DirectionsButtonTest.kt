package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.roundToIntRect
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterDirectionsControl
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.putFramesOnSurfaces
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs

// UI-198: ScooterControls.swift's DirectionsButton, a Label whose title and symbol each change by themselves.

/**
 * As the way is being found the Directions button keeps its title, and only its symbol gives way to the spinner: iOS
 * changes the Label's icon (the symbol's opacity, the spinner in its overlay) and leaves the Text, which has not
 * changed. A title that does change (Hide route as the way is found) fades into the new one.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w300dp-h200dp-xhdpi")
class DirectionsButtonTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private var control by mutableStateOf(ScooterDirectionsControl.Directions)

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
    fun asTheWayIsBeingFoundDirectionsStaysAsItIsAndOnlyItsSymbolGivesWayToTheSpinner() {
        titleStaysAsTheSpinnerComes()
    }

    /**
     * At a small text size the walker's symbol, 14 points at 0.85 and its frame's 1.2, is narrower than the Mini
     * spinner's 16: the spinner, in the symbol's overlay, still takes no room, and the title doesn't move (review-app-r).
     */
    @Test
    fun atASmallTextSizeTheSpinnerWiderThanTheSymbolTakesNoRoom() {
        useFontScale(0.85f)
        try {
            titleStaysAsTheSpinnerComes()
        } finally {
            resetFontScale()
        }
    }

    /**
     * Under Reduce Motion the button is Hide route's in one step, as the iPhone's nil animation changes it: from the
     * frame the walk changes, the button's pixels, its symbol's and its title's, are the settled Hide route's, not
     * the spinner's or Directions' a frame or two longer (review-app-w finding 4: the title's alone missed the symbol).
     */
    @Test
    fun underReduceMotionTheButtonIsHideRoutesAtOnce() {
        show(reduceMotion = true)
        control = ScooterDirectionsControl.Finding
        val finding = settled()
        control = ScooterDirectionsControl.HideRoute
        // Recomposition sees the change in the next frame.
        Snapshot.sendApplyNotifications()
        val frames = List(30) { frame() }
        val shown = settled()
        val title = placeOf("Hide route")
        assertTrue("the title's place $title", title.width > 40 && title.height > 10)
        // The symbol's place, before the title: the spinner there gives way to the cross.
        val symbol = (0 until title.left).count { x -> (0 until shown.height).any { y -> finding[x, y] != shown[x, y] } }
        assertTrue("the symbol's columns that change: $symbol", symbol > 10)
        frames.forEachIndexed { index, pixels ->
            val changed = (0 until shown.width).sumOf { x -> (0 until shown.height).count { y -> pixels[x, y] != shown[x, y] } }
            assertEquals("the button's pixels unlike Hide route's on frame ${index + 1}", 0, changed)
        }
    }

    /**
     * Each symbol is in `.dockActionStyle`'s bold, designFont(14, .bold) (ScooterControls.swift:965): Open in Maps'
     * map too, which the map's credits and the coverage card draw at regular and semibold (UI-364). The device matrix's
     * fold and tablet walkNoRoute screenshots (screenshots/matrix) show Open in Maps.
     */
    @Test
    fun theSymbolsAreInADockActionsBold() {
        assertSame(Symbols.walk, directionsSymbol(ScooterDirectionsControl.Directions))
        assertSame(Symbols.close, directionsSymbol(ScooterDirectionsControl.HideRoute))
        assertSame(Symbols.mapBold, directionsSymbol(ScooterDirectionsControl.OpenInMaps))
    }

    private fun titleStaysAsTheSpinnerComes() {
        show()
        val rest = settled()
        control = ScooterDirectionsControl.Finding
        val frames = List(30) { frame() }
        val finding = settled()

        // The title's columns: those inked at rest that are the same once the spinner has come.
        val title = rest.inkedColumns().filter { x -> (0 until rest.height).all { y -> rest[x, y] == finding[x, y] } }
        assertTrue("the title's columns $title", title.size > 80)
        // The symbol's place changes: the walker goes and the spinner comes.
        assertTrue(rest.inkedColumns().any { x -> (0 until rest.height).any { y -> rest[x, y] != finding[x, y] } })
        frames.forEachIndexed { index, pixels ->
            val changed = title.count { x -> (0 until rest.height).any { y -> pixels[x, y] != rest[x, y] } }
            assertEquals("the title's columns changed on frame ${index + 1}", 0, changed)
        }
    }

    @Test
    fun theWayFoundTheTitleFadesIntoHideRoute() {
        show()
        control = ScooterDirectionsControl.Finding
        settled()
        control = ScooterDirectionsControl.HideRoute
        val frames = List(30) { frame() }
        val shown = settled()

        // Halfway, Directions going and Hide route coming are each half there: nothing in the label is as dark as the
        // settled title. A title that changed in one step would be, from the first frame.
        val darkest = frames.take(12).map { it.ink() / shown.ink() }
        assertTrue("the label's darkest ink on its first frames, of the settled one's: $darkest", darkest.min() < 0.9f)
        assertTrue("the label's darkest ink once settled, of the settled one's: $darkest", frames.last().ink() / shown.ink() > 0.99f)
    }

    /** The scooter card's Directions button, on its first frame, the clock then left to the test. */
    private fun show(reduceMotion: Boolean = false) {
        val model = controllers.make(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val target = ScooterWalkTarget.Scooter(scooter("s1", "lime"))
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = reduceMotion) {
                Box(Modifier.width(240.dp).testTag("button")) {
                    DirectionsButton(model, target, control, prominent = false)
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
    }

    /** The button's pixels a frame on. */
    private fun frame(): PixelMap {
        compose.mainClock.advanceTimeByFrame()
        return pixels()
    }

    /** The button's pixels a second on, its animations over. */
    private fun settled(): PixelMap {
        compose.mainClock.advanceTimeBy(1_000)
        return pixels()
    }

    /** Where the [text] is in the button's pixels. */
    private fun placeOf(text: String): IntRect {
        val button = compose.onNodeWithTag("button").fetchSemanticsNode().boundsInRoot
        val title = compose.onNode(hasText(text), useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
        return title.translate(-button.topLeft).roundToIntRect()
    }

    private fun pixels(): PixelMap {
        compose.putFramesOnSurfaces()
        return compose.onNodeWithTag("button").captureToImage().toPixelMap()
    }

    /** The button's fill, beside its label in the 12 points before it. */
    private fun PixelMap.fill(): Color = this[width / 40, height / 2]

    /** The columns where the label draws something other than the fill. */
    private fun PixelMap.inkedColumns(): List<Int> {
        val fill = fill()
        return (width / 20 until width - width / 20).filter { x -> (0 until height).any { y -> this[x, y].distance(fill) > 0.02f } }
    }

    /** How far the label's darkest pixel is from the fill. */
    private fun PixelMap.ink(): Float {
        val fill = fill()
        return (0 until width).maxOf { x -> (0 until height).maxOf { y -> this[x, y].distance(fill) } }
    }

    private fun Color.distance(other: Color): Float = (abs(red - other.red) + abs(green - other.green) + abs(blue - other.blue)) / 3f
}
