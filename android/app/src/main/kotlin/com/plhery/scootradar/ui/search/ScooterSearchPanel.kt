package com.plhery.scootradar.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.isFinite
import androidx.compose.ui.unit.max
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.core.search.KeyboardOverlap
import com.plhery.scootradar.core.search.SwissAddressSearchModel
import com.plhery.scootradar.core.search.SwissAddressSearchStatus
import com.plhery.scootradar.ui.Announcer
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.Spinner
import com.plhery.scootradar.ui.dock.SpinnerSize
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.rememberAnnouncementOnChange
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.min

// ScooterSearchPanel, SearchPlaceRow and SearchSymbolTile in ios/ScootRadar/Views/SwissAddressSearch.swift (ui.md
// UI-013 to UI-025, UI-105).

/**
 * The open search: the field first, with Cancel beside it. Under it, ways to start while nothing is typed, and the
 * places found from two characters on. It ends above the keyboard, or at [bottomLimit] without one; what does not
 * fit scrolls.
 */
@Composable
internal fun ScooterSearchPanel(
    model: SwissAddressSearchModel,
    recentPlaces: List<MapDestination>,
    nearbyCities: List<ScooterCity>,
    bottomLimit: Dp,
    onSelect: (MapDestination) -> Unit,
    onChooseCity: (ScooterCity) -> Unit,
    onUseCurrentLocation: () -> Unit,
    onCancel: () -> Unit,
    autofocus: Boolean = true,
) {
    val density = LocalDensity.current
    val focus = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    val status by model.status.collectAsState()
    var contentTop by remember { mutableFloatStateOf(0f) }

    fun choose(result: AddressSearchResult) {
        val destination = model.select(result)
        focusManager.clearFocus()
        onSelect(destination)
    }

    // KeyboardTopProbe: where the keyboard's top is in the window, as it moves.
    val windowHeight = LocalWindowInfo.current.containerSize.height.toDouble()
    val keyboard = WindowInsets.ime.getBottom(density).toDouble()
    val keyboardTop = KeyboardOverlap.top(ScreenRect(0.0, windowHeight - keyboard, 1.0, keyboard), windowHeight)
    // The panel ends above the keyboard, or at the bottom of the window without one.
    val limit = min(keyboardTop, with(density) { if (bottomLimit.isFinite) bottomLimit.toPx().toDouble() else Double.POSITIVE_INFINITY })
    val maximumContentHeight = if (limit.isFinite()) {
        with(density) { max(120.dp, (limit - contentTop).toFloat().toDp() - 20.dp) }
    } else {
        Dp.Infinity
    }

    Box {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            val field = @Composable { fieldModifier: Modifier ->
                SearchField(model, focus, onSubmit = { model.firstResult?.let(::choose) }, modifier = fieldModifier)
            }
            if (TextSize.isAccessibility) {
                // Large text leaves no room for the field beside Cancel.
                Column(horizontalAlignment = Alignment.End) {
                    field(Modifier.fillMaxWidth())
                    CancelButton(onCancel)
                }
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    field(Modifier.weight(1f))
                    CancelButton(onCancel)
                }
            }

            // What does not fit above the keyboard scrolls.
            FitOrScroll(
                maximumContentHeight,
                Modifier.onGloballyPositioned { contentTop = it.positionInWindow().y },
            ) {
                when (val shown = status) {
                    SwissAddressSearchStatus.Idle -> Suggestions(recentPlaces, nearbyCities, onSelect, onChooseCity, onUseCurrentLocation)
                    SwissAddressSearchStatus.Searching -> Row(
                        Modifier.searchStatus(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Spinner(SpinnerSize.Small)
                        StatusText(localized("Searching…"))
                    }
                    is SwissAddressSearchStatus.Results -> ResultRows(shown.results, ::choose)
                    SwissAddressSearchStatus.NoResults -> Box(Modifier.searchStatus(), contentAlignment = Alignment.CenterStart) {
                        StatusText(localized("No places found."))
                    }
                    SwissAddressSearchStatus.Failed -> Column {
                        Box(Modifier.searchStatus(), contentAlignment = Alignment.CenterStart) {
                            StatusText(localized("Search isn’t available right now."))
                        }
                        TextButton(localized("Try again"), model::retry)
                    }
                }
            }
        }
        // Said with TalkBack only, as the iPhone posts it to VoiceOver only.
        Announcer(rememberAnnouncementOnChange(status) { announcement(status) })
    }

    LaunchedEffect(Unit) {
        if (!autofocus) return@LaunchedEffect
        // Task.yield(): once the field is on screen.
        withFrameNanos {}
        focus.requestFocus()
    }
}

/** What TalkBack says as the places come, or don't. */
private fun announcement(status: SwissAddressSearchStatus): String? = when (status) {
    SwissAddressSearchStatus.Idle, SwissAddressSearchStatus.Searching -> null
    is SwissAddressSearchStatus.Results ->
        if (status.results.size == 1) {
            localized("One address suggestion")
        } else {
            stringFormat(localized("%lld address suggestions"), status.results.size)
        }
    SwissAddressSearchStatus.NoResults -> localized("No places found.")
    SwissAddressSearchStatus.Failed -> localized("Search isn’t available right now.")
}

/**
 * HeightLimit with ViewThatFits: as tall as the content, up to [maximum], and scrolling only when it is taller. A
 * plain stack while it fits leaves the rows' shapes whole.
 */
@Composable
private fun FitOrScroll(maximum: Dp, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    var contentHeight by remember { mutableIntStateOf(0) }
    val scrolls = maximum.isFinite && contentHeight > with(LocalDensity.current) { maximum.roundToPx() }
    Column(
        modifier
            .then(if (maximum.isFinite) Modifier.heightIn(max = maximum) else Modifier)
            .then(if (scrolls) Modifier.verticalScroll(rememberScrollState()) else Modifier)
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints.copy(maxHeight = Constraints.Infinity))
                contentHeight = placeable.height
                layout(placeable.width, min(placeable.height, constraints.maxHeight)) { placeable.place(0, 0) }
            },
        content = content,
    )
}

/** The field, with a search icon before it and, once something is typed, a button that empties it. */
@Composable
private fun SearchField(model: SwissAddressSearchModel, focus: FocusRequester, onSubmit: () -> Unit, modifier: Modifier = Modifier) {
    val colors = scootColors
    val focusManager = LocalFocusManager.current
    val query by model.queryState.collectAsState()
    val textStyle = ScootType.body.copy(color = colors.label)
    Row(
        modifier
            .heightIn(min = 46.dp)
            .clip(SquircleShape(14.dp))
            .background(colors.quaternaryLabel.copy(alpha = colors.quaternaryLabel.alpha * 0.55f))
            .padding(start = 12.dp, end = if (query.isEmpty()) 12.dp else 0.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SymbolIcon(Symbols.searchRegular, textSymbolSize(17f), colors.secondaryLabel)
        BasicTextField(
            value = query,
            onValueChange = { model.query = it },
            modifier = Modifier
                .weight(1f)
                .focusRequester(focus)
                .semantics { contentType = ContentType.AddressStreet }
                // A hardware keyboard's Tab goes on to the next button, as on the iPhone; Enter searches.
                .onPreviewKeyEvent { event ->
                    if (event.type == KeyEventType.KeyDown && event.key == Key.Tab) {
                        focusManager.moveFocus(FocusDirection.Next)
                    } else {
                        false
                    }
                }
                .testTag(SEARCH_FIELD_TAG),
            textStyle = textStyle,
            singleLine = true,
            cursorBrush = SolidColor(colors.accent),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                autoCorrectEnabled = false,
                imeAction = ImeAction.Search,
            ),
            keyboardActions = KeyboardActions(onSearch = { onSubmit() }),
            decorationBox = { field ->
                Box(contentAlignment = Alignment.CenterStart) {
                    if (query.isEmpty()) {
                        Text(localized("City or address"), style = textStyle, color = colors.tertiaryLabel, maxLines = 1)
                    }
                    field()
                }
            },
        )
        if (query.isNotEmpty()) {
            Box(
                Modifier
                    .plainButton(label = localized("Clear search")) {
                        model.clear()
                        focus.requestFocus()
                    }
                    .size(44.dp),
                contentAlignment = Alignment.Center,
            ) {
                SymbolIcon(Symbols.clearFillRegular, textSymbolSize(17f), colors.secondaryLabel)
            }
        }
    }
}

@Composable
private fun CancelButton(onCancel: () -> Unit) {
    TextButton(localized("Cancel"), onCancel)
}

/** Cancel and Try again: a word in the app's blue, 44 points high. */
@Composable
private fun TextButton(title: String, onClick: () -> Unit) {
    Box(
        Modifier
            .plainButton(onClick = onClick)
            .heightIn(min = 44.dp)
            .padding(horizontal = 6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            title,
            style = ScootType.subheadline.weight(FontWeight.SemiBold),
            color = scootColors.actionText,
            maxLines = 1,
            softWrap = false,
        )
    }
}

/** Nothing typed yet: your location, the places of this session and the covered cities nearest to the map. */
@Composable
private fun Suggestions(
    recentPlaces: List<MapDestination>,
    nearbyCities: List<ScooterCity>,
    onSelect: (MapDestination) -> Unit,
    onChooseCity: (ScooterCity) -> Unit,
    onUseCurrentLocation: () -> Unit,
) {
    val colors = scootColors
    Column {
        Row(
            Modifier
                .fillMaxWidth()
                .plainButton(onClick = onUseCurrentLocation)
                .heightIn(min = 52.dp)
                .padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(11.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SearchSymbolTile(Symbols.locationFill)
            Text(localized("Use my location"), style = ScootType.subheadline.weight(FontWeight.SemiBold), color = colors.actionText)
        }

        if (recentPlaces.isNotEmpty()) {
            SectionHeader(localized("Recent"))
            recentPlaces.forEachIndexed { index, place ->
                SearchPlaceRow(
                    title = place.title,
                    subtitle = place.subtitle,
                    symbol = Symbols.history,
                    isAccented = false,
                    showsNoData = !place.isCovered,
                    modifier = Modifier.plainButton { onSelect(place) },
                )
                if (index < recentPlaces.lastIndex) RowDivider()
            }
        }

        if (nearbyCities.isNotEmpty()) {
            SectionHeader(localized("Cities with scooters"))
            FlowRow(
                Modifier.padding(horizontal = 4.dp).padding(bottom = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                for (city in nearbyCities) {
                    Box(
                        Modifier
                            .plainButton { onChooseCity(city) }
                            .heightIn(min = 44.dp)
                            .clip(CapsuleShape)
                            .background(colors.label.copy(alpha = 0.055f))
                            .border(1.dp, colors.secondaryLabel.copy(alpha = colors.secondaryLabel.alpha * 0.16f), CapsuleShape)
                            .padding(horizontal = 14.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(city.name, style = ScootType.subheadline.weight(FontWeight.SemiBold), color = colors.label)
                    }
                }
            }
        }
    }
}

@Composable
private fun ResultRows(results: List<AddressSearchResult>, onChoose: (AddressSearchResult) -> Unit) {
    val actionText = scootColors.actionText
    Column {
        results.forEachIndexed { index, result ->
            // Return chooses the first place, so it is shown as chosen.
            val isFirst = index == 0
            SearchPlaceRow(
                title = result.title,
                subtitle = result.subtitle,
                isAccented = result.isCovered,
                showsNoData = !result.isCovered,
                modifier = Modifier
                    .plainButton { onChoose(result) }
                    .semantics { selected = isFirst }
                    .then(if (isFirst) Modifier.background(actionText.copy(alpha = 0.08f), SquircleShape(14.dp)) else Modifier),
            )
            if (index < results.lastIndex) RowDivider()
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        style = ScootType.footnote.weight(FontWeight.SemiBold),
        color = scootColors.secondaryText,
        modifier = Modifier
            .padding(horizontal = 6.dp)
            .padding(top = 12.dp, bottom = 6.dp)
            .semantics { heading() },
    )
}

/** `Divider().padding(.leading, 51)`: a hairline from the text's edge. */
@Composable
private fun RowDivider() {
    val hairline = with(LocalDensity.current) { 1f.toDp() }
    Box(
        Modifier
            .padding(start = 51.dp)
            .fillMaxWidth()
            .height(hairline)
            .background(scootColors.separator),
    )
}

/** "Searching…" and the sentences that stand in for results. */
private fun Modifier.searchStatus(): Modifier = fillMaxWidth().heightIn(min = 44.dp).padding(horizontal = 6.dp)

@Composable
private fun StatusText(text: String) {
    Text(text, style = ScootType.subheadline, color = scootColors.secondaryText)
}

/** A place in the search panel: a result, or a place chosen earlier. */
@Composable
internal fun SearchPlaceRow(
    title: String,
    /** May be empty; the second line is left out then. */
    subtitle: String,
    modifier: Modifier = Modifier,
    symbol: ImageVector = Symbols.mapPin,
    /** Blue for a place with scooter data, grey for one without and for recent places. */
    isAccented: Boolean = true,
    /** The neutral "No data" tag of a place no operator serves. */
    showsNoData: Boolean = false,
) {
    val colors = scootColors
    val isAccessibility = TextSize.isAccessibility
    val lines = if (isAccessibility) Int.MAX_VALUE else 2
    Row(
        modifier
            .fillMaxWidth()
            .heightIn(min = 56.dp)
            .padding(horizontal = 6.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(11.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SearchSymbolTile(symbol, isAccented)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                title,
                style = ScootType.subheadline.weight(FontWeight.SemiBold),
                color = colors.label,
                maxLines = lines,
                overflow = TextOverflow.Ellipsis,
            )
            if (subtitle.isNotEmpty()) {
                Text(subtitle, style = ScootType.caption, color = colors.secondaryText, maxLines = lines, overflow = TextOverflow.Ellipsis)
            }
            // Beside large text there is no room left for the tag.
            if (showsNoData && isAccessibility) NoDataTag()
        }
        if (showsNoData && !isAccessibility) NoDataTag()
    }
}

@Composable
private fun NoDataTag() {
    Text(
        localized("No data"),
        style = ScootType.caption2.weight(FontWeight.SemiBold),
        color = scootColors.secondaryText,
        modifier = Modifier
            .clip(CapsuleShape)
            .background(scootColors.label.copy(alpha = 0.06f))
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

/** The small rounded tile in front of the search bar's text and of a place row. */
@Composable
internal fun SearchSymbolTile(
    symbol: ImageVector,
    /** Blue for your location and places with scooter data; grey otherwise. */
    isAccented: Boolean = true,
) {
    val colors = scootColors
    Box(
        Modifier
            .size(34.dp)
            .clip(SquircleShape(11.dp))
            .background(if (isAccented) colors.actionText.copy(alpha = 0.12f) else colors.label.copy(alpha = 0.06f))
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center,
    ) {
        FixedSymbol(symbol, 15f, if (isAccented) colors.actionText else colors.secondaryLabel)
    }
}
