import CoreLocation
import StoreKit
import SwiftUI
import UIKit

struct ScooterMapScreen: View {
    @State private var model: ScooterMapModel
    @State private var searchIsExpanded = false
    @State private var filtersPresented = false
    @State private var settingsPresented = false
    @State private var dockHeight: CGFloat = 128
    @State private var searchBarHeight: CGFloat = 62
    @State private var locateButtonHeight: CGFloat = 52
    @State private var topChromeFrame = CGRect.null
    @State private var bottomChromeTop: CGFloat?
    @State private var locateButtonFrame = CGRect.null
    @State private var dockFrame = CGRect.null
    @State private var zoneLegendFrame = CGRect.null
    @State private var chromeLayout = ScooterChromeLayout.dock
    @State private var panelFrame = CGRect.null
    @State private var panelNoticesHeight: CGFloat = 0
    /// The window's whole height, which a sheet's half height is half of.
    @State private var windowHeight = CGFloat.infinity
    /// Whether the panel was left folded, kept with the window across launches.
    @SceneStorage("panelCollapsed") private var panelCollapsed = false
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.verticalSizeClass) private var verticalSizeClass
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.requestReview) private var requestReview

    /// The fold tests hand in, in window coordinates; only a partly open
    /// iPhone Duo reports one.
    private let foldForTests: CGRect?

    /// Tests hand in a model with the state they want to see, and a fold.
    init(model: ScooterMapModel = ScooterMapModel(), fold: CGRect? = nil) {
        _model = State(initialValue: model)
        foldForTests = fold
    }

    var body: some View {
        GeometryReader { proxy in
            // Measured inside the safe area, which a bar down the side of an
            // open iPhone Duo takes its share of.
            let layout = ScooterChromeLayout.resolve(
                width: proxy.size.width,
                regularWidth: horizontalSizeClass == .regular,
                regularHeight: verticalSizeClass == .regular,
                largeText: dynamicTypeSize.isAccessibilitySize,
                current: chromeLayout
            )
            let fold = foldForTests ?? reservedFold(in: proxy)
            ZStack {
                ScooterMapView(
                    scooters: model.mapScooters,
                    scooterRevision: model.mapScootersRevision,
                    clusters: model.mapClusters,
                    clusterRevision: model.mapClustersRevision,
                    usesServerClusters: model.responseMetadata?.mode == "clusters",
                    mapStyle: model.mapStyle,
                    showsUserLocation: model.userLocation != nil,
                    focusRequest: model.focusRequest,
                    zoomRequest: model.zoomRequest,
                    destination: model.searchedDestination,
                    selectedScooterID: model.selectedScooterID,
                    interactionExclusionFrame: layout == .dock ? topChromeFrame : .null,
                    bottomChromeTop: layout == .dock ? bottomChromeTop : nil,
                    bottomChromeFrames: layout == .dock
                        ? [locateButtonFrame, zoneLegendFrame, dockFrame]
                        : [locateButtonFrame, zoneLegendFrame],
                    panelFrame: layout == .panel ? panelFrame : .null,
                    foldFrame: fold ?? .null,
                    onRegionChange: { model.updateViewport($0, zoom: $1, zoomLevel: $2) },
                    onSelectionChange: model.selectScooter,
                    userHeading: model.userHeading,
                    // Beside the panel the compass is far from the search.
                    showsMapCompass: layout == .panel || !searchIsExpanded,
                    parking: model.mapParking,
                    selectedParkingID: model.selectedParkingID,
                    onParkingSelectionChange: model.selectParking,
                    origin: model.mapOrigin,
                    language: model.language,
                    walkTrail: model.walkTrail,
                    isWalking: model.isWalking,
                    walkRemainingMetres: model.walkRemainingMetres,
                    zones: model.mapZones,
                    zonesRevision: model.mapZonesRevision
                )
                .ignoresSafeArea()

                switch layout {
                case .dock:
                    dockChrome(in: proxy, below: ScooterFold.chromeTop(below: fold, in: proxy.frame(in: .global)))
                case .panel:
                    panelChrome(in: proxy, beside: fold)
                }
            }
            .onChange(of: layout, initial: true) { _, layout in
                chromeLayout = layout
            }
        }
        // Keep the dock anchored to the screen while search dismisses. Otherwise
        // it fades back in within the keyboard's shrinking safe area and jumps.
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .onGeometryChange(for: CGFloat.self) { geometry in
            geometry.size.height + geometry.safeAreaInsets.top + geometry.safeAreaInsets.bottom
        } action: { height in
            windowHeight = height
        }
        .background(Color(.systemBackground))
        .task {
            ScooterAnalytics.shared.track()
            ScooterAnalytics.shared.track("app_open")
            model.start()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                ScooterAnalytics.shared.track("app_foreground")
                model.becameActive()
            } else {
                model.becameInactive()
            }
        }
        .onDisappear { model.becameInactive() }
        // The panel opens folded if it was left so, without folding before the eyes.
        .onAppear {
            guard panelCollapsed else { return }
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) { model.isPanelCollapsed = true }
        }
        .onChange(of: model.isPanelCollapsed) { _, collapsed in
            panelCollapsed = collapsed
        }
        // A scootradar.com link to the map: its place shows on the map, not
        // under a sheet or the search.
        .onOpenURL { url in
            guard let link = ScooterMapLink(url: url) else { return }
            searchIsExpanded = false
            filtersPresented = false
            settingsPresented = false
            model.open(link)
        }
        .onChange(of: searchIsExpanded) { _, expanded in
            ScooterAnalytics.shared.track(expanded ? "search_open" : "search_close")
        }
        .onChange(of: filtersPresented) { _, open in
            ScooterAnalytics.shared.track(open ? "filters_open" : "panel_close")
            if open { ScooterAnalytics.shared.track(screen: "/filters") }
        }
        .onChange(of: settingsPresented) { _, open in
            ScooterAnalytics.shared.track(open ? "settings_open" : "panel_close")
            if open { ScooterAnalytics.shared.track(screen: "/settings") }
        }
        .task(id: ReviewWait(
            moments: model.reviewMoments,
            nothingOver: nothingOverTheMap,
            scooter: model.selectedScooterID,
            bay: model.selectedParkingID
        )) {
            // A return from a ride that is the moment to ask for a rating
            // (ScooterReviewPrompt): after the map has rested a few seconds
            // with nothing over it, never from a button. Anything over the
            // map or changing on it before then ends this try.
            guard model.reviewDue else { return }
            guard nothingOverTheMap else { return model.dropReviewMoment() }
            try? await Task.sleep(for: ScooterReviewPrompt.settle)
            guard !Task.isCancelled else { return model.dropReviewMoment() }
            guard model.takeReviewMoment() else { return }
            requestReview()
            ScooterAnalytics.shared.track("review_ask", result: "rental_return")
        }
        .sheet(isPresented: filtersSheetPresented) {
            ScooterFilterSheet(model: model)
                // Half of a short window shows the first settings only, so
                // there Filters opens at full height, its providers in view.
                .presentationDetents(windowHeight < 700 ? [.large] : [.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $settingsPresented) {
            if chromeLayout == .panel {
                // A form at the trailing side, clear of the panel and of
                // most of the map.
                ScooterSettingsSheet(model: model)
                    .presentationSizing(.form)
                    .modifier(TrailingPresentation())
            } else {
                ScooterSettingsSheet(model: model)
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
            }
        }
        .sensoryFeedback(.selection, trigger: model.selectedScooterID)
        .sensoryFeedback(.selection, trigger: model.selectedParkingID)
        .background {
            KeyCommandButtons(
                commands: ScooterKeyCommand.available(in: keySituation),
                situation: keySituation,
                perform: perform
            )
        }
        .focusedSceneValue(\.scooterMenu, ScooterMenuBar.shown ? ScooterMenu(situation: keySituation, mapStyle: model.mapStyle, perform: perform) : nil)
        // Automatic turns dark or light within the minute the sun has it.
        .background(TimelineView(.everyMinute) { _ in WindowAppearance(style: model.interfaceStyle) })
        .background(InterfaceOrientationProbe { model.setHeadingOrientation(ScooterHeadingPolicy.deviceOrientation(for: $0)) })
        .environment(\.locale, model.language.locale)
    }

    /// A phone's: the search bar and its notices at the top, the dock at the
    /// bottom, and the locate button above the dock. The search bar starts
    /// `chromeTop` down: under the fold of an iPhone Duo standing like a
    /// laptop, so that all of them are on the half lying flat.
    @ViewBuilder
    private func dockChrome(in proxy: GeometryProxy, below chromeTop: CGFloat) -> some View {
        VStack(spacing: 8) {
            // The search bar and what sits under it shield the map
            // from taps, and the compass stays clear of them.
            VStack(spacing: 8) {
                searchIsland(in: proxy)

                if !searchIsExpanded, hasTopNotices {
                    // With large text a banner and a card can be taller than
                    // the room above the locate button; then they scroll.
                    HeightLimit(maximum: topNoticesHeightLimit(in: proxy, below: chromeTop)) {
                        ViewThatFits(in: .vertical) {
                            VStack(spacing: 8) { topNotices }
                            ScrollView(.vertical) {
                                VStack(spacing: 8) { topNotices }
                                    .padding(.horizontal, 12)
                            }
                            // Room for the shadows at the sides.
                            .padding(.horizontal, -12)
                        }
                    }
                }
            }
            .onGeometryChange(for: CGRect.self) { geometry in
                geometry.frame(in: .global)
            } action: { frame in
                topChromeFrame = frame
            }
            .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: firstLoadFailure)
            .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: model.locationIssue)

            Spacer(minLength: 0)
        }
        .padding(.top, 8 + chromeTop)
        .padding(.horizontal, 12)
        .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: chromeTop)
        .zIndex(20)
        // Made anew in another language: much of what is over the
        // map is text that was written when it was drawn.
        .id(model.language)

        VStack {
            Spacer()
            HStack(alignment: .bottom, spacing: 10) {
                zoneLegend
                    .padding(.leading, 2)
                Spacer(minLength: 0)
                FloatingMapControls(model: model)
                    .onGeometryChange(for: CGRect.self) { geometry in
                        geometry.frame(in: .global)
                    } action: { frame in
                        locateButtonHeight = frame.height
                        // The map centres a scooter in what this button and the dock leave visible.
                        bottomChromeTop = frame.minY
                        locateButtonFrame = frame
                    }
            }
            // At the dock's trailing edge, which on a window wider than
            // the dock is not the window's.
            .padding(.trailing, 2)
            .frame(maxWidth: 560)
            .padding(.horizontal, 10)
            .padding(
                .bottom,
                dockHeight + max(proxy.safeAreaInsets.bottom, 8) + 10
            )
        }
        .opacity(searchIsExpanded ? 0 : 1)
        .scaleEffect(searchIsExpanded ? 0.92 : 1, anchor: .bottomTrailing)
        .allowsHitTesting(!searchIsExpanded)
        .accessibilityHidden(searchIsExpanded)
        .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: searchIsExpanded)
        .id(model.language)

        VStack {
            Spacer()
            ScooterControlDock(
                model: model,
                maximumContentHeight: max(
                    160,
                    proxy.size.height - chromeTop - (dynamicTypeSize.isAccessibilitySize ? 300 : 220)
                        // With large text a notice under the search bar needs room too.
                        - (dynamicTypeSize.isAccessibilitySize && hasTopNotices ? 120 : 0)
                ),
                onEditFilters: { filtersPresented = true },
                onHeightChange: { dockHeight = $0 }
            )
            .onGeometryChange(for: CGRect.self) { geometry in
                geometry.frame(in: .global)
            } action: { frame in
                dockFrame = frame
            }
            .padding(.horizontal, 10)
            .padding(.bottom, max(proxy.safeAreaInsets.bottom, 8))
        }
        .opacity(searchIsExpanded ? 0 : 1)
        .scaleEffect(searchIsExpanded ? 0.96 : 1, anchor: .bottom)
        .allowsHitTesting(!searchIsExpanded)
        .accessibilityHidden(searchIsExpanded)
        .animation(reduceMotion ? nil : .snappy(duration: 0.24), value: searchIsExpanded)
        .id(model.language)
    }

    /// A large window's, as the website's on a computer: the search bar, the
    /// notices and the dock's card one under the other in a panel down the
    /// leading side, over the map, and the locate button in the map's
    /// trailing corner. The open search covers the panel, and nothing else.
    /// The card folds down to one line, and the map then shows, and takes
    /// taps, under the panel; the notices stay. Beside the fold of an iPhone
    /// Duo open like a book the panel keeps to its half.
    @ViewBuilder
    private func panelChrome(in proxy: GeometryProxy, beside fold: CGRect?) -> some View {
        ZStack(alignment: .top) {
            searchIsland(in: proxy)
                // Under the panel's search bar, with the map beside the panel
                // in view, where what the filters change shows as they change.
                // The system places it there; a trailing arrow edge squeezed
                // it into the window's leading margin, its controls cut off.
                .popover(isPresented: $filtersPresented) {
                    ScooterFilterSheet(model: model, inPopover: true)
                }
                .zIndex(1)

            VStack(spacing: 8) {
                if hasTopNotices {
                    HeightLimit(maximum: panelNoticesHeightLimit(in: proxy)) {
                        ViewThatFits(in: .vertical) {
                            VStack(spacing: 8) { topNotices }
                            ScrollView(.vertical) {
                                VStack(spacing: 8) { topNotices }
                                    .padding(.horizontal, 12)
                            }
                            // Room for the shadows at the sides.
                            .padding(.horizontal, -12)
                        }
                    }
                    .onGeometryChange(for: CGFloat.self) { geometry in
                        geometry.size.height
                    } action: { height in
                        panelNoticesHeight = height
                    }
                }

                ScooterControlDock(
                    model: model,
                    layout: .panel,
                    maximumContentHeight: panelDockHeightLimit(in: proxy),
                    onEditFilters: { filtersPresented = true },
                    onHeightChange: { dockHeight = $0 }
                )
            }
            .padding(.top, searchBarHeight + 8)
            .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: firstLoadFailure)
            .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: model.locationIssue)
            .opacity(searchIsExpanded ? 0 : 1)
            .scaleEffect(searchIsExpanded ? 0.96 : 1, anchor: .top)
            .allowsHitTesting(!searchIsExpanded)
            .accessibilityHidden(searchIsExpanded)
            .animation(reduceMotion ? nil : .snappy(duration: 0.24), value: searchIsExpanded)
        }
        .frame(width: ScooterFold.panelWidth(
            ScooterChromeLayout.panelWidth(largeText: dynamicTypeSize.isAccessibilitySize),
            beside: fold,
            in: proxy.frame(in: .global),
            inset: 16,
            rightToLeft: layoutDirection == .rightToLeft
        ))
        // The map shows a scooter beside the panel, and keeps its names,
        // its taps and Apple's logo off it.
        .onGeometryChange(for: CGRect.self) { geometry in
            geometry.frame(in: .global)
        } action: { frame in
            panelFrame = frame
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(16)
        .zIndex(20)
        .id(model.language)

        VStack {
            Spacer()
            HStack(alignment: .bottom, spacing: 10) {
                Spacer(minLength: 0)
                zoneLegend
                FloatingMapControls(model: model)
                    .onGeometryChange(for: CGRect.self) { geometry in
                        geometry.frame(in: .global)
                    } action: { frame in
                        locateButtonFrame = frame
                    }
            }
        }
        .padding(16)
        .id(model.language)
    }

    /// What the zones' colours mean, while they are on; the names on the map keep clear of it.
    @ViewBuilder
    private var zoneLegend: some View {
        if model.zoneState != .off {
            ZoneLegend(state: model.zoneState, count: model.mapZones.count)
                .onGeometryChange(for: CGRect.self) { geometry in
                    geometry.frame(in: .global)
                } action: { frame in
                    zoneLegendFrame = frame
                }
                .onDisappear { zoneLegendFrame = .null }
        }
    }

    /// The search bar, the same in both layouts.
    private func searchIsland(in proxy: GeometryProxy) -> some View {
        ScooterSearchIsland(
            state: model.searchBarState,
            isSearching: $searchIsExpanded,
            hasActiveFilters: model.hasActiveFilters,
            recentPlaces: model.recentPlaces,
            nearbyCities: searchIsExpanded ? model.nearbyCities.map(\.city) : [],
            near: searchIsExpanded ? model.searchNear : nil,
            bottomLimit: proxy.frame(in: .global).maxY,
            onSelect: model.focusOnAddress,
            onChooseCity: model.chooseCity,
            onClear: model.clearAddressSearch,
            onUseCurrentLocation: model.focusOnUser,
            onShowFilters: {
                searchIsExpanded = false
                filtersPresented = true
            },
            onShowSettings: {
                searchIsExpanded = false
                settingsPresented = true
            }
        )
        // In an iPad window the bar makes room for the window's
        // buttons in its top corner.
        .containerCornerOffset(.leading, sizeToFit: true)
        .onGeometryChange(for: CGFloat.self) { geometry in
            geometry.size.height
        } action: { height in
            if !searchIsExpanded { searchBarHeight = height }
        }
    }

    /// Filters open in a sheet over a phone's layout. Beside a panel they
    /// open in a popover from its search bar instead.
    private var filtersSheetPresented: Binding<Bool> {
        Binding(
            get: { filtersPresented && chromeLayout == .dock },
            set: { filtersPresented = $0 }
        )
    }

    /// Only a first load that failed is reported under the search bar; later
    /// failures are the dock's to report, next to the data they concern.
    private var firstLoadFailure: ScooterLoadFailure? {
        guard case let .firstLoadFailed(failure) = model.loadIssue else { return nil }
        return failure
    }

    /// The app is in front and the map has nothing over it: no search, no
    /// sheet or popover (beside a panel, the filters' popover and the
    /// settings' form), no location being found or gone wrong.
    private var nothingOverTheMap: Bool {
        scenePhase == .active && !searchIsExpanded && !filtersPresented && !settingsPresented
            && !model.isLocating && model.locationIssue == nil
    }

    /// What the ask for a rating waits on: each moment to ask, what is over
    /// the map, and the scooter or bay chosen on it.
    private struct ReviewWait: Equatable {
        var moments: Int
        var nothingOver: Bool
        var scooter: String?
        var bay: String?
    }

    private var hasTopNotices: Bool {
        firstLoadFailure != nil || model.locationIssue != nil
    }

    /// The room between the search bar and the locate button above the dock.
    private func topNoticesHeightLimit(in proxy: GeometryProxy, below chromeTop: CGFloat) -> CGFloat {
        let dockAndGap = dockHeight + max(proxy.safeAreaInsets.bottom, 8) + 10
        let room = proxy.size.height - chromeTop - 8 - searchBarHeight - 8 - 8 - locateButtonHeight - dockAndGap
        // Never less than a banner, or the title of a card.
        return max(64, room)
    }

    /// The room in the panel under the search bar, which the notices and the dock share.
    private func panelRoomUnderSearch(in proxy: GeometryProxy) -> CGFloat {
        proxy.size.height - 16 - searchBarHeight - 8 - 16
    }

    /// Notices in the panel take half the room under the search bar at most.
    private func panelNoticesHeightLimit(in proxy: GeometryProxy) -> CGFloat {
        max(64, panelRoomUnderSearch(in: proxy) / 2)
    }

    /// The dock's content takes the rest, inside its own padding and above its grabber.
    private func panelDockHeightLimit(in proxy: GeometryProxy) -> CGFloat {
        let notices = hasTopNotices ? panelNoticesHeight + 8 : 0
        return max(160, panelRoomUnderSearch(in: proxy) - notices - 16 - ScooterControlDock.panelFoot)
    }

    @ViewBuilder
    private var topNotices: some View {
        if let firstLoadFailure {
            MapStatusBanner(
                message: firstLoadFailure.message,
                actionTitle: String(localized: "Try again"),
                isBusy: model.isLoading,
                action: model.retryLoad
            )
            .transition(.move(edge: .top).combined(with: .opacity))
        }

        if let issue = model.locationIssue {
            LocationIssueCard(
                issue: issue,
                onOpenSettings: openLocationSettings,
                onSearchPlace: {
                    // Searching is the answer to the card, so it goes away.
                    model.dismissLocationIssue()
                    searchIsExpanded = true
                },
                onRetry: model.focusOnUser,
                onDismiss: model.dismissLocationIssue
            )
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }

    /// The screen as the keyboard finds it.
    private var keySituation: ScooterKeyCommand.Situation {
        ScooterKeyCommand.Situation(
            layout: chromeLayout,
            isSearching: searchIsExpanded,
            isPresenting: filtersPresented || settingsPresented,
            hasCard: model.selectedScooterID != nil || model.selectedParkingID != nil,
            isFolded: model.isPanelCollapsed,
            isLocating: model.isLocating
        )
    }

    /// What a key does: what the button or the gesture it stands for does.
    private func perform(_ command: ScooterKeyCommand) {
        switch command {
        case .search, .searchWithSlash:
            searchIsExpanded = true
        case .nearMe:
            searchIsExpanded = false
            model.focusOnUser()
        case .zoomIn, .zoomInWithoutShift:
            model.zoom(by: 1)
        case .zoomOut:
            model.zoom(by: -1)
        case .filters:
            searchIsExpanded = false
            filtersPresented = true
        case .standardMap:
            model.mapStyle = .standard
        case .quietMap:
            model.mapStyle = .quiet
        case .satelliteMap:
            model.mapStyle = .satellite
        case .settings:
            searchIsExpanded = false
            settingsPresented = true
        case .close:
            switch ScooterKeyCommand.closing(in: keySituation) {
            case .card: model.clearSelection()
            case .search: searchIsExpanded = false
            case nil: break
            }
        case .fold:
            model.isPanelCollapsed.toggle()
        }
    }

    /// The fold of a partly open iPhone Duo, where iOS 27.1 reserves a
    /// division of the window, in window coordinates. CI builds with the
    /// iOS 26 SDK, which doesn't have it.
    private func reservedFold(in proxy: GeometryProxy) -> CGRect? {
        #if compiler(>=6.4)
        if #available(iOS 27.1, *) {
            // Fixed, not mirrored right to left: the map reads window coordinates.
            let regions = proxy.reservedRegions(kind: .division, layoutDirectionBehavior: .fixed)
            return ScooterFold.frame(
                among: regions.filter(\.isActive).map(\.frame),
                in: proxy.frame(in: .global)
            )
        }
        #endif
        return nil
    }

    private func openLocationSettings() {
        guard let settingsURL = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(settingsURL)
    }
}

/// Light or dark for the whole window, so for the sheets too. SwiftUI's own
/// preference left the open Settings sheet dark once the choice was back on
/// Automatic.
private struct WindowAppearance: UIViewRepresentable {
    let style: UIUserInterfaceStyle

    func makeUIView(context: Context) -> Probe {
        Probe()
    }

    func updateUIView(_ probe: Probe, context: Context) {
        probe.style = style
    }

    final class Probe: UIView {
        var style = UIUserInterfaceStyle.unspecified {
            didSet { window?.overrideUserInterfaceStyle = style }
        }

        override func didMoveToWindow() {
            super.didMoveToWindow()
            window?.overrideUserInterfaceStyle = style
        }
    }
}

/// How the controls stand over the map: a phone's search bar at the top and
/// dock at the bottom, or, in a window wide and tall enough for both, a panel
/// down the leading side beside the map, as on the website on a computer.
/// Chosen from the room the window has, never from what device it is on.
enum ScooterChromeLayout: Equatable {
    case dock
    case panel

    /// The panel's width; larger text needs more.
    static func panelWidth(largeText: Bool) -> CGFloat {
        largeText ? 420 : 380
    }

    /// The least map worth showing beside the panel.
    static let minimumMapWidth: CGFloat = 380

    /// How much wider than it needs a window must be to open the panel. A
    /// window resized across the threshold doesn't flip back and forth, and
    /// iPad mini upright, 744 points, keeps the dock.
    static let slack: CGFloat = 20

    /// The layout for a window `width` points across inside its safe area.
    /// Only a window regular both ways has the panel: an iPhone's, a Duo's
    /// and a narrow iPad window's are compact one way or the other. The
    /// panel opens with `slack` to spare and stays until the map would get
    /// less than its minimum.
    static func resolve(
        width: CGFloat,
        regularWidth: Bool,
        regularHeight: Bool,
        largeText: Bool,
        current: Self
    ) -> Self {
        guard regularWidth, regularHeight else { return .dock }
        let both = panelWidth(largeText: largeText) + minimumMapWidth
        return width >= (current == .panel ? both : both + slack) ? .panel : .dock
    }
}

/// The fold of a partly open iPhone Duo, which iOS reserves as a division of
/// the window: active while the device is partly open, inactive and of no
/// width flat. Open like a book and held sideways, it runs down the middle of
/// the window: the panel keeps to the leading half and the map centres what
/// it shows in the trailing one. Standing like a laptop, upright, it runs
/// across: the map takes the upright half, and the search bar, the notices
/// and the dock go down to the half lying flat, within reach. The map stays
/// whole under both, and only what has to moves.
enum ScooterFold {
    /// The fold among the active `regions` read in `container`, the frame
    /// of the screen in window coordinates, in window coordinates too.
    static func frame(among regions: [CGRect], in container: CGRect) -> CGRect? {
        regions
            .first { !$0.isNull && !$0.isEmpty }
            .map { $0.offsetBy(dx: container.minX, dy: container.minY) }
    }

    /// Whether the fold runs across the window, standing like a laptop,
    /// rather than down it, open like a book.
    static func isAcross(_ fold: CGRect) -> Bool {
        fold.width > fold.height
    }

    /// How far below the top of `container`, the screen in window
    /// coordinates, the search bar starts: under a fold across it, and at
    /// its top otherwise.
    static func chromeTop(below fold: CGRect?, in container: CGRect) -> CGFloat {
        guard let fold, isAcross(fold), fold.maxY > container.minY, fold.maxY < container.maxY else { return 0 }
        return fold.maxY - container.minY
    }

    /// The narrowest the panel gets to keep clear of a fold.
    static let minimumPanelWidth: CGFloat = 320

    /// The panel's `width` beside a fold down `container`, `inset` from its
    /// leading edge: as wide as it is, unless that would reach the fold.
    static func panelWidth(
        _ width: CGFloat,
        beside fold: CGRect?,
        in container: CGRect,
        inset: CGFloat,
        rightToLeft: Bool
    ) -> CGFloat {
        guard let fold, !isAcross(fold) else { return width }
        let room = rightToLeft ? container.maxX - inset - fold.maxX : fold.minX - container.minX - inset
        guard room > 0, room < width else { return width }
        return max(minimumPanelWidth, room)
    }
}

/// The keys of a hardware keyboard on the map screen, as in Maps: ⌘F or /
/// opens the search, ⌘L locates, ⌘+ and ⌘− zoom, ⌥⌘F opens the filters, ⌘1
/// to ⌘3 choose the map's look, ⌘, opens Settings, Esc closes the search and
/// then the card, and ⌘\ folds or opens the panel of a large window.
enum ScooterKeyCommand: CaseIterable, Hashable {
    case search
    case searchWithSlash
    case nearMe
    case zoomIn
    /// ⌘= is ⌘+ on a keyboard where + takes Shift.
    case zoomInWithoutShift
    case zoomOut
    case filters
    case standardMap
    case quietMap
    case satelliteMap
    case settings
    case close
    case fold

    /// The screen as the keyboard finds it.
    struct Situation: Equatable {
        var layout: ScooterChromeLayout
        var isSearching = false
        /// The filters or Settings are open, in a sheet or a popover.
        var isPresenting = false
        /// The card of a scooter or a bay.
        var hasCard = false
        var isFolded = false
        var isLocating = false
    }

    /// What Esc closes.
    enum Closing: Equatable {
        case card
        case search
    }

    var key: KeyEquivalent {
        switch self {
        case .search, .filters: "f"
        case .searchWithSlash: "/"
        case .nearMe: "l"
        case .zoomIn: "+"
        case .zoomInWithoutShift: "="
        case .zoomOut: "-"
        case .standardMap: "1"
        case .quietMap: "2"
        case .satelliteMap: "3"
        case .settings: ","
        case .close: .escape
        case .fold: "\\"
        }
    }

    var modifiers: EventModifiers {
        switch self {
        case .searchWithSlash, .close: []
        case .filters: [.command, .option]
        default: .command
        }
    }

    /// The look of the map it chooses, for ⌘1 to ⌘3.
    var mapStyle: AppleMapStyle? {
        switch self {
        case .standardMap: .standard
        case .quietMap: .quiet
        case .satelliteMap: .satellite
        default: nil
        }
    }

    /// What the keyboard's list of shortcuts calls it.
    func title(in situation: Situation) -> String {
        switch self {
        case .search, .searchWithSlash: String(localized: "Search")
        case .nearMe: String(localized: "Near me")
        case .zoomIn, .zoomInWithoutShift: String(localized: "Zoom in")
        case .zoomOut: String(localized: "Zoom out")
        case .filters: String(localized: "Filters")
        case .standardMap: AppleMapStyle.standard.label
        case .quietMap: AppleMapStyle.quiet.label
        case .satelliteMap: AppleMapStyle.satellite.label
        case .settings: String(localized: "Settings")
        case .close: String(localized: "Close")
        case .fold: situation.isFolded ? String(localized: "Expand panel") : String(localized: "Collapse panel")
        }
    }

    /// The shortcuts that stand. Only these are made, so that the others
    /// take no key from anything. None while the filters or Settings are
    /// open: the keys a sheet or a popover doesn't take go on to the screen
    /// that presented it, and a "/" typed in it, or an Esc meant for it,
    /// would act on the map under it. "/" stands only while the search's
    /// field isn't there to take it, Esc only while there is something to
    /// close, ⌘L not while locating, as the locate button, and ⌘\ only
    /// beside a panel, since a phone's dock doesn't fold.
    static func available(in situation: Situation) -> [ScooterKeyCommand] {
        guard !situation.isPresenting else { return [] }
        return allCases.filter { command in
            switch command {
            case .searchWithSlash: !situation.isSearching
            case .close: closing(in: situation) != nil
            case .nearMe: !situation.isLocating
            case .fold: situation.layout == .panel
            default: true
            }
        }
    }

    /// Esc closes what is in front first: the search, which covers the
    /// card, then the card of a scooter or a bay.
    static func closing(in situation: Situation) -> Closing? {
        if situation.isSearching { return .search }
        if situation.hasCard { return .card }
        return nil
    }
}

/// The screen's keyboard shortcuts, on buttons that don't show: each does
/// what the button or the gesture it stands for does.
private struct KeyCommandButtons: View {
    let commands: [ScooterKeyCommand]
    let situation: ScooterKeyCommand.Situation
    let perform: (ScooterKeyCommand) -> Void

    var body: some View {
        ZStack {
            ForEach(commands, id: \.self) { command in
                Button(command.title(in: situation)) { perform(command) }
                    .keyboardShortcut(command.key, modifiers: command.modifiers)
            }
        }
        .frame(width: 0, height: 0)
        .opacity(0)
        .accessibilityHidden(true)
    }
}

/// The menu bar of an iPad, and of a Mac running the iPad app, as in Maps:
/// Settings in the app's menu, a Map menu, and the map's looks and the panel
/// in View. The screen says what stands now, so an item is dimmed where its
/// key would do nothing. The screen keeps its own key buttons as well: a
/// phone has no menu bar, and where both answer a key they do the same
/// thing. "/", ⌘= and Esc stay off the menus.
enum ScooterMenuBar {
    /// Whether the screen tells the menu bar what it can do. A phone's
    /// menus stay dimmed and out of the way.
    @MainActor static let shown = UIDevice.current.userInterfaceIdiom == .pad

    /// The Map menu, in groups between dividers.
    static let map: [[ScooterKeyCommand]] = [[.search, .nearMe], [.zoomIn, .zoomOut], [.filters]]

    /// What View lists before its own items: the map's looks, then the panel.
    static let view: [[ScooterKeyCommand]] = [[.standardMap, .quietMap, .satelliteMap], [.fold]]
}

/// The map screen as the menu bar finds it, published while it is in front.
struct ScooterMenu {
    let situation: ScooterKeyCommand.Situation
    let mapStyle: AppleMapStyle
    let perform: (ScooterKeyCommand) -> Void
}

extension FocusedValues {
    @Entry var scooterMenu: ScooterMenu?
}

struct ScooterCommands: Commands {
    @FocusedValue(\.scooterMenu) private var menu

    var body: some Commands {
        CommandGroup(replacing: .appSettings) {
            item(.settings)
        }
        CommandMenu(String(localized: "Map")) {
            items(ScooterMenuBar.map)
        }
        CommandGroup(before: .toolbar) {
            items(ScooterMenuBar.view)
            Divider()
        }
    }

    private func items(_ groups: [[ScooterKeyCommand]]) -> some View {
        ForEach(Array(groups.enumerated()), id: \.offset) { index, group in
            if index > 0 { Divider() }
            ForEach(group, id: \.self) { command in
                item(command)
            }
        }
    }

    /// A look of the map is ticked while the map shows it.
    @ViewBuilder
    private func item(_ command: ScooterKeyCommand) -> some View {
        let title = command.title(in: menu?.situation ?? .init(layout: .dock))
        let stands = menu.map { ScooterKeyCommand.available(in: $0.situation).contains(command) } ?? false
        if let style = command.mapStyle {
            Toggle(title, isOn: Binding(get: { menu?.mapStyle == style }, set: { _ in menu?.perform(command) }))
                .keyboardShortcut(command.key, modifiers: command.modifiers)
                .disabled(!stands)
        } else {
            Button(title) { menu?.perform(command) }
                .keyboardShortcut(command.key, modifiers: command.modifiers)
                .disabled(!stands)
        }
    }
}

/// A sheet on the trailing side of the window, where iOS 27 can put one. CI
/// builds with the iOS 26 SDK, which doesn't have the placement.
private struct TrailingPresentation: ViewModifier {
    func body(content: Content) -> some View {
        #if compiler(>=6.4)
        if #available(iOS 27.0, *) {
            content.presentationPlacement(.trailing)
        } else {
            content
        }
        #else
        content
        #endif
    }
}

/// The compass reads the heading from the top of the device held upright. The
/// direction someone faces is the top of the screen as it shows, so a screen
/// shown sideways, as an open iPhone Duo shows the map, turns it with it.
enum ScooterHeadingPolicy {
    static func deviceOrientation(for interface: UIInterfaceOrientation) -> CLDeviceOrientation {
        switch interface {
        case .portraitUpsideDown: .portraitUpsideDown
        // The interface turns the other way from the device.
        case .landscapeLeft: .landscapeRight
        case .landscapeRight: .landscapeLeft
        default: .portrait
        }
    }
}

/// Which way up the window shows, now and each time it turns.
private struct InterfaceOrientationProbe: UIViewRepresentable {
    let onChange: (UIInterfaceOrientation) -> Void

    func makeUIView(context: Context) -> Probe {
        Probe()
    }

    func updateUIView(_ probe: Probe, context: Context) {
        probe.onChange = onChange
    }

    final class Probe: UIView {
        var onChange: ((UIInterfaceOrientation) -> Void)?
        private var observation: NSKeyValueObservation?

        override func didMoveToWindow() {
            super.didMoveToWindow()
            observation = window?.windowScene?.observe(\.effectiveGeometry, options: [.initial, .new]) { [weak self] scene, _ in
                MainActor.assumeIsolated {
                    self?.onChange?(scene.effectiveGeometry.interfaceOrientation)
                }
            }
        }
    }
}

#if DEBUG
private struct ScooterMapScreenPreview: PreviewProvider {
    static var previews: some View {
        ScooterMapScreen()
    }
}
#endif
