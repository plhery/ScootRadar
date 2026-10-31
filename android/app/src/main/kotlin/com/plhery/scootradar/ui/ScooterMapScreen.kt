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
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.absolutePadding
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.tappableElement
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
import androidx.compose.runtime.Stable
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
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.Layout
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
import com.plhery.scootradar.core.model.ScooterKeyCommand
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
import com.plhery.scootradar.ui.theme.atOnceUnderReduceMotion
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
    /** Where the screen says what its keys stand for, for the activity to list them in Android's helper. */
    shortcuts: ScreenShortcuts? = null,
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
    SeeThroughCaption(light = !dark)

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
    val selectedScooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val selectedParking by controller.selectedParkingID.collectAsStateWithLifecycle()
    val isLocating by controller.isLocating.collectAsStateWithLifecycle()
    val isPanelCollapsed by controller.isPanelCollapsed.collectAsStateWithLifecycle()

    // The screen as the keyboard finds it, and what a key does: what the button or the gesture it stands for does.
    val keySituation = ScooterKeyCommand.Situation(
        layout = chrome.layout,
        isSearching = searchIsExpanded,
        isPresenting = sheetOpen,
        hasCard = selectedScooter != null || selectedParking != null,
        isFolded = isPanelCollapsed,
        isLocating = isLocating,
    )
    fun perform(command: ScooterKeyCommand) {
        when (command) {
            ScooterKeyCommand.Search, ScooterKeyCommand.SearchWithSlash -> searchIsExpanded = true
            ScooterKeyCommand.NearMe -> {
                searchIsExpanded = false
                controller.focusOnUser()
            }
            ScooterKeyCommand.ZoomIn, ScooterKeyCommand.ZoomInWithoutShift -> controller.zoom(by = 1)
            ScooterKeyCommand.ZoomOut -> controller.zoom(by = -1)
            ScooterKeyCommand.Filters -> {
                searchIsExpanded = false
                filtersPresented = true
            }
            ScooterKeyCommand.StandardMap, ScooterKeyCommand.QuietMap, ScooterKeyCommand.SatelliteMap ->
                command.mapStyle?.let(controller::setMapStyle)
            ScooterKeyCommand.Settings -> {
                searchIsExpanded = false
                settingsPresented = true
            }
            ScooterKeyCommand.Close -> when (ScooterKeyCommand.closing(keySituation)) {
                ScooterKeyCommand.Closing.Card -> controller.clearSelection()
                ScooterKeyCommand.Closing.Search -> searchIsExpanded = false
                null -> Unit
            }
            ScooterKeyCommand.Fold -> controller.setPanelCollapsed(!isPanelCollapsed)
        }
    }
    val keys = shortcuts ?: remember { ScreenShortcuts() }
    SideEffect {
        keys.situation = keySituation
        keys.perform = ::perform
    }
    DisposableEffect(keys) {
        onDispose {
            keys.situation = null
            keys.perform = null
        }
    }

    ScootTheme(dark = dark) {
        CompositionLocalProvider(
            LocalGlass provides Glass(backdrop, glassBlurs),
            LocalAnalytics provides analytics,
            LocalAddressSearch provides addressSearch,
            LocalMapChrome provides chrome,
            LocalLocationSettings provides locationSettings,
        ) {
            // The keys reach the screen before what has the focus in it, as a key command reaches the window before
            // the field being typed in; with nothing focused, the activity hands them over. A mouse's right click
            // reaches nothing in it, the map included, as on an iPad (X-AD22).
            BoxWithConstraints(
                Modifier
                    .fillMaxSize()
                    .primaryClicksOnly()
                    .onGloballyPositioned { origin = it.positionInWindow() }
                    .onPreviewKeyEvent(keys::handle),
            ) {
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
                val captionButtons = rememberCaptionButtons(origin)
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
                    chrome.isSearching = searchIsExpanded
                    chrome.captionButtons = captionButtons
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
                            captionButtons = captionButtons,
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
                            captionButtons = captionButtons,
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
    // A sheet over the map takes Back first.
    BackHandler(enabled = !sheetOpen && (searchIsExpanded || selectedScooter != null || selectedParking != null)) {
        if (searchIsExpanded) searchIsExpanded = false else controller.clearSelection()
    }

    // The app in front, with no search, sheet or location being found or gone wrong over the map.
    val lifecycleState by LocalLifecycleOwner.current.lifecycle.currentStateAsState()
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
 * of them are on the half lying flat, within reach. In a window whose caption bar the map runs under, the search bar
 * keeps to the top beside the caption's [captionButtons], and goes under the caption where it can't. Made anew in
 * another language, as much of it is text written when it was drawn.
 */
@Composable
private fun DockChrome(
    controller: ScooterMapController,
    chrome: MapChromeFrames,
    chromeTop: Dp,
    captionButtons: List<ScreenRect>,
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
    val safeBottom = safe.calculateBottomPadding()
    // The safe area's top with the caption bar left out, which the map shows through.
    val captionTop = WindowInsets.statusBars.union(WindowInsets.displayCutout).asPaddingValues().calculateTopPadding()
    // The dock, the locate row over it and the notices' room stand this far above the safe area's foot; the dock's
    // foot is the safe area's and this above the window's.
    val overSafeFoot = dockFoot(safeBottom, tappableBottom = WindowInsets.tappableElement.asPaddingValues().calculateBottomPadding())
    val bottom = safeBottom + overSafeFoot
    val below by animateDpAsState(chromeTop, motion(IosMotion.snappy(duration = 0.28)), label = "chromeTop").atOnceUnderReduceMotion(chromeTop)
    // The panel's layout has frames of its own.
    DisposableEffect(chrome) {
        onDispose {
            chrome.top = null
            chrome.dock = null
        }
    }

    // The controls keep clear of a cutout or a navigation bar down a side, as the iPhone's GeometryReader keeps to the
    // safe area's sides (X-AD34).
    val direction = LocalLayoutDirection.current
    val safeLeft = safe.calculateLeftPadding(direction)
    val safeRight = safe.calculateRightPadding(direction)

    key(language) {
        BoxWithConstraints(Modifier.fillMaxSize().absolutePadding(left = safeLeft, right = safeRight)) {
            val dock = with(density) { dockHeight.intValue.toDp() }
            val locate = with(density) { locateButtonHeight.intValue.toDp() }
            val searchBar = with(density) { searchBarHeight.intValue.toDp() }
            val notices = firstLoadFailure != null || locationIssue != null
            // The search bar across the top, at most 560 wide; beside the caption's buttons if it fits there. Under a
            // fold it is well under the caption. In the window's points, as the caption's buttons are.
            val slot = ScreenRect((safeLeft + 12.dp).value.toDouble(), 0.0, (maxWidth - 24.dp).value.toDouble(), 0.0)
            val barWidth = minOf(slot.width, 560.0)
            val bar = ScreenRect(slot.midX - barWidth / 2, (captionTop + 8.dp).value.toDouble(), barWidth, searchBar.value.toDouble())
            val beside = if (chromeTop > 0.dp) null else besideCaption(bar, captionButtons)
            val safeTop = if (beside != null) captionTop else safe.calculateTopPadding()
            // Measured inside the safe area, as the iPhone's GeometryReader is.
            val height = maxHeight - safeTop - safeBottom

            TopStack(
                controller,
                failure = firstLoadFailure,
                locationIssue = locationIssue,
                noticesLimit = max(64.dp, height - chromeTop - 8.dp - searchBar - 8.dp - 8.dp - locate - (dock + overSafeFoot + 10.dp)),
                isSearching = isSearching,
                onSearchingChange = onSearchingChange,
                onShowFilters = onShowFilters,
                onShowSettings = onShowSettings,
                // The window's bottom, inside its safe area.
                bottomLimit = maxHeight - safeBottom,
                chrome = chrome,
                onSearchBarHeightChange = { if (!isSearching) searchBarHeight.intValue = it },
                settledTop = safeTop + 8.dp + chromeTop,
                modifier = Modifier.padding(top = safeTop + 8.dp + below, start = 12.dp, end = 12.dp),
                searchBarModifier = beside?.let { Modifier.besideCaption(it, slot) } ?: Modifier,
                barSpan = bar.takeIf { beside != null },
            )

            // The locate button and the dock make way for the search, and come back as it closes. They stay, unseen,
            // so that a card keeps where it was scrolled to and the dock what it last announced.
            val trailing = if (LocalLayoutDirection.current == LayoutDirection.Ltr) 1f else 0f
            // Under Reduce Motion gone, or back, in the frame the search opens or closes (UI-184).
            val searchGone = if (isSearching) 1f else 0f
            val locateGone by animateFloatAsState(searchGone, motion(IosMotion.snappy(duration = 0.28)), label = "locate")
                .atOnceUnderReduceMotion(searchGone)
            val isAccessibility = TextSize.isAccessibility
            val dockGone by animateFloatAsState(searchGone, motion(IosMotion.snappy(duration = 0.24)), label = "dock")
                .atOnceUnderReduceMotion(searchGone)
            // The locate row stands 10 above the dock's card, laid out from where the card is in the same pass, as the
            // iPhone's padding by the dock's height is: a height read back as state would move the row a frame after
            // the card, which shows under Reduce Motion, where the card changes height in one frame.
            Layout(
                content = {
                    Box(Modifier.fillMaxSize().unheard(isSearching)) {
                        Row(
                            Modifier
                                .align(Alignment.BottomCenter)
                                .padding(horizontal = 10.dp)
                                .widthIn(max = 560.dp)
                                .fillMaxWidth()
                                .padding(end = 2.dp)
                                .inert(isSearching),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.Bottom,
                        ) {
                            // The legend at the leading edge, a spacer's 10 short of the button: the iPhone's HStack.
                            // The iPad's puts it against the button, after the spacer.
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
                    Box(Modifier.fillMaxSize().makingWay(isSearching, { dockGone }, scale = 0.96f, TransformOrigin(0.5f, 1f))) {
                        ScooterControlDock(
                            controller,
                            onEditFilters = onShowFilters,
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(horizontal = 10.dp)
                                .padding(bottom = bottom)
                                .dockTop()
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
                },
                modifier = Modifier.fillMaxSize(),
            ) { (locateRow, dockCard), constraints ->
                val card = dockCard.measure(constraints)
                val screenHeight = constraints.maxHeight
                val cardTop = card[DockTop].takeIf { it != AlignmentLine.Unspecified }
                    ?: (screenHeight - dockHeight.intValue - bottom.roundToPx())
                // The row's foot, 10 above the card: the row is laid out down to it.
                val foot = (cardTop - 10.dp.roundToPx()).coerceAtMost(screenHeight).coerceAtLeast(1)
                val screenWidth = constraints.maxWidth
                val row = locateRow.measure(Constraints.fixed(screenWidth, foot))
                // It shrinks toward the bottom trailing corner of the iPhone's VStack: the screen's bottom, and the
                // trailing edge of the row's 560 and its 10 either side, in the middle of a wider screen.
                val column = min(screenWidth, 580.dp.roundToPx())
                val corner = (screenWidth - column) / 2f + trailing * column
                layout(screenWidth, screenHeight) {
                    row.placeWithLayer(0, 0) {
                        makeWay(isSearching, locateGone, scale = 0.92f, TransformOrigin(corner / screenWidth, screenHeight.toFloat() / foot))
                    }
                    card.place(0, 0)
                }
            }
        }
    }
}

/**
 * How far above the safe area's foot the dock stands, [safeBottom] above the window's, and the locate row over it and
 * the notices' room with it (UI-121, PLAN §10, the dock's foot). The iPhone lays them out inside the safe area and pads
 * them by `max(proxy.safeAreaInsets.bottom, 8)` again (ScooterMapScreen.swift:284, :313, :506): over the home
 * indicator, its inset twice, the dock 68 pt above the foot of an iPhone 17 Pro Max (34 + 34); with no indicator, 8.
 * A gesture bar is the home indicator: its inset again, 8 at least. A navigation bar that takes taps where the gesture
 * bar lets them through to the app, the 3-button one, has a [tappableBottom]: it is a home-button iPhone's chin, under
 * a safe area whose foot is 0 on the iPhone, so 8 above it, not its height twice.
 */
internal fun dockFoot(safeBottom: Dp, tappableBottom: Dp): Dp = if (tappableBottom > 0.dp) 8.dp else max(safeBottom, 8.dp)

/** The top of the dock's card, which the locate row stands on. */
private val DockTop = HorizontalAlignmentLine(::min)

/** Tells the dock's layout where the card's top is, through [DockTop]. */
private fun Modifier.dockTop(): Modifier = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    layout(placeable.width, placeable.height, mapOf(DockTop to 0)) { placeable.place(0, 0) }
}

/**
 * A large window's chrome, as the website's on a computer: the search bar, the notices and the dock's card one under
 * the other in a panel down the leading side, over the map, and the locate button in the map's trailing corner. The
 * open search covers the panel, and nothing else. The card folds down to one line, and the map then shows, and takes
 * taps, under the panel; the notices stay. Beside the fold of a foldable open like a book the panel keeps to its
 * half, [width] wide. In a window whose caption bar the map runs under, the panel keeps to the top, its search bar
 * beside the caption's [captionButtons], and goes under the caption where the bar can't. Made anew in another
 * language, as the phone's is.
 */
@Composable
private fun PanelChrome(
    controller: ScooterMapController,
    chrome: MapChromeFrames,
    width: Dp,
    captionButtons: List<ScreenRect>,
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
    val noticeHeights = remember { NoticeHeights() }
    val safe = WindowInsets.systemBars.union(WindowInsets.displayCutout).asPaddingValues()
    val safeBottom = safe.calculateBottomPadding()
    // The safe area's top with the caption bar left out, which the map shows through.
    val captionTop = WindowInsets.statusBars.union(WindowInsets.displayCutout).asPaddingValues().calculateTopPadding()
    val direction = LocalLayoutDirection.current
    DisposableEffect(chrome) { onDispose { chrome.panel = null } }

    key(language) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val windowHeight = maxHeight
            val searchBar = with(density) { searchBarHeight.intValue.toDp() }
            // The panel's search bar at the top of its leading side, beside the caption's buttons if it fits there.
            val left = if (direction == LayoutDirection.Ltr) {
                safe.calculateLeftPadding(direction) + 16.dp
            } else {
                maxWidth - safe.calculateRightPadding(direction) - 16.dp - width
            }
            val bar = ScreenRect(left.value.toDouble(), (captionTop + 16.dp).value.toDouble(), width.value.toDouble(), searchBar.value.toDouble())
            val beside = besideCaption(bar, captionButtons)
            val safeTop = if (beside != null) captionTop else safe.calculateTopPadding()
            // Inside the safe area, as the iPhone's GeometryReader is.
            Box(
                Modifier.fillMaxSize().padding(
                    start = safe.calculateStartPadding(direction),
                    top = safeTop,
                    end = safe.calculateEndPadding(direction),
                    bottom = safeBottom,
                ),
            ) {
                val height = windowHeight - safeTop - safeBottom
                val notices = firstLoadFailure != null || locationIssue != null
                // The room in the panel under the search bar, which the notices and the dock share: notices take
                // half of it at most, and the dock's content the rest, inside its own padding and above its grabber.
                val room = height - 16.dp - searchBar - 8.dp - 16.dp
                val noticesLimit = max(64.dp, room / 2)
                val noticesTaken = if (notices) {
                    with(density) { noticeHeights.settled(firstLoadFailure, locationIssue, 8.dp.roundToPx(), noticesLimit.roundToPx()).toDp() } + 8.dp
                } else {
                    0.dp
                }
                val dockLimit = max(160.dp, room - noticesTaken - 16.dp - PANEL_FOOT)
                val searchGone = if (isSearching) 1f else 0f
                val gone by animateFloatAsState(searchGone, motion(IosMotion.snappy(duration = 0.24)), label = "panel")
                    .atOnceUnderReduceMotion(searchGone)
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
                        // The dock moves down for the notices, and back up as they go, on their spring.
                        TopNotices(
                            controller,
                            failure = firstLoadFailure,
                            locationIssue = locationIssue,
                            limit = noticesLimit,
                            onSearchingChange = onSearchingChange,
                            heights = noticeHeights,
                            modifier = Modifier.padding(bottom = 8.dp),
                        )
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
                        modifier = beside?.let { Modifier.besideCaption(it, bar) } ?: Modifier,
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
    graphicsLayer { makeWay(hidden, gone(), scale, origin) }.unheard(hidden)

/** [makingWay]'s layer, [progress] of the way gone. */
private fun GraphicsLayerScope.makeWay(hidden: Boolean, progress: Float, scale: Float, origin: TransformOrigin) {
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
}

/** [makingWay]'s `.accessibilityHidden`. */
private fun Modifier.unheard(hidden: Boolean): Modifier = if (hidden) semantics { hideFromAccessibility() } else this

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
 * What the zones' colours mean, while they are on, and the cities' rules and zones over the map; the names on the map
 * keep clear of it.
 */
@Composable
private fun ZoneLegendOverTheMap(controller: ScooterMapController, chrome: MapChromeFrames, modifier: Modifier = Modifier) {
    val state by controller.zoneState.collectAsStateWithLifecycle()
    val count by controller.mapOperatorZoneCount.collectAsStateWithLifecycle()
    val rules by controller.mapRuleZones.collectAsStateWithLifecycle()
    val notices by controller.mapZoneNotices.collectAsStateWithLifecycle()
    if (state == ScooterZoneState.Off && rules.isEmpty() && notices.isEmpty()) return
    val density = LocalDensity.current.density
    ZoneLegend(
        state = state,
        count = count,
        rules = rules,
        notices = notices,
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
 * [settledTop] is where the stack's top comes to rest under the top of the room it is given, where its [modifier]'s
 * padding springs to. Beside a caption's buttons, [searchBarModifier] moves and narrows the bar, and [barSpan] is where
 * it is across the screen without them, in the screen's points from the room's origin.
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
    settledTop: Dp,
    modifier: Modifier = Modifier,
    searchBarModifier: Modifier = Modifier,
    barSpan: ScreenRect? = null,
) {
    val density = LocalDensity.current
    // The search bar and the notices under it, closed: what the map keeps its names and its taps out of, and centres
    // a place below. As wide as they are, as the iPhone's VStack is, not the room they are centred in: in a window
    // more than 584 dp wide the bar's 560 leave the map's sides to it. The open search covers the map, and leaves the
    // map's frame as it was. Worked out as the stack is drawn, where its frames are read: under Reduce Motion the
    // stack goes under a fold in one step, which nothing else draws again (UI-194). Where the stack comes to rest,
    // not where its spring has it, as the iPhone's onGeometryChange reads the layout, which an animation doesn't move:
    // only the views that draw apply it to their frames (geometryGroup()'s documentation). Taps and names keep clear
    // of where the search bar goes under a fold from its first frame. So too a notice that goes leaves it at once, as
    // the iPhone's stack drops it from its layout while it goes over it. Beside a caption's buttons, across the bar's
    // whole width without them: the iPad's containerCornerOffset(_:sizeToFit:) offsets and sizes the bar's content in
    // the frame the bar had, which its stack lays out.
    var roomFrame by remember { mutableStateOf<ScreenRect?>(null) }
    var barFrame by remember { mutableStateOf<ScreenRect?>(null) }
    var noticesFrame by remember { mutableStateOf<ScreenRect?>(null) }
    var barHeight by remember { mutableIntStateOf(0) }
    val noticeHeights = remember { NoticeHeights() }
    val top = run {
        val room = roomFrame ?: return@run null
        // The span is the screen's, whose origin the room's is; the bar's frame is the window's.
        val bar = barFrame?.let { frame -> barSpan?.let { frame.copy(x = room.x + it.x, width = it.width) } ?: frame } ?: return@run null
        if (barHeight == 0 || isSearching) return@run null
        val noticesHeight = with(density) { noticeHeights.settled(failure, locationIssue, 8.dp.roundToPx(), noticesLimit.roundToPx()) }
        val notices = if (noticesHeight > 0) with(density) { 8.dp.toPx() } + noticesHeight else 0f
        val sides = listOfNotNull(bar, noticesFrame?.takeIf { noticesHeight > 0 })
        val left = sides.minOf { it.minX }
        ScreenRect(left, room.y + settledTop.value, sides.maxOf { it.maxX } - left, ((barHeight + notices) / density.density).toDouble())
    }
    SideEffect {
        if (top != null) chrome.top = top
    }

    // The notices go while the search is open. They fade as they were when it opened, as the iPhone takes the whole
    // block away (ScooterMapScreen.swift:227) and SwiftUI draws it as it was, where it was, while it fades: a card
    // dismissed as the search opens (its Search a place) doesn't slide out inside the fading block, and the block isn't
    // pushed down by the bar growing into the open search. As it closes they fade in where they rest, 8 under the
    // collapsed bar, over the open search shrinking to it, as SwiftUI lays a view it inserts out where it rests: they
    // don't ride up with it. The panel's notices stay, and fade with the panel, as the iPhone's do.
    val searchSpring = IosMotion.spring(response = 0.36, dampingFraction = 0.88)
    val searchMotion = motion<Float>(searchSpring)
    val (heldFailure, heldIssue) = rememberHeld(failure to locationIssue, holding = isSearching)
    // Where the notices rest, 8 under the collapsed bar, and where they were as the search opened.
    val heldNoticesTop = remember { intArrayOf(0) }
    Layout(
        content = {
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
                modifier = searchBarModifier.onGloballyPositioned { if (!isSearching) barFrame = it.windowFrame(density.density) },
            )
            AnimatedVisibility(
                visible = !isSearching,
                enter = fadeIn(searchMotion),
                exit = fadeOut(searchMotion),
                label = "notices",
            ) {
                TopNotices(
                    controller,
                    failure = heldFailure,
                    locationIssue = heldIssue,
                    limit = noticesLimit,
                    onSearchingChange = onSearchingChange,
                    heights = noticeHeights,
                    modifier = Modifier.onGloballyPositioned { noticesFrame = it.windowFrame(density.density) },
                )
            }
        },
        modifier = Modifier
            .onGloballyPositioned { roomFrame = it.windowFrame(density.density) }
            .then(modifier)
            .fillMaxWidth(),
    ) { measurables, constraints ->
        // As a column, centred across, the notices 8 under the collapsed bar while the search is closed, the island
        // still shrinking to it included.
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        val island = measurables[0].measure(loose)
        if (!isSearching) heldNoticesTop[0] = (if (barHeight > 0) barHeight else island.height) + 8.dp.roundToPx()
        val noticesTop = heldNoticesTop[0]
        val notices = measurables.getOrNull(1)?.measure(
            if (loose.hasBoundedHeight) loose.copy(maxHeight = (loose.maxHeight - noticesTop).coerceAtLeast(0)) else loose,
        )
        val width = maxOf(island.width, notices?.width ?: 0).coerceIn(constraints.minWidth, constraints.maxWidth)
        val height = maxOf(island.height, notices?.let { noticesTop + it.height } ?: 0).coerceIn(constraints.minHeight, constraints.maxHeight)
        layout(width, height) {
            // Rounded as the column's centring rounds, so the bar keeps its pixel.
            island.place(Alignment.CenterHorizontally.align(island.width, width, layoutDirection), 0)
            notices?.place(Alignment.CenterHorizontally.align(notices.width, width, layoutDirection), noticesTop)
        }
    }
}

/**
 * The heights of the notices under the search bar, each as it was last measured, 0 before: what the frames handed to
 * the map and the panel's room are worked out from. Kept while the notices are away under the open search, and while a
 * notice that changes what it says is measured again: the iPhone's card keeps its place as its kind changes.
 */
@Stable
private class NoticeHeights {
    var banner by mutableIntStateOf(0)
    var card by mutableIntStateOf(0)

    /**
     * The notices' height as the iPhone's layout has it, up to [limit]: those there are, without one that is going,
     * which the stack drops from its layout at once while the notice goes over it, [gap] apart.
     */
    fun settled(failure: ScooterLoadFailure?, locationIssue: ScooterLocationIssue?, gap: Int, limit: Int): Int {
        val banner = if (failure != null) banner else 0
        val card = if (locationIssue != null) card else 0
        return min(limit, banner + card + if (banner > 0 && card > 0) gap else 0)
    }
}

/**
 * What sits under the search bar: the banner of a first load that failed, and the card of a location that could not
 * be found, as tall as [limit] at most, each measured into [heights]. They come as one block with the first notice and
 * go with the last, as the iPhone inserts its `HeightLimit { topNotices }` and takes it away: SwiftUI runs the
 * transition of the view inserted into a parent that stays, so the block fades in where it rests and out where it
 * was, by the default `.opacity`, and the room it takes opens and closes on the same spring, which moves what is under
 * it (the panel's card). A notice's own slide from the top runs only as it joins another or leaves it (lead, 30 Oct;
 * to settle on an iPad).
 */
@Composable
private fun TopNotices(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
    limit: Dp,
    onSearchingChange: (Boolean) -> Unit,
    heights: NoticeHeights,
    modifier: Modifier = Modifier,
) {
    val spring = IosMotion.snappy(duration = 0.28)
    val reduceMotion = LocalReduceMotion.current
    val notices = failure != null || locationIssue != null
    // The notices as the last went, which the block keeps while it fades: the last doesn't slide away inside it.
    val last = rememberLast((failure to locationIssue).takeIf { notices })
    val shown = if (notices) failure to locationIssue else last ?: (null to null)
    AnimatedVisibility(
        notices,
        enter = if (reduceMotion) fadeIn(snap()) else fadeIn(spring.animation()) + expandVertically(spring.animation(), Alignment.Top, clip = false),
        exit = if (reduceMotion) fadeOut(snap()) else fadeOut(spring.animation()) + shrinkVertically(spring.animation(), Alignment.Top, clip = false),
        label = "notices",
    ) {
        NoticeStack(controller, shown.first, shown.second, limit, onSearchingChange, heights, modifier)
    }
}

/**
 * The notices in their block. As ViewThatFits: a plain stack while the notices fit, which leaves their shadows and
 * slides whole, and a scroll, which clips them, only when they don't.
 */
@Composable
private fun NoticeStack(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
    limit: Dp,
    onSearchingChange: (Boolean) -> Unit,
    heights: NoticeHeights,
    modifier: Modifier,
) {
    val isLoading by controller.isLoading.collectAsStateWithLifecycle()
    // What a banner or a card said stays on it while it goes.
    val lastFailure = rememberLast(failure)
    val lastIssue = rememberLast(locationIssue)
    val context = LocalContext.current
    val locationSettings = LocalLocationSettings.current
    val spring = IosMotion.snappy(duration = 0.28)
    val reduceMotion = LocalReduceMotion.current
    // The stack's 8 between them comes and goes with the one that comes or goes, so the card moves by the banner and
    // its spacing on one spring, as the iPhone's does. Under Reduce Motion it comes and goes in the frame the notice
    // does, as the iPhone's nil animation lays both out at once: a snap would land a frame later.
    val gapTarget = if (failure != null && locationIssue != null) 8.dp else 0.dp
    val animatedGap by animateDpAsState(gapTarget, motion(spring), label = "noticesGap")
    val gap = if (reduceMotion) gapTarget else animatedGap
    val density = LocalDensity.current
    // A notice that joins another slides in from above its place, and one that leaves another back up out of it, by its
    // own height (`.move(edge: .top)`), and what is under it moves on the same spring: the card down as a banner comes
    // over it, and up as the banner goes. The card under a banner rides on the 8 that opens and closes above it, which
    // its slide leaves out: it moves from or to its place's top less its height, as on the iPhone, whose VStack lays
    // the card out at its place at once.
    fun enter(gapAbove: Int) = if (reduceMotion) {
        fadeIn(snap())
    } else {
        slideInVertically(spring.animation()) { -(it - gapAbove) } + fadeIn(spring.animation()) +
            expandVertically(spring.animation(), Alignment.Top, clip = false)
    }
    fun exit(gapAbove: Int) = if (reduceMotion) {
        fadeOut(snap())
    } else {
        slideOutVertically(spring.animation()) { -(it - gapAbove) } + fadeOut(spring.animation()) +
            shrinkVertically(spring.animation(), Alignment.Top, clip = false)
    }
    val cardGap = if (failure != null) with(density) { 8.dp.roundToPx() } else 0
    // As ViewThatFits, which weighs the notices that stay.
    val scrolls = with(density) { heights.settled(failure, locationIssue, 8.dp.roundToPx(), Int.MAX_VALUE) > limit.roundToPx() }
    Column(
        modifier
            .heightIn(max = limit)
            .then(if (scrolls) Modifier.verticalScroll(rememberScrollState()) else Modifier)
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints.copy(maxHeight = Constraints.Infinity))
                layout(placeable.width, min(placeable.height, constraints.maxHeight)) { placeable.place(0, 0) }
            },
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // A notice that changes while it shows fades what it says into the new and eases its height, on the same
        // spring, as the iPhone's stack animates its notices' changes; each tells its height at rest, as the iPhone's
        // layout has it, from the change's first frame.
        val changes = if (reduceMotion) null else spring.animation<Float>()
        AnimatedVisibility(failure != null, enter = enter(0), exit = exit(0)) {
            val shown = lastFailure ?: return@AnimatedVisibility
            Box {
                MapStatusBanner(
                    message = shown.message,
                    actionTitle = localized("Try again"),
                    onAction = controller::retryLoad,
                    isBusy = isLoading,
                    animation = changes,
                    onRestingHeight = { heights.banner = it },
                )
                // Said as it appears and each time its message changes.
                Announcer(Announcement(shown.message))
            }
        }
        Spacer(Modifier.height(gap))
        AnimatedVisibility(locationIssue != null, enter = enter(cardGap), exit = exit(cardGap)) {
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
                    animation = changes,
                    onRestingHeight = { heights.card = it },
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
    modifier: Modifier = Modifier,
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
        modifier = modifier,
    )
}

/** The analytics the chrome tracks its taps with, such as "rental_open"; none where the screen was given none. */
val LocalAnalytics = staticCompositionLocalOf<ScooterAnalytics?> { null }

/** What the location card's Open Settings and Try again ask of the phone. */
val LocalLocationSettings = staticCompositionLocalOf { LocationSettings.appPage }

/** [value], or while [holding], the value it had when the hold began. */
@Composable
private fun <T> rememberHeld(value: T, holding: Boolean): T {
    val held = remember { mutableStateOf(value) }
    if (!holding) held.value = value
    return held.value
}

/** The last value that was not null. */
@Composable
private fun <T : Any> rememberLast(value: T?): T? {
    val last = remember { mutableStateOf(value) }
    if (value != null) last.value = value
    return last.value
}
