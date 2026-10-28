package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.background
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.dock.DockSymbolTile
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.Spinner
import com.plhery.scootradar.ui.dock.SpinnerSize
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight

// MapStatusBanner, LocationIssueCard and TopChromeTapShield in ios/ScootRadar/Views/ScooterControls.swift
// (ui.md UI-094 to UI-096).

/**
 * TopChromeTapShield, and what every element over the map does: it takes the touches that land on it, so none
 * goes through to the map, while the buttons and rows inside it still take theirs. A sibling drawn over the map
 * that takes touches keeps them from the map under it.
 */
fun Modifier.overTheMap(): Modifier = pointerInput(Unit) {
    awaitPointerEventScope {
        while (true) awaitPointerEvent()
    }
}

/**
 * The banner under the search bar while nothing has loaded and the load failed: the reason and a filled Try again
 * button. From xLarge text up the button goes under the sentence, which is never cut short.
 */
@Composable
fun MapStatusBanner(message: String, actionTitle: String, onAction: () -> Unit, modifier: Modifier = Modifier, isBusy: Boolean = false) {
    val colors = scootColors
    val stacks = TextSize.isXLargeOrMore
    val shape = if (stacks) SquircleShape(22.dp) else CapsuleShape
    val indicator = @Composable { SymbolIcon(Symbols.warningFill, textSymbolSize(17f), colors.critical) }
    val text = @Composable { textModifier: Modifier ->
        Text(message, style = ScootType.caption.weight(FontWeight.SemiBold), color = colors.label, modifier = textModifier)
    }
    val action = @Composable { actionModifier: Modifier ->
        // The pill stays small; its target is 44 points high.
        Box(
            actionModifier
                .plainButton(enabled = !isBusy, label = actionTitle, onClick = onAction)
                .heightIn(min = 44.dp),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier
                    .clip(CapsuleShape)
                    .background(colors.criticalFill)
                    .heightIn(min = 34.dp)
                    .padding(horizontal = 14.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    actionTitle,
                    style = ScootType.caption.weight(FontWeight.Bold),
                    color = Color.White,
                    maxLines = 1,
                    modifier = Modifier.alpha(if (isBusy) 0f else 1f),
                )
                if (isBusy) Spinner(SpinnerSize.Small, Color.White)
            }
        }
    }
    Box(
        modifier
            .widthIn(max = 560.dp)
            .fillMaxWidth()
            .iosShadow(shape, Color.Black.copy(alpha = 0.07f), radius = 9.dp, y = 4.dp)
            .chromeGlass(shape)
            .overTheMap()
            .padding(start = 14.dp, end = if (stacks) 14.dp else 5.dp, top = if (stacks) 10.dp else 2.dp, bottom = if (stacks) 10.dp else 2.dp),
    ) {
        if (stacks) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                    indicator()
                    text(Modifier.weight(1f))
                }
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { action(Modifier) }
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(9.dp), verticalAlignment = Alignment.CenterVertically) {
                indicator()
                text(Modifier.weight(1f))
                action(Modifier)
            }
        }
    }
}

/** The dismissible card under the search bar when locating did not work: what happened and the ways forward. */
@Composable
fun LocationIssueCard(
    issue: ScooterLocationIssue,
    onOpenSettings: () -> Unit,
    onSearchPlace: () -> Unit,
    onRetry: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = scootColors
    val shape = SquircleShape(24.dp)
    Row(
        modifier
            .widthIn(max = 560.dp)
            .fillMaxWidth()
            .iosShadow(shape, Color.Black.copy(alpha = 0.08f), radius = 10.dp, y = 4.dp)
            .chromeGlass(shape)
            .overTheMap()
            .padding(start = 12.dp, end = 4.dp, top = 6.dp, bottom = 2.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        DockSymbolTile(Symbols.locationSlash, colors.warning, colors.warning, size = 40.dp, modifier = Modifier.padding(top = 2.dp))
        Column(Modifier.weight(1f)) {
            Column(
                Modifier.heightIn(min = 44.dp).semantics(mergeDescendants = true) {},
                verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
            ) {
                val title = issue.title
                if (title != null) {
                    Text(title, style = ScootType.subheadline.weight(FontWeight.SemiBold), color = colors.label)
                    Text(issue.message, style = ScootType.footnote, color = colors.secondaryText)
                } else {
                    Text(issue.message, style = ScootType.subheadline.weight(FontWeight.Medium), color = colors.label)
                }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                if (issue.canOpenSettings) IssueAction(localized("Open Settings"), onOpenSettings)
                if (issue.canSearchPlace) IssueAction(localized("Search a place"), onSearchPlace)
                if (issue.canRetry) IssueAction(localized("Try again"), onRetry)
            }
        }
        Box(
            Modifier.size(44.dp).plainButton(label = localized("Dismiss"), onClick = onDismiss),
            contentAlignment = Alignment.Center,
        ) {
            FixedSymbol(Symbols.close, 13f, colors.secondaryText)
        }
    }
}

@Composable
private fun IssueAction(title: String, onClick: () -> Unit) {
    Box(Modifier.heightIn(min = 44.dp).plainButton(onClick = onClick), contentAlignment = Alignment.CenterStart) {
        Text(title, style = ScootType.subheadline.weight(FontWeight.SemiBold), color = scootColors.actionText)
    }
}
