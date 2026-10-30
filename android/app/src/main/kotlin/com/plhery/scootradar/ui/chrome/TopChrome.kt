package com.plhery.scootradar.ui.chrome

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.updateTransition
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.platform.InspectorInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Constraints
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
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

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

/** The banner's tag and the location card's, by which the tests find them. */
const val STATUS_BANNER_TAG = "statusBanner"
const val LOCATION_CARD_TAG = "locationCard"

/**
 * The banner under the search bar while nothing has loaded and the load failed: the reason and a filled Try again
 * button. From xLarge text up the button goes under the sentence, which is never cut short. A reason that changes
 * while the banner shows fades into the new one in [animation], the notices' (ScooterMapScreen.swift:247), the banner's
 * height easing to the new one's; at once without one (Reduce Motion). [onRestingHeight] hears the height it comes to
 * rest at (easedHeight).
 */
@Composable
fun MapStatusBanner(
    message: String,
    actionTitle: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier,
    isBusy: Boolean = false,
    animation: FiniteAnimationSpec<Float>? = null,
    onRestingHeight: (Int) -> Unit = {},
) {
    val colors = scootColors
    val stacks = TextSize.isXLargeOrMore
    val shape = if (stacks) SquircleShape(22.dp) else CapsuleShape
    val indicator = @Composable { SymbolIcon(Symbols.warningFill, textSymbolSize(17f), colors.critical) }
    val text = @Composable { textModifier: Modifier ->
        CrossFade(message, animation, textModifier) {
            Text(it, style = ScootType.caption.weight(FontWeight.SemiBold), color = colors.label)
        }
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
            .testTag(STATUS_BANNER_TAG)
            .widthIn(max = 560.dp)
            .fillMaxWidth()
            .iosShadow(shape, Color.Black.copy(alpha = 0.07f), radius = 9.dp, y = 4.dp)
            .chromeGlass(shape)
            .overTheMap()
            .easedHeight(message, animation, onRestingHeight, centred = true)
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

/**
 * The dismissible card under the search bar when locating did not work: what happened and the ways forward. An issue
 * that changes while the card shows fades what it says and offers into the new one's in [animation], the notices'
 * (ScooterMapScreen.swift:248), the card's height easing to the new one's; at once without one (Reduce Motion).
 * [onRestingHeight] hears the height it comes to rest at (easedHeight).
 */
@Composable
fun LocationIssueCard(
    issue: ScooterLocationIssue,
    onOpenSettings: () -> Unit,
    onSearchPlace: () -> Unit,
    onRetry: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    animation: FiniteAnimationSpec<Float>? = null,
    onRestingHeight: (Int) -> Unit = {},
) {
    val colors = scootColors
    val shape = SquircleShape(24.dp)
    Row(
        modifier
            .testTag(LOCATION_CARD_TAG)
            .widthIn(max = 560.dp)
            .fillMaxWidth()
            .iosShadow(shape, Color.Black.copy(alpha = 0.08f), radius = 10.dp, y = 4.dp)
            .chromeGlass(shape)
            .overTheMap()
            .easedHeight(issue, animation, onRestingHeight)
            .padding(start = 12.dp, end = 4.dp, top = 6.dp, bottom = 2.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        DockSymbolTile(Symbols.locationSlash, colors.warning, colors.warning, size = 40.dp, modifier = Modifier.padding(top = 2.dp))
        // Each kind's words and actions are their own: a kind that changes changes them all, as the iPhone's `if let
        // title` switches branch or its one text changes, and its actions come and go.
        CrossFade(issue, animation, Modifier.weight(1f)) { shown ->
            Column {
                Column(
                    Modifier.heightIn(min = 44.dp).semantics(mergeDescendants = true) {},
                    verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
                ) {
                    val title = shown.title
                    if (title != null) {
                        Text(title, style = ScootType.subheadline.weight(FontWeight.SemiBold), color = colors.label)
                        Text(shown.message, style = ScootType.footnote, color = colors.secondaryText)
                    } else {
                        Text(shown.message, style = ScootType.subheadline.weight(FontWeight.Medium), color = colors.label)
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                    if (shown.canOpenSettings) IssueAction(localized("Open Settings"), onOpenSettings)
                    if (shown.canSearchPlace) IssueAction(localized("Search a place"), onSearchPlace)
                    if (shown.canRetry) IssueAction(localized("Try again"), onRetry)
                }
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

/**
 * [content] for [target]. As [target] changes in [animation], the old content fades out where it was while the new
 * fades in where it rests, as SwiftUI changes a text, or swaps a branch, in an animation; without one the new is there
 * at once. Laid out as the new content alone, so that the notice comes to rest at its height at once; the old one,
 * going, is out of TalkBack's reach and takes no tap, as SwiftUI takes a view it removes out of hit testing.
 */
@Composable
private fun <T : Any> CrossFade(target: T, animation: FiniteAnimationSpec<Float>?, modifier: Modifier, content: @Composable (T) -> Unit) {
    if (animation == null) {
        Box(modifier, propagateMinConstraints = true) { content(target) }
        return
    }
    val transition = updateTransition(target, label = "crossFade")
    val shown = remember { mutableStateListOf(target) }
    if (transition.currentState == transition.targetState) {
        if (shown.size != 1 || shown[0] != transition.targetState) {
            shown.clear()
            shown.add(transition.targetState)
        }
    } else if (transition.targetState !in shown) {
        shown.add(transition.targetState)
    }
    Layout(
        content = {
            for (item in shown) {
                key(item) {
                    val alpha by transition.animateFloat({ animation }, label = "crossFadeAlpha") { if (it == item) 1f else 0f }
                    Box(
                        Modifier
                            .layoutId(item)
                            .graphicsLayer { this.alpha = alpha }
                            .then(if (item == transition.targetState) Modifier else Modifier.clearAndSetSemantics { }.goingOut()),
                        propagateMinConstraints = true,
                    ) { content(item) }
                }
            }
        },
        modifier = modifier,
    ) { measurables, constraints ->
        val placeables = measurables.map { it.measure(constraints) }
        val resting = placeables[measurables.indexOfFirst { it.layoutId == transition.targetState }.coerceAtLeast(0)]
        layout(resting.width, resting.height) { placeables.forEach { it.place(0, 0) } }
    }
}

/** Content on its way out: every touch on it is taken before its buttons see it. */
private fun Modifier.goingOut(): Modifier = pointerInput(Unit) {
    awaitPointerEventScope {
        while (true) {
            awaitPointerEvent(PointerEventPass.Initial).changes.forEach { it.consume() }
        }
    }
}

/**
 * A notice whose [key] changes while it shows eases its height to its new content's in [animation], as
 * SwiftUI animates a frame; at once without one, and for any other change (the window's width, the text's size). The
 * content is laid out where it rests at once; the height this takes, and the glass drawn around it, ease. [onRest] hears
 * the content's own height as it changes: what the iPhone's onGeometryChange reads, as an animation doesn't move the
 * layout it reads (geometryGroup()'s documentation), so the map's frames and the panel's room take the new height at
 * once. [centred] content stays in the middle of the height as it eases, as a centred HStack's views ride the frame's
 * spring in SwiftUI; otherwise it keeps to the top.
 */
private fun Modifier.easedHeight(key: Any, animation: FiniteAnimationSpec<Float>?, onRest: (Int) -> Unit, centred: Boolean = false): Modifier =
    this then EasedHeightElement(key, animation, onRest, centred)

private data class EasedHeightElement(
    val key: Any,
    val animation: FiniteAnimationSpec<Float>?,
    val onRest: (Int) -> Unit,
    val centred: Boolean,
) : ModifierNodeElement<EasedHeightNode>() {
    override fun create() = EasedHeightNode(key, animation, onRest, centred)

    override fun update(node: EasedHeightNode) {
        node.key = key
        node.animation = animation
        node.onRest = onRest
        node.centred = centred
    }

    override fun InspectorInfo.inspectableProperties() {
        name = "easedHeight"
        properties["key"] = key
        properties["animation"] = animation
        properties["centred"] = centred
    }
}

private class EasedHeightNode(
    var key: Any,
    var animation: FiniteAnimationSpec<Float>?,
    var onRest: (Int) -> Unit,
    var centred: Boolean,
) : Modifier.Node(), LayoutModifierNode {
    /** The key of the content measured last. */
    private var measuredKey: Any = key

    /** The content's own height, measured last; -1 before. */
    private var rest = -1

    /** The height laid out last; -1 before. */
    private var shown = -1
    private val height = Animatable(0f)
    private var easing: Job? = null

    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val placeable = measurable.measure(constraints)
        if (placeable.height != rest) {
            val spec = animation
            val from = shown
            rest = placeable.height
            onRest(rest)
            if (spec != null && from >= 0 && key != measuredKey && isAttached) {
                val running = easing?.isActive == true
                // Started here, so that this frame lays out the height it eases from; one that is easing goes on from
                // where it is, at its speed, as SwiftUI's spring does.
                val target = rest.toFloat()
                easing = coroutineScope.launch(start = CoroutineStart.UNDISPATCHED) {
                    if (!running) height.snapTo(from.toFloat())
                    height.animateTo(target, spec)
                }
            } else {
                easing?.cancel()
                easing = null
            }
        }
        measuredKey = key
        shown = if (easing?.isActive == true) height.value.roundToInt() else rest
        return layout(placeable.width, shown) { placeable.place(0, if (centred) (shown - rest) / 2 else 0) }
    }

    override fun onDetach() {
        easing = null
        shown = -1
        rest = -1
    }
}
