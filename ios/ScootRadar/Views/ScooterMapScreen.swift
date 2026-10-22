import CoreLocation
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
    @State private var chromeLayout = ScooterChromeLayout.dock
    @State private var panelFrame = CGRect.null
    @State private var panelNoticesHeight: CGFloat = 0
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.verticalSizeClass) private var verticalSizeClass

    /// Tests hand in a model with the state they want to see.
    init(model: ScooterMapModel = ScooterMapModel()) {
        _model = State(initialValue: model)
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
                    destination: model.searchedDestination,
                    selectedScooterID: model.selectedScooterID,
                    interactionExclusionFrame: layout == .dock ? topChromeFrame : .null,
                    bottomChromeTop: layout == .dock ? bottomChromeTop : nil,
                    bottomChromeFrames: layout == .dock ? [locateButtonFrame, dockFrame] : [locateButtonFrame],
                    panelFrame: layout == .panel ? panelFrame : .null,
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
                    walkRemainingMetres: model.walkRemainingMetres
                )
                .ignoresSafeArea()

                switch layout {
                case .dock:
                    dockChrome(in: proxy)
                case .panel:
                    panelChrome(in: proxy)
                }
            }
            .onChange(of: layout, initial: true) { _, layout in
                chromeLayout = layout
            }
        }
        // Keep the dock anchored to the screen while search dismisses. Otherwise
        // it fades back in within the keyboard's shrinking safe area and jumps.
        .ignoresSafeArea(.keyboard, edges: .bottom)
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
        .sheet(isPresented: $filtersPresented) {
            ScooterFilterSheet(model: model)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $settingsPresented) {
            ScooterSettingsSheet(model: model)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sensoryFeedback(.selection, trigger: model.selectedScooterID)
        .sensoryFeedback(.selection, trigger: model.selectedParkingID)
        .background(WindowAppearance(style: model.appearance.interfaceStyle))
        .background(InterfaceOrientationProbe { model.setHeadingOrientation(ScooterHeadingPolicy.deviceOrientation(for: $0)) })
        .environment(\.locale, model.language.locale)
    }

    /// A phone's: the search bar and its notices at the top, the dock at the
    /// bottom, and the locate button above the dock.
    @ViewBuilder
    private func dockChrome(in proxy: GeometryProxy) -> some View {
        VStack(spacing: 8) {
            // The search bar and what sits under it shield the map
            // from taps, and the compass stays clear of them.
            VStack(spacing: 8) {
                searchIsland(in: proxy)

                if !searchIsExpanded, hasTopNotices {
                    // With large text a banner and a card can be taller than
                    // the room above the locate button; then they scroll.
                    HeightLimit(maximum: topNoticesHeightLimit(in: proxy)) {
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
        .padding(.top, 8)
        .padding(.horizontal, 12)
        .zIndex(20)
        // Made anew in another language: much of what is over the
        // map is text that was written when it was drawn.
        .id(model.language)

        VStack {
            Spacer()
            HStack {
                Spacer()
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
            .padding(.trailing, 12)
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
                    proxy.size.height - (dynamicTypeSize.isAccessibilitySize ? 300 : 220)
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
    @ViewBuilder
    private func panelChrome(in proxy: GeometryProxy) -> some View {
        ZStack(alignment: .top) {
            searchIsland(in: proxy)
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
        .frame(width: ScooterChromeLayout.panelWidth(largeText: dynamicTypeSize.isAccessibilitySize))
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
            HStack {
                Spacer()
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

    /// Only a first load that failed is reported under the search bar; later
    /// failures are the dock's to report, next to the data they concern.
    private var firstLoadFailure: ScooterLoadFailure? {
        guard case let .firstLoadFailed(failure) = model.loadIssue else { return nil }
        return failure
    }

    private var hasTopNotices: Bool {
        firstLoadFailure != nil || model.locationIssue != nil
    }

    /// The room between the search bar and the locate button above the dock.
    private func topNoticesHeightLimit(in proxy: GeometryProxy) -> CGFloat {
        let dockAndGap = dockHeight + max(proxy.safeAreaInsets.bottom, 8) + 10
        let room = proxy.size.height - 8 - searchBarHeight - 8 - 8 - locateButtonHeight - dockAndGap
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

    /// The dock's content takes the rest, inside its own padding.
    private func panelDockHeightLimit(in proxy: GeometryProxy) -> CGFloat {
        let notices = hasTopNotices ? panelNoticesHeight + 8 : 0
        return max(160, panelRoomUnderSearch(in: proxy) - notices - 32)
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
