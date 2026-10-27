package com.plhery.scootradar.core.model

import kotlin.math.max

// ScooterFold from ios/ScootRadar/Views/ScooterMapScreen.swift; the rest of that file is the screen.

/**
 * The fold of a partly open folding phone, which the system reserves as a division of the window: there
 * while the phone is partly open, of no width flat. Open like a book and held sideways, it runs down the
 * middle of the window: the panel keeps to the leading half and the map centres what it shows in the
 * trailing one. Standing like a laptop, upright, it runs across: the map takes the upright half, and the
 * search bar, the notices and the dock go down to the half lying flat, within reach. The map stays whole
 * under both, and only what has to moves.
 */
object ScooterFold {
    /**
     * The fold among the `among` regions read in `container`, the frame of the screen in window
     * coordinates, in window coordinates too.
     */
    fun frame(among: List<ScreenRect>, container: ScreenRect): ScreenRect? =
        among.firstOrNull { !it.isEmpty }?.offsetBy(dx = container.minX, dy = container.minY)

    /** Whether the fold runs across the window, standing like a laptop, rather than down it, open like a book. */
    fun isAcross(fold: ScreenRect): Boolean = fold.standardized.width > fold.standardized.height

    /**
     * How far below the top of `container`, the screen in window coordinates, the search bar starts: under
     * a fold across it, and at its top otherwise.
     */
    fun chromeTop(below: ScreenRect?, container: ScreenRect): Double {
        val fold = below
        if (fold == null || !isAcross(fold) || !(fold.maxY > container.minY) || !(fold.maxY < container.maxY)) return 0.0
        return fold.maxY - container.minY
    }

    /** The narrowest the panel gets to keep clear of a fold. */
    const val minimumPanelWidth: Double = 320.0

    /**
     * The panel's `width` `beside` a fold down `container`, `inset` from its leading edge: as wide as it is,
     * unless that would reach the fold.
     */
    fun panelWidth(width: Double, beside: ScreenRect?, container: ScreenRect, inset: Double, rightToLeft: Boolean): Double {
        val fold = beside
        if (fold == null || isAcross(fold)) return width
        val room = if (rightToLeft) container.maxX - inset - fold.maxX else fold.minX - container.minX - inset
        if (!(room > 0 && room < width)) return width
        return max(minimumPanelWidth, room)
    }
}
