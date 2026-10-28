package com.plhery.scootradar.ui

import android.graphics.Rect
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.window.layout.FoldingFeature
import androidx.window.testing.layout.FoldingFeature
import com.plhery.scootradar.core.model.ScooterFold
import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith

// T239 on Android: the fold WindowManager gives, as reservedFold(in:) of ios/ScootRadar/Views/ScooterMapScreen.swift
// reads iOS's division. ScooterMapControllerTest has ScooterFold's own geometry (T239–T243).

/** The fold of a partly open foldable read from WindowManager's display features, in the window's points. */
@RunWith(AndroidJUnit4::class)
class WindowFoldTest {
    /** An iPhone Duo's window upright, 669 × 951 points, at two pixels to the point. */
    private val window = Rect(0, 0, 1338, 1902)
    private val screen = ScreenRect(0.0, 0.0, 669.0, 951.0)

    @Test
    fun theFoldIsTheActiveDivisionMovedIntoWindowCoordinates() {
        // A hinge 20 points wide across the middle, standing like a laptop.
        val hinge = FoldingFeature(window, center = 950, size = 40, state = FoldingFeature.State.HALF_OPENED)
        val fold = windowFold(listOf(hinge), screen, density = 2f)
        assertEquals(ScreenRect(0.0, 465.0, 669.0, 20.0), fold)
        assertEquals(true, fold?.let(ScooterFold::isAcross))
        // A screen lower in the window measures from its own origin, and hands the fold back in the window's points.
        assertEquals(fold, windowFold(listOf(hinge), screen.offsetBy(0.0, 24.0), density = 2f))
    }

    @Test
    fun aSeamlessFoldIsAPixelWide() {
        // Open like a book, folded along a line down the middle with no width.
        val line = FoldingFeature(window, state = FoldingFeature.State.HALF_OPENED, orientation = FoldingFeature.Orientation.VERTICAL)
        val fold = windowFold(listOf(line), screen, density = 2f)
        assertEquals(ScreenRect(334.5, 0.0, 0.5, 951.0), fold)
        assertEquals(false, fold?.let(ScooterFold::isAcross))
    }

    @Test
    fun flatThereIsNoFold() {
        val flat = FoldingFeature(window, size = 40, state = FoldingFeature.State.FLAT)
        assertNull(windowFold(listOf(flat), screen, density = 2f))
        assertNull(windowFold(emptyList(), screen, density = 2f))
    }
}
