package com.plhery.scootradar.ui.dock

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.VectorConverter
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
import androidx.compose.ui.unit.round
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.allProviderCount
import com.plhery.scootradar.core.map.allProvidersSelected
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.designFont
import com.plhery.scootradar.ui.theme.scootColors
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.launch

// The panel's providers in ios/ScootRadar/Views/ScooterControls.swift: providerList and ProviderListRow (ui.md
// UI-108, UI-109).

/**
 * The providers one under the other, as the website's legend beside the map on a computer: "All providers", then
 * each provider with its dot, its count and a check while it is shown. A row does what its chip does, so a window
 * that goes from the panel to the dock changes nothing but the look. The rows and the lines between them run to the
 * edges of the card, and slide to their new places when the order changes.
 */
@Composable
internal fun ProviderList(controller: ScooterMapController, chips: List<ScooterProviderEntry>) {
    val colors = scootColors
    val motion = if (LocalReduceMotion.current) null else IosMotion.snappy(duration = 0.25)
    // "All providers" and the hints read these through the controller.
    controller.enabledProviders.collectAsState().value
    controller.visibleProviderCounts.collectAsState().value
    // The counts roll only in the animation of a new order, as `.numericText()` inside `.animation(value: order)`.
    val order = chips.map { it.provider }
    val lastOrder = remember { arrayOf(order) }
    val rolls = motion != null && order != lastOrder[0]
    SideEffect { lastOrder[0] = order }
    Column(
        Modifier.layout { measurable, constraints ->
            // padding(.horizontal, -16).
            val side = 16.dp.roundToPx()
            val placeable = measurable.measure(constraints.offset(horizontal = 2 * side))
            layout(placeable.width - 2 * side, placeable.height) { placeable.place(-side, 0) }
        },
    ) {
        ProviderListRow(
            title = localized("All providers"),
            accessibilityTitle = localized("All providers"),
            count = controller.allProviderCount,
            color = null,
            isShown = controller.allProvidersSelected,
            onClick = controller::showAllProviders,
            countRolls = rolls,
        )
        chips.forEach { entry ->
            key(entry.provider.id) {
                ProviderListRow(
                    title = entry.provider.displayName,
                    accessibilityTitle = if (entry.isDown) entry.downLabel else entry.provider.displayName,
                    count = entry.count,
                    color = colors.providerAccent(entry.provider),
                    isShown = entry.isEnabled,
                    isDown = entry.isDown,
                    hint = quickProviderHint(controller, entry.provider),
                    onClick = { controller.toggleQuickProvider(entry.provider) },
                    countRolls = rolls,
                    modifier = Modifier.slidesToItsPlace(motion?.animation()),
                )
            }
        }
    }
}

/**
 * A row of the panel's providers: the provider's dot, its name, its count or a warning while it isn't sharing data,
 * and a check while it is shown, dashed while it is shown but down. 44 points high at least, under a line.
 */
@Composable
internal fun ProviderListRow(
    title: String,
    accessibilityTitle: String,
    count: Int,
    /** The provider's colour; none for "All providers". */
    color: Color?,
    /** Shown on the map: the check, and the selected state for TalkBack. */
    isShown: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isDown: Boolean = false,
    hint: String? = null,
    countRolls: Boolean = false,
) {
    val colors = scootColors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    val label = chipAccessibilityLabel(accessibilityTitle, count, isDown)
    val shown = if (isShown) localized("Shown") else localized("Hidden")
    // @ScaledMetric(relativeTo: .subheadline), whose text is 15 points.
    val checkSize = scaledMetric(20f, 15f)
    Row(
        modifier
            .fillMaxWidth()
            .clickable(interaction, indication = null, role = Role.Button, onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = label
                stateDescription = shown
                selected = isShown
                role = Role.Button
                onClick(label = hint) { onClick(); true }
            }
            .drawBehind { drawRect(colors.dockHairline, size = Size(size.width, 1.dp.toPx())) }
            .heightIn(min = 44.dp)
            .graphicsLayer { alpha = if (pressed) 0.4f else if (hovered) hoveredAlpha(0.4f) else 1f }
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (color != null) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(if (isDown) colors.dockQuiet else color))
        }
        Text(
            title,
            style = designFont(14.5f, FontWeight.SemiBold),
            color = if (isShown && !isDown) colors.dockText else colors.dockQuiet,
            modifier = Modifier.weight(1f),
        )
        if (isDown) {
            // `.caption.weight(.semibold)`, 12 points.
            SymbolIcon(Symbols.warning, textSymbolSize(12f), colors.warning)
        } else {
            RollingCount(count, rolls = countRolls, style = designFont(12.5f, FontWeight.SemiBold, tabular = true), color = colors.dockQuiet)
        }
        Box(Modifier.size(checkSize), contentAlignment = Alignment.Center) {
            when {
                isShown && isDown -> Box(
                    Modifier
                        .size(checkSize)
                        .padding(2.dp)
                        .drawBehind {
                            val width = 1.5.dp.toPx()
                            drawCircle(
                                colors.dockQuiet,
                                radius = (size.minDimension - width) / 2,
                                style = Stroke(width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.5.dp.toPx(), 3.dp.toPx()))),
                            )
                        },
                )
                isShown -> SymbolIcon(Symbols.check, textSymbolSize(14f), colors.actionText)
            }
        }
    }
}

/**
 * A row's move to a new place in its column, as SwiftUI animates a stack's new order: placed where it was, then
 * sliding to where it is now. Without [spec], as with Reduce Motion, it goes there at once.
 */
private fun Modifier.slidesToItsPlace(spec: AnimationSpec<IntOffset>?): Modifier = if (spec == null) {
    this
} else {
    composed {
        val scope = rememberCoroutineScope()
        val shift = remember { Animatable(IntOffset.Zero, IntOffset.VectorConverter) }
        val lastPlace = remember { arrayOfNulls<IntOffset>(1) }
        layout { measurable, constraints ->
            val placeable = measurable.measure(constraints)
            layout(placeable.width, placeable.height) {
                val place = coordinates?.positionInParent()?.round()
                if (place != null && !isLookingAhead) {
                    val before = lastPlace[0]
                    lastPlace[0] = place
                    if (before != null && before != place) {
                        val from = shift.value + (before - place)
                        // At once where nothing is moving yet, so that the row isn't drawn a frame at its new place.
                        scope.launch(start = CoroutineStart.UNDISPATCHED) {
                            shift.snapTo(from)
                            shift.animateTo(IntOffset.Zero, spec)
                        }
                    }
                }
                placeable.place(shift.value)
            }
        }
    }
}
