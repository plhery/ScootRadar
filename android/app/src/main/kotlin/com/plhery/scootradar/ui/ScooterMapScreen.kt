package com.plhery.scootradar.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.invalidateDraw
import androidx.compose.ui.platform.InspectorInfo
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
import androidx.compose.ui.zIndex
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
import com.plhery.scootradar.core.model.ScreenPoint
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
import com.plhery.scootradar.ui.search.SEARCH_BAR_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.sheet.IosFormSheet
import com.plhery.scootradar.ui.sheet.IosPopover
import com.plhery.scootradar.ui.sheet.IosSheet
import com.plhery.scootradar.ui.sheet.SheetDetent
import com.plhery.scootradar.ui.theme.AppearingContent
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
    /** What the screen has open, which the activity's ViewModel keeps through an activity made again. */
    screenState: ScreenState = rememberScreenState(),
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
    var searchIsExpanded by screenState::searchIsExpanded
    var filtersPresented by screenState::filtersPresented
    var settingsPresented by screenState::settingsPresented
    val sheetOpen = filtersPresented || settingsPresented
    // TalkBack's focus goes back to the button that opened a sheet, popover or form, as it closes.
    val focusReturn = rememberAccessibilityFocusReturn()
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
                focusReturn.opening()
                searchIsExpanded = false
                filtersPresented = true
            }
            ScooterKeyCommand.StandardMap, ScooterKeyCommand.QuietMap, ScooterKeyCommand.SatelliteMap ->
                command.mapStyle?.let(controller::setMapStyle)
            ScooterKeyCommand.Settings -> {
                focusReturn.opening()
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
            LocalScreenState provides screenState,
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
                    chrome.covered = sheetOpen
                }
                // A sheet, a popover and a form are modal: TalkBack reads them alone, as VoiceOver does.
                Box(Modifier.fillMaxSize().then(if (sheetOpen) Modifier.clearAndSetSemantics { } else Modifier)) {
                    map(dark)
                    // Before the chrome is hidden from TalkBack under what opens.
                    val onShowFilters = {
                        focusReturn.opening()
                        searchIsExpanded = false
                        filtersPresented = true
                    }
                    val onShowSettings = {
                        focusReturn.opening()
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
                    ScooterSettingsSheet(
                        controller,
                        bottomInset,
                        defaults,
                        onDone = { settingsPresented = false },
                        heldPages = screenState.settingsPages,
                    )
                }
                // Beside a panel, a form at the trailing side, clear of the panel and of most of the map.
                IosFormSheet(isPresented = settingsPresented && !dock, onDismiss = { settingsPresented = false }, title = localized("Settings")) {
                    ScooterSettingsSheet(
                        controller,
                        bottomInset = 0.dp,
                        defaults,
                        onDone = { settingsPresented = false },
                        heldPages = screenState.settingsPages,
                    )
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
    OnChange(searchIsExpanded) { expanded ->
        analytics?.track(if (expanded) "search_open" else "search_close")
        if (!expanded) focusReturn.moveTo(SEARCH_BAR_TAG, closing = SEARCH_ISLAND_TAG)
    }
    OnChange(filtersPresented) { open ->
        analytics?.track(if (open) "filters_open" else "panel_close")
        if (open) analytics?.track(screen = "/filters")
    }
    OnChange(settingsPresented) { open ->
        analytics?.track(if (open) "settings_open" else "panel_close")
        if (open) analytics?.track(screen = "/settings")
    }
    OnChange(sheetOpen) { open -> if (!open) focusReturn.closed() }

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
    // The notices' settled height under the search bar, in pixels, as the stack last laid them out: the legend stays under them.
    val noticesHeight = remember { mutableIntStateOf(0) }
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
            chrome.search = null
        }
    }

    // The controls keep clear of a cutout or a navigation bar down a side, as the iPhone's GeometryReader keeps to the
    // safe area's sides (X-AD34).
    val direction = LocalLayoutDirection.current
    val safeLeft = safe.calculateLeftPadding(direction)
    val safeRight = safe.calculateRightPadding(direction)

    key(language) {
        BoxWithConstraints(Modifier.fillMaxSize().absolutePadding(left = safeLeft, right = safeRight)) {
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
            val laidOut = remember { LaidOutFrames() }
            // Where the safe area ends, as a share of the window's height.
            val safeFoot = if (maxHeight > 0.dp) (maxHeight - safeBottom) / maxHeight else 1f
            // The locate row stands 10 above the dock's card, and the search bar's notices end 8 above the locate
            // button: both laid out from where the card is in the same pass, as the iPhone has its padding by the
            // dock's height and its notices' HeightLimit in the frame the card changes. A height read back as state
            // would move them a frame after the card, which shows under Reduce Motion, where the card changes height in
            // one frame: on a small phone a walk's note made the card taller under a location card drawn whole over
            // Near me for a frame, and cut a frame late as it went.
            Layout(
                content = {
                    TopStack(
                        controller,
                        failure = firstLoadFailure,
                        locationIssue = locationIssue,
                        isSearching = isSearching,
                        onSearchingChange = onSearchingChange,
                        onShowFilters = onShowFilters,
                        onShowSettings = onShowSettings,
                        // The window's bottom, inside its safe area.
                        bottomLimit = maxHeight - safeBottom,
                        chrome = chrome,
                        onSearchBarHeightChange = { if (!isSearching) searchBarHeight.intValue = it },
                        onNoticesHeightChange = { noticesHeight.intValue = it },
                        settledTop = safeTop + 8.dp + chromeTop,
                        // Drawn over the locate row and the dock, and taking the taps first, as the iPhone's stack at
                        // zIndex 20: in a window too short for all three, as a third of a split screen, the row reaches
                        // up to the bar.
                        modifier = Modifier.zIndex(20f).padding(top = safeTop + 8.dp + below, start = 12.dp, end = 12.dp),
                        searchBarModifier = beside?.let { Modifier.besideCaption(it, slot) } ?: Modifier,
                        barSpan = bar.takeIf { beside != null },
                    )
                    Box(Modifier.fillMaxSize().unheard(isSearching).onGloballyPositioned { laidOut.row = it }) {
                        LocateRow(
                            // 8 under the search bar, in the row's box, which begins at the window's top: where the
                            // bar settles under a fold, not where it springs through, so the legend moves once. And 8
                            // under the notices there: under a location card the legend's first lines were out of
                            // reach of its scroll (review-legend-cap R1).
                            legendCeiling = safeTop + 8.dp + chromeTop + searchBar + 8.dp +
                                with(density) { if (noticesHeight.intValue > 0) noticesHeight.intValue.toDp() + 8.dp else 0.dp },
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(horizontal = 10.dp)
                                .widthIn(max = 560.dp)
                                .fillMaxWidth()
                                .padding(end = 2.dp)
                                .inert(isSearching),
                            legend = {
                                ZoneLegendOverTheMap(controller, chrome, Modifier.padding(start = 2.dp)) { laidOut.frame(laidOut.row, it, density.density) }
                            },
                            button = {
                                FloatingMapControls(
                                    controller,
                                    Modifier
                                        .topAs(LocateTop)
                                        .onSizeChanged { locateButtonHeight.intValue = it.height }
                                        // The map centres a scooter in what this button and the dock leave visible.
                                        .onGloballyPositioned { chrome.locateButton = laidOut.frame(laidOut.row, it, density.density) },
                                )
                            },
                        )
                    }
                    Box(
                        Modifier
                            .fillMaxSize()
                            // Toward the middle of the safe area's foot, where the iPhone's VStack ends in its
                            // GeometryReader (`.bottom`), not the window's below a navigation bar.
                            .makingWay(isSearching, { dockGone }, scale = 0.96f, TransformOrigin(0.5f, safeFoot))
                            .onGloballyPositioned { laidOut.dock = it },
                    ) {
                        ScooterControlDock(
                            controller,
                            onEditFilters = onShowFilters,
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(horizontal = 10.dp)
                                .padding(bottom = bottom)
                                .topAs(DockTop)
                                .onGloballyPositioned { chrome.dock = laidOut.frame(laidOut.dock, it, density.density) }
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
                modifier = Modifier.fillMaxSize().onGloballyPositioned { laidOut.screen = it },
            ) { (topStack, locateRow, dockCard), constraints ->
                val card = dockCard.measure(constraints)
                val screenHeight = constraints.maxHeight
                val cardTop = card[DockTop].takeIf { it != AlignmentLine.Unspecified }
                    ?: (screenHeight - dockHeight.intValue - bottom.roundToPx())
                // The row's foot, 10 above the card: the row is laid out down to it.
                val foot = (cardTop - 10.dp.roundToPx()).coerceAtMost(screenHeight).coerceAtLeast(1)
                val screenWidth = constraints.maxWidth
                val row = locateRow.measure(Constraints.fixed(screenWidth, foot))
                val buttonTop = row[LocateTop].takeIf { it != AlignmentLine.Unspecified } ?: (foot - locateButtonHeight.intValue)
                // The search bar and its notices are laid out down to 8 above the locate button, the foot of the
                // room the iPhone's topNoticesHeightLimit leaves them, which it works out from where the stack rests:
                // under a fold, chromeTop down, where its top springs to.
                val stack = topStack.measure(
                    Constraints(maxWidth = screenWidth, maxHeight = (buttonTop - 8.dp.roundToPx() + (below - chromeTop).roundToPx()).coerceAtLeast(0)),
                )
                // It shrinks toward the bottom trailing corner of the iPhone's VStack: the safe area's foot, where the
                // VStack ends in its GeometryReader, and the trailing edge of the row's 560 and its 10 either side, in
                // the middle of a wider screen.
                val column = min(screenWidth, 580.dp.roundToPx())
                val corner = (screenWidth - column) / 2f + trailing * column
                val pivot = (screenHeight - safeBottom.roundToPx()).toFloat() / foot
                layout(screenWidth, screenHeight) {
                    row.placeWithLayer(0, 0) {
                        makeWay(isSearching, locateGone, scale = 0.92f, TransformOrigin(corner / screenWidth, pivot))
                    }
                    card.place(0, 0)
                    stack.place(0, 0)
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

/** The top of the locate button, which the search bar's notices end 8 above. */
private val LocateTop = HorizontalAlignmentLine(::min)

/** Tells the dock's layout where this top is, through [line]: the card's, [DockTop], or the locate button's, [LocateTop]. */
private fun Modifier.topAs(line: HorizontalAlignmentLine): Modifier = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    layout(placeable.width, placeable.height, mapOf(line to 0)) { placeable.place(0, 0) }
}

/**
 * The row over the dock, as the iPhone's `HStack(alignment: .bottom) { zoneLegend; Spacer(minLength: 0);
 * FloatingMapControls }` (ScooterMapScreen.swift:263-276): the [button] at the trailing edge at its own size, which
 * SwiftUI gives the least flexible view first, and the [legend] at the leading edge in what is left, a spacer's 10
 * short of it, both down on the row's foot.
 *
 * Where the legend, beside the button, would reach higher than [legendCeiling] (from the top of the box the row stands
 * in), it goes over the button instead, at the row's whole width, where its top then ends lower (UI-410). On
 * ScootRadar_Phone_Min at font scale 2.0 before the first location, "Near me" took about 190 of the row's 340 dp: a street's line, "No riding 12:00 PM–11:00
 * PM · Seoul, lines © OpenStreetMap (not now)", broke into about twelve lines, words cut inside, and ran up under the
 * search bar and the status bar. The iPhone's stack has no answer there (its lines are fixedSize, with no limit) and
 * would do the same on its smallest phone at its largest sizes; wherever the legend fits beside the button, as it
 * always does at the default sizes, the row is the iPhone's. Where it fits neither way, it is as tall as its room
 * under the ceiling, and scrolls (review-app-ap R2), over the button where that shows more of it.
 */
@Composable
private fun LocateRow(
    legendCeiling: Dp,
    legend: @Composable () -> Unit,
    button: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    // The last placement, read and written only while measuring: not state, which would measure the row again.
    val stacked = remember { booleanArrayOf(false) }
    Layout(
        content = {
            Box(contentAlignment = Alignment.BottomStart) { legend() }
            button()
        },
        modifier = modifier,
    ) { (legendBox, locate), constraints ->
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        val gap = 10.dp.roundToPx()
        val width = constraints.maxWidth
        val placedButton = locate.measure(loose)
        // The iPhone's spacing of 10 and its Spacer, 10 more, between the legend and the button.
        val beside = maxOf(0, width - placedButton.width - 2 * gap)
        val room = constraints.maxHeight - legendCeiling.roundToPx()
        val besideHeight = legendBox.maxIntrinsicHeight(beside)
        val overHeight = legendBox.maxIntrinsicHeight(width)
        // At most down from the ceiling, where it scrolls, as the notices under the search bar do in theirs (the
        // iPhone's HeightLimit): two lines or more at the largest text ran up under the bar over the button too. Never
        // under the notices' least room, a banner's 64, in a window too short for both.
        val floor = 64.dp.roundToPx()
        val overRoom = room - placedButton.height - gap
        val overReach = min(overHeight, maxOf(floor, overRoom)) + gap + placedButton.height
        val besideReach = min(besideHeight, maxOf(floor, room))
        // Over the button where that ends lower than beside it, both as tall as they may be: in a landscape phone's
        // short row over it the legend would only reach higher, up to the floor's 64 over the button and under the
        // search bar (review-legend-cap B2). Back beside only with 8 to spare, so that a notice or the search bar
        // changing height by a little doesn't move it to and fro.
        val slack = if (stacked[0]) 8.dp.roundToPx() else 0
        val endsLower = besideHeight > room - slack && overHeight + gap + placedButton.height < besideHeight && overReach <= besideReach
        // Over it too where both would scroll and over it, in what is left of the room and under the 64, it shows more
        // of the legend: under a location card at font scale 2.0 on ScootRadar_Phone_Min, beside "Near me" the legend
        // was 125 wide, a line cut inside its words and taller than the legend; over it, at the row's 338, its words
        // stay whole.
        val showsMore = besideHeight > besideReach && overRoom > 0 &&
            (overRoom + slack).toLong() * besideHeight >= besideReach.toLong() * overHeight
        // Over it as well where beside it a word would break inside, the legend at its narrowest, each line wrapped at
        // its spaces, wider than the room there, and over it it reaches no higher: at font scale 1.3 on
        // ScootRadar_Phone_Min, beside "À proximité" the kinds' names broke inside ("Stationnem" over "ent").
        val breaksWords = legendBox.minIntrinsicWidth(Constraints.Infinity) > beside && overRoom > 0 && overReach <= besideReach
        val over = endsLower || showsMore || breaksWords
        stacked[0] = over
        val cap = when {
            endsLower || (breaksWords && !showsMore) -> maxOf(floor, overRoom)
            over -> overRoom
            else -> maxOf(floor, room)
        }
        val placedLegend = legendBox.measure(
            loose.copy(maxWidth = if (over) width else beside, maxHeight = min(loose.maxHeight, cap)),
        )
        val height = if (over && placedLegend.height > 0) {
            placedLegend.height + gap + placedButton.height
        } else {
            maxOf(placedLegend.height, placedButton.height)
        }
        layout(width, min(height, constraints.maxHeight)) {
            val foot = min(height, constraints.maxHeight)
            placedButton.placeRelative(width - placedButton.width, foot - placedButton.height)
            val legendFoot = if (over && placedLegend.height > 0) foot - placedButton.height - gap else foot
            placedLegend.placeRelative(0, legendFoot - placedLegend.height)
        }
    }
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
    DisposableEffect(chrome) {
        onDispose {
            chrome.panel = null
            chrome.search = null
        }
    }

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
                        // Drawn over the zones' legend and the locate button, and taking the taps first where a wide
                        // legend reaches in under its foot, as the iPhone's panel at zIndex 20 (ScooterMapScreen.swift:396).
                        .zIndex(20f)
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
                            onSearchingChange = onSearchingChange,
                            heights = noticeHeights,
                            modifier = Modifier.padding(bottom = 8.dp).heightIn(max = noticesLimit),
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
                        modifier = (beside?.let { Modifier.besideCaption(it, bar) } ?: Modifier).onGloballyPositioned {
                            chrome.search = if (isSearching) it.windowFrame(density.density) else null
                        },
                        onFiltersFrameChange = onFiltersButtonFrame,
                    )
                }

                // The legend against the locate button, in the map's trailing corner, 10 in from the leading side
                // at the most, the iPad's spacing after its Spacer (ScooterMapScreen.swift:401-404).
                Row(
                    Modifier.align(Alignment.BottomEnd).padding(16.dp).padding(start = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Bottom,
                ) {
                    // The button keeps its size, as the iPad's HStack sizes its least flexible view first, and the
                    // legend wraps in what is left: measured first, a long line took the whole row at the largest
                    // text, and "Near me" was 0 wide (UI-410).
                    ZoneLegendOverTheMap(controller, chrome, Modifier.weight(1f, fill = false))
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
private fun ZoneLegendOverTheMap(
    controller: ScooterMapController,
    chrome: MapChromeFrames,
    modifier: Modifier = Modifier,
    /** Its frame as laid out, where it makes way for the search with the locate row. */
    laidOut: ((LayoutCoordinates) -> ScreenRect)? = null,
) {
    val state by controller.zoneState.collectAsStateWithLifecycle()
    val count by controller.mapOperatorZoneCount.collectAsStateWithLifecycle()
    val slowSpeeds by controller.mapOperatorSlowSpeeds.collectAsStateWithLifecycle()
    val rules by controller.mapRuleZones.collectAsStateWithLifecycle()
    val notices by controller.mapZoneNotices.collectAsStateWithLifecycle()
    if (state == ScooterZoneState.Off && rules.isEmpty() && notices.isEmpty()) return
    val density = LocalDensity.current.density
    ZoneLegend(
        state = state,
        count = count,
        slowSpeeds = slowSpeeds,
        rules = rules,
        notices = notices,
        modifier = modifier.onGloballyPositioned { chrome.zoneLegend = laidOut?.invoke(it) ?: it.windowFrame(density) },
    )
    DisposableEffect(Unit) { onDispose { chrome.zoneLegend = null } }
}

/**
 * The frames of the chrome that makes way for the search, the dock and the locate row over it, as they are laid out,
 * as SwiftUI's frames are, which `.scaleEffect` leaves be: what the map reads of them does not shrink with them toward
 * the screen's foot as the search opens. Read through the layout of the [screen], outside their layers, and the
 * coordinates inside the [dock]'s layer and the [row]'s, each laid out from the screen layout's origin. As they shrank,
 * the dock no longer spanned the map's credits on a phone (its side from 10 in to 18.5 on the Fold folded, past their
 * text from 14), and the credits went up over it, 4 over the highest shrunk frame over them: under the open search's
 * keyboard on API 37, their text cut by its top (app-ab's pass).
 */
private class LaidOutFrames {
    var screen: LayoutCoordinates? = null
    var dock: LayoutCoordinates? = null
    var row: LayoutCoordinates? = null

    /** The frame of [of], inside [space], in the window in points; on the screen, until the layouts are known. */
    fun frame(space: LayoutCoordinates?, of: LayoutCoordinates, density: Float): ScreenRect {
        val screen = screen
        if (screen == null || space == null || !screen.isAttached || !space.isAttached) return of.windowFrame(density)
        val laid = space.localBoundingBoxOf(of, clipBounds = false)
        val origin = screen.localToWindow(laid.topLeft)
        return ScreenRect(
            (origin.x / density).toDouble(),
            (origin.y / density).toDouble(),
            (laid.width / density).toDouble(),
            (laid.height / density).toDouble(),
        )
    }
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
 * The stack is laid out in that room, down to the foot its constraints' height ends at, 8 above the locate button; the
 * open search goes on past it, down to [bottomLimit]. [settledTop] is where the stack's top comes to rest under the top
 * of the room it is given, where its [modifier]'s padding springs to. Beside a caption's buttons, [searchBarModifier]
 * moves and narrows the bar, and [barSpan] is where it is across the screen without them, in the screen's points from
 * the room's origin.
 */
@Composable
private fun TopStack(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
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
    onNoticesHeightChange: (Int) -> Unit = {},
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
    // Where the room is: its origin, which a room 0 tall keeps, where it has no bounds.
    var roomOrigin by remember { mutableStateOf<ScreenPoint?>(null) }
    var barFrame by remember { mutableStateOf<ScreenRect?>(null) }
    var noticesFrame by remember { mutableStateOf<ScreenRect?>(null) }
    var barHeight by remember { mutableIntStateOf(0) }
    val noticeHeights = remember { NoticeHeights() }
    // The notices' room, in pixels, as the stack was last laid out.
    var noticesLimit by remember { mutableIntStateOf(Constraints.Infinity) }
    val top = run {
        val room = roomOrigin ?: return@run null
        // The span is the screen's, whose origin the room's is; the bar's frame is the window's.
        val bar = barFrame?.let { frame -> barSpan?.let { frame.copy(x = room.x + it.x, width = it.width) } ?: frame } ?: return@run null
        if (barHeight == 0 || isSearching) return@run null
        val noticesHeight = with(density) { noticeHeights.settled(failure, locationIssue, 8.dp.roundToPx(), noticesLimit) }
        val notices = if (noticesHeight > 0) with(density) { 8.dp.toPx() } + noticesHeight else 0f
        val sides = listOfNotNull(bar, noticesFrame?.takeIf { noticesHeight > 0 })
        val left = sides.minOf { it.minX }
        ScreenRect(left, room.y + settledTop.value, sides.maxOf { it.maxX } - left, ((barHeight + notices) / density.density).toDouble())
    }
    // The notices' settled height, for what stands under them.
    val noticesSettled = with(density) { noticeHeights.settled(failure, locationIssue, 8.dp.roundToPx(), noticesLimit) }
    SideEffect {
        if (top != null) chrome.top = top
        onNoticesHeightChange(noticesSettled)
    }

    // The notices go while the search is open. They fade as they were when it opened, as the iPhone takes the whole
    // block away (ScooterMapScreen.swift:227) and SwiftUI draws it as it was, where it was, while it fades: a card
    // dismissed as the search opens (its Search a place) doesn't slide out inside the fading block, and the block isn't
    // pushed down by the bar growing into the open search. As it closes they fade in where they rest, 8 under the
    // collapsed bar, over the open search shrinking to it, as SwiftUI lays a view it inserts out where it rests: they
    // don't ride up with it. The panel's notices stay, and fade with the panel, as the iPhone's do. Under Reduce Motion
    // they are gone, or back, in the frame the search opens or closes (UI-184).
    val searchSpring = IosMotion.spring(response = 0.36, dampingFraction = 0.88)
    val reduceMotion = LocalReduceMotion.current
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
                modifier = searchBarModifier.onGloballyPositioned {
                    if (!isSearching) barFrame = it.windowFrame(density.density)
                    chrome.search = if (isSearching) it.windowFrame(density.density) else null
                },
            )
            AppearingContent(
                visible = !isSearching,
                atOnce = reduceMotion,
                enter = fadeIn(searchSpring.animation()),
                exit = fadeOut(searchSpring.animation()),
                label = "notices",
            ) {
                TopNotices(
                    controller,
                    failure = heldFailure,
                    locationIssue = heldIssue,
                    onSearchingChange = onSearchingChange,
                    heights = noticeHeights,
                    modifier = Modifier.onGloballyPositioned { noticesFrame = it.windowFrame(density.density) },
                )
            }
        },
        modifier = Modifier
            .onGloballyPositioned { coordinates ->
                val origin = coordinates.positionInWindow()
                roomOrigin = ScreenPoint((origin.x / density.density).toDouble(), (origin.y / density.density).toDouble())
            }
            .then(modifier)
            .fillMaxWidth(),
    ) { measurables, constraints ->
        // As a column, centred across, the notices 8 under the collapsed bar while the search is closed, the island
        // still shrinking to it included.
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        // The open search ends itself at bottomLimit, or above the keyboard: not in the notices' room.
        val island = measurables[0].measure(loose.copy(maxHeight = Constraints.Infinity))
        if (!isSearching) heldNoticesTop[0] = (if (barHeight > 0) barHeight else island.height) + 8.dp.roundToPx()
        val noticesTop = heldNoticesTop[0]
        // From 8 under the bar to the room's foot, and never less than a banner, or the title of a card
        // (topNoticesHeightLimit): the notices' constraints, which they choose to scroll in as they are laid out, in the
        // frame the room changes.
        val limit = if (loose.hasBoundedHeight) maxOf(64.dp.roundToPx(), loose.maxHeight - noticesTop) else Constraints.Infinity
        noticesLimit = limit
        val notices = measurables.getOrNull(1)?.measure(loose.copy(maxHeight = limit))
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
 * What sits under the search bar: the banner of a first load that failed, and the card of a location that could not be
 * found, as tall as the room they are given at most, each measured into [heights]. They come as one block with the
 * first notice and go with the last, as the iPhone inserts its `HeightLimit { topNotices }` and takes it away: SwiftUI
 * runs the transition of the view inserted into a parent that stays, so the block fades in where it rests and out where
 * it was, by the default `.opacity`, and the room it takes opens and closes on the same spring, which moves what is
 * under it (the panel's card). A notice's own slide from the top runs only as it joins another or leaves it (lead,
 * 30 Oct; to settle on an iPad).
 */
@Composable
private fun TopNotices(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
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
    // Under Reduce Motion the block is there, or gone, in the frame of the first notice or the last (UI-184).
    AppearingContent(
        notices,
        atOnce = reduceMotion,
        enter = fadeIn(spring.animation()) + expandVertically(spring.animation(), Alignment.Top, clip = false),
        exit = fadeOut(spring.animation()) + shrinkVertically(spring.animation(), Alignment.Top, clip = false),
        label = "notices",
    ) {
        NoticeStack(controller, shown.first, shown.second, onSearchingChange, heights, modifier)
    }
}

/**
 * The notices in their block, as tall as the room they are given at most. As ViewThatFits: a plain stack while the
 * notices fit, which leaves their shadows and slides whole, and a scroll, which clips them, only when they don't.
 */
@Composable
private fun NoticeStack(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
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
    // the card out at its place at once. Under Reduce Motion a notice is there, or gone, in the frame it comes or goes
    // (UI-184).
    fun enter(gapAbove: Int) = slideInVertically(spring.animation()) { -(it - gapAbove) } + fadeIn(spring.animation()) +
        expandVertically(spring.animation(), Alignment.Top, clip = false)
    fun exit(gapAbove: Int) = slideOutVertically(spring.animation()) { -(it - gapAbove) } + fadeOut(spring.animation()) +
        shrinkVertically(spring.animation(), Alignment.Top, clip = false)
    val cardGap = if (failure != null) with(density) { 8.dp.roundToPx() } else 0
    // Each notice is said as it appears and each time what it says changes, from here, in the frame it comes, not from
    // the stack below, which is composed as it is laid out. The dock says its words a recomposition after they change,
    // so a walk with no location is heard as the iPhone has it: the location card, then "Couldn’t find your location."
    Announcer(failure?.let { Announcement(it.message) })
    Announcer(locationIssue?.let { Announcement(listOfNotNull(it.title, it.message).joinToString(" ")) })
    // As ViewThatFits, which weighs the notices that stay, in the room they are laid out in, the height they are given:
    // chosen in the frame that room changes, as the iPhone lays out the dock's card and the notices in the same frame.
    // On a small phone the dock's card grows with a walk's note and shrinks back as it goes, and a scroll chosen a
    // frame later left the location card drawn whole over Near me for a frame, or cut for a frame once it fit again.
    BoxWithConstraints(modifier, propagateMinConstraints = true) {
        val gapPx = with(density) { 8.dp.roundToPx() }
        val scrolls = constraints.hasBoundedHeight &&
            heights.settled(failure, locationIssue, gapPx, Int.MAX_VALUE) > constraints.maxHeight
        val unmeasured = (failure != null && heights.banner == 0) || (locationIssue != null && heights.card == 0)
        Column(
            Modifier
                .then(if (scrolls) Modifier.verticalScroll(rememberScrollState()) else Modifier)
                .fitOrClip(clips = reduceMotion || unmeasured),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // A notice that changes while it shows fades what it says into the new and eases its height, on the
            // same spring, as the iPhone's stack animates its notices' changes; each tells its height at rest, as the
            // iPhone's layout has it, from the change's first frame.
            val changes = if (reduceMotion) null else spring.animation<Float>()
            AppearingContent(failure != null, atOnce = reduceMotion, enter = enter(0), exit = exit(0)) {
                val shown = lastFailure ?: return@AppearingContent
                MapStatusBanner(
                    message = shown.message,
                    actionTitle = localized("Try again"),
                    onAction = controller::retryLoad,
                    isBusy = isLoading,
                    animation = changes,
                    onRestingHeight = { heights.banner = it },
                )
            }
            Spacer(Modifier.height(gap))
            AppearingContent(locationIssue != null, atOnce = reduceMotion, enter = enter(cardGap), exit = exit(cardGap)) {
                val issue = lastIssue ?: return@AppearingContent
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
            }
        }
    }
}

/**
 * The plain stack's notices measured whole, and the stack as tall as its room at most. While they overflow it and it
 * [clips], they are clipped at the room's top and foot, 30 out at the sides for their shadows, as the scroll that takes
 * them from the next frame clips them (clipScrollableContainer): a notice that comes before its height is known, or any
 * under Reduce Motion, isn't drawn over the locate button for that frame. Otherwise they are drawn whole past the
 * foot, as the iPhone's HeightLimit draws them: a notice going after the scroll gave way, or a spring past its rest.
 * Under the scroll, which measures them whole itself, they fit. [FitOrScroll] clips its content so in the frame it
 * outgrows its room, before its scroll comes.
 */
internal fun Modifier.fitOrClip(clips: Boolean): Modifier = this then FitOrClipElement(clips)

/** [fitOrClip]'s element. */
private data class FitOrClipElement(val clips: Boolean) : ModifierNodeElement<FitOrClipNode>() {
    override fun create() = FitOrClipNode(clips)

    override fun update(node: FitOrClipNode) {
        if (node.clips == clips) return
        node.clips = clips
        node.invalidateDraw()
    }

    override fun InspectorInfo.inspectableProperties() {
        name = "fitOrClip"
        properties["clips"] = clips
    }
}

/**
 * [fitOrClip]'s node, which keeps the room's foot while the notices overflow it, as they were last measured. It draws
 * in the notices' own frame, as tall as they are, not the room's: the clip is at the foot it keeps.
 */
private class FitOrClipNode(var clips: Boolean) : Modifier.Node(), LayoutModifierNode, DrawModifierNode {
    private var foot: Int? = null

    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val placeable = measurable.measure(constraints.copy(maxHeight = Constraints.Infinity))
        val overflow = constraints.maxHeight.takeIf { placeable.height > it }
        if (overflow != foot) {
            foot = overflow
            invalidateDraw()
        }
        return layout(placeable.width, min(placeable.height, constraints.maxHeight)) { placeable.place(0, 0) }
    }

    override fun ContentDrawScope.draw() {
        val foot = foot?.takeIf { clips } ?: return drawContent()
        val sides = 30.dp.roundToPx().toFloat()
        clipRect(-sides, 0f, size.width + sides, foot.toFloat()) { this@draw.drawContent() }
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
