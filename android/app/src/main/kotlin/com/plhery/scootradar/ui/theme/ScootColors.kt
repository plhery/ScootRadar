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
    /** Blue under white text: Near me, Show results, the checks in Filters. */
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
    /** The app's tint, systemBlue: toggles, links, Done. */
    val accent: Color,
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
    /** What the chrome's glass is tinted with, so small text stays readable over the map. */
    val glassTint: Color,
    /** The frost of Liquid Glass itself, under the tint: how much lighter the blurred map is made. */
    val glassFrost: Color,
    /**
     * The glass where there is no blur: a translucent fill, tuned to the App Store screenshots' dock (about
     * #FBFEF8 over a cream map by day, #1A1C29 over a dark one by night).
     */
    val glassFill: Color,
) {
    /** A provider's colour, or blue for none (ScooterControls.swift's providerAccent). */
    fun providerAccent(provider: ScooterProvider?): Color =
        if (provider == null) accent else Color(ScooterMapLook.dotColor(provider, isDark))

    /** A provider's dot colour, grey for none. */
    fun dot(provider: ScooterProvider?): Color = Color(ScooterMapLook.dotColor(provider, isDark))

    /** The colour of what is written on a provider's colour. */
    fun ink(on: ScooterProvider?): Color = Color(ScooterMapLook.ink(on, isDark))

    companion object {
        val Light = ScootColors(
            isDark = false,
            actionFill = Color(0xFF006BE6),
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
            accent = Color(0xFF007AFF),
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
            glassTint = Color.White.copy(alpha = 0.15f),
            glassFrost = Color.White.copy(alpha = 0.7f),
            glassFill = Color.White.copy(alpha = 0.9f),
        )

        val Dark = ScootColors(
            isDark = true,
            actionFill = Color(0xFF006BE6),
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
            accent = Color(0xFF0A84FF),
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
            glassTint = Color.Black.copy(alpha = 0.62f),
            glassFrost = Color.White.copy(alpha = 0.14f),
            glassFill = Color(0xFF1A1C29).copy(alpha = 0.94f),
        )
    }
}

val LocalScootColors = staticCompositionLocalOf { ScootColors.Light }
