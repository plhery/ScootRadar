package com.plhery.scootradar.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.compose.currentStateAsState
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.hasActiveFilters
import com.plhery.scootradar.core.map.nearbyCities
import com.plhery.scootradar.core.map.searchBarState
import com.plhery.scootradar.core.map.searchNear
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterFold
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.UserInterfaceStyle
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.ui.chrome.FloatingMapControls
import com.plhery.scootradar.ui.chrome.LocationIssueCard
import com.plhery.scootradar.ui.chrome.LocationSettings
import com.plhery.scootradar.ui.chrome.MapStatusBanner
import com.plhery.scootradar.ui.chrome.ZoneLegend
import com.plhery.scootradar.ui.dock.PANEL_FOOT
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.filters.ScooterFilterSheet
import com.plhery.scootradar.ui.glass.Glass
import com.plhery.scootradar.ui.glass.LocalGlass
import com.plhery.scootradar.ui.glass.MapBackdrop
import com.plhery.scootradar.ui.glass.glassMayBlur
import com.plhery.scootradar.ui.search.LocalAddressSearch
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.sheet.IosFormSheet
import com.plhery.scootradar.ui.sheet.IosPopover
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.SelectionFeedback
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.motion
import kotlin.math.min
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow

// ios/ScootRadar/Views/ScooterMapScreen.swift: the screen around the map, and the chrome over it: a phone's
// (dockChrome, ui.md UI-004 to UI-006), or a large window's panel (panelChrome, UI-007, UI-008, UI-113, UI-124),
// with the search bar at its top (searchIsland, UI-009), both kept clear of a foldable's fold (UI-116 to UI-118).

/** The app's one screen: the map, edge to edge, the chrome over it, and the window's appearance. */
@Composable
fun ScooterMapScreen(
    controller: ScooterMapController,
    /** The map itself, dark or light; tests put something plain in its place. */
    map: @Composable (dark: Boolean) -> Unit,
    /** Whether the glass may blur the map; tests choose. */
    glassBlurs: Boolean = glassMayBlur(),
    /** Where the chrome's own events go, as ScooterAnalytics.shared on the iPhone; none in tests. */
    analytics: ScooterAnalytics? = null,
    /** Where the search asks for places: the server's, or the tests' stand-in for it. */
    addressSearch: AddressSearchAPIClient? = null,
    /** Where Settings keeps the rider's choice about usage data, for ScooterAnalytics to read; none in tests. */
    defaults: ScooterDefaults? = null,
    /** What asks for a rating once the map has rested after a ride. */
    reviewRequester: ReviewRequester = ReviewRequester.none,
    /** Where the location card's Open Settings goes, and what its Try again asks first: the phone's location service. */
    locationSettings: LocationSettings = LocationSettings.appPage,
    /** The scootradar.com links to the map the phone opens in the app, as they come. */
    links: Flow<ScooterMapLink> = emptyFlow(),
) {
    val appearance by controller.appearance.collectAsStateWithLifecycle()
    val userLocation by controller.userLocation.collectAsStateWithLifecycle()
    val minute by everyMinute()
    // Automatic turns dark or light within the minute the sun has it.
    val style = remember(appearance, userLocation, minute) { controller.interfaceStyle }
    WindowAppearance(style)
    // The app's own appearance at once, rather than the window's once Android has applied it (MAP-291).
    val dark = when (style) {
        UserInterfaceStyle.Dark -> true
        UserInterfaceStyle.Light -> false
        UserInterfaceStyle.Unspecified -> isSystemInDarkTheme()
    }

    val context = LocalContext.current
    // The frame the map draws into, which the glass blurs.
    val backdrop = remember { MapBackdrop(context) }
    // Where the chrome is over the map, for the map to keep clear of it.
    val chrome = remember { MapChromeFrames() }
    var searchIsExpanded by remember { mutableStateOf(false) }
    var filtersPresented by remember { mutableStateOf(false) }
    var settingsPresented by remember { mutableStateOf(false) }
    val sheetOpen = filtersPresented || settingsPresented
    // Where a large window's Filters popover points: the panel's Filters button, in the window.
    var filtersButton by remember { mutableStateOf<Rect?>(null) }
    // Where the screen is in the window, in pixels, which a fold is measured from.
    var origin by remember { mutableStateOf(Offset.Zero) }

    ScootTheme(dark = dark) {
        CompositionLocalProvider(
            LocalGlass provides Glass(backdrop, glassBlurs),
            LocalAnalytics provides analytics,
            LocalAddressSearch provides addressSearch,
            LocalMapChrome provides chrome,
            LocalLocationSettings provides locationSettings,
        ) {
            BoxWithConstraints(Modifier.fillMaxSize().onGloballyPositioned { origin = it.positionInWindow() }) {
                // Chosen again at every size of the window, which turns and is resized without a new activity. Filters
                // and Settings, open, move to the new layout's presenters. A fold doesn't choose it: the size classes
                // and the width do (UI-119).
                val layout = rememberChromeLayout(maxWidth)
                val density = LocalDensity.current
                val screen = ScreenRect(
                    (origin.x / density.density).toDouble(),
                    (origin.y / density.density).toDouble(),
                    maxWidth.value.toDouble(),
                    maxHeight.value.toDouble(),
                )
                val fold = rememberWindowFold(screen)
                // The screen inside its safe area, in the window, which the iPhone's GeometryReader measures.
                val direction = LocalLayoutDirection.current
                val safe = WindowInsets.systemBars.union(WindowInsets.displayCutout).asPaddingValues()
                val inside = ScreenRect(
                    screen.x + safe.calculateLeftPadding(direction).value,
                    screen.y + safe.calculateTopPadding().value,
                    screen.width - (safe.calculateLeftPadding(direction) + safe.calculateRightPadding(direction)).value,
                    screen.height - (safe.calculateTopPadding() + safe.calculateBottomPadding()).value,
                )
                SideEffect {
                    chrome.layout = layout
                    chrome.fold = fold
                }
                // A sheet, a popover and a form are modal: TalkBack reads them alone, as VoiceOver does.
                Box(Modifier.fillMaxSize().then(if (sheetOpen) Modifier.clearAndSetSemantics { } else Modifier)) {
                    map(dark)
                    val onShowFilters = {
                        searchIsExpanded = false
                        filtersPresented = true
                    }
                    val onShowSettings = {
                        searchIsExpanded = false
                        settingsPresented = true
                    }
                    when (layout) {
                        ScooterChromeLayout.Dock -> DockChrome(
                            controller,
                            chrome = chrome,
                            chromeTop = ScooterFold.chromeTop(below = fold, container = inside).dp,
                            isSearching = searchIsExpanded,
                            onSearchingChange = { searchIsExpanded = it },
                            onShowFilters = onShowFilters,
                            onShowSettings = onShowSettings,
                        )
                        ScooterChromeLayout.Panel -> PanelChrome(
                            controller,
                            chrome = chrome,
                            width = ScooterFold.panelWidth(
                                ScooterChromeLayout.panelWidth(TextSize.isAccessibility),
                                beside = fold,
                                container = inside,
                                inset = 16.0,
                                rightToLeft = direction == LayoutDirection.Rtl,
                            ).dp,
                            isSearching = searchIsExpanded,
                            onSearchingChange = { searchIsExpanded = it },
                            onShowFilters = onShowFilters,
                            onShowSettings = onShowSettings,
                            onFiltersButtonFrame = { filtersButton = it },
                        )
                    }
                }

                // Half of a short window shows the first settings only, so there Filters opens at full height, its
                // providers in view.
                val windowHeight = with(LocalDensity.current) { LocalWindowInfo.current.containerSize.height.toDp() }
                val dock = layout == ScooterChromeLayout.Dock
                IosSheet(
                    isPresented = filtersPresented && dock,
                    onDismiss = { filtersPresented = false },
                    detents = if (windowHeight < 700.dp) listOf(SheetDetent.Large) else listOf(SheetDetent.Medium, SheetDetent.Large),
                    title = localized("Filters"),
                ) { bottomInset ->
                    ScooterFilterSheet(controller, bottomInset, onDone = { filtersPresented = false })
                }
                // Beside a panel, a popover under its search bar, with the map beside the panel in view, where what
                // the filters change shows as they change.
                IosPopover(
                    isPresented = filtersPresented && !dock,
                    onDismiss = { filtersPresented = false },
                    anchor = filtersButton,
                    title = localized("Filters"),
                ) {
                    ScooterFilterSheet(controller, bottomInset = 0.dp, onDone = { filtersPresented = false }, inPopover = true)
                }
                IosSheet(
                    isPresented = settingsPresented && dock,
                    onDismiss = { settingsPresented = false },
                    detents = listOf(SheetDetent.Medium, SheetDetent.Large),
                    title = localized("Settings"),
                ) { bottomInset ->
                    ScooterSettingsSheet(controller, bottomInset, defaults, onDone = { settingsPresented = false })
                }
                // Beside a panel, a form at the trailing side, clear of the panel and of most of the map.
                IosFormSheet(isPresented = settingsPresented && !dock, onDismiss = { settingsPresented = false }, title = localized("Settings")) {
                    ScooterSettingsSheet(controller, bottomInset = 0.dp, defaults, onDone = { settingsPresented = false })
                }
            }
        }
    }

    // A scootradar.com link to the map: its place shows on the map, not under a sheet or the search.
    LaunchedEffect(links) {
        links.collect { link ->
            searchIsExpanded = false
            filtersPresented = false
            settingsPresented = false
            controller.open(link)
        }
    }
    OnChange(searchIsExpanded) { expanded -> analytics?.track(if (expanded) "search_open" else "search_close") }
    OnChange(filtersPresented) { open ->
        analytics?.track(if (open) "filters_open" else "panel_close")
        if (open) analytics?.track(screen = "/filters")
    }
    OnChange(settingsPresented) { open ->
        analytics?.track(if (open) "settings_open" else "panel_close")
        if (open) analytics?.track(screen = "/settings")
    }

    // Back closes the search, else the card of the scooter or bay chosen (UI-250), as Escape does on the iPad.
    val selectedScooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val selectedParking by controller.selectedParkingID.collectAsStateWithLifecycle()
    // A sheet over the map takes Back first.
    BackHandler(enabled = !sheetOpen && (searchIsExpanded || selectedScooter != null || selectedParking != null)) {
        if (searchIsExpanded) searchIsExpanded = false else controller.clearSelection()
    }

    // The app in front, with no search, sheet or location being found or gone wrong over the map.
    val lifecycleState by LocalLifecycleOwner.current.lifecycle.currentStateAsState()
    val isLocating by controller.isLocating.collectAsStateWithLifecycle()
    val locationIssue by controller.locationIssue.collectAsStateWithLifecycle()
    ReviewWhenTheMapRests(
        controller,
        nothingOverTheMap = lifecycleState.isAtLeast(Lifecycle.State.RESUMED) && !searchIsExpanded && !sheetOpen &&
            !isLocating && locationIssue == null,
        requester = reviewRequester,
        analytics = analytics,
    )
}

/** `.onChange(of:)`: [action] each time [value] changes, not for the value first shown. */
@Composable
private fun <T> OnChange(value: T, action: (T) -> Unit) {
    val current by rememberUpdatedState(action)
    var last by remember { mutableStateOf(value) }
    LaunchedEffect(value) {
        if (value == last) return@LaunchedEffect
        last = value
        current(value)
    }
}

/**
 * A phone's chrome: the search bar and its notices at the top, the dock at the bottom, and the locate button above
 * the dock. The search bar starts [chromeTop] down: under the fold of a foldable standing like a laptop, so that all
 * of them are on the half lying flat, within reach. Made anew in another language, as much of it is text written
 * when it was drawn.
 */
@Composable
private fun DockChrome(
    controller: ScooterMapController,
    chrome: MapChromeFrames,
    chromeTop: Dp,
    isSearching: Boolean,
    onSearchingChange: (Boolean) -> Unit,
    onShowFilters: () -> Unit,
    onShowSettings: () -> Unit,
) {
    val language by controller.language.collectAsStateWithLifecycle()
    val selectedScooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val selectedParking by controller.selectedParkingID.collectAsStateWithLifecycle()
    val loadIssue by controller.loadIssue.collectAsStateWithLifecycle()
    val locationIssue by controller.locationIssue.collectAsStateWithLifecycle()
    // Only a first load that failed is reported under the search bar; later failures are the dock's to report.
    val firstLoadFailure = (loadIssue as? ScooterLoadIssue.FirstLoadFailed)?.failure
    SelectionFeedback(selectedScooter)
    SelectionFeedback(selectedParking)

    val density = LocalDensity.current
    val dockHeight = remember { mutableIntStateOf(with(density) { 128.dp.roundToPx() }) }
    val locateButtonHeight = remember { mutableIntStateOf(with(density) { 52.dp.roundToPx() }) }
    // Measured only while the search is closed, as on the iPhone.
    val searchBarHeight = remember { mutableIntStateOf(with(density) { 62.dp.roundToPx() }) }
    // The keyboard doesn't move the dock or the locate row (`.ignoresSafeArea(.keyboard, edges: .bottom)`): the safe
    // area without it. Not safeDrawing.exclude(ime), which takes the keyboard's height off the navigation bar's too.
    val safe = WindowInsets.systemBars.union(WindowInsets.displayCutout).asPaddingValues()
    val safeTop = safe.calculateTopPadding()
    val safeBottom = safe.calculateBottomPadding()
    // The room under the home indicator, or 8 where there is none.
    val bottom = max(safeBottom, 8.dp)
    val below by animateDpAsState(chromeTop, motion(IosMotion.snappy(duration = 0.28)), label = "chromeTop")
    // The panel's layout has frames of its own.
    DisposableEffect(chrome) {
        onDispose {
            chrome.top = null
            chrome.dock = null
        }
    }

    key(language) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            // Measured inside the safe area, as the iPhone's GeometryReader is.
            val height = maxHeight - safeTop - safeBottom
            val dock = with(density) { dockHeight.intValue.toDp() }
            val locate = with(density) { locateButtonHeight.intValue.toDp() }
            val searchBar = with(density) { searchBarHeight.intValue.toDp() }
            val notices = firstLoadFailure != null || locationIssue != null

            TopStack(
                controller,
                failure = firstLoadFailure,
                locationIssue = locationIssue,
                noticesLimit = max(64.dp, height - chromeTop - 8.dp - searchBar - 8.dp - 8.dp - locate - (dock + bottom + 10.dp)),
                isSearching = isSearching,
                onSearchingChange = onSearchingChange,
                onShowFilters = onShowFilters,
                onShowSettings = onShowSettings,
                // The window's bottom, inside its safe area.
                bottomLimit = maxHeight - safeBottom,
                chrome = chrome,
                onSearchBarHeightChange = { if (!isSearching) searchBarHeight.intValue = it },
                modifier = Modifier.padding(top = safeTop + 8.dp + below, start = 12.dp, end = 12.dp),
            )

            // The locate button and the dock make way for the search, and come back as it closes. They stay, unseen,
            // so that a card keeps where it was scrolled to and the dock what it last announced.
            val trailing = if (LocalLayoutDirection.current == LayoutDirection.Ltr) 1f else 0f
            val locateGone by animateFloatAsState(if (isSearching) 1f else 0f, motion(IosMotion.snappy(duration = 0.28)), label = "locate")
            Box(Modifier.fillMaxSize().makingWay(isSearching, { locateGone }, scale = 0.92f, TransformOrigin(trailing, 1f))) {
                Row(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .padding(horizontal = 10.dp)
                        .widthIn(max = 560.dp)
                        .fillMaxWidth()
                        .padding(end = 2.dp)
                        .padding(bottom = dock + bottom + 10.dp)
                        .inert(isSearching),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Bottom,
                ) {
                    // The legend at the leading edge, a spacer's 10 short of the button: the iPhone's HStack. The
                    // iPad's puts it against the button, after the spacer.
                    Box(Modifier.weight(1f).padding(end = 10.dp), contentAlignment = Alignment.BottomStart) {
                        ZoneLegendOverTheMap(controller, chrome, Modifier.padding(start = 2.dp))
                    }
                    FloatingMapControls(
                        controller,
                        Modifier
                            .onSizeChanged { locateButtonHeight.intValue = it.height }
                            // The map centres a scooter in what this button and the dock leave visible.
                            .onGloballyPositioned { chrome.locateButton = it.windowFrame(density.density) },
                    )
                }
            }

            val isAccessibility = TextSize.isAccessibility
            val dockGone by animateFloatAsState(if (isSearching) 1f else 0f, motion(IosMotion.snappy(duration = 0.24)), label = "dock")
            Box(Modifier.fillMaxSize().makingWay(isSearching, { dockGone }, scale = 0.96f, TransformOrigin(0.5f, 1f))) {
                ScooterControlDock(
                    controller,
                    onEditFilters = onShowFilters,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(horizontal = 10.dp)
                        .padding(bottom = bottom)
                        .onGloballyPositioned { chrome.dock = it.windowFrame(density.density) }
                        .inert(isSearching),
                    maximumContentHeight = max(
                        160.dp,
                        height - chromeTop - (if (isAccessibility) 300.dp else 220.dp) -
                            // With large text a notice under the search bar needs room too.
                            (if (isAccessibility && notices) 120.dp else 0.dp),
                    ),
                    onHeightChange = { dockHeight.intValue = it },
                )
            }
        }
    }
}

/**
 * A large window's chrome, as the website's on a computer: the search bar, the notices and the dock's card one under
 * the other in a panel down the leading side, over the map, and the locate button in the map's trailing corner. The
 * open search covers the panel, and nothing else. The card folds down to one line, and the map then shows, and takes
 * taps, under the panel; the notices stay. Beside the fold of a foldable open like a book the panel keeps to its
 * half, [width] wide. Made anew in another language, as the phone's is.
 */
@Composable
private fun PanelChrome(
    controller: ScooterMapController,
    chrome: MapChromeFrames,
    width: Dp,
    isSearching: Boolean,
    onSearchingChange: (Boolean) -> Unit,
    onShowFilters: () -> Unit,
    onShowSettings: () -> Unit,
    /** The search bar's Filters button's frame in the window, in pixels, which the Filters popover points at. */
    onFiltersButtonFrame: (Rect) -> Unit,
) {
    val language by controller.language.collectAsStateWithLifecycle()
    val selectedScooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val selectedParking by controller.selectedParkingID.collectAsStateWithLifecycle()
    val loadIssue by controller.loadIssue.collectAsStateWithLifecycle()
    val locationIssue by controller.locationIssue.collectAsStateWithLifecycle()
    val firstLoadFailure = (loadIssue as? ScooterLoadIssue.FirstLoadFailed)?.failure
    SelectionFeedback(selectedScooter)
    SelectionFeedback(selectedParking)

    val density = LocalDensity.current
    // Measured only while the search is closed, as on the iPhone.
    val searchBarHeight = remember { mutableIntStateOf(with(density) { 62.dp.roundToPx() }) }
    val noticesHeight = remember { mutableIntStateOf(0) }
    val safe = WindowInsets.systemBars.union(WindowInsets.displayCutout).asPaddingValues()
    val safeTop = safe.calculateTopPadding()
    val safeBottom = safe.calculateBottomPadding()
    DisposableEffect(chrome) { onDispose { chrome.panel = null } }

    key(language) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val windowHeight = maxHeight
            // Inside the safe area, as the iPhone's GeometryReader is.
            Box(Modifier.fillMaxSize().padding(safe)) {
                val height = windowHeight - safeTop - safeBottom
                val searchBar = with(density) { searchBarHeight.intValue.toDp() }
                val notices = firstLoadFailure != null || locationIssue != null
                // The room in the panel under the search bar, which the notices and the dock share: notices take
                // half of it at most, and the dock's content the rest, inside its own padding and above its grabber.
                val room = height - 16.dp - searchBar - 8.dp - 16.dp
                val noticesLimit = max(64.dp, room / 2)
                val noticesTaken = if (notices) with(density) { noticesHeight.intValue.toDp() } else 0.dp
                val dockLimit = max(160.dp, room - noticesTaken - 16.dp - PANEL_FOOT)
                val gone by animateFloatAsState(if (isSearching) 1f else 0f, motion(IosMotion.snappy(duration = 0.24)), label = "panel")
                Box(
                    Modifier
                        .padding(16.dp)
                        .width(width)
                        // The map shows a scooter beside the panel, and keeps its names and its taps off it.
                        .onGloballyPositioned { chrome.panel = it.windowFrame(density.density) },
                ) {
                    Column(
                        Modifier
                            .makingWay(isSearching, { gone }, scale = 0.96f, TransformOrigin(0.5f, 0f))
                            .padding(top = searchBar + 8.dp)
                            .inert(isSearching),
                    ) {
                        // The dock moves down for the notices, and back up as they go, as they slide.
                        val noticesSpring = motion<IntSize>(IosMotion.snappy(duration = 0.28))
                        AnimatedVisibility(
                            notices,
                            enter = expandVertically(noticesSpring, Alignment.Top, clip = false),
                            exit = shrinkVertically(noticesSpring, Alignment.Top, clip = false),
                            label = "notices",
                        ) {
                            TopNotices(
                                controller,
                                failure = firstLoadFailure,
                                locationIssue = locationIssue,
                                limit = noticesLimit,
                                onSearchingChange = onSearchingChange,
                                modifier = Modifier
                                    .onSizeChanged { noticesHeight.intValue = it.height }
                                    .padding(bottom = 8.dp),
                            )
                        }
                        ScooterControlDock(
                            controller,
                            layout = ScooterChromeLayout.Panel,
                            maximumContentHeight = dockLimit,
                            onEditFilters = onShowFilters,
                        )
                    }
                    // Over the panel, which the open search covers.
                    SearchIsland(
                        controller,
                        isSearching = isSearching,
                        onSearchingChange = onSearchingChange,
                        onShowFilters = onShowFilters,
                        onShowSettings = onShowSettings,
                        // The window's bottom, inside its safe area.
                        bottomLimit = windowHeight - safeBottom,
                        onCollapsedHeightChange = { if (!isSearching) searchBarHeight.intValue = it },
                        onFiltersFrameChange = onFiltersButtonFrame,
                    )
                }

                // The legend against the locate button, in the map's trailing corner.
                Row(
                    Modifier.align(Alignment.BottomEnd).padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Bottom,
                ) {
                    ZoneLegendOverTheMap(controller, chrome)
                    FloatingMapControls(
                        controller,
                        Modifier.onGloballyPositioned { chrome.locateButton = it.windowFrame(density.density) },
                    )
                }
            }
        }
    }
}

/**
 * `.opacity` and `.scaleEffect(_:anchor:)` on what makes way for the search: it fades and shrinks a little toward
 * [origin] of the screen as [gone] goes from 0 to 1, and comes back as it returns to 0. With `.accessibilityHidden`,
 * TalkBack leaves it as soon as it starts to go, and once it is gone taps go through it to the map.
 */
private fun Modifier.makingWay(hidden: Boolean, gone: () -> Float, scale: Float, origin: TransformOrigin): Modifier =
    graphicsLayer {
        val progress = gone()
        alpha = 1 - progress
        val scaled = 1 - (1 - scale) * progress
        scaleX = scaled
        scaleY = scaled
        transformOrigin = origin
        // Clipped to nothing, it is no longer in the way of a finger: Compose hit-tests inside a layer's clip.
        if (hidden && progress == 1f) {
            clip = true
            shape = EmptyShape
        }
    }.then(if (hidden) Modifier.semantics { hideFromAccessibility() } else Modifier)

/** `.allowsHitTesting(false)` while it goes: its buttons and its scroll take no touch. */
private fun Modifier.inert(hidden: Boolean): Modifier =
    if (!hidden) {
        this
    } else {
        pointerInput(Unit) {
            awaitPointerEventScope {
                while (true) awaitPointerEvent(PointerEventPass.Initial).changes.forEach { it.consume() }
            }
        }
    }

/** A shape with no inside. */
private val EmptyShape = object : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density) = Outline.Rectangle(Rect.Zero)
}

/**
 * What the zones' colours mean, while they are on, and a city's rules over the map; the names on the map keep clear
 * of it.
 */
@Composable
private fun ZoneLegendOverTheMap(controller: ScooterMapController, chrome: MapChromeFrames, modifier: Modifier = Modifier) {
    val state by controller.zoneState.collectAsStateWithLifecycle()
    val zones by controller.mapZones.collectAsStateWithLifecycle()
    val rules by controller.mapRuleZones.collectAsStateWithLifecycle()
    if (state == ScooterZoneState.Off && rules.isEmpty()) return
    val density = LocalDensity.current.density
    ZoneLegend(
        state = state,
        count = zones.size - rules.size,
        rules = rules,
        modifier = modifier.onGloballyPositioned { chrome.zoneLegend = it.windowFrame(density) },
    )
    DisposableEffect(Unit) { onDispose { chrome.zoneLegend = null } }
}

/** Where a piece of the chrome is in the window, in points, which are the map's. */
private fun LayoutCoordinates.windowFrame(density: Float): ScreenRect {
    val bounds = boundsInWindow()
    return ScreenRect(
        (bounds.left / density).toDouble(),
        (bounds.top / density).toDouble(),
        (bounds.width / density).toDouble(),
        (bounds.height / density).toDouble(),
    )
}

/**
 * The search bar and what sits under it: the banner of a first load that failed, and the card of a location that
 * could not be found. With large text they can be taller than the room above the locate button; then they scroll.
 */
@Composable
private fun TopStack(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
    noticesLimit: Dp,
    isSearching: Boolean,
    onSearchingChange: (Boolean) -> Unit,
    onShowFilters: () -> Unit,
    onShowSettings: () -> Unit,
    bottomLimit: Dp,
    chrome: MapChromeFrames,
    onSearchBarHeightChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val density = LocalDensity.current
    // The search bar and the notices under it, closed: what the map keeps its names under, and centres a place
    // below. The open search covers the map, and leaves the map's frame as it was.
    var stackFrame by remember { mutableStateOf<ScreenRect?>(null) }
    var barHeight by remember { mutableIntStateOf(0) }
    var noticesHeight by remember { mutableIntStateOf(0) }
    SideEffect {
        val frame = stackFrame ?: return@SideEffect
        if (barHeight == 0 || isSearching) return@SideEffect
        val notices = if (noticesHeight > 0) with(density) { 8.dp.toPx() } + noticesHeight else 0f
        chrome.top = ScreenRect(frame.x, frame.y, frame.width, ((barHeight + notices) / density.density).toDouble())
    }

    Column(
        modifier
            .fillMaxWidth()
            .onGloballyPositioned { stackFrame = it.windowFrame(density.density) },
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        SearchIsland(
            controller,
            isSearching = isSearching,
            onSearchingChange = onSearchingChange,
            onShowFilters = onShowFilters,
            onShowSettings = onShowSettings,
            bottomLimit = bottomLimit,
            onCollapsedHeightChange = {
                barHeight = it
                onSearchBarHeightChange(it)
            },
        )

        // The notices go while the search is open.
        val searchSpring = IosMotion.spring(response = 0.36, dampingFraction = 0.88)
        val searchMotion = motion<Float>(searchSpring)
        AnimatedVisibility(
            visible = !isSearching,
            enter = fadeIn(searchMotion),
            exit = fadeOut(searchMotion),
            label = "notices",
        ) {
            TopNotices(
                controller,
                failure = failure,
                locationIssue = locationIssue,
                limit = noticesLimit,
                onSearchingChange = onSearchingChange,
                modifier = Modifier.onSizeChanged { noticesHeight = it.height },
            )
        }
    }
}

/**
 * What sits under the search bar: the banner of a first load that failed, and the card of a location that could not
 * be found, as tall as [limit] at most. As ViewThatFits: a plain stack while the notices fit, which leaves their
 * shadows and slides whole, and a scroll, which clips them, only when they don't.
 */
@Composable
private fun TopNotices(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
    limit: Dp,
    onSearchingChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isLoading by controller.isLoading.collectAsStateWithLifecycle()
    // What a banner or a card said stays on it while it goes.
    val lastFailure = rememberLast(failure)
    val lastIssue = rememberLast(locationIssue)
    val context = LocalContext.current
    val locationSettings = LocalLocationSettings.current
    val spring = IosMotion.snappy(duration = 0.28)
    val reduceMotion = LocalReduceMotion.current
    val enter = if (reduceMotion) fadeIn(snap()) else slideInVertically(spring.animation()) { -it } + fadeIn(spring.animation())
    val exit = if (reduceMotion) fadeOut(snap()) else slideOutVertically(spring.animation()) { -it } + fadeOut(spring.animation())
    val density = LocalDensity.current
    var contentHeight by remember { mutableIntStateOf(0) }
    val scrolls = contentHeight > with(density) { limit.roundToPx() }
    Column(
        modifier
            .heightIn(max = limit)
            .then(if (scrolls) Modifier.verticalScroll(rememberScrollState()) else Modifier)
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints.copy(maxHeight = Constraints.Infinity))
                contentHeight = placeable.height
                layout(placeable.width, min(placeable.height, constraints.maxHeight)) { placeable.place(0, 0) }
            },
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        AnimatedVisibility(failure != null, enter = enter, exit = exit) {
            val shown = lastFailure ?: return@AnimatedVisibility
            Box {
                MapStatusBanner(
                    message = shown.message,
                    actionTitle = localized("Try again"),
                    onAction = controller::retryLoad,
                    isBusy = isLoading,
                )
                // Said as it appears and each time its message changes.
                Announcer(Announcement(shown.message))
            }
        }
        AnimatedVisibility(locationIssue != null, enter = enter, exit = exit) {
            val issue = lastIssue ?: return@AnimatedVisibility
            Box {
                LocationIssueCard(
                    issue = issue,
                    onOpenSettings = { context.startActivity(locationSettings.settingsIntent(context)) },
                    onSearchPlace = {
                        // Searching is the answer to the card, so it goes away.
                        controller.dismissLocationIssue()
                        onSearchingChange(true)
                    },
                    onRetry = { locationSettings.retry(controller::focusOnUser) },
                    onDismiss = controller::dismissLocationIssue,
                )
                Announcer(Announcement(listOfNotNull(issue.title, issue.message).joinToString(" ")))
            }
        }
    }
}

/**
 * The search bar, with what it reads from the controller: the cities near the map and the place to search near
 * are worked out only while it is open.
 */
@Composable
private fun SearchIsland(
    controller: ScooterMapController,
    isSearching: Boolean,
    onSearchingChange: (Boolean) -> Unit,
    onShowFilters: () -> Unit,
    onShowSettings: () -> Unit,
    bottomLimit: Dp,
    onCollapsedHeightChange: (Int) -> Unit,
    onFiltersFrameChange: (Rect) -> Unit = {},
) {
    val changes = rememberControllerChanges(controller)
    val state = remember(controller, changes) { controller.searchBarState }
    val hasActiveFilters = remember(controller, changes) { controller.hasActiveFilters }
    val recentPlaces by controller.recentPlaces.collectAsStateWithLifecycle()
    val nearbyCities = remember(controller, changes, isSearching) {
        if (isSearching) controller.nearbyCities.map { it.city } else emptyList()
    }
    val near = remember(controller, changes, isSearching) { if (isSearching) controller.searchNear else null }
    ScooterSearchIsland(
        state = state,
        isSearching = isSearching,
        onSearchingChange = onSearchingChange,
        hasActiveFilters = hasActiveFilters,
        recentPlaces = recentPlaces,
        nearbyCities = nearbyCities,
        near = near,
        bottomLimit = bottomLimit,
        onSelect = controller::focusOnAddress,
        onChooseCity = controller::chooseCity,
        onClear = controller::clearAddressSearch,
        onUseCurrentLocation = controller::focusOnUser,
        onShowFilters = onShowFilters,
        onShowSettings = onShowSettings,
        onCollapsedHeightChange = onCollapsedHeightChange,
        onFiltersFrameChange = onFiltersFrameChange,
    )
}

/** The analytics the chrome tracks its taps with, such as "rental_open"; none where the screen was given none. */
val LocalAnalytics = staticCompositionLocalOf<ScooterAnalytics?> { null }

/** What the location card's Open Settings and Try again ask of the phone. */
val LocalLocationSettings = staticCompositionLocalOf { LocationSettings.appPage }

/** The last value that was not null. */
@Composable
private fun <T : Any> rememberLast(value: T?): T? {
    val last = remember { mutableStateOf(value) }
    if (value != null) last.value = value
    return last.value
}
