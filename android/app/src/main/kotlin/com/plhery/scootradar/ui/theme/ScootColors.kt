package com.plhery.scootradar.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterMapLook

// ScooterPalette in ios/ScootRadar/Views/ScooterControls.swift, and the system colours it leans on (ui.md §10).

/** The app's colours in one appearance, light or dark. */
@Immutable
data class ScootColors(
    val isDark: Boolean,
    /**
     * Blue under white text: Near me, Show results, the checks in Filters. iOS's (0, 0.42, 0.9), which the simulator
     * draws #006BE5 in both appearances (ui346), not 0.9 × 255 rounded up.
     */
    val actionFill: Color,
    /** Blue text and symbols on the glass. */
    val actionText: Color,
    val warning: Color,
    val good: Color,
    val critical: Color,
    /** Red under white text: the banner's action. */
    val criticalFill: Color,
    val secondaryText: Color,
    val dockText: Color,
    val dockSecondary: Color,
    val dockQuiet: Color,
    /** Unselected chips. */
    val dockRaised: Color,
    /** The figure cells and the close button. */
    val dockTile: Color,
    /** Quiet action buttons. */
    val dockQuietFill: Color,
    /** The 1 pt borders. */
    val dockHairline: Color,
    /** The text of selected chips. */
    val dockGround: Color,
    /** Prominent card buttons. */
    val cardActionFill: Color,
    /** The app's tint, systemBlue as iOS 26 made it, as UIKit draws it: toggles, checks, links, Done (UI-346). */
    val accent: Color,
    /**
     * The tint as SwiftUI's `Color.accentColor` draws it, a step stronger than [accent] with Increase Contrast: the
     * chosen tile in Settings, a Label's symbol in a form row (UI-346).
     */
    val accentColor: Color,
    val systemBackground: Color,
    val systemGroupedBackground: Color,
    val secondarySystemGroupedBackground: Color,
    /** `.primary`. */
    val label: Color,
    /** `.secondary`. */
    val secondaryLabel: Color,
    val tertiaryLabel: Color,
    val quaternaryLabel: Color,
    val tertiarySystemFill: Color,
    val quaternarySystemFill: Color,
    val systemGray2: Color,
    val separator: Color,
    val systemGreen: Color,
    val zoneNoRiding: Color,
    val zoneNoParking: Color,
    val zoneSlow: Color,
    /**
     * What the chrome's glass is tinted with, so small text stays readable over the map. With [glassFrost], 40% of
     * the blurred map shows through by day and 45% by night (app-aw): the text on the glass keeps 4.5:1, and its
     * secondary text 3:1, over the darkest the blurred map gets by day (a no riding zone over water, a cluster of
     * near-black dots) and the lightest by night (a no riding zone over a main street, a cluster of near-white dots).
     */
    val glassTint: Color,
    /** The frost of Liquid Glass itself, under the tint: how much lighter the blurred map is made. */
    val glassFrost: Color,
    /**
     * The glass where there is no blur: a translucent fill, tuned to the App Store screenshots' dock (about
     * #FBFEF8 over a cream map by day, #1A1C29 over a dark one by night). 14% of the map shows through, as much as
     * keeps its text at 4.5:1 and secondary text at 3:1 over anything sharp under it, black by day and white by
     * night.
     */
    val glassFill: Color,
    /** Whether these are [withIncreasedContrast]'s colours. */
    val isContrastIncreased: Boolean = false,
) {
    /** A provider's colour, or blue for none (ScooterControls.swift's providerAccent). */
    fun providerAccent(provider: ScooterProvider?): Color =
        if (provider == null) accent else Color(ScooterMapLook.dotColor(provider, isDark))

    /** A provider's dot colour, grey for none. */
    fun dot(provider: ScooterProvider?): Color = Color(ScooterMapLook.dotColor(provider, isDark))

    /** The colour of what is written on a provider's colour. */
    fun ink(on: ScooterProvider?): Color = Color(ScooterMapLook.ink(on, isDark))

    /**
     * The colours inside a sheet, which UIKit draws at the elevated level: in the dark the backgrounds are lighter,
     * so the sheet stands out from the dimmed map. Light has one level.
     */
    fun elevated(): ScootColors = when {
        !isDark -> this
        isContrastIncreased -> copy(
            systemBackground = Color(0xFF242426),
            systemGroupedBackground = Color(0xFF242426),
            secondarySystemGroupedBackground = Color(0xFF363638),
        )
        else -> copy(
            systemBackground = Color(0xFF1C1C1E),
            systemGroupedBackground = Color(0xFF1C1C1E),
            secondarySystemGroupedBackground = Color(0xFF2C2C2E),
        )
    }

    /**
     * The colours with Increase Contrast on (ui.md UI-186): the system colours take UIKit's high-contrast variants,
     * as UIKit resolves them for `accessibilityContrast == .high` (the fills as Mac Catalyst's UIKit gives them on
     * macOS 27; the labels, separators, backgrounds and green as Flutter's CupertinoColors copies them from iOS; the
     * blue as the iOS 27 simulator draws it, and `Color.accentColor` a step stronger: 0.8 of it by day, a quarter of
     * the way to white by night), and the glass gains an edge (chromeGlass). ScooterPalette's own colours stay as they are, but for the
     * dark halves of warning, good and critical, which are UIKit's orange, green and red and take theirs.
     */
    fun withIncreasedContrast(): ScootColors = when {
        isContrastIncreased -> this
        isDark -> copy(
            isContrastIncreased = true,
            accent = Color(0xFF5CB8FF),
            accentColor = Color(0xFF85CAFF),
            secondarySystemGroupedBackground = Color(0xFF242426),
            secondaryLabel = Color(0xADEBEBF5),
            tertiaryLabel = Color(0x60EBEBF5),
            quaternaryLabel = Color(0x3DEBEBF5),
            tertiarySystemFill = Color(0x52767680),
            quaternarySystemFill = Color(0x42767680),
            systemGray2 = Color(0xFF7C7C80),
            separator = Color(0xAD545458),
            systemGreen = Color(0xFF30DB5B),
            warning = Color(0xFFFFB340),
            good = Color(0xFF30DB5B),
            critical = Color(0xFFFF6961),
        )
        else -> copy(
            isContrastIncreased = true,
            accent = Color(0xFF1E6EF4),
            accentColor = Color(0xFF1858C3),
            systemGroupedBackground = Color(0xFFEBEBF0),
            secondaryLabel = Color(0xAD3C3C43),
            tertiaryLabel = Color(0x603C3C43),
            quaternaryLabel = Color(0x423C3C43),
            tertiarySystemFill = Color(0x33767680),
            quaternarySystemFill = Color(0x29747480),
            systemGray2 = Color(0xFF8E8E93),
            separator = Color(0x5E3C3C43),
            systemGreen = Color(0xFF248A3D),
        )
    }

    companion object {
        val Light = ScootColors(
            isDark = false,
            actionFill = Color(0xFF006BE5),
            actionText = Color(0xFF0059BE),
            warning = Color(0xFF8A4D00),
            good = Color(0xFF1C7833),
            critical = Color(0xFFB3261F),
            criticalFill = Color(0xFFC22624),
            secondaryText = Color(0xFF61636B),
            dockText = Color(0xFF10131A),
            dockSecondary = Color(0xFF3B4350),
            dockQuiet = Color(0xFF667080),
            dockRaised = Color.White,
            dockTile = Color.White.copy(alpha = 0.5f),
            dockQuietFill = Color(0xFF667080).copy(alpha = 0.17f),
            dockHairline = Color(0xFF10131A).copy(alpha = 0.1f),
            dockGround = Color(0xFFEEF0F4),
            cardActionFill = Color(0xFF0070EB),
            accent = Color(0xFF0088FF),
            accentColor = Color(0xFF0088FF),
            systemBackground = Color.White,
            systemGroupedBackground = Color(0xFFF2F2F7),
            secondarySystemGroupedBackground = Color.White,
            label = Color.Black,
            secondaryLabel = Color(0x993C3C43),
            tertiaryLabel = Color(0x4D3C3C43),
            quaternaryLabel = Color(0x2E3C3C43),
            tertiarySystemFill = Color(0x1F767680),
            quaternarySystemFill = Color(0x14747480),
            systemGray2 = Color(0xFFAEAEB2),
            separator = Color(0x4A3C3C43),
            systemGreen = Color(0xFF34C759),
            zoneNoRiding = Color(0xFFD92D20),
            zoneNoParking = Color(0xFFC05600),
            zoneSlow = Color(0xFF3E63DD),
            glassTint = Color.White.copy(alpha = 0.1f),
            glassFrost = Color.White.copy(alpha = 0.55f),
            glassFill = Color.White.copy(alpha = 0.86f),
        )

        val Dark = ScootColors(
            isDark = true,
            actionFill = Color(0xFF006BE5),
            actionText = Color(0xFF5CB0FF),
            warning = Color(0xFFFF9F0A),
            good = Color(0xFF30D158),
            critical = Color(0xFFFF453A),
            criticalFill = Color(0xFFC22624),
            secondaryText = Color(0x99EBEBF5),
            dockText = Color(0xFFF4F5F7),
            dockSecondary = Color(0xFFC5C9D1),
            dockQuiet = Color(0xFFA3A8B3),
            dockRaised = Color(0xFF161A24),
            dockTile = Color(0xFF161A24),
            dockQuietFill = Color(0xFF1D2330),
            dockHairline = Color.White.copy(alpha = 0.1f),
            dockGround = Color(0xFF0B0E14),
            cardActionFill = Color(0xFF0070EB),
            accent = Color(0xFF0091FF),
            accentColor = Color(0xFF0091FF),
            systemBackground = Color.Black,
            systemGroupedBackground = Color.Black,
            secondarySystemGroupedBackground = Color(0xFF1C1C1E),
            label = Color.White,
            secondaryLabel = Color(0x99EBEBF5),
            tertiaryLabel = Color(0x4DEBEBF5),
            quaternaryLabel = Color(0x29EBEBF5),
            tertiarySystemFill = Color(0x3D767680),
            quaternarySystemFill = Color(0x2E767680),
            systemGray2 = Color(0xFF636366),
            separator = Color(0x99545458),
            systemGreen = Color(0xFF30D158),
            zoneNoRiding = Color(0xFFFF6961),
            zoneNoParking = Color(0xFFFFB340),
            zoneSlow = Color(0xFF7C9CFF),
            glassTint = Color.Black.copy(alpha = 0.5f),
            glassFrost = Color.White.copy(alpha = 0.1f),
            glassFill = Color(0xFF1A1C29).copy(alpha = 0.86f),
        )
    }
}

val LocalScootColors = staticCompositionLocalOf { ScootColors.Light }
