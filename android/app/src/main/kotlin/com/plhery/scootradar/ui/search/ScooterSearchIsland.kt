package com.plhery.scootradar.ui.search

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.search.SwissAddressSearchModel
import com.plhery.scootradar.ui.LocalAnalytics
import com.plhery.scootradar.ui.chrome.overTheMap
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.Spinner
import com.plhery.scootradar.ui.dock.SpinnerSize
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.motion
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.shrinking
import com.plhery.scootradar.ui.theme.weight

// ScooterSearchIsland in ios/ScootRadar/Views/SwissAddressSearch.swift: the search bar at the top of a phone's map,
// collapsed and open (ui.md UI-009 to UI-012).

/** Where the open search asks for places: the server's search, or the tests' stand-in for it. */
val LocalAddressSearch = staticCompositionLocalOf<AddressSearchAPIClient?> { null }

/** The island's tag, by which the tests find it. */
const val SEARCH_ISLAND_TAG = "searchIsland"

/** The search field's tag. */
const val SEARCH_FIELD_TAG = "searchField"

/**
 * The search bar at the top of the map. Collapsed, it says what the map is based on: nothing yet, your location, a
 * searched place, or a location on its way. Tapped, it opens into the search panel, which asks [LocalAddressSearch]
 * for places.
 */
@Composable
fun ScooterSearchIsland(
    state: ScooterSearchBarState,
    isSearching: Boolean,
    onSearchingChange: (Boolean) -> Unit,
    hasActiveFilters: Boolean,
    onSelect: (MapDestination) -> Unit,
    onClear: () -> Unit,
    onUseCurrentLocation: () -> Unit,
    onShowFilters: () -> Unit,
    onShowSettings: () -> Unit,
    modifier: Modifier = Modifier,
    /** Places chosen during this session, newest first. */
    recentPlaces: List<MapDestination> = emptyList(),
    /** The covered cities nearest to the map centre. */
    nearbyCities: List<ScooterCity> = emptyList(),
    /** The map centre, rounded, when the map shows a city or less: places near it are found first. */
    near: GeoPoint? = null,
    /** Where the open panel has to end when no keyboard is up, in the window's coordinates. */
    bottomLimit: Dp = Dp.Infinity,
    onChooseCity: (ScooterCity) -> Unit = {},
    /** The collapsed bar's height in pixels, as it is measured: the room the island takes over the map. */
    onCollapsedHeightChange: (Int) -> Unit = {},
    /** The Filters button's frame in the window, in pixels, as it is placed: where a large window's popover points. */
    onFiltersFrameChange: (Rect) -> Unit = {},
) {
    val shape = SquircleShape(24.dp)
    val spring = IosMotion.spring(response = 0.36, dampingFraction = 0.88)
    val reduceMotion = LocalReduceMotion.current
    // The collapsed bar keeps its own room above and under it, inside its buttons, so that they reach the glass's
    // edges; the open panel has 10 of the island's.
    val vertical by animateDpAsState(if (isSearching) 10.dp else 0.dp, motion(spring), label = "islandPadding")

    Box(
        modifier
            .widthIn(max = 560.dp)
            .fillMaxWidth()
            .iosShadow(shape, Color.Black.copy(alpha = 0.08f), radius = 10.dp, y = 4.dp)
            .chromeGlass(shape, live = true)
            .overTheMap()
            // The spring overshoots 0 by a hair as the search closes, where padding may not go.
            .padding(horizontal = 10.dp, vertical = vertical.coerceAtLeast(0.dp))
            .testTag(SEARCH_ISLAND_TAG),
    ) {
        AnimatedContent(
            targetState = isSearching,
            contentAlignment = Alignment.TopStart,
            transitionSpec = {
                if (reduceMotion) {
                    EnterTransition.None togetherWith ExitTransition.None using SizeTransform(clip = false) { _, _ -> snap() }
                } else {
                    fadeIn(spring.animation()) togetherWith fadeOut(spring.animation()) using
                        SizeTransform(clip = false) { _, _ -> spring.animation() }
                }
            },
            label = "island",
        ) { searching ->
            if (searching) {
                val api = LocalAddressSearch.current
                val analytics = LocalAnalytics.current
                val scope = rememberCoroutineScope()
                // A new search each time it opens, as the iPhone's panel has its own.
                val model = remember {
                    if (api != null) SwissAddressSearchModel(scope, analytics, api) else SwissAddressSearchModel(scope, analytics)
                }
                DisposableEffect(model) { onDispose { model.cancel() } }
                SideEffect { model.near = near }
                ScooterSearchPanel(
                    model = model,
                    recentPlaces = recentPlaces,
                    nearbyCities = nearbyCities,
                    bottomLimit = bottomLimit,
                    onSelect = { destination ->
                        onSelect(destination)
                        onSearchingChange(false)
                    },
                    onChooseCity = { city ->
                        onChooseCity(city)
                        onSearchingChange(false)
                    },
                    onUseCurrentLocation = {
                        onUseCurrentLocation()
                        onSearchingChange(false)
                    },
                    onCancel = { onSearchingChange(false) },
                )
            } else {
                CollapsedBar(
                    state = state,
                    hasActiveFilters = hasActiveFilters,
                    onOpen = { onSearchingChange(true) },
                    onClear = onClear,
                    onShowFilters = onShowFilters,
                    onShowSettings = onShowSettings,
                    onFiltersFrameChange = onFiltersFrameChange,
                    modifier = Modifier.onSizeChanged { onCollapsedHeightChange(it.height) },
                )
            }
        }
    }
}

/** The room above and under the collapsed bar's content, inside the glass. */
private val COLLAPSED_PADDING = 6.dp

@Composable
private fun CollapsedBar(
    state: ScooterSearchBarState,
    hasActiveFilters: Boolean,
    onOpen: () -> Unit,
    onClear: () -> Unit,
    onShowFilters: () -> Unit,
    onShowSettings: () -> Unit,
    onFiltersFrameChange: (Rect) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = scootColors
    val analytics = LocalAnalytics.current
    val isAccessibility = TextSize.isAccessibility
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
        // A plain button is tapped on its label only, so the label fills the bar: its whole height, up to the
        // bar's edges.
        Row(
            Modifier
                .weight(1f)
                .plainButton(label = state.accessibilityLabel, onClick = onOpen)
                .padding(vertical = COLLAPSED_PADDING)
                .heightIn(min = if (isAccessibility) 60.dp else 50.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BarIndicator(state)
            BarText(state, Modifier.weight(1f, fill = false))
            Spacer(Modifier.widthIn(min = 4.dp))
        }

        if (state is ScooterSearchBarState.Place) {
            BarButton(
                label = localized("Clear place"),
                onClick = {
                    analytics?.track("search_clear")
                    onClear()
                },
            ) {
                FixedSymbol(Symbols.clearFill, 18f, colors.secondaryLabel)
            }
        }

        BarButton(
            label = localized(if (hasActiveFilters) "Filters, active" else "Filters"),
            onClick = onShowFilters,
            modifier = Modifier.onGloballyPositioned { onFiltersFrameChange(it.boundsInWindow()) },
        ) {
            // Idle, it is as dark as the Settings icon beside it; the layered blue is kept for filters that are
            // active. `.contentTransition(.symbolEffect(.replace))`: one goes down as the other comes up.
            val replace = IosMotion.snappy(duration = 0.3)
            val reduceMotion = LocalReduceMotion.current
            AnimatedContent(
                targetState = hasActiveFilters,
                transitionSpec = {
                    if (reduceMotion) {
                        EnterTransition.None togetherWith ExitTransition.None
                    } else {
                        (fadeIn(replace.animation()) + scaleIn(replace.animation(), initialScale = 0.5f)) togetherWith
                            (fadeOut(replace.animation()) + scaleOut(replace.animation(), targetScale = 0.5f))
                    }
                },
                label = "filtersIcon",
            ) { active ->
                if (active) {
                    FixedSymbol(Symbols.filterCircleFill, 20f, colors.actionText)
                } else {
                    FixedSymbol(Symbols.filterCircle, 20f, colors.label)
                }
            }
        }

        BarButton(label = localized("Settings"), onClick = onShowSettings) {
            FixedSymbol(Symbols.ellipsisCircle, 20f, colors.label)
        }
    }
}

/** A symbol's button in the bar: 44 points square, reaching the glass's edges above and under it. */
@Composable
private fun BarButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier
            .plainButton(label = label, onClick = onClick)
            .padding(vertical = COLLAPSED_PADDING)
            .size(44.dp),
        contentAlignment = Alignment.Center,
    ) {
        content()
    }
}

/** What leads the bar: a search icon, a tile for the place, or a spinner while locating. */
@Composable
private fun BarIndicator(state: ScooterSearchBarState) {
    when (state) {
        ScooterSearchBarState.Empty -> Box(Modifier.size(34.dp), contentAlignment = Alignment.Center) {
            FixedSymbol(Symbols.search, 17f, scootColors.secondaryText)
        }
        is ScooterSearchBarState.Place -> SearchSymbolTile(Symbols.mapPin)
        ScooterSearchBarState.Locating -> Box(Modifier.size(34.dp), contentAlignment = Alignment.Center) {
            Spinner(SpinnerSize.Small)
        }
    }
}

@Composable
private fun BarText(state: ScooterSearchBarState, modifier: Modifier = Modifier) {
    val colors = scootColors
    val isAccessibility = TextSize.isAccessibility
    val isEmpty = state == ScooterSearchBarState.Empty
    val showsPlace = state is ScooterSearchBarState.Place
    Column(modifier, verticalArrangement = Arrangement.spacedBy(1.dp)) {
        // With nothing chosen the bar reads like an empty search field.
        val style = ScootType.subheadline.weight(if (isEmpty) FontWeight.Medium else FontWeight.SemiBold)
        Text(
            state.title,
            style = style,
            color = if (isEmpty) colors.secondaryText else colors.label,
            maxLines = if (isAccessibility) 2 else 1,
            overflow = TextOverflow.Ellipsis,
            // A long place name is cut short. The bar's own sentences shrink further instead: "Recherche de votre
            // position…" on a narrow phone.
            autoSize = shrinking(style, if (showsPlace) 0.9f else 0.8f),
        )
        val subtitle = state.subtitle
        if (subtitle != null && !isAccessibility) {
            // Beside the clear button the line is too long for narrow phones and for Italian, so it may take a
            // second line.
            Text(subtitle, style = ScootType.caption, color = colors.secondaryText, maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
    }
}
