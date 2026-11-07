package com.plhery.scootradar.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentDataType
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDataType
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextOverflow
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
import com.plhery.scootradar.ui.FitOrScroll
import com.plhery.scootradar.ui.dock.BodySymbol
import com.plhery.scootradar.ui.dock.SYMBOL_FRAME
import com.plhery.scootradar.ui.dock.Spinner
import com.plhery.scootradar.ui.dock.SpinnerSize
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.bodyMetric
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.keepsSecondaryClicks
import com.plhery.scootradar.ui.rememberAnnouncementOnChange
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.min

// ScooterSearchPanel, RecentPlaceRow, SearchPlaceRow and SearchSymbolTile in ios/ScootRadar/Views/SwissAddressSearch.swift
// (ui.md UI-013 to UI-025, UI-105).

/**
 * The open search: the field first, with Cancel beside it. Under it, ways to start while nothing is typed, and the
 * places found from two characters on. It ends above the keyboard, or at [bottomLimit] without one; what does not
 * fit scrolls.
 */
@Composable
internal fun ScooterSearchPanel(
    model: SwissAddressSearchModel,
    /** The last place chosen in the search, offered again while nothing is typed; none, null. */
    recentPlace: MapDestination?,
    nearbyCities: List<ScooterCity>,
    bottomLimit: Dp,
    onSelect: (MapDestination) -> Unit,
    onChooseRecentPlace: () -> Unit,
    onForgetRecentPlace: () -> Unit,
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
                // Return chooses the first place; with none, it puts the keyboard away and leaves the search open.
                SearchField(model, focus, onSubmit = { model.firstResult?.let(::choose) ?: focusManager.clearFocus() }, modifier = fieldModifier)
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
                    SwissAddressSearchStatus.Idle -> Suggestions(
                        recentPlace = recentPlace,
                        nearbyCities = nearbyCities,
                        onChooseRecentPlace = onChooseRecentPlace,
                        onForgetRecentPlace = {
                            onForgetRecentPlace()
                            // The field keeps the focus and the keyboard, as after Clear search: the ✕ goes with
                            // the row.
                            focus.requestFocus()
                        },
                        onChooseCity = onChooseCity,
                        onUseCurrentLocation = onUseCurrentLocation,
                    )
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
                // A right click opens its edit menu, as UITextField's on an iPad (X-AD22).
                .keepsSecondaryClicks()
                // No autofill, as the iPhone's field asks for none since 4 November (a905f8d8). Typed as a street
                // address, it had autofill services offer the rider's own addresses, in a list that at large text
                // sizes covered Cancel under the field; the search finds places by itself. A field of no type is
                // still offered autofill on the services' guesses, so it is marked as holding no data.
                .semantics { contentDataType = ContentDataType.None }
                // A hardware keyboard's Tab goes on to the next button and Shift+Tab back, as on the iPhone; Enter
                // searches.
                .onPreviewKeyEvent { event ->
                    if (event.type == KeyEventType.KeyDown && event.key == Key.Tab) {
                        focusManager.moveFocus(if (event.isShiftPressed) FocusDirection.Previous else FocusDirection.Next)
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
                    // The placeholder, drawn while nothing is typed, stays the field's label after: TalkBack reads it
                    // with the text, as VoiceOver reads the field's title (UI-256). A contentDescription would be read
                    // instead of the text.
                    Text(
                        localized("City or address"),
                        style = textStyle,
                        color = colors.tertiaryLabel,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = if (query.isEmpty()) Modifier else Modifier.drawWithContent {},
                    )
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

/** Nothing typed yet: your location, the last place chosen and the covered cities nearest to the map. */
@Composable
private fun Suggestions(
    recentPlace: MapDestination?,
    nearbyCities: List<ScooterCity>,
    onChooseRecentPlace: () -> Unit,
    onForgetRecentPlace: () -> Unit,
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

        // One place needs no heading: its clock says it was chosen before.
        if (recentPlace != null) {
            RowDivider()
            RecentPlaceRow(recentPlace, onChoose = onChooseRecentPlace, onForget = onForgetRecentPlace)
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

/**
 * The last place chosen, which a tap chooses again, and beside it the ✕ that forgets it: a button of its own, not one
 * inside the row's, so that TalkBack, Switch Access and a keyboard reach each.
 */
@Composable
private fun RecentPlaceRow(place: MapDestination, onChoose: () -> Unit, onForget: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        SearchPlaceRow(
            title = place.title,
            subtitle = place.subtitle,
            symbol = Symbols.history,
            isAccented = false,
            showsNoData = !place.isCovered,
            modifier = Modifier
                .weight(1f)
                .plainButton(label = recentPlaceLabel(place), shows = place.title, onClick = onChoose),
        )
        Box(
            Modifier.size(44.dp).plainButton(label = localized("Forget this place"), onClick = onForget),
            contentAlignment = Alignment.Center,
        ) {
            // It grows with the text as far as it fits in the button's 44 points.
            BodySymbol(Symbols.close, 13f, maximum = 22f, scootColors.secondaryText)
        }
    }
}

/**
 * What TalkBack reads for the remembered place, in place of its clock: "Recent, Bahnhofstrasse 12, 8001 Zürich,
 * Switzerland", and "No data" after a place no operator serves, as the row shows it.
 */
private fun recentPlaceLabel(place: MapDestination): String =
    listOf(localized("Recent"), place.title, place.subtitle, if (place.isCovered) "" else localized("No data"))
        .filter { it.isNotEmpty() }
        .joinToString(", ")

@Composable
private fun ResultRows(results: List<AddressSearchResult>, onChoose: (AddressSearchResult) -> Unit) {
    val actionText = scootColors.actionText
    Column {
        results.forEachIndexed { index, result ->
            // Return chooses the first place, so it is tinted. It is only the default, not selected, so TalkBack
            // reads no state for it, as VoiceOver reads no selected trait since 4 November (ee9874f6).
            val isFirst = index == 0
            SearchPlaceRow(
                title = result.title,
                subtitle = result.subtitle,
                isAccented = result.isCovered,
                showsNoData = !result.isCovered,
                modifier = Modifier
                    .plainButton { onChoose(result) }
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

/** A place in the search panel: a result, or the place chosen last. */
@Composable
internal fun SearchPlaceRow(
    title: String,
    /** May be empty; the second line is left out then. */
    subtitle: String,
    modifier: Modifier = Modifier,
    symbol: ImageVector = Symbols.mapPin,
    /** Blue for a place with scooter data, grey for one without and for the place chosen last. */
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

/**
 * The small rounded tile in front of the search bar's text and of a place row: 34 points at the standard text size,
 * growing with the text as the body does up to 50, its symbol and corners in proportion (ddd8e672).
 */
@Composable
internal fun SearchSymbolTile(
    symbol: ImageVector,
    /** Blue for your location and places with scooter data; grey otherwise. */
    isAccented: Boolean = true,
) {
    val colors = scootColors
    val side = minOf(bodyMetric(34f), 50.dp)
    Box(
        Modifier
            .size(side)
            .clip(SquircleShape(side * 11f / 34f))
            .background(if (isAccented) colors.actionText.copy(alpha = 0.12f) else colors.label.copy(alpha = 0.06f))
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center,
    ) {
        // 15 points in the 34-point tile at the standard size.
        SymbolIcon(symbol, side * 15f / 34f * SYMBOL_FRAME, if (isAccented) colors.actionText else colors.secondaryLabel)
    }
}
