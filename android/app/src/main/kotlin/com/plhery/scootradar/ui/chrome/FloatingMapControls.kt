package com.plhery.scootradar.ui.chrome

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.snap
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.Spinner
import com.plhery.scootradar.ui.dock.SpinnerSize
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight

// FloatingMapControls in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-090, UI-091).

/**
 * The locate button above the dock. Until this phone has located once it is a labelled blue pill; after that the
 * round button is enough. Both are disabled while the rider is being found, with a spinner over the arrow.
 */
@Composable
fun FloatingMapControls(controller: ScooterMapController, modifier: Modifier = Modifier) {
    val hasLocatedOnce = controller.hasLocatedOnce.collectAsState().value
    val isLocating = controller.isLocating.collectAsState().value
    val reduceMotion = LocalReduceMotion.current
    val spring = IosMotion.snappy(duration = 0.28)
    AnimatedContent(
        targetState = hasLocatedOnce,
        modifier = modifier,
        contentAlignment = Alignment.BottomEnd,
        transitionSpec = {
            if (reduceMotion) {
                EnterTransition.None togetherWith ExitTransition.None using SizeTransform(clip = false) { _, _ -> snap() }
            } else {
                fadeIn(spring.animation()) togetherWith fadeOut(spring.animation()) using
                    SizeTransform(clip = false) { _, _ -> spring.animation() }
            }
        },
        label = "locate",
    ) { located ->
        if (located) {
            GoToMyLocation(isLocating, controller::focusOnUser)
        } else {
            NearMe(isLocating, controller::focusOnUser)
        }
    }
}

/**
 * The glass button's own margin around its label: an iPhone's `.glass` and `.glassProminent` buttons are 8 points
 * larger on each side than what they hold (the round one is 66 points across in the App Store screenshots).
 */
private val glassInset = 8.dp

/** The round glass button, after the first fix: the arrow, 18 points, in the app's blue. */
@Composable
private fun GoToMyLocation(isLocating: Boolean, onClick: () -> Unit) {
    val colors = scootColors
    val label = localized("Go to my location")
    val value = if (isLocating) localized("Finding your location…") else ""
    Box(
        Modifier
            .chromeGlass(CapsuleShape)
            .overTheMap()
            .plainButton(enabled = !isLocating, onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = label
                if (value.isNotEmpty()) stateDescription = value
                role = Role.Button
                if (isLocating) disabled()
                onClick { onClick(); true }
            }
            .padding(glassInset)
            .size(50.dp),
        contentAlignment = Alignment.Center,
    ) {
        Indicator(isLocating) { FixedSymbol(Symbols.locationFill, 18f, colors.accent) }
    }
}

/**
 * The blue pill before the first fix: the arrow and "Near me", in white, or in the text's colour on the grey a
 * disabled pill takes while the rider is being found.
 */
@Composable
private fun NearMe(isLocating: Boolean, onClick: () -> Unit) {
    val colors = scootColors
    val title = localized("Near me")
    val value = if (isLocating) localized("Finding your location…") else ""
    val foreground = if (isLocating) colors.label else Color.White
    Row(
        Modifier
            .iosShadow(CapsuleShape, colors.actionFill.copy(alpha = 0.28f), radius = 7.dp, y = 6.dp)
            .clip(CapsuleShape)
            .background(if (isLocating) colors.tertiarySystemFill else colors.actionFill)
            .overTheMap()
            .plainButton(enabled = !isLocating, onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = title
                if (value.isNotEmpty()) stateDescription = value
                role = Role.Button
                if (isLocating) disabled()
                onClick { onClick(); true }
            }
            .padding(horizontal = glassInset + 4.dp + 4.dp, vertical = glassInset)
            .heightIn(min = 40.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Indicator(isLocating) { SymbolIcon(Symbols.locationFill, textSymbolSize(17f), foreground) }
        Text(title, style = ScootType.body.weight(FontWeight.SemiBold), color = foreground, maxLines = 1)
    }
}

/** The arrow, hidden under a small spinner while the rider is being found. */
@Composable
private fun Indicator(isLocating: Boolean, arrow: @Composable () -> Unit) {
    Box(contentAlignment = Alignment.Center) {
        Box(Modifier.alpha(if (isLocating) 0f else 1f)) { arrow() }
        if (isLocating) Spinner(SpinnerSize.Small)
    }
}
