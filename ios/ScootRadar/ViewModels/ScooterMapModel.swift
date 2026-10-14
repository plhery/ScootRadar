import CoreLocation
import Foundation
import MapKit
import Observation

enum ScooterLocationPolicy {
    static let preferredAccuracy: CLLocationAccuracy = 200
    static let fallbackAccuracy: CLLocationAccuracy = 1_000
    static let maximumAge: TimeInterval = 30

    static func isAcceptable(
        _ location: CLLocation,
        maximumAccuracy: CLLocationAccuracy
    ) -> Bool {
        location.horizontalAccuracy >= 0 &&
            location.horizontalAccuracy <= maximumAccuracy &&
            abs(location.timestamp.timeIntervalSinceNow) <= maximumAge
    }

    static func bestCandidate(
        in locations: [CLLocation],
        maximumAccuracy: CLLocationAccuracy = fallbackAccuracy
    ) -> CLLocation? {
        locations
            .filter { isAcceptable($0, maximumAccuracy: maximumAccuracy) }
            .min(by: { $0.horizontalAccuracy < $1.horizontalAccuracy })
    }
}

enum NearbyOrigin: Equatable, Sendable {
    case searchedDestination(MapDestination)
    case userLocation(GeoPoint)

    var point: GeoPoint {
        switch self {
        case let .searchedDestination(destination):
            destination.point
        case let .userLocation(point):
            point
        }
    }
}

extension MapFocusRequest {
    /// Moves the map to the point and keeps the zoom it has: there is no span to fit.
    static func center(_ point: GeoPoint, token: Int) -> MapFocusRequest {
        MapFocusRequest(point: point, token: token, latitudinalMeters: 0, longitudinalMeters: 0)
    }

    var keepsZoom: Bool {
        latitudinalMeters <= 0 || longitudinalMeters <= 0
    }
}

@MainActor
@Observable
final class ScooterMapModel: NSObject, @MainActor CLLocationManagerDelegate {
    static let switzerlandCenter = ScooterMapStart.switzerlandCenter
    /// Where the app's map opens: the covered city nearest the iPhone's time zone (ScooterStartPlace).
    static let start = ScooterStartPlace.start(forTimeZone: TimeZone.current.identifier)
    static var initialRegion: MKCoordinateRegion { start.region }

    private(set) var vehicles: [Scooter] = [] {
        didSet {
            guard !isApplyingResponse else { return }
            rebuildVehicleIndex()
            rebuildMapScooters()
            rebuildVisibleCounts()
        }
    }
    private(set) var clusters: [ScooterCluster] = [] {
        didSet {
            guard !isApplyingResponse else { return }
            rebuildMapClusters()
            rebuildVisibleCounts()
        }
    }
    private(set) var parking: [ScooterParking] = []
    /// The bays drawn on the map: zoom 16 and closer, for the providers that
    /// are shown, and the bay walked to wherever the map is.
    var mapParking: [ScooterParking] {
        var shown = viewportZoom < 16 ? [] : parking.filter { location in
            guard let provider = ScooterProvider(rawValue: location.provider) else { return false }
            return enabledProviders.contains(provider) && viewport.contains(latitude: location.latitude, longitude: location.longitude)
        }
        if let held = walk?.heldParking, !shown.contains(where: { $0.id == held.id }) {
            shown.append(held)
        }
        return shown
    }
    var viewport = GeoBounds(region: ScooterMapStart.switzerland.region) {
        didSet { rebuildVisibleCounts() }
    }
    private(set) var viewportZoom = ScooterMapStart.switzerland.zoom
    /// The zoom as MapKit has it, between whole levels: it decides which city totals are drawn as one.
    private(set) var viewportZoomLevel = Double(ScooterMapStart.switzerland.zoom)
    var isLoading = false
    var isLocating = false
    /// What went wrong with loading, until a load succeeds again.
    private(set) var loadIssue: ScooterLoadIssue?
    /// When the data on the map was observed. It survives the map being cleared,
    /// so the out-of-date card can say when the last update was.
    var lastUpdated: Date?
    private(set) var responseMetadata: ScooterResponseMetadata?
    var userLocation: GeoPoint? {
        didSet {
            if userLocation != oldValue { walkOriginDidChange() }
        }
    }
    private(set) var userHeading: ScooterUserHeading?
    /// True once this device has located successfully. Only this boolean is stored.
    private(set) var hasLocatedOnce: Bool
    private var locationProblem: ScooterLocationIssue? {
        didSet {
            if locationProblem != oldValue { locationIssueDismissed = false }
        }
    }
    private var locationIssueDismissed = false
    private(set) var enabledProviders = Set(ScooterProvider.allCases) {
        didSet {
            defaults.set(
                enabledProviders.map(\.rawValue).sorted(),
                forKey: Self.enabledProvidersKey
            )
            rebuildMapScooters()
            rebuildMapClusters()
            rebuildVisibleCounts()
            clearSelectionIfHidden()
        }
    }
    var selectedScooterID: String? {
        didSet {
            if selectedScooterID != nil { selectedParkingID = nil }
            if selectedScooterID != oldValue { endWalkIfTargetLeftSelection() }
        }
    }
    /// Selecting a bay clears the selected scooter, and the other way round.
    private(set) var selectedParkingID: String? {
        didSet {
            if selectedParkingID != oldValue { endWalkIfTargetLeftSelection() }
        }
    }
    var searchedDestination: MapDestination? {
        didSet {
            if searchedDestination != oldValue { walkOriginDidChange() }
        }
    }
    /// Places chosen during this session, newest first. Never persisted: the
    /// privacy notice promises that precise origins are not stored.
    private(set) var recentPlaces: [MapDestination] = []
    var focusRequest: MapFocusRequest?
    /// The walk to the selected scooter or bay, from a tap on Directions until
    /// the route is hidden, the card closes or the walk ends on its own. Nil
    /// while the card simply offers Directions.
    private(set) var walk: ScooterWalk? {
        didSet { walkDidChange(from: oldValue) }
    }
    /// What VoiceOver is told about the walk: that the way is being found,
    /// the route that was found, that none was, or that the rider is there.
    private(set) var walkAnnouncement: ScooterWalkAnnouncement?

    var minimumBattery: Double {
        didSet {
            defaults.set(Int(minimumBattery), forKey: Self.minimumBatteryKey)
            rebuildMapScooters()
            rebuildVisibleCounts()
            clearSelectionIfHidden()
        }
    }

    var mapStyle: AppleMapStyle {
        didSet {
            if oldValue != mapStyle { ScooterAnalytics.shared.track("map_style", result: mapStyle.rawValue) }
            defaults.set(mapStyle.rawValue, forKey: Self.mapStyleKey)
        }
    }

    var appearance: ScooterAppearance {
        didSet {
            if oldValue != appearance {
                // Under the name and with the values the web sends.
                ScooterAnalytics.shared.track("map_style", result: appearance == .automatic ? "auto" : appearance.rawValue)
            }
            defaults.set(appearance.rawValue, forKey: Self.appearanceKey)
        }
    }

    /// The language the app is shown in. A choice changes the app's own text
    /// at once, and is kept where iOS reads the app's language at launch,
    /// which is where the Settings of the iPhone keep the one chosen there.
    var language = ScooterLanguage.current {
        didSet {
            guard oldValue != language else { return }
            ScooterAnalytics.shared.track("language_change", result: language.rawValue)
            ScooterLanguage.current = language
            defaults.set([language.rawValue], forKey: Self.languagesKey)
            // Countries are named in it.
            rebuildMapClusters()
        }
    }

    private(set) var rideEstimateMinutes: Int
    private(set) var ridePasses: [ScooterProvider: ProviderRidePass]

    @ObservationIgnored private let api: any ScooterAPIClient
    @ObservationIgnored private let locationManager: CLLocationManager
    @ObservationIgnored private var isTrackingHeading = false
    @ObservationIgnored private var isSceneActive = true
    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let locationTimeout: Duration
    @ObservationIgnored private let refreshPolicy: ScooterRefreshPolicy
    @ObservationIgnored private let clock: () -> Date
    @ObservationIgnored private let directions: any WalkingDirectionsClient
    @ObservationIgnored private let openInMaps: @MainActor (ScooterWalkTarget) -> Void
    /// The route being found, and the number of the latest request: an
    /// answer to an earlier one is not wanted any more.
    @ObservationIgnored private var routeTask: Task<Void, Never>?
    @ObservationIgnored private var routeRequests = 0
    @ObservationIgnored private var routeRevisions = 0
    @ObservationIgnored private var walkAnnouncements = 0
    /// How precise the last location was: a location this vague may lie that
    /// far from the path without the rider having left it.
    @ObservationIgnored private var locationAccuracy: CLLocationAccuracy = 0
    // What the data on the map was requested for. Observed, because the dock
    // only reports an area as empty once the data covers it.
    private var queryBounds: GeoBounds?
    private var queryZoom: Int?
    private var queryMinimumBattery: Int?
    @ObservationIgnored private var pendingQueryBounds: GeoBounds?
    @ObservationIgnored private var pendingQueryZoom: Int?
    @ObservationIgnored private var pendingQueryMinimumBattery: Int?
    @ObservationIgnored private var fetchTask: Task<Void, Never>?
    @ObservationIgnored private var refreshTimerTask: Task<Void, Never>?
    @ObservationIgnored private var parkingExpiryTask: Task<Void, Never>?
    /// When the previous request finished, whatever its outcome.
    @ObservationIgnored private var lastAttemptAt: Date?
    @ObservationIgnored private var lastSuccessAt: Date?
    /// The gap before the next request when the data on screen asked for a quick follow-up.
    @ObservationIgnored private var followUpGap: TimeInterval?
    /// The last response was refreshing, for this query; its follow-up was already granted.
    @ObservationIgnored private var followedUpQuery: ScooterFollowUpQuery?
    @ObservationIgnored private var vehiclesExpireAt: Date?
    @ObservationIgnored private var parkingExpireAt: Date?
    @ObservationIgnored private var locationTimeoutTask: Task<Void, Never>?
    @ObservationIgnored private var knownAuthorizationStatus: CLAuthorizationStatus
    @ObservationIgnored private var activeRequestID: UUID?
    @ObservationIgnored private var bestLocationCandidate: CLLocation?
    /// Set while a card asked for the location: the first fix leaves the map where it is.
    @ObservationIgnored private var keepsMapOnFirstFix = false
    /// Counts the places and cities the rider sent the map to, so that a fix can
    /// tell whether one was chosen while it was on its way.
    @ObservationIgnored private var placeChoices = 0
    @ObservationIgnored private var placeChoicesAtLocate = 0
    @ObservationIgnored private var focusToken = 0
    @ObservationIgnored private var hasStarted = false
    @ObservationIgnored private var isApplyingResponse = false
    /// Scooters are asked for, and walks measured, from here until the iPhone's location is known.
    @ObservationIgnored private let startCenter: GeoPoint
    @ObservationIgnored private var distanceOrigin: GeoPoint
    @ObservationIgnored private var vehiclesByID: [String: Scooter] = [:]
    private(set) var mapScooters: [Scooter] = []
    private(set) var mapScootersRevision = 0
    private(set) var mapClusters: [ScooterCluster] = []
    private(set) var mapClustersRevision = 0
    private(set) var visibleScooterCount = 0
    private(set) var visibleProviderCounts: [ScooterProvider: Int] = [:]
    private var unfilteredVisibleCount = 0
    private var unfilteredVisibleProviders = Set<ScooterProvider>()

    private static let minimumBatteryKey = "minimum-battery"
    private static let mapStyleKey = "apple-map-style"
    private static let appearanceKey = "appearance"
    private static let languagesKey = "AppleLanguages"
    private static let enabledProvidersKey = "enabled-providers"
    private static let rideEstimateMinutesKey = "ride-estimate-minutes-v1"
    private static let ridePassesKey = "provider-ride-passes-v1"
    private static let hasLocatedOnceKey = "has-located-once"
    private static let maximumRecentPlaces = 3
    /// Locating shows about 350 m across, like zoom 17 on the web.
    static let userFocusMeters: CLLocationDistance = 350
    private static let userFocusZoom = 17

    override convenience init() {
        self.init(api: ScooterAPI(), locationManager: CLLocationManager(), defaults: .standard, start: Self.start)
    }

    init(
        api: any ScooterAPIClient,
        locationManager: CLLocationManager,
        defaults: UserDefaults,
        locationTimeout: Duration = .seconds(5),
        refreshPolicy: ScooterRefreshPolicy = .standard,
        now: @escaping () -> Date = Date.init,
        directions: any WalkingDirectionsClient = MapKitWalkingDirections(),
        openInMaps: @escaping @MainActor (ScooterWalkTarget) -> Void = { $0.openInMaps() },
        start: ScooterMapStart = .switzerland
    ) {
        startCenter = start.center
        distanceOrigin = start.center
        viewport = GeoBounds(region: start.region)
        viewportZoom = start.zoom
        viewportZoomLevel = Double(start.zoom)
        self.api = api
        self.directions = directions
        self.openInMaps = openInMaps
        self.locationManager = locationManager
        self.defaults = defaults
        self.locationTimeout = locationTimeout
        self.refreshPolicy = refreshPolicy
        clock = now
        knownAuthorizationStatus = locationManager.authorizationStatus
        hasLocatedOnce = defaults.bool(forKey: Self.hasLocatedOnceKey)

        let savedBattery = defaults.object(forKey: Self.minimumBatteryKey) as? Int ?? 0
        minimumBattery = Double(ScooterBatteryFilter.snapped(savedBattery))

        let savedStyle = defaults.string(forKey: Self.mapStyleKey)
        // The quiet ground is what the dots are made for; a style chosen in
        // Settings is kept.
        mapStyle = AppleMapStyle(rawValue: savedStyle ?? "") ?? .quiet
        appearance = ScooterAppearance(rawValue: defaults.string(forKey: Self.appearanceKey) ?? "") ?? .automatic

        let savedEstimateMinutes = defaults.object(
            forKey: Self.rideEstimateMinutesKey
        ) as? Int ?? RideEstimateDuration.defaultMinutes
        rideEstimateMinutes = RideEstimateDuration.normalized(savedEstimateMinutes)
        ridePasses = Self.loadRidePasses(from: defaults)

        if let savedProviderIDs = defaults.array(forKey: Self.enabledProvidersKey) as? [String] {
            let savedProviders = Set(savedProviderIDs.compactMap(ScooterProvider.init(rawValue:)))
            if savedProviders.count == savedProviderIDs.count {
                enabledProviders = savedProviders
            }
        }

        super.init()

        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = Self.distanceFilter
        locationManager.headingFilter = 2
    }

    /// The selected scooter. A walk keeps it on the card when the data no
    /// longer lists it: zoomed out, where the data counts scooters in
    /// clusters, or gone, when someone may have taken it.
    var selectedScooter: Scooter? {
        guard let selectedScooterID else { return nil }
        if let scooter = vehiclesByID[selectedScooterID] { return scooter }
        guard let walk, walk.holdsCard, case let .scooter(scooter) = walk.target,
              scooter.id == selectedScooterID else { return nil }
        return scooter
    }

    /// The selected bay, while it is still drawn on the map.
    var selectedParking: ScooterParking? {
        guard let selectedParkingID else { return nil }
        return mapParking.first { $0.id == selectedParkingID }
    }

    /// The location card under the search bar, unless it was dismissed. The
    /// next locate attempt brings it back.
    var locationIssue: ScooterLocationIssue? {
        locationIssueDismissed ? nil : locationProblem
    }

    var searchBarState: ScooterSearchBarState {
        if let searchedDestination { return .place(searchedDestination) }
        if isLocating { return .locating }
        // Once located the bar stays a search field: the dot on the map says where you are.
        return .empty
    }

    /// The six covered cities nearest to the map centre, for "Cities with scooters".
    var nearbyCities: [ScooterCityDistance] {
        ScooterCityCatalog.nearest(to: viewport.center, count: 6)
    }

    /// The map centre for the address search, which finds places near it
    /// first: only when the map shows a city or less, and rounded to about a
    /// kilometre, as on the web.
    var searchNear: GeoPoint? {
        guard viewportZoomLevel >= Self.searchNearMinimumZoom else { return nil }
        let centre = viewport.center
        return GeoPoint(
            latitude: (centre.latitude * 100).rounded() / 100,
            longitude: (centre.longitude * 100).rounded() / 100
        )
    }

    static let searchNearMinimumZoom = 10.0

    /// The three covered cities nearest to the map centre, for the outside-coverage card.
    var closestCities: [ScooterCityDistance] {
        ScooterCityCatalog.nearest(to: viewport.center, count: 3)
    }

    var activeOrigin: NearbyOrigin? {
        if let searchedDestination {
            return .searchedDestination(searchedDestination)
        }
        if let userLocation {
            return .userLocation(userLocation)
        }
        return nil
    }

    /// The origin while it is on the map or within half a map of it. Distances
    /// from an origin far out of sight say nothing about the scooters shown:
    /// the dots then keep one size and none is named.
    var mapOrigin: GeoPoint? {
        guard let point = activeOrigin?.point, viewport.expanded(by: 0.5).contains(point) else { return nil }
        return point
    }

    /// The nearest of the scooters in view, filters applied: the ones the
    /// count and the chips are of. Only while the place walked from is on the
    /// map and every scooter has its own dot, as on the web.
    var dockLead: ScooterDockLead? {
        ScooterDockLead.nearest(
            of: mapScooters,
            from: activeOrigin?.point,
            in: viewport,
            grouped: responseMetadata?.mode == "clusters" || ScooterClusteringPolicy.shouldCluster(at: viewportZoom)
        )
    }

    /// What the card of a scooter says under its name.
    func cardContent(for scooter: Scooter) -> ScooterCardContent {
        ScooterCardContent(
            scooter: scooter,
            metres: walkingDistance(to: scooter),
            placeTitle: searchedDestination?.title,
            quote: ridePriceQuote(for: scooter),
            curfew: RentalCurfew.active(at: GeoPoint(latitude: scooter.latitude, longitude: scooter.longitude), on: clock())
        )
    }

    var visibleCount: Int { visibleScooterCount }

    var allProvidersSelected: Bool {
        Set(availableProviders).isSubset(of: enabledProviders)
    }

    var availableProviders: [ScooterProvider] {
        let providers = Set(ScooterProviderCoverage.providers(in: viewport)).union(visibleProviderCounts.keys)
        return ScooterProvider.allCases.filter { providers.contains($0) }
    }

    var hasActiveFilters: Bool {
        minimumBattery > 0 || !allProvidersSelected
    }

    /// The providers that are not sharing data here: a feed of theirs failed, they
    /// operate in the viewport and the map holds none of their scooters in view,
    /// whatever the rider's filters hide. City totals name no one, and neither does
    /// data that cannot tell who has scooters here: loaded for another area, or
    /// already without the scooters under the battery minimum, which the server
    /// leaves out of clusters.
    var providerHealth: ScooterProviderHealth {
        guard let responseMetadata, responseMetadata.overview != true, viewportIsLoaded,
              (queryMinimumBattery ?? 0) == 0 else { return .healthy }
        return ScooterProviderHealth(
            failedSources: responseMetadata.failedSources,
            operating: ScooterProviderCoverage.providers(in: viewport),
            inView: unfilteredVisibleProviders
        )
    }

    /// The calm lines under the dock status: a night ban, providers down, truncation, parking.
    var dockNotices: [ScooterDockNotice] {
        guard let responseMetadata else { return [] }
        return ScooterDockNotice.notices(
            curfew: RentalCurfew.active(at: viewport.center, on: clock()),
            health: providerHealth,
            metadata: responseMetadata,
            shownCount: representedVehicleCount
        )
    }

    func count(for provider: ScooterProvider) -> Int {
        visibleProviderCounts[provider, default: 0]
    }

    var allProviderCount: Int { visibleProviderCounts.values.reduce(0, +) }

    /// The providers in the filter sheet, in catalogue order.
    var filterProviders: [ScooterProviderEntry] {
        let down = Set(providerHealth.downProviders)
        let isFilteringProviders = !allProvidersSelected
        return availableProviders.map { provider in
            let count = count(for: provider)
            let isDown = down.contains(provider)
            let isEnabled = enabledProviders.contains(provider)
            return ScooterProviderEntry(
                provider: provider,
                count: count,
                isEnabled: isEnabled,
                isSelected: isFilteringProviders && isEnabled && !isDown,
                isDown: isDown
            )
        }
    }

    /// The chips after "All": providers that are down first, then by count,
    /// largest first. Ties keep the catalogue order.
    var dockChips: [ScooterProviderEntry] {
        let entries = filterProviders
        let sharing = entries.enumerated()
            .filter { !$0.element.isDown }
            .sorted { lhs, rhs in
                lhs.element.count != rhs.element.count
                    ? lhs.element.count > rhs.element.count
                    : lhs.offset < rhs.offset
            }
            .map(\.element)
        return entries.filter(\.isDown) + sharing
    }

    /// What the filter sheet's "Show n scooters" button promises: filters apply
    /// as they are chosen, so this is the count on the map.
    var showResultsTitle: String {
        ScooterFiltering.showResultsTitle(count: visibleCount)
    }

    /// The providers listed under Passes: those operating in the viewport or
    /// with a pass, and every provider when that leaves none.
    var passProviders: [ScooterProvider] {
        let operating = Set(availableProviders)
        let listed = ScooterProvider.allCases.filter {
            operating.contains($0) || ridePass(for: $0).enabled
        }
        return listed.isEmpty ? ScooterProvider.allCases : listed
    }

    /// What the dock shows.
    var dock: ScooterDockContent {
        if let selectedScooter { return .scooter(selectedScooter) }
        if let selectedParking { return .parking(selectedParking) }
        if case let .outOfDate(failure, lastUpdate) = loadIssue {
            return .outOfDate(failure, lastUpdate: lastUpdate)
        }
        guard let lastUpdated else {
            return loadIssue == nil ? .finding(chips: []) : .waiting
        }

        // A failure already explains an empty map.
        let isEmpty = visibleCount == 0 && loadIssue == nil
        if isEmpty {
            // No provider operates here, whatever the pending request answers.
            if availableProviders.isEmpty { return .outsideCoverage(closestCities) }
            // The data on the map is for another area: no count to show yet.
            guard viewportIsLoaded else { return .finding(chips: dockChips) }
            if let filterSummary = hiddenByFilters { return .filtersHideEverything(filterSummary) }
        }

        let isOverview = responseMetadata?.overview == true
        let hint: ScooterDockHint? = if isEmpty {
            .emptyArea
        } else {
            isOverview && visibleCount > 0 ? .tapCity : nil
        }
        return .summary(ScooterDockSummary(
            count: visibleCount,
            countContext: activeOrigin.map { viewport.contains($0.point) } == true ? .nearby : .onThisMap,
            lastUpdated: lastUpdated,
            refreshFailure: refreshFailure,
            isOverview: isOverview,
            isDelayed: responseMetadata?.stale == true,
            notices: dockNotices,
            hint: hint,
            chips: dockChips,
            lead: isOverview ? nil : dockLead
        ))
    }

    private var refreshFailure: ScooterLoadFailure? {
        guard case let .refreshFailed(failure, _) = loadIssue else { return nil }
        return failure
    }

    /// The failed refresh or the delay to report at the top of a scooter or bay
    /// card, which hides the dock's own status line. Nil while the data is healthy.
    var cardStatus: ScooterDockStatus? {
        if case let .refreshFailed(failure, showing) = loadIssue {
            return failure == .offline ? .offline(showing: showing) : .refreshFailed(showing: showing)
        }
        guard responseMetadata?.stale == true, let lastUpdated else { return nil }
        return .delayed(showing: lastUpdated)
    }

    /// What VoiceOver is told when the dock turns into a card, which happens far
    /// from the marker that was activated: the card's own first lines. Nil for
    /// the count and its chips.
    var dockAnnouncement: String? {
        switch dock {
        case let .scooter(scooter):
            let name = String(
                format: String(localized: "%@ scooter"),
                scooter.providerInfo?.name ?? scooter.provider.capitalized
            )
            return [name, walkingSummary(for: scooter)].compactMap { $0 }.joined(separator: ", ")
        case let .parking(parking):
            let heading = [parking.bayTitle, parkingSubtitle(for: parking)]
                .filter { !$0.isEmpty }
                .joined(separator: ", ")
            return "\(heading). \(parking.notice)"
        case let .outOfDate(failure, lastUpdate):
            let title = String(localized: "These positions are out of date")
            return "\(title). \(ScooterDockStatus.outOfDateBody(failure, lastUpdate: lastUpdate))"
        case .finding, .waiting, .outsideCoverage, .filtersHideEverything, .summary:
            return nil
        }
    }

    /// Whether the data on the map was loaded for the area on screen. Only then
    /// is an empty map a fact about the area rather than a load in progress.
    private var viewportIsLoaded: Bool {
        queryCovers(viewport, zoom: viewportZoom, pending: false)
    }

    /// The filters and what they hide, when they are the reason the loaded area is empty.
    private var hiddenByFilters: ScooterFilterSummary? {
        guard hasActiveFilters else { return nil }
        // The response cannot tell how many scooters there are once the server
        // filtered clustered data by battery or cut the list short.
        let isCountKnown = (queryMinimumBattery ?? 0) == 0 && responseMetadata?.truncated != true
        let hiddenCount: Int? = isCountKnown ? unfilteredVisibleCount : nil
        // Filters that hide nothing are not the reason the map is empty.
        if hiddenCount == 0 { return nil }

        var providers: [ScooterProvider] = []
        if !allProvidersSelected {
            providers = availableProviders.filter(enabledProviders.contains)
            if providers.isEmpty {
                providers = ScooterProvider.allCases.filter(enabledProviders.contains)
            }
        }
        return ScooterFilterSummary(
            hiddenCount: hiddenCount,
            providers: providers,
            minimumBattery: minimumBattery > 0 ? Int(minimumBattery) : nil
        )
    }

    func formattedDistance(for scooter: Scooter) -> String? {
        if let metres = routeDistance(to: .scooter(scooter)) { return Scooter.formattedLength(meters: metres) }
        guard let origin = activeOrigin?.point else { return nil }
        return scooter.formattedDistance(from: origin)
    }

    func straightLineDistance(to scooter: Scooter) -> CLLocationDistance? {
        guard let origin = activeOrigin?.point else { return nil }
        return scooter.distance(from: origin)
    }

    /// What is left to walk along the route on the map, or else the straight line.
    func walkingDistance(to scooter: Scooter) -> CLLocationDistance? {
        routeDistance(to: .scooter(scooter)) ?? straightLineDistance(to: scooter)
    }

    func approximateWalkingMinutes(to scooter: Scooter) -> Int? {
        guard let distance = walkingDistance(to: scooter), distance.isFinite else { return nil }
        return ScooterMapLook.walkingMinutes(metres: distance)
    }

    func approximateWalkingMinutes(to parking: ScooterParking) -> Int? {
        if let metres = routeDistance(to: .parking(parking)) { return ScooterMapLook.walkingMinutes(metres: metres) }
        guard let origin = activeOrigin?.point else { return nil }
        let distance = Self.distance(
            from: origin,
            to: GeoPoint(latitude: parking.latitude, longitude: parking.longitude)
        )
        guard distance.isFinite else { return nil }
        return ScooterMapLook.walkingMinutes(metres: distance)
    }

    /// The second line of the scooter card: "≈4 min walk · 320 m", or
    /// "≈4 min walk from Zürich HB · 320 m" when the origin is a searched
    /// place. Nil without an origin.
    func walkingSummary(for scooter: Scooter) -> String? {
        guard let minutes = approximateWalkingMinutes(to: scooter),
              let distance = formattedDistance(for: scooter) else { return nil }
        if let searchedDestination {
            return String(
                format: String(localized: "≈%1$lld min walk from %2$@ · %3$@"),
                Int64(minutes),
                searchedDestination.title,
                distance
            )
        }
        return String(format: String(localized: "≈%1$lld min walk · %2$@"), Int64(minutes), distance)
    }

    /// The second line of the bay card: "Rue Faidherbe · ≈3 min walk", with
    /// "from Zürich HB" when the origin is a searched place, or the name alone
    /// without an origin.
    func parkingSubtitle(for parking: ScooterParking) -> String {
        guard let minutes = approximateWalkingMinutes(to: parking) else { return parking.name }
        let walk = if let searchedDestination {
            String(
                format: String(localized: "≈%1$lld min walk from %2$@"),
                Int64(minutes),
                searchedDestination.title
            )
        } else {
            String(format: String(localized: "≈%lld min walk"), Int64(minutes))
        }
        guard !parking.name.isEmpty else { return walk }
        return String(format: String(localized: "%1$@ · %2$@"), parking.name, walk)
    }

    func setRideEstimateMinutes(_ minutes: Int) {
        let normalizedMinutes = RideEstimateDuration.normalized(minutes)
        guard normalizedMinutes != rideEstimateMinutes else { return }
        ScooterAnalytics.shared.track("ride_duration", value: normalizedMinutes)
        rideEstimateMinutes = normalizedMinutes
        defaults.set(normalizedMinutes, forKey: Self.rideEstimateMinutesKey)
    }

    func ridePass(for provider: ScooterProvider) -> ProviderRidePass {
        ridePasses[provider] ?? ProviderRidePass()
    }

    func setRidePass(_ pass: ProviderRidePass, for provider: ScooterProvider) {
        ScooterAnalytics.shared.track("ride_pass_change", provider: provider.rawValue)
        ridePasses[provider] = pass
        persistRidePasses()
    }

    func ridePriceQuote(
        for scooter: Scooter,
        now: Date = .now,
        calendar: Calendar = .current
    ) -> RidePriceQuote? {
        guard let pricing = scooter.pricing else { return nil }
        let pass = scooter.providerInfo.map(ridePass(for:))
        return RidePriceEstimator.quote(
            pricing: pricing,
            durationMinutes: rideEstimateMinutes,
            pass: pass,
            now: now,
            calendar: calendar
        )
    }

    func start() {
        guard !hasStarted else { return }
        hasStarted = true

        switch locationManager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            startHeadingUpdates()
            if let cachedLocation = locationManager.location,
               ScooterLocationPolicy.isAcceptable(
                   cachedLocation,
                   maximumAccuracy: ScooterLocationPolicy.preferredAccuracy
               ) {
                acceptLocation(cachedLocation)
            } else {
                requestLocationAccess()
            }
        default:
            refresh()
        }
    }

    func becameActive() {
        isSceneActive = true
        if hasStarted { startHeadingUpdates() }
        expireParkingIfNeeded()
        // Back in the foreground a due refresh starts at once. The old data
        // stays on the map until the outcome is known.
        refreshIfDue(respectingAttemptGap: false)
    }

    func becameInactive() {
        isSceneActive = false
        stopHeadingUpdates()
        refreshTimerTask?.cancel()
        refreshTimerTask = nil
    }

    private func startHeadingUpdates() {
        guard isSceneActive, !isTrackingHeading, CLLocationManager.headingAvailable(),
              locationManager.authorizationStatus == .authorizedWhenInUse ||
                locationManager.authorizationStatus == .authorizedAlways else { return }
        isTrackingHeading = true
        // Location updates let Core Location resolve true north for the map.
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }

    private func stopHeadingUpdates() {
        locationManager.stopUpdatingHeading()
        isTrackingHeading = false
        userHeading = nil
    }

    /// What the refresh timer does when it fires: bays past their time go, and
    /// the scooters are fetched again once they are due or have expired.
    func autoRefreshIfNeeded() {
        expireParkingIfNeeded()
        refreshIfDue(respectingAttemptGap: true)
    }

    private var refreshAfter: TimeInterval {
        guard let seconds = responseMetadata?.refreshAfterSeconds, seconds > 0 else {
            return refreshPolicy.defaultRefreshAfter
        }
        return TimeInterval(seconds)
    }

    private func refreshIfDue(respectingAttemptGap: Bool) {
        // A request in flight decides the outcome; nothing is cleared meanwhile.
        guard isSceneActive, fetchTask == nil else { return }
        guard lastAttemptAt != nil else {
            if !isLocating { refresh() }
            return
        }

        let due = respectingAttemptGap
            ? refreshPolicy.nextAttempt(
                lastSuccess: lastSuccessAt,
                refreshAfter: refreshAfter,
                expiresAt: vehiclesExpireAt,
                lastAttempt: lastAttemptAt,
                attemptGap: followUpGap
            )
            : refreshPolicy.refreshDue(
                lastSuccess: lastSuccessAt,
                refreshAfter: refreshAfter,
                expiresAt: vehiclesExpireAt,
                attemptGap: followUpGap
            )
        if clock() >= due {
            refresh()
        } else {
            scheduleAutomaticRefresh()
        }
    }

    private func scheduleAutomaticRefresh() {
        refreshTimerTask?.cancel()
        refreshTimerTask = nil
        guard isSceneActive, fetchTask == nil, lastAttemptAt != nil else { return }

        let nextAttempt = refreshPolicy.nextAttempt(
            lastSuccess: lastSuccessAt,
            refreshAfter: refreshAfter,
            expiresAt: vehiclesExpireAt,
            lastAttempt: lastAttemptAt,
            attemptGap: followUpGap
        )
        let delay = max(0, nextAttempt.timeIntervalSince(clock()))
        refreshTimerTask = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(delay)) } catch { return }
            guard let self else { return }
            refreshTimerTask = nil
            autoRefreshIfNeeded()
        }
    }

    func updateViewport(_ region: MKCoordinateRegion, zoom: Int, zoomLevel: Double? = nil) {
        let nextViewport = GeoBounds(region: region)
        viewport = nextViewport
        viewportZoom = zoom
        let nextZoomLevel = zoomLevel ?? Double(zoom)
        if nextZoomLevel != viewportZoomLevel {
            viewportZoomLevel = nextZoomLevel
            if responseMetadata?.overview == true { rebuildMapClusters() }
        }
        clearSelectionIfHidden()

        if queryCovers(nextViewport, zoom: zoom, pending: false) {
            if fetchTask != nil && !queryCovers(nextViewport, zoom: zoom, pending: true) {
                cancelPendingFetch()
            }
            return
        }
        guard !queryCovers(nextViewport, zoom: zoom, pending: true) else { return }
        scheduleFetch(for: nextViewport.expanded(by: 0.25), zoom: zoom, debounce: true)
    }

    func refresh() {
        scheduleFetch(for: viewport.expanded(by: 0.25), zoom: viewportZoom, debounce: false)
    }

    /// "Try again" and "Refresh": a manual refresh, fetched at once.
    func retryLoad() {
        ScooterAnalytics.shared.track("refresh")
        refresh()
    }

    func showAllProviders() {
        ScooterAnalytics.shared.track("providers_all")
        enabledProviders = Set(ScooterProvider.allCases)
    }

    func showProviders(_ providers: Set<ScooterProvider>) {
        ScooterAnalytics.shared.track("provider_filter", provider: providers.count == 1 ? providers.first?.rawValue : nil, value: providers.count)
        enabledProviders = providers
    }

    func toggleQuickProvider(_ provider: ScooterProvider) {
        if allProvidersSelected {
            showProviders([provider])
        } else if enabledProviders == [provider] {
            showAllProviders()
        } else {
            toggle(provider: provider)
        }
    }

    func toggle(provider: ScooterProvider) {
        ScooterAnalytics.shared.track("provider_filter", provider: provider.rawValue, result: enabledProviders.contains(provider) ? "disabled" : "enabled")
        if enabledProviders.contains(provider) {
            enabledProviders.remove(provider)
        } else {
            enabledProviders.insert(provider)
        }
    }

    func resetFilters() {
        ScooterAnalytics.shared.track("filters_reset")
        let batteryChanged = minimumBattery != 0
        minimumBattery = 0
        enabledProviders = Set(ScooterProvider.allCases)
        if batteryChanged, ScooterClusteringPolicy.shouldCluster(at: viewportZoom) {
            clusters = []
            scheduleFetch(for: viewport.expanded(by: 0.25), zoom: viewportZoom, debounce: true)
        }
    }

    /// Sets the minimum battery to a preset; other values snap down (45 → 30).
    func setMinimumBattery(_ value: Double) {
        let normalizedValue = Double(ScooterBatteryFilter.snapped(
            value.isFinite ? Int(min(100, max(0, value))) : 0
        ))
        guard normalizedValue != minimumBattery else { return }
        ScooterAnalytics.shared.track("battery_filter", value: Int(normalizedValue))
        minimumBattery = normalizedValue
        if ScooterClusteringPolicy.shouldCluster(at: viewportZoom) {
            clusters = []
            scheduleFetch(for: viewport.expanded(by: 0.25), zoom: viewportZoom, debounce: true)
        }
    }

    func focusOnUser() {
        ScooterAnalytics.shared.track("locate")
        searchedDestination = nil
        keepsMapOnFirstFix = false
        if let userLocation {
            requestUserFocus(at: userLocation)
        } else {
            isLocating = true
            requestLocationAccess()
        }
    }

    /// "Turn on location to see walking time" on a card: locates like Near me,
    /// but the map stays where it is, so the card is not closed by the map
    /// moving away from the scooter.
    func locateForWalkingTime() {
        guard userLocation == nil else { return }
        ScooterAnalytics.shared.track("locate")
        keepsMapOnFirstFix = true
        isLocating = true
        requestLocationAccess()
    }

    /// Chooses a place found in the search: it becomes the origin for walking
    /// times, is remembered for this session and the map moves there.
    func focusOnAddress(_ destination: MapDestination) {
        ScooterAnalytics.shared.track("search_select")
        choosePlace(destination)
    }

    private func choosePlace(_ destination: MapDestination) {
        // A walk under way goes on from the new place when it is still a walk
        // from there. Its route then shows the place and the scooter, and the
        // map fits it rather than move to the place first.
        let keepsWalk = walk.map {
            $0.isUnderway && WalkRoute.isWalk(from: destination.point, to: $0.target.point)
        } ?? false
        if !keepsWalk {
            selectedScooterID = nil
            selectedParkingID = nil
        }
        placeChoices += 1
        searchedDestination = destination
        rememberPlace(destination)
        guard !keepsWalk else { return }
        focusToken += 1
        focusRequest = destination.kind == .city
            ? .city(destination.point, token: focusToken)
            : MapFocusRequest(point: destination.point, token: focusToken)
    }

    /// A "Cities with scooters" chip: like choosing the city as a place.
    func chooseCity(_ city: ScooterCity) {
        focusOnAddress(city.destination)
    }

    /// A closest-city chip: the city becomes the place, like its chip in the
    /// search, so walking times start there and not at the place without data.
    func focusOnCity(_ city: ScooterCity) {
        choosePlace(city.destination)
    }

    private func rememberPlace(_ destination: MapDestination) {
        recentPlaces.removeAll { $0.id == destination.id }
        recentPlaces.insert(destination, at: 0)
        if recentPlaces.count > Self.maximumRecentPlaces {
            recentPlaces.removeLast(recentPlaces.count - Self.maximumRecentPlaces)
        }
    }

    /// The card header: centres the scooter and leaves the zoom as it is.
    func focusOnScooter(_ scooter: Scooter) {
        selectScooter(scooter.id)
        focusToken += 1
        focusRequest = .center(GeoPoint(scooter.coordinate), token: focusToken)
    }

    func clearAddressSearch() {
        searchedDestination = nil
    }

    func selectScooter(_ id: String?) {
        guard id != selectedScooterID else { return }
        ScooterAnalytics.shared.track(id == nil ? "vehicle_dismiss" : "vehicle_select", provider: id.flatMap { vehiclesByID[$0]?.provider })
        selectedScooterID = id
    }

    /// Selects a parking bay by id, or closes the bay card with nil. The map
    /// reports `parking_select` itself, so nothing is tracked here.
    func selectParking(_ id: String?) {
        guard id != selectedParkingID else { return }
        if id != nil { selectedScooterID = nil }
        selectedParkingID = id
    }

    /// A tap on the map background: closes the scooter or the bay card.
    func clearSelection() {
        selectScooter(nil)
        selectedParkingID = nil
    }

    func dismissLocationIssue() {
        locationIssueDismissed = true
    }

    private func passesBatteryFilter(_ scooter: Scooter) -> Bool {
        ScooterFiltering.passesBattery(scooter, minimumBattery: minimumBattery)
    }

    private func rebuildMapScooters() {
        var next = ScooterFiltering.mapScooters(
            from: vehicles,
            minimumBattery: minimumBattery,
            enabledProviders: enabledProviders
        )
        // The scooter walked to stays on the map whatever the map shows around it.
        if let held = walk?.heldScooter, !next.contains(where: { $0.id == held.id }) {
            next.append(held)
        }
        guard next != mapScooters else { return }
        mapScooters = next
        mapScootersRevision &+= 1
    }

    private func rebuildMapClusters() {
        var next = clusters.compactMap { $0.filtered(to: enabledProviders) }
        if responseMetadata?.overview == true {
            let locale = language.locale
            next = ScooterCityGrouping.group(next, zoomLevel: viewportZoomLevel, language: language) { code in
                locale.localizedString(forRegionCode: code) ?? code.uppercased()
            }
        }
        guard next != mapClusters else { return }
        mapClusters = next
        mapClustersRevision &+= 1
    }

    private func rebuildVehicleIndex() {
        vehiclesByID = Dictionary(
            vehicles.map { ($0.id, $0) },
            uniquingKeysWith: { _, latest in latest }
        )
    }

    private func rebuildVisibleCounts() {
        let summary = ScooterFiltering.visibleSummary(
            for: vehicles, viewport: viewport, minimumBattery: minimumBattery,
            enabledProviders: enabledProviders
        )
        var count = summary.count
        var providers = summary.providerCounts
        var unfilteredCount = summary.unfilteredCount
        var unfilteredProviders = summary.unfilteredProviders
        if responseMetadata?.mode == "clusters" {
            for cluster in clusters where viewport.contains(latitude: cluster.latitude, longitude: cluster.longitude) {
                for (providerID, providerCount) in cluster.providers {
                    unfilteredCount += providerCount
                    guard let provider = ScooterProvider(rawValue: providerID) else { continue }
                    if providerCount > 0 { unfilteredProviders.insert(provider) }
                    providers[provider, default: 0] += providerCount
                    if enabledProviders.contains(provider) { count += providerCount }
                }
            }
        }
        visibleScooterCount = count
        visibleProviderCounts = providers
        unfilteredVisibleCount = unfilteredCount
        unfilteredVisibleProviders = unfilteredProviders
    }

    private var representedVehicleCount: Int {
        vehicles.count + clusters.reduce(0) { $0 + $1.count }
    }

    private func clearSelectionIfHidden() {
        if let selectedParkingID, !mapParking.contains(where: { $0.id == selectedParkingID }) {
            self.selectedParkingID = nil
        }

        // The scooter walked to stays selected wherever the map goes.
        guard let selectedScooter, walk?.heldScooter?.id != selectedScooter.id else { return }
        let remainsVisible = viewport.contains(
            latitude: selectedScooter.latitude,
            longitude: selectedScooter.longitude
        ) && passesBatteryFilter(selectedScooter) && (
            allProvidersSelected || selectedScooter.providerInfo.map(enabledProviders.contains) == true
        )

        if !remainsVisible {
            selectedScooterID = nil
        }
    }

    private func scheduleFetch(for bounds: GeoBounds, zoom: Int, debounce: Bool) {
        fetchTask?.cancel()
        refreshTimerTask?.cancel()
        refreshTimerTask = nil

        let requestID = UUID()
        let fetchOrigin = userLocation ?? startCenter
        let requestMinimumBattery = ScooterClusteringPolicy.shouldCluster(at: zoom)
            ? Int(minimumBattery)
            : 0
        activeRequestID = requestID
        pendingQueryBounds = bounds
        pendingQueryZoom = zoom
        pendingQueryMinimumBattery = requestMinimumBattery
        fetchTask = Task { [weak self] in
            guard let self else { return }

            defer {
                if activeRequestID == requestID { clearPendingFetch() }
            }
            if debounce {
                do {
                    try await Task.sleep(for: .milliseconds(180))
                } catch {
                    return
                }
            }

            guard !Task.isCancelled else { return }
            isLoading = true

            do {
                let response = try await api.scooters(
                    bounds: bounds,
                    zoom: zoom,
                    minimumBattery: requestMinimumBattery
                )
                guard !Task.isCancelled, activeRequestID == requestID else { return }
                // The backend preserves recent successful feeds independently.
                // Accept healthy cities even when another operator is unavailable.
                // A response is shown whatever its own timestamps say.
                let receivedAt = clock()
                isApplyingResponse = true
                vehicles = response.vehicles
                clusters = response.clusters
                parking = response.parking
                responseMetadata = response.meta
                isApplyingResponse = false
                queryBounds = bounds
                queryZoom = zoom
                queryMinimumBattery = requestMinimumBattery
                rebuildVehicleIndex()
                followWalkTarget(in: response.meta, loadedFor: bounds)
                rebuildMapScooters()
                rebuildMapClusters()
                rebuildVisibleCounts()
                distanceOrigin = fetchOrigin
                let generatedAt = Self.apiDate(response.meta?.generatedAt, clockOffset: response.clockOffset)
                lastUpdated = min(generatedAt ?? receivedAt, receivedAt)
                lastSuccessAt = receivedAt
                lastAttemptAt = receivedAt
                // The server is collecting feeds of this answer again: ask once more soon, but only once in a row.
                let query = ScooterFollowUpQuery(bounds: bounds, zoom: zoom, minimumBattery: requestMinimumBattery)
                let refreshing = response.meta?.refreshing == true
                followUpGap = refreshing && followedUpQuery != query ? refreshPolicy.followUpGap : nil
                followedUpQuery = refreshing ? query : nil
                loadIssue = nil
                scheduleDataExpiry(response.meta, receivedAt: receivedAt, clockOffset: response.clockOffset)
                expireParkingIfNeeded()
                clearSelectionIfHidden()
            } catch is CancellationError {
                return
            } catch {
                guard activeRequestID == requestID else { return }
                // Retries repeat every few seconds; report a failure once, when it starts.
                if loadIssue == nil {
                    ScooterAnalytics.shared.track("data_error", result: "request_failed")
                }
                lastAttemptAt = clock()
                followUpGap = nil
                handleLoadFailure(ScooterLoadFailure(error))
            }

        }
    }

    private func handleLoadFailure(_ failure: ScooterLoadFailure) {
        guard let lastUpdated else {
            loadIssue = .firstLoadFailed(failure)
            return
        }
        if case let .outOfDate(_, lastUpdate) = loadIssue {
            loadIssue = .outOfDate(failure, lastUpdate: lastUpdate)
            return
        }
        guard let vehiclesExpireAt, clock() >= vehiclesExpireAt else {
            // The data on the map is still valid and stays exactly as it is.
            loadIssue = .refreshFailed(failure, showing: lastUpdated)
            return
        }

        // Only now is the data both expired and impossible to renew.
        vehicles = []
        clusters = []
        selectedScooterID = nil
        selectedParkingID = nil
        queryBounds = nil
        loadIssue = .outOfDate(failure, lastUpdate: lastUpdated)
    }

    private func clearPendingFetch() {
        isLoading = false
        activeRequestID = nil
        pendingQueryBounds = nil
        pendingQueryZoom = nil
        pendingQueryMinimumBattery = nil
        fetchTask = nil
        scheduleAutomaticRefresh()
    }

    private func cancelPendingFetch() {
        fetchTask?.cancel()
        clearPendingFetch()
    }

    /// A time the server wrote, on the clock of this device: `clockOffset` is
    /// how far this clock is ahead of the server's.
    private static func apiDate(_ value: String?, clockOffset: TimeInterval) -> Date? {
        guard let value else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: value) ?? ISO8601DateFormatter().date(from: value)
        return date?.addingTimeInterval(clockOffset)
    }

    /// The server's times are moved onto this device's clock first: a clock
    /// that is minutes fast would otherwise find every response expired on arrival.
    private func scheduleDataExpiry(_ meta: ScooterResponseMetadata?, receivedAt: Date, clockOffset: TimeInterval) {
        let observedAt = min(receivedAt, Self.apiDate(meta?.generatedAt, clockOffset: clockOffset) ?? receivedAt)
        let maximumAge: TimeInterval = meta?.overview == true ? 3 * 3600 : 900
        // Scooters past this moment are only cleared once a refresh has failed.
        vehiclesExpireAt = min(Self.apiDate(meta?.expiresAt, clockOffset: clockOffset) ?? .distantFuture,
            observedAt.addingTimeInterval(maximumAge))
        parkingExpireAt = min(Self.apiDate(meta?.parkingExpiresAt, clockOffset: clockOffset) ?? .distantFuture,
            receivedAt.addingTimeInterval(300))

        parkingExpiryTask?.cancel()
        let delay = max(0, (parkingExpireAt ?? receivedAt).timeIntervalSince(receivedAt))
        parkingExpiryTask = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(delay)) } catch { return }
            self?.expireParkingIfNeeded()
        }
    }

    /// Parking bays expire on their own schedule, whatever happens to the scooters.
    func expireParkingIfNeeded() {
        guard let parkingExpireAt, clock() >= parkingExpireAt else { return }
        self.parkingExpireAt = nil
        parking = []
        clearSelectionIfHidden()
    }

    private func fetchIfNeeded(
        for targetViewport: GeoBounds,
        zoom: Int? = nil,
        debounce: Bool = false
    ) {
        let targetZoom = zoom ?? viewportZoom
        if queryCovers(targetViewport, zoom: targetZoom, pending: false) {
            if fetchTask != nil && !queryCovers(targetViewport, zoom: targetZoom, pending: true) {
                cancelPendingFetch()
            }
            return
        }
        guard !queryCovers(targetViewport, zoom: targetZoom, pending: true) else { return }
        scheduleFetch(
            for: targetViewport.expanded(by: 0.25),
            zoom: targetZoom,
            debounce: debounce
        )
    }

    private func queryCovers(_ targetViewport: GeoBounds, zoom: Int, pending: Bool) -> Bool {
        let bounds = pending ? pendingQueryBounds : queryBounds
        let storedZoom = pending ? pendingQueryZoom : self.queryZoom
        let storedMinimumBattery = pending
            ? pendingQueryMinimumBattery
            : self.queryMinimumBattery
        guard bounds?.contains(targetViewport) == true,
              let storedZoom,
              ScooterClusteringPolicy.representationsMatch(storedZoom, zoom) else { return false }

        let targetMinimumBattery = ScooterClusteringPolicy.shouldCluster(at: zoom)
            ? Int(minimumBattery)
            : 0
        return storedMinimumBattery == targetMinimumBattery
    }

    private var isLocationAuthorized: Bool {
        locationManager.authorizationStatus == .authorizedWhenInUse ||
            locationManager.authorizationStatus == .authorizedAlways
    }

    private func requestLocationAccess() {
        // A new attempt brings a dismissed card back and retires the last "not found".
        locationIssueDismissed = false
        if locationProblem == .notFound { locationProblem = nil }
        placeChoicesAtLocate = placeChoices

        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationProblem = nil
            isLocating = true
            // The wait for a fix starts with the answer to the prompt, however
            // long that takes: the authorization callback begins it.
            locationManager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            locationProblem = nil
            isLocating = true
            locationManager.startUpdatingLocation()
            startHeadingUpdates()
            if userLocation == nil {
                beginLocationTimeout()
            }
        case .denied:
            locationProblem = .denied
            isLocating = false
            finishLocationAttemptWithoutFix()
        case .restricted:
            locationProblem = .restricted
            isLocating = false
            finishLocationAttemptWithoutFix()
        @unknown default:
            isLocating = false
            finishLocationAttemptWithoutFix()
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        let statusChanged = status != knownAuthorizationStatus
        knownAuthorizationStatus = status
        if status != .authorizedAlways && status != .authorizedWhenInUse {
            stopHeadingUpdates()
        }
        // CLLocationManager can deliver the current authorization state as soon as
        // its delegate is assigned. Wait until the app has actually requested a
        // location so model initialization cannot unexpectedly recenter the map.
        guard hasStarted || isLocating else { return }

        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            locationProblem = nil
            manager.startUpdatingLocation()
            startHeadingUpdates()
            // With a position already in hand there is nothing to wait for.
            if userLocation == nil {
                isLocating = true
                beginLocationTimeout()
            }
        case .denied, .restricted:
            // The same goes for the location card: a refusal that was already
            // known, with no request pending, answers nothing the user just did.
            guard statusChanged || isLocating else { return }
            locationProblem = status == .denied ? .denied : .restricted
            isLocating = false
            finishLocationAttemptWithoutFix()
        case .notDetermined:
            locationProblem = nil
        @unknown default:
            isLocating = false
            finishLocationAttemptWithoutFix()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = ScooterLocationPolicy.bestCandidate(in: locations) else { return }

        if bestLocationCandidate.map({ location.horizontalAccuracy < $0.horizontalAccuracy }) ?? true {
            bestLocationCandidate = location
        }

        guard location.horizontalAccuracy <= ScooterLocationPolicy.preferredAccuracy else { return }
        acceptLocation(location)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        guard isTrackingHeading else { return }
        guard abs(newHeading.timestamp.timeIntervalSinceNow) <= 10 else {
            userHeading = nil
            return
        }
        userHeading = ScooterUserHeading(
            trueHeading: newHeading.trueHeading,
            magneticHeading: newHeading.magneticHeading,
            accuracy: newHeading.headingAccuracy
        )
    }

    func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
        false
    }

    private func acceptLocation(_ location: CLLocation) {
        locationTimeoutTask?.cancel()
        locationTimeoutTask = nil
        bestLocationCandidate = nil

        let nextLocation = GeoPoint(location.coordinate)
        let hadLocation = userLocation != nil
        if !hadLocation { ScooterAnalytics.shared.track("location_result", result: "success") }
        locationAccuracy = location.horizontalAccuracy
        userLocation = nextLocation
        isLocating = false
        locationProblem = nil
        if !hasLocatedOnce {
            hasLocatedOnce = true
            defaults.set(true, forKey: Self.hasLocatedOnceKey)
        }

        // A place chosen while the fix was on its way is the later wish, however
        // late the fix is: the map stays there and the place stays the origin.
        let keepsMap = keepsMapOnFirstFix || placeChoices != placeChoicesAtLocate
        keepsMapOnFirstFix = false
        if !hadLocation, keepsMap {
            // Also when a card asked: the walking time appears and the map stays put.
            distanceOrigin = nextLocation
        } else if !hadLocation {
            requestUserFocus(at: nextLocation)
            distanceOrigin = nextLocation

            let focusedRegion = MKCoordinateRegion(
                center: nextLocation.coordinate,
                latitudinalMeters: Self.userFocusMeters,
                longitudinalMeters: Self.userFocusMeters
            )
            let focusedViewport = GeoBounds(region: focusedRegion)
            viewport = focusedViewport
            viewportZoom = Self.userFocusZoom
            fetchIfNeeded(for: focusedViewport, zoom: viewportZoom)
        } else if Self.distance(from: distanceOrigin, to: nextLocation) >= max(75, location.horizontalAccuracy) {
            distanceOrigin = nextLocation
        }
    }

    private func requestUserFocus(at point: GeoPoint) {
        focusToken += 1
        focusRequest = MapFocusRequest(
            point: point,
            token: focusToken,
            latitudinalMeters: Self.userFocusMeters,
            longitudinalMeters: Self.userFocusMeters
        )
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let code = (error as? CLError)?.code
        if code == .denied {
            switch manager.authorizationStatus {
            case .denied:
                locationProblem = .denied
            case .restricted:
                locationProblem = .restricted
            default:
                break
            }
        }
        // Core Location keeps trying after "location unknown"; the timeout decides.
        if code == .locationUnknown, locationTimeoutTask != nil { return }
        isLocating = false
        finishLocationAttemptWithoutFix()
    }

    private func beginLocationTimeout() {
        locationTimeoutTask?.cancel()
        let timeout = locationTimeout
        locationTimeoutTask = Task { [weak self] in
            do {
                try await Task.sleep(for: timeout)
            } catch {
                return
            }

            guard let self else { return }
            if let bestLocationCandidate {
                acceptLocation(bestLocationCandidate)
            } else {
                isLocating = false
                finishLocationAttemptWithoutFix()
            }
        }
    }

    private func finishLocationAttemptWithoutFix() {
        // Allowed, and still no position in time.
        if locationProblem == nil, userLocation == nil, isLocationAuthorized {
            locationProblem = .notFound
        }
        ScooterAnalytics.shared.track("location_result", result: locationProblem == .denied ? "denied" : "unavailable")
        keepsMapOnFirstFix = false
        if var walk, walk.phase == .locating {
            walk.phase = .failed(.noLocation)
            self.walk = walk
            announceWalk(ScooterWalkNote.noLocation.text)
        }
        locationTimeoutTask?.cancel()
        locationTimeoutTask = nil
        bestLocationCandidate = nil
        fetchIfNeeded(for: viewport)
    }

    private func persistRidePasses() {
        let storedPasses = Dictionary(
            uniqueKeysWithValues: ridePasses.map { provider, pass in
                (provider.rawValue, pass)
            }
        )
        guard let encodedPasses = try? JSONEncoder().encode(storedPasses) else { return }
        defaults.set(encodedPasses, forKey: Self.ridePassesKey)
    }

    private static func loadRidePasses(
        from defaults: UserDefaults
    ) -> [ScooterProvider: ProviderRidePass] {
        guard let encodedPasses = defaults.data(forKey: ridePassesKey),
              let storedPasses = try? JSONDecoder().decode(
                  [String: ProviderRidePass].self,
                  from: encodedPasses
              ) else { return [:] }

        return Dictionary(
            uniqueKeysWithValues: storedPasses.compactMap { providerID, pass in
                ScooterProvider(rawValue: providerID).map { ($0, pass) }
            }
        )
    }

    private static func distance(from start: GeoPoint, to end: GeoPoint) -> CLLocationDistance {
        CLLocation(latitude: start.latitude, longitude: start.longitude)
            .distance(from: CLLocation(latitude: end.latitude, longitude: end.longitude))
    }
}

// MARK: - Walking route

extension ScooterMapModel {
    /// Core Location reports a move of this many metres. While the rider
    /// walks a route, of a few metres: the trail behind them goes as they walk.
    private static let distanceFilter: CLLocationDistance = 20
    private static let walkingDistanceFilter: CLLocationDistance = 5

    /// What the Directions button of the card of this scooter or bay is.
    func directionsControl(for target: ScooterWalkTarget) -> ScooterDirectionsControl {
        guard let walk, walk.target.isSame(as: target) else { return .directions }
        return walk.control
    }

    /// The line the card of this scooter or bay shows about its walk, if any.
    func walkNote(for target: ScooterWalkTarget) -> ScooterWalkNote? {
        guard let walk, walk.target.isSame(as: target) else { return nil }
        return walk.note
    }

    /// The route the map draws, while there is one.
    var walkTrail: WalkTrail? { walk?.trail }

    /// A walk is under way: the scooter or the bay stays selected and on the
    /// map wherever the map goes, and a tap on the empty map keeps its card open.
    var isWalking: Bool { walk?.isUnderway == true }

    /// What is left to walk along the route on the map.
    var walkRemainingMetres: CLLocationDistance? { walk?.remainingDistance }

    /// Directions on a card: the way on foot from the searched place, or from
    /// the rider, to the scooter or the bay, drawn on the map. A rider not yet
    /// located is located first, and the map stays where it is meanwhile.
    func showWalkingRoute(to target: ScooterWalkTarget) {
        ScooterAnalytics.shared.track("directions_open", provider: target.provider, target: target.analyticsTarget)
        cancelRouteRequest()
        guard let origin = activeOrigin else {
            walk = ScooterWalk(target: target, phase: .locating)
            announceWalk(String(localized: "Finding the way…"))
            // A location already on its way is waited for.
            if !isLocating { locateForWalkingTime() }
            return
        }
        startWalk(to: target, from: origin, asked: true)
    }

    /// Hide route: the trail fades and the card offers Directions again.
    func hideWalkingRoute() {
        endWalk()
    }

    /// Open in Maps, once no route was found: Apple Maps takes over, as
    /// Directions did before the route was drawn in the app.
    func openWalkInMaps(to target: ScooterWalkTarget) {
        ScooterAnalytics.shared.track("directions_open", provider: target.provider, target: target.analyticsTarget)
        openInMaps(target)
    }

    /// `asked` when the rider is waiting for this route: a tap on Directions,
    /// and the location it waited for. Only that route is reported, and only
    /// a walk too long for that opens Apple Maps.
    private func startWalk(to target: ScooterWalkTarget, from origin: NearbyOrigin, asked: Bool) {
        cancelRouteRequest()
        let start = Self.walkOrigin(of: origin)
        guard WalkRoute.isWalk(from: origin.point, to: target.point) else {
            walk = nil
            if asked {
                trackRouteResult("too_far", for: target)
                openInMaps(target)
            }
            return
        }
        if start == .rider, WalkRoute.hasArrived(origin.point, at: target.point) {
            // Already there: nothing to find.
            walk = ScooterWalk(target: target, phase: .arrived, origin: .rider)
            reportArrival(at: target)
            return
        }
        walk = ScooterWalk(target: target, phase: .finding, origin: start)
        announceWalk(String(localized: "Finding the way…"))
        requestRoute(from: origin.point, reveals: true, reports: asked)
    }

    /// Asks MapKit for the way. A route that `reveals` is fitted on the map
    /// and draws itself; a route found again on the way only takes the old
    /// one's place, which stays on the map meanwhile.
    private func requestRoute(from origin: GeoPoint, reveals: Bool, reports: Bool) {
        guard var walk else { return }
        cancelRouteRequest()
        routeRequests += 1
        let request = routeRequests
        let target = walk.target
        walk.lastRequestAt = clock()
        self.walk = walk
        routeTask = Task { [weak self, directions = self.directions] in
            let path = try? await directions.walkingPath(from: origin, to: target.point)
            // A request that was replaced or cancelled answers nothing.
            guard let self, !Task.isCancelled, request == routeRequests else { return }
            routeTask = nil
            routeFound(path, from: origin, to: target, reveals: reveals, reports: reports)
        }
    }

    private func routeFound(
        _ path: [GeoPoint]?,
        from origin: GeoPoint,
        to target: ScooterWalkTarget,
        reveals: Bool,
        reports: Bool
    ) {
        guard var walk, walk.phase == .finding || walk.phase == .shown else { return }
        guard let path, !path.isEmpty else {
            // A route asked for again on the way keeps the one on the map.
            guard walk.phase == .finding else { return }
            walk.phase = .failed(.noRoute)
            walk.route = nil
            self.walk = walk
            if reports { trackRouteResult("error", for: walk.target) }
            announceWalk(ScooterWalkNote.noRoute.text)
            return
        }
        let route = WalkRoute(origin: origin, path: path, target: target.point)
        routeRevisions += 1
        walk.route = route
        walk.routeRevision = routeRevisions
        walk.reveals = reveals
        walk.progress = 0
        walk.phase = .shown
        self.walk = walk
        if reports { trackRouteResult("success", for: walk.target) }
        if reveals {
            announceWalk(String(
                format: String(localized: "Route shown: ≈%1$lld min walk · %2$@"),
                Int64(ScooterMapLook.walkingMinutes(metres: route.length)),
                Scooter.formattedLength(meters: route.length)
            ))
        }
        // The rider may have walked on while the way was found.
        if walk.origin == .rider, let userLocation { riderMoved(to: userLocation) }
    }

    /// The searched place or the rider changed. A walk waiting for a location
    /// begins; a walk under way follows the rider, or begins again from
    /// another place; a walk that ended goes once its origin is another.
    private func walkOriginDidChange() {
        guard let walk else { return }
        let origin = activeOrigin
        switch walk.phase {
        case .locating:
            guard let origin else { return }
            startWalk(to: walk.target, from: origin, asked: true)
        case .finding, .shown:
            guard let origin else { return endWalk() }
            if Self.walkOrigin(of: origin) != walk.origin {
                // Fitted and drawn again, from where the walk now starts.
                startWalk(to: walk.target, from: origin, asked: false)
            } else if walk.origin == .rider {
                riderMoved(to: origin.point)
            }
        case .failed, .arrived:
            if origin.map(Self.walkOrigin(of:)) != walk.origin { self.walk = nil }
        case .gone:
            break
        }
    }

    /// The rider walked on. The route behind them goes; a rider who left the
    /// route, or whose scooter moved away from its end, gets a new one, at
    /// most every fifteen seconds. The camera never follows.
    private func riderMoved(to point: GeoPoint) {
        guard var walk, walk.origin == .rider, walk.isUnderway else { return }
        if WalkRoute.hasArrived(point, at: walk.target.point) { return arrive() }
        guard walk.phase == .shown, let route = walk.route,
              let position = route.position(of: point, after: walk.progress) else { return }
        if WalkRoute.isOffRoute(position.offset, accuracy: locationAccuracy) {
            rerouteIfAllowed(from: point)
            return
        }
        if position.along != walk.progress {
            walk.progress = position.along
            self.walk = walk
        }
        if walkTargetLeftRoute { rerouteIfAllowed(from: point) }
    }

    /// The scooter is further from the end of the route than a scooter
    /// standing where it stood.
    private var walkTargetLeftRoute: Bool {
        guard let walk, let end = walk.route?.end else { return false }
        return end.distance(to: walk.target.point) > WalkRoute.targetMoveDistance
    }

    private func rerouteIfAllowed(from point: GeoPoint) {
        guard var walk, walk.phase == .shown, walk.origin == .rider, routeTask == nil,
              walk.reroutes < WalkRoute.maximumReroutes else { return }
        if let last = walk.lastRequestAt, clock().timeIntervalSince(last) < WalkRoute.rerouteInterval { return }
        walk.reroutes += 1
        self.walk = walk
        requestRoute(from: point, reveals: false, reports: false)
    }

    /// The rider is at the scooter or the bay: the trail fades and the card
    /// says so.
    private func arrive() {
        cancelRouteRequest()
        guard var walk else { return }
        walk.phase = .arrived
        walk.route = nil
        self.walk = walk
        reportArrival(at: walk.target)
    }

    private func reportArrival(at target: ScooterWalkTarget) {
        ScooterAnalytics.shared.track("route_arrived", provider: target.provider, target: target.analyticsTarget)
        announceWalk(ScooterWalkNote.arrived.text)
    }

    /// Fresh data about the scooter walked to. It may have moved, and the
    /// route then follows it; or data that would list it no longer does,
    /// which mostly means someone took it. Scooters get new ids now and then,
    /// so one of the same provider standing where it stood is that scooter.
    private func followWalkTarget(in meta: ScooterResponseMetadata?, loadedFor bounds: GeoBounds) {
        guard var walk, walk.holdsCard, case let .scooter(scooter) = walk.target else { return }
        if let fresh = vehiclesByID[scooter.id] {
            guard walk.phase != .gone else {
                // Back on the map: its card is a scooter's card again.
                self.walk = nil
                return
            }
            guard fresh != scooter else { return }
            walk.target = .scooter(fresh)
            self.walk = walk
            if walkTargetLeftRoute, walk.origin == .rider, let userLocation { rerouteIfAllowed(from: userLocation) }
            return
        }
        let point = GeoPoint(scooter.coordinate)
        guard walk.isUnderway, Self.listsEveryScooter(of: scooter.provider, at: point, in: meta, loadedFor: bounds) else {
            return
        }
        let successor = vehicles
            .filter { $0.provider == scooter.provider }
            .map { (scooter: $0, metres: $0.distance(from: point)) }
            .filter { $0.metres <= WalkRoute.rebindDistance }
            .min { $0.metres < $1.metres }?
            .scooter
        if let successor {
            walk.target = .scooter(successor)
            self.walk = walk
            selectedScooterID = successor.id
            if walkTargetLeftRoute, walk.origin == .rider, let userLocation { rerouteIfAllowed(from: userLocation) }
            return
        }
        cancelRouteRequest()
        walk.phase = .gone
        walk.route = nil
        self.walk = walk
        announceWalk(ScooterWalkNote.gone.text)
    }

    /// Whether data would list the scooter if it were still there: single
    /// scooters, not cut short, loaded around it, with every feed of its
    /// provider in. A failed feed nobody can name might be its provider's.
    private static func listsEveryScooter(
        of provider: String,
        at point: GeoPoint,
        in meta: ScooterResponseMetadata?,
        loadedFor bounds: GeoBounds
    ) -> Bool {
        guard bounds.contains(point) else { return false }
        guard let meta else { return true }
        guard meta.mode != "clusters", !meta.overview, !meta.truncated else { return false }
        return meta.failedSources.allSatisfy { source in
            guard let failed = ScooterProviderHealth.provider(forSource: source) else { return false }
            return failed.rawValue != provider
        }
    }

    /// Closing the card or choosing another scooter or bay ends the walk.
    private func endWalkIfTargetLeftSelection() {
        guard let walk else { return }
        let isSelected = switch walk.target {
        case let .scooter(scooter): selectedScooterID == scooter.id
        case let .parking(parking): selectedParkingID == parking.id
        }
        if !isSelected { endWalk() }
    }

    private func endWalk() {
        cancelRouteRequest()
        walk = nil
    }

    private func cancelRouteRequest() {
        routeTask?.cancel()
        routeTask = nil
    }

    private func walkDidChange(from old: ScooterWalk?) {
        if old?.heldScooter != walk?.heldScooter { rebuildMapScooters() }
        let filter = walk?.isUnderway == true && walk?.origin == .rider
            ? Self.walkingDistanceFilter
            : Self.distanceFilter
        if locationManager.distanceFilter != filter { locationManager.distanceFilter = filter }
    }

    /// What is left of the route on the map to this scooter or bay.
    private func routeDistance(to target: ScooterWalkTarget) -> CLLocationDistance? {
        guard let walk, walk.target.isSame(as: target) else { return nil }
        return walk.remainingDistance
    }

    private func announceWalk(_ text: String) {
        walkAnnouncements += 1
        walkAnnouncement = ScooterWalkAnnouncement(text: text, serial: walkAnnouncements)
    }

    private func trackRouteResult(_ result: String, for target: ScooterWalkTarget) {
        ScooterAnalytics.shared.track(
            "route_result",
            provider: target.provider,
            result: result,
            target: target.analyticsTarget
        )
    }

    private static func walkOrigin(of origin: NearbyOrigin) -> ScooterWalkOrigin {
        switch origin {
        case let .searchedDestination(place): .place(place)
        case .userLocation: .rider
        }
    }
}
