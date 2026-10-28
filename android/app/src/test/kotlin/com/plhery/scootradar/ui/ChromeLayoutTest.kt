package com.plhery.scootradar.ui

import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterChromeLayout.Dock
import com.plhery.scootradar.core.model.ScooterChromeLayout.Panel
import com.plhery.scootradar.map.MapKitCamera
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// UI-007, UI-008: Android's windows, in dp, given the iPhone's and the iPad's layouts. :core's
// ScooterMapControllerTest has iOS's own cases (T216–T220); these give them the size classes Android's windows have.

class ChromeLayoutTest {
    /** The layout of a window `width` by `height` dp, `sides` dp of its width outside the safe area, from either layout. */
    private fun layouts(width: Double, height: Double, sides: Double = 0.0, largeText: Boolean = false): List<ScooterChromeLayout> =
        listOf(Dock, Panel).map { chromeLayout(width - sides, SizeClasses.of(width, height), largeText, current = it) }

    private val dockBoth = listOf(Dock, Dock)
    private val panelBoth = listOf(Panel, Panel)
    private val asItWas = listOf(Dock, Panel)

    @Test
    fun aWindowIsRegularAcrossFrom600AndUpAndDownFrom480() {
        assertEquals(SizeClasses(regularWidth = false, regularHeight = true), SizeClasses.of(599.9, 900.0))
        assertEquals(SizeClasses(regularWidth = true, regularHeight = true), SizeClasses.of(600.0, 480.0))
        assertEquals(SizeClasses(regularWidth = true, regularHeight = false), SizeClasses.of(915.0, 479.9))
        assertTrue(SizeClasses.of(1280.0, 800.0).isRegular)
        assertFalse(SizeClasses.of(412.0, 915.0).isRegular)
        assertFalse(SizeClasses.of(915.0, 412.0).isRegular)
        // Only a window regular both ways takes the iPad's camera.
        assertEquals(MapKitCamera.IPad, SizeClasses.of(1280.0, 800.0).mapKit)
        assertEquals(MapKitCamera.IPhone, SizeClasses.of(915.0, 412.0).mapKit)
        assertEquals(MapKitCamera.IPhone, SizeClasses.of(412.0, 915.0).mapKit)
    }

    @Test
    fun aPhoneKeepsItsDockUprightAndSideways() {
        for (largeText in listOf(false, true)) {
            // Upright a phone is compact across; sideways compact up and down, however wide.
            for ((width, height) in listOf(360.0 to 800.0, 412.0 to 915.0, 448.0 to 998.0)) {
                assertEquals("$width", dockBoth, layouts(width, height, largeText = largeText))
                assertEquals("$height", dockBoth, layouts(height, width, sides = 48.0, largeText = largeText))
            }
        }
    }

    @Test
    fun aTabletShowsThePanelUprightAndSidewaysWhenTheMapStillHasRoomBesideIt() {
        for (largeText in listOf(false, true)) {
            // A 10-inch tablet, 1280×800 dp, either way up; an unfolded foldable, about 850×880.
            assertEquals(panelBoth, layouts(1280.0, 800.0, largeText = largeText))
            assertEquals(panelBoth, layouts(850.0, 880.0, largeText = largeText))
            assertEquals(panelBoth, layouts(841.0, 701.0, largeText = largeText))
        }
        assertEquals(panelBoth, layouts(800.0, 1280.0))
        // Upright with the largest text, 800 dp keeps the layout it had: 420 dp of panel and 380 of map.
        assertEquals(asItWas, layouts(800.0, 1280.0, largeText = true))
        // A small tablet upright keeps the dock, as iPad mini's 744 points do.
        assertEquals(dockBoth, layouts(744.0, 1133.0))
        assertEquals(dockBoth, layouts(744.0, 1133.0, largeText = true))
    }

    @Test
    fun aShortOrNarrowWindowKeepsTheDockHoweverWide() {
        // Compact up and down: a short, wide window on a tablet, or a large phone sideways.
        assertEquals(dockBoth, layouts(1280.0, 400.0))
        assertEquals(dockBoth, layouts(1280.0, 479.0))
        // Compact across: a narrow window on a tablet.
        assertEquals(dockBoth, layouts(599.0, 1280.0))
    }

    @Test
    fun aWindowResizedAcrossTheLineDoesNotSwitchBackAndForth() {
        // The panel opens with 20 dp to spare, and stays until the map would get less than 380.
        assertEquals(asItWas, layouts(779.0, 800.0))
        assertEquals(panelBoth, layouts(780.0, 800.0))
        assertEquals(asItWas, layouts(760.0, 800.0))
        assertEquals(dockBoth, layouts(759.0, 800.0))
        // At the accessibility sizes the panel is 420 dp.
        assertEquals(asItWas, layouts(819.0, 800.0, largeText = true))
        assertEquals(panelBoth, layouts(820.0, 800.0, largeText = true))
        assertEquals(asItWas, layouts(800.0, 800.0, largeText = true))
        assertEquals(dockBoth, layouts(799.0, 800.0, largeText = true))
    }

    @Test
    fun theWidthIsMeasuredInsideTheSafeArea() {
        // A cut-out or a bar down the side takes its share, as the iPhone Duo's does.
        assertEquals(panelBoth, layouts(840.0, 800.0))
        assertEquals(asItWas, layouts(840.0, 800.0, sides = 64.0))
        assertEquals(dockBoth, layouts(840.0, 800.0, sides = 81.0))
    }
}
