package com.plhery.scootradar.ui.dock

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.snap
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.allProviderCount
import com.plhery.scootradar.core.map.allProvidersSelected
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.theme.ChangingContent
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.designFont
import com.plhery.scootradar.ui.theme.hairline
import com.plhery.scootradar.ui.theme.scootColors

// The dock's provider chips in ios/ScootRadar/Views/ScooterControls.swift: providerChips, providerChip,
// quickProviderHint and QuickProviderFilterChip (ui.md UI-039, UI-040, UI-262, UI-263).

/**
 * "All", then a chip for each provider in view, side by side in a row that scrolls and runs to the edges of the
 * dock. A chip is 40 points to look at in a row that is 44 to touch. When the order changes the chips slide to
 * their new places.
 */
@Composable
internal fun ProviderChips(controller: ScooterMapController, chips: List<ScooterProviderEntry>) {
    val colors = scootColors
    val motion = if (LocalReduceMotion.current) null else IosMotion.snappy(duration = 0.25)
    // "All" and the hints read these through the controller.
    controller.enabledProviders.collectAsState().value
    controller.visibleProviderCounts.collectAsState().value
    // The counts roll only in the animation of a new order, as `.numericText()` inside `.animation(value: order)`.
    val order = chips.map { it.provider }
    val lastOrder = remember { arrayOf(order) }
    val rolls = motion != null && order != lastOrder[0]
    SideEffect { lastOrder[0] = order }
    LazyRow(
        Modifier.layout { measurable, constraints ->
            // padding(.horizontal, -16) and padding(.vertical, -2).
            val side = 16.dp.roundToPx()
            val top = 2.dp.roundToPx()
            val placeable = measurable.measure(constraints.offset(horizontal = 2 * side))
            layout(placeable.width - 2 * side, placeable.height - 2 * top) { placeable.place(-side, -top) }
        },
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        item(key = "all") {
            QuickProviderFilterChip(
                title = localized("All"),
                accessibilityTitle = localized("All providers"),
                count = controller.allProviderCount,
                color = null,
                isSelected = controller.allProvidersSelected,
                accessibilityIsShown = controller.allProvidersSelected,
                onClick = controller::showAllProviders,
                countRolls = rolls,
            )
        }
        items(chips, key = { it.provider.id }) { entry ->
            QuickProviderFilterChip(
                title = entry.provider.displayName,
                accessibilityTitle = if (entry.isDown) entry.downLabel else entry.provider.displayName,
                count = entry.count,
                color = colors.providerAccent(entry.provider),
                isSelected = entry.isSelected,
                isDown = entry.isDown,
                accessibilityIsShown = entry.isEnabled,
                hint = quickProviderHint(controller, entry.provider),
                onClick = { controller.toggleQuickProvider(entry.provider) },
                countRolls = rolls,
                modifier = if (motion == null) {
                    Modifier.animateItem(fadeInSpec = null, placementSpec = null, fadeOutSpec = null)
                } else {
                    Modifier.animateItem(fadeInSpec = motion.animation(), placementSpec = motion.animation(), fadeOutSpec = motion.animation())
                },
            )
        }
    }
}

/** What a chip does when tapped, said after its name. */
internal fun quickProviderHint(controller: ScooterMapController, provider: ScooterProvider): String {
    val enabled = controller.enabledProviders.value
    return when {
        controller.allProvidersSelected -> localized("show only this provider")
        enabled == setOf(provider) -> localized("show all providers")
        provider in enabled -> localized("hide this provider")
        else -> localized("add this provider")
    }
}

/**
 * A provider's chip, or "All": its dot, its name and its count. A chosen chip is filled with the text colour and
 * written in the ground's; a provider not sharing data is dashed, with a warning in place of its count. It dims
 * under the finger, and a little under a mouse's pointer.
 */
@Composable
internal fun QuickProviderFilterChip(
    title: String,
    accessibilityTitle: String,
    count: Int,
    /** The provider's colour; none for "All". */
    color: Color?,
    isSelected: Boolean,
    accessibilityIsShown: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isDown: Boolean = false,
    hint: String? = null,
    /** A new count rolls to its place rather than taking the old one's. */
    countRolls: Boolean = false,
) {
    val colors = scootColors
    val shape = SquircleShape(14.dp)
    val foreground = when {
        isDown -> colors.dockQuiet
        isSelected -> colors.dockGround
        else -> colors.dockText
    }
    val background = when {
        isDown -> Color.Transparent
        isSelected -> colors.dockText
        else -> colors.dockRaised
    }
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    val label = chipAccessibilityLabel(accessibilityTitle, count, isDown)
    val shown = if (accessibilityIsShown) localized("Shown") else localized("Hidden")
    Row(
        modifier
            .graphicsLayer { alpha = if (pressed) 0.4f else if (hovered) hoveredAlpha(0.4f) else 1f }
            .clickable(interaction, FocusRing(shape), role = Role.Button, onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = label
                stateDescription = shown
                role = Role.Button
                onClick(label = hint) { onClick(); true }
            }
            .padding(vertical = 2.dp)
            .clip(shape)
            .background(background)
            .then(
                when {
                    isDown -> Modifier.drawBehind {
                        val outline = shape.createOutline(size, layoutDirection, this)
                        val width = 1.dp.toPx()
                        drawOutline(
                            outline,
                            colors.dockQuiet.copy(alpha = 0.7f),
                            style = Stroke(width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 3.dp.toPx()))),
                        )
                    }
                    !isSelected -> Modifier.hairline(shape, colors.dockHairline)
                    else -> Modifier
                },
            )
            .heightIn(min = 40.dp)
            .padding(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (color != null) {
            androidx.compose.foundation.layout.Box(
                Modifier.size(8.dp).clip(CircleShape).background(if (isDown) colors.dockQuiet else color),
            )
        }
        Text(title, style = designFont(13f, FontWeight.SemiBold), color = foreground, maxLines = 1)
        if (isDown) {
            SymbolIcon(Symbols.warning, textSymbolSize(12f), colors.warning)
        } else {
            RollingCount(
                count,
                rolls = countRolls,
                style = designFont(11.5f, FontWeight.Bold, tabular = true),
                color = if (isSelected) foreground.copy(alpha = 0.6f) else colors.dockQuiet,
            )
        }
    }
}

/** "Lime, 12 scooters", or what is said of a provider that isn't sharing data. */
internal fun chipAccessibilityLabel(title: String, count: Int, isDown: Boolean): String = when {
    isDown -> title
    count == 1 -> stringFormat(localized("%@, one scooter"), title)
    else -> stringFormat(localized("%@, %lld scooters"), title, count.toLong())
}

/**
 * A count as `.contentTransition(.numericText())` draws it: when [rolls], the new number comes up from below as
 * the old goes up and out when it grows, and the other way when it shrinks; otherwise it takes the old one's
 * place, under Reduce Motion in the frame it changes (UI-184). The whole number rolls, where the iPhone rolls only
 * the digits that change.
 */
@Composable
internal fun RollingCount(count: Int, rolls: Boolean, style: TextStyle, color: Color) {
    val spring = IosMotion.snappy(duration = 0.25)
    ChangingContent(
        targetState = count,
        // Not `!rolls`: the dock's [rolls] is true only in the composition of a new order, and a change of atOnce
        // would draw the count afresh at the new number instead of rolling it.
        atOnce = LocalReduceMotion.current,
        transitionSpec = {
            if (!rolls) {
                EnterTransition.None togetherWith ExitTransition.None using SizeTransform { _, _ -> snap() }
            } else {
                val direction = if (targetState > initialState) 1 else -1
                (slideInVertically(spring.animation()) { it * direction } + fadeIn(spring.animation())) togetherWith
                    (slideOutVertically(spring.animation()) { -it * direction } + fadeOut(spring.animation())) using
                    SizeTransform(clip = true) { _, _ -> spring.animation() }
            }
        },
        label = "count",
    ) { shown ->
        Text(ScooterNumberFormat.integer(shown.toLong(), ScooterLanguage.current.locale), style = style, color = color, maxLines = 1)
    }
}
