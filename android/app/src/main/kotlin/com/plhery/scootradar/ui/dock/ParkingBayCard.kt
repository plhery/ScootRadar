package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.cardStatus
import com.plhery.scootradar.core.map.parkingSubtitle
import com.plhery.scootradar.core.map.walkNote
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.rememberControllerChanges
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight

// ParkingBayCard in ios/ScootRadar/Views/ScooterControls.swift: the card of a chosen parking bay (ui.md UI-063).

/**
 * A parking bay's card: the status of the data while it is failing; the bay's "P" in its provider's colour, its
 * title and how far it is; whether parking in a bay is a must here; what became of the walk; Directions; and the
 * reminder to check the operator's app.
 */
@Composable
internal fun ParkingBayCard(controller: ScooterMapController, parking: ScooterParking) {
    val changes = rememberControllerChanges(controller)
    val status = remember(changes) { controller.cardStatus }
    val subtitle = remember(changes, parking) { controller.parkingSubtitle(parking) }
    val target = remember(parking) { ScooterWalkTarget.Parking(parking) }
    val colors = scootColors
    val noticeShape = SquircleShape(14.dp)

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        if (status != null) CardStatusLine(controller, status)

        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Row(
                Modifier.weight(1f).semantics(mergeDescendants = true) {},
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BayTile(parking)
                Column(Modifier.weight(1f, fill = false), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(parking.bayTitle, style = ScootType.headline, color = colors.dockText)
                    if (subtitle.isNotEmpty()) {
                        Text(subtitle, style = ScootType.footnote.monospacedDigit(), color = colors.secondaryText)
                    }
                }
            }
            // Spacer(minLength: 4), with the stack's 12 on each side of it.
            Spacer(Modifier.width(28.dp))
            DockCloseButton(localized("Close parking details"), onClick = { controller.selectParking(null) })
        }

        val noticeColor = if (parking.mandatory) colors.warning else colors.label
        Row(
            Modifier
                .fillMaxWidth()
                .clip(noticeShape)
                .background(if (parking.mandatory) colors.warning.copy(alpha = 0.14f) else colors.tertiarySystemFill)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            SymbolIcon(Symbols.info, textSymbolSize(13f), noticeColor, Modifier.alignBy(SymbolBaseline))
            Text(
                parking.notice,
                style = ScootType.footnote.weight(FontWeight.SemiBold),
                color = noticeColor,
                modifier = Modifier.alignByBaseline().weight(1f),
            )
        }

        WalkNote(controller.walkNote(target))

        DockActionRow {
            DirectionsButton(controller, target, prominent = true)
        }

        Text(
            parking.footnote,
            style = ScootType.caption2,
            color = colors.secondaryText,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/**
 * The bay's "P" on the window's ground, ringed in its provider's colour: 48 points, whatever the text size. SF's
 * rounded design has no Inter of its own, so the letter is Inter's.
 */
@Composable
private fun BayTile(parking: ScooterParking) {
    val colors = scootColors
    val shape = SquircleShape(14.dp)
    val size = with(LocalDensity.current) { 23.dp.toSp() }
    Box(
        Modifier
            .size(48.dp)
            .clip(shape)
            .background(colors.systemBackground)
            .border(3.dp, colors.providerAccent(parking.providerInfo), shape)
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center,
    ) {
        Text("P", style = ScootType.style(23f, FontWeight.ExtraBold).copy(fontSize = size), color = colors.dockText, maxLines = 1)
    }
}
