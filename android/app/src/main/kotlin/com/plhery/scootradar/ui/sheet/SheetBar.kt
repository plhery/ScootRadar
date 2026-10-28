package com.plhery.scootradar.ui.sheet

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.IosWeight
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSizeUpToAX1
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.max

// The inline navigation bar of a NavigationStack in a sheet, in ios/ScootRadar/Views/ScooterControls.swift's
// ScooterFilterSheet and ScooterSettingsSheet, as iOS 26 draws it: the title in the middle, and the toolbar's
// buttons on glass at its ends (ui.md UI-060, UI-089).

/**
 * The bar at the top of a sheet: [title] in the middle of the sheet, whatever is at its ends, which are given the
 * room they need first. Its text grows no further than AX1, as UIKit's bar.
 */
@Composable
internal fun SheetTitleBar(
    title: String,
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    TextSizeUpToAX1 {
        Layout(
            content = {
                Box { leading?.invoke() }
                Text(
                    title,
                    style = ScootType.headline,
                    color = scootColors.label,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.semantics { heading() },
                )
                Box { trailing?.invoke() }
            },
            modifier = modifier
                .fillMaxWidth()
                .padding(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 6.dp)
                .heightIn(min = 44.dp),
        ) { measurables, constraints ->
            val loose = constraints.copy(minWidth = 0, minHeight = 0)
            val start = measurables[0].measure(loose)
            val end = measurables[2].measure(loose.copy(maxWidth = max(0, loose.maxWidth - start.width)))
            // The title stays in the middle: as far from both ends as the wider item reaches, and 8 more.
            val side = max(start.width, end.width) + if (start.width + end.width > 0) 8.dp.roundToPx() else 0
            val titlePlaceable = measurables[1].measure(loose.copy(maxWidth = max(0, constraints.maxWidth - 2 * side)))
            val height = maxOf(constraints.minHeight, start.height, end.height, titlePlaceable.height)
            layout(constraints.maxWidth, height) {
                start.place(0, (height - start.height) / 2)
                end.place(constraints.maxWidth - end.width, (height - end.height) / 2)
                titlePlaceable.place((constraints.maxWidth - titlePlaceable.width) / 2, (height - titlePlaceable.height) / 2)
            }
        }
    }
}

/** A text button of the toolbar, on a capsule of glass: "Reset", or "Done". */
@Composable
internal fun SheetBarButton(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    color: Color = scootColors.label,
) {
    Box(
        modifier
            .iosShadow(CapsuleShape, Color.Black.copy(alpha = 0.08f), radius = 8.dp, y = 2.dp)
            .chromeGlass(CapsuleShape)
            .plainButton(enabled = enabled, onClick = onClick)
            .heightIn(min = 44.dp)
            .widthIn(min = 44.dp)
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            title,
            style = ScootType.body.weight(IosWeight.medium),
            color = if (enabled) color else scootColors.tertiaryLabel,
            maxLines = 1,
        )
    }
}

/**
 * The toolbar's confirmation button, as iOS 26 draws "Done": a checkmark on a round of glass in the app's blue.
 * TalkBack says its title.
 */
@Composable
internal fun SheetDoneButton(title: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier
            .iosShadow(CircleShape, Color.Black.copy(alpha = 0.08f), radius = 8.dp, y = 2.dp)
            .background(scootColors.accent, CircleShape)
            .plainButton(label = title, onClick = onClick)
            .size(44.dp),
        contentAlignment = Alignment.Center,
    ) {
        FixedSymbol(Symbols.check, 17f, Color.White)
    }
}

/** The back button of a page pushed in a sheet: a chevron on a round of glass. TalkBack says "Back". */
@Composable
internal fun SheetBackButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier
            .iosShadow(CircleShape, Color.Black.copy(alpha = 0.08f), radius = 8.dp, y = 2.dp)
            .chromeGlass(CircleShape)
            .plainButton(label = localized("Back"), onClick = onClick)
            .size(44.dp),
        contentAlignment = Alignment.Center,
    ) {
        // chevron.backward: Material's forward chevron, mirrored.
        FixedSymbol(Symbols.chevronRight, 17f, scootColors.label, Modifier.scale(scaleX = -1f, scaleY = 1f))
    }
}
