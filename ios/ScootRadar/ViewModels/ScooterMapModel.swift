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
    /// While the server collects an app's map again, where the scooters and
    /// groups its sweep has not reached yet were last seen: drawn faded and
    /// counted nowhere.
    private(set) var lastSeenVehicles: [Scooter] = [] {
        didSet {
            guard !isApplyingResponse else { return }
            rebuildMapLastSeen()
            rebuildVisibleCounts()
        }
    }
    private(set) var lastSeenClusters: [ScooterCluster] = [] {
        didSet {
            guard !isApplyingResponse else { return }
            rebuildMapLastSeen()
            rebuildVisibleCounts()
        }
    }
    /// Of each app among them, from the last answer: when its were seen, on this device's clock, and
    /// whether new positions of its are on their way (ScooterResponse.lastSeenStatuses).
    private var lastSeenReports: [ScooterProvider: ScooterLastSeenStatus] = [:]
    /// The same, none on its way while the map is paused: a paused map asks for nothing.
    var lastSeenStatuses: [ScooterProvider: ScooterLastSeenStatus] {
        isPausedForIdle ? lastSeenReports.mapValues(\.idle) : lastSeenReports
    }
    /// Of the last answer, while stale: each app whose positions shown are being collected again or could
    /// not be renewed, with when the oldest of them were seen, on this device's clock
    /// (ScooterResponse.staleProviderTimes). Nil when the answer does not name them.
    private var staleReports: [ScooterProvider: Date]?
    /// The same, of the apps switched on: an app filtered out delays nothing shown.
    private var staleApps: [ScooterProvider: Date]? {
        staleReports?.filter { enabledProviders.contains($0.key) }
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
            // The providers turned off, as Android keeps them: one the catalog adds later is on until turned off.
            defaults.set(
                ScooterProvider.allCases.filter { !enabledProviders.contains($0) }.map(\.rawValue).sorted(),
                forKey: Self.disabledProvidersKey
            )
            defaults.removeObject(forKey: Self.legacyEnabledProvidersKey)
            rebuildMapScooters()
            rebuildMapClusters()
            rebuildMapLastSeen()
            rebuildMapZones()
            rebuildVisibleCounts()
            clearSelectionIfHidden()
        }
    }
    var selectedScooterID: String? {
        didSet {
            if selectedScooterID != nil { selectedParkingID = nil }
            guard selectedScooterID != oldValue else { return }
            if isFollowingScooter, let selectedScooterID {
                neighbours?.follow(to: selectedScooterID)
            } else {
                scooterChoices += 1
                // Another choice: the scooters seen beside the one before are nothing to this one.
                neighbours = selectedScooterID.map(ScooterNeighbours.init(following:))
                noteNeighbours()
            }
            endWalkIfTargetLeftSelection()
        }
    }
    /// Counts each scooter chosen and each card closed, but not a card that follows its scooter to a new id, which is
    /// the same choice: the dock animates, VoiceOver reads the card and the phone ticks on it, not on the id.
    private(set) var scooterChoices = 0
    @ObservationIgnored private var isFollowingScooter = false
    /// The scooters of its app seen near the selected scooter since it was chosen, which a scooter under a new id
    /// must stand further from to be it (ScooterNeighbours).
    @ObservationIgnored private var neighbours: ScooterNeighbours?
    /// Selecting a bay clears the selected scooter, and the other way round.
    private(set) var selectedParkingID: String? {
        didSet {
            if selectedParkingID != oldValue { endWalkIfTargetLeftSelection() }
        }
    }
    /// The panel of a large window folded down to its search bar and one line
    /// under it, as the card of Maps folds. Choosing a scooter or a bay opens
    /// it again, since their cards are in it. A phone's dock never folds.
    var isPanelCollapsed = false
    var searchedDestination: MapDestination? {
        didSet {
            if searchedDestination != oldValue { walkOriginDidChange() }
        }
    }
    /// The last place chosen in the search, which the search offers again while nothing is typed. It is
    /// the one precise origin the app keeps, in its own file outside backups (RecentPlaceStore), as the
    /// privacy notice says, until another place is chosen or the rider forgets it.
    private(set) var recentPlace: MapDestination? {
        didSet {
            if recentPlace != oldValue { recentPlaceStore?.save(recentPlace) }
        }
    }
    var focusRequest: MapFocusRequest?
    /// A step in or out asked from the keyboard, ⌘+ and ⌘−.
    private(set) var zoomRequest: MapZoomRequest?
    /// The walk to the selected scooter or bay, from a tap on Directions until
    /// the route is hidden, the card closes or the walk ends on its own. Nil
    /// while the card simply offers Directions.
    private(set) var walk: ScooterWalk? {
        didSet { walkDidChange(from: oldValue) }
    }
    /// What VoiceOver is told about the walk: that the way is being found,
    /// the route that was found, that none was, or that the rider is there.
    private(set) var walkAnnouncement: ScooterWalkAnnouncement?
    /// Goes up with each moment to ask for a rating: the screen asks once the map has rested.
    private(set) var reviewMoments = 0
    /// The moment to ask for a rating came, and the screen has not asked yet (`takeReviewMoment`).
    @ObservationIgnored private(set) var reviewDue = false

    /// The minimum range in metres as it was set, kept as it is; 0 for Any. It is read in whole steps of the
    /// unit shown (minimumRange), so that units chosen in Settings and chosen back give the same minimum.
    private(set) var chosenMinimumRange: Int {
        didSet {
            defaults.set(chosenMinimumRange, forKey: Self.minimumRangeKey)
            filtersDidChange()
        }
    }

    /// The minimum range in metres the map filters by and asks for: the one set, in the nearest whole
    /// step of the slider's unit, no further than its last; 0 for Any.
    var minimumRange: Int {
        ScooterRangeFilter.snapped(chosenMinimumRange, unit: rangeUnit)
    }

    /// The range slider's unit: kilometres, or miles where lengths are written in miles.
    var rangeUnit: ScooterRangeFilter.Unit {
        ScooterRangeFilter.Unit(locale: writing.locale)
    }

    /// How far a full battery takes each app's scooters at the least, in metres, from the latest answer
    /// (batteryRanges), at every zoom: the range filter judges by it the scooters that report a battery and no
    /// range, and the paragraph under the slider names their apps. Empty where it did not say.
    private(set) var batteryRanges: [String: Int] = [:] {
        didSet {
            guard !isApplyingResponse, batteryRanges != oldValue else { return }
            filtersDidChange()
        }
    }

    /// Under the range slider while a minimum is set, and read by VoiceOver after it: the battery the scooters
    /// of each app switched on that report only their battery need, "Scooters that only report a battery need
    /// at least 9% (Voi), 21% (Bolt) and 53% (Lime).", the apps whose such scooters are all hidden, and that
    /// scooters with neither are hidden. Nil for Any.
    var rangeHelp: String? {
        ScooterRangeFilter.help(
            metres: minimumRange,
            batteryRanges: batteryRanges,
            enabledProviders: enabledProviders,
            locale: writing.locale
        )
    }

    /// The units lengths and speeds are written in: the iPhone's on Automatic, or those chosen in Settings,
    /// which change them at once, the range filter's steps with them.
    var units: ScooterUnits {
        didSet {
            guard oldValue != units else { return }
            ScooterUnits.current = units
            defaults.set(units.rawValue, forKey: Self.unitsKey)
            // A minimum range is read in whole steps of the new unit: 5 km becomes 3 mi. Units that keep
            // the slider's unit (km in Switzerland, mi in Britain) leave the map as it is.
            let before = ScooterRangeFilter.snapped(
                chosenMinimumRange,
                unit: ScooterRangeFilter.Unit(locale: ScooterWriting(language: language, units: oldValue).locale)
            )
            guard minimumRange != before else { return }
            filtersDidChange()
            refetchFilteredClusters()
        }
    }

    /// The language and the units the text over the map is written in.
    var writing: ScooterWriting {
        ScooterWriting(language: language, units: units)
    }

    var mapStyle: AppleMapStyle {
        didSet {
            if oldValue != mapStyle { ScooterAnalytics.shared.track("map_style", result: mapStyle.rawValue) }
            defaults.set(mapStyle.rawValue, forKey: Self.mapStyleKey)
        }
    }

    /// The operators' zones over the map, on unless turned off in Settings.
    var showsZones: Bool {
        didSet {
            guard oldValue != showsZones else { return }
            ScooterAnalytics.shared.track("zones_toggle", result: showsZones ? "enabled" : "disabled")
            defaults.set(showsZones, forKey: Self.showsZonesKey)
            updateZones()
        }
    }
    /// What the zones' legend says.
    private(set) var zoneState = ScooterZoneState.off
    /// The zones drawn on the map: those of the providers shown, from zoom 14,
    /// and the cities' rules and zones, which show whether or not the zones
    /// are on.
    private(set) var mapZones: [ScooterZone] = []
    private(set) var mapZonesRevision = 0
    /// The cities' rules and zones over the map, for the legend; each is one of mapZones,
    /// which may draw more of them, just off the map.
    private(set) var mapRuleZones: [CityRuleZone.Shown] = []
    /// The cities over the map whose zones the app downloads and has not drawn: on their way, or unavailable,
    /// which the legend says rather than draw none (docs/city-zone-downloads.md).
    private(set) var mapZoneNotices: [CityZoneDownloads.Notice] = []
    /// How many of mapZones are the operators'.
    private(set) var mapOperatorZoneCount = 0
    /// The limits of the operators' slow zones among mapZones, which the legend's "Slow" says: "Slow: 6 km/h".
    private(set) var mapOperatorSlowSpeeds = ScooterZoneSpeeds()

    var appearance: ScooterAppearance {
        didSet {
            if oldValue != appearance {
                // Under the name and with the values the web sends.
                ScooterAnalytics.shared.track("map_style", result: appearance == .system ? "auto" : appearance.rawValue)
            }
            defaults.set(appearance.rawValue, forKey: Self.appearanceKey)
        }
    }

    /// Light or dark now. Automatic goes by the sun where the rider is, or
    /// where the map opened until they are located.
    var interfaceStyle: UIUserInterfaceStyle {
        appearance.interfaceStyle(at: clock(), in: userLocation ?? startCenter)
    }

    /// What the app's language follows: the iPhone's languages, or one chosen
    /// in Settings. A choice changes the app's own text at once. A language
    /// is kept where iOS reads the app's language at launch, which is where
    /// the Settings of the iPhone keep the one chosen there; Automatic takes
    /// it away, so that iOS follows the iPhone's languages again.
    var languageChoice = ScooterLanguageChoice.atLaunch {
        didSet {
            guard oldValue != languageChoice else { return }
            switch languageChoice {
            case .automatic:
                ScooterAnalytics.shared.track("language_change", result: "auto")
                defaults.removeObject(forKey: ScooterLanguageChoice.key)
                language = iPhoneLanguage
            case let .language(chosen):
                ScooterAnalytics.shared.track("language_change", result: chosen.rawValue)
                defaults.set([chosen.rawValue], forKey: ScooterLanguageChoice.key)
                language = chosen
            }
        }
    }

    /// The language the app is shown in.
    private(set) var language = ScooterLanguage.current {
        didSet {
            guard oldValue != language else { return }
            ScooterLanguage.current = language
            // Countries are named in it.
            rebuildMapClusters()
        }
    }

    /// The language the app follows on Automatic: the first of the iPhone's
    /// languages it is translated into, or else English.
    var iPhoneLanguage: ScooterLanguage {
        ScooterLanguage(preferences: iPhoneLanguages())
    }

    private(set) var rideEstimateMinutes: Int
    private(set) var ridePasses: [ScooterProvider: ProviderRidePass]

    @ObservationIgnored private let api: any ScooterAPIClient
    @ObservationIgnored private let cityZoneDownloads: CityZoneDownloads
    /// The streets and the cities' zones built in (CityRuleZone.onMap), first read when drawn, from zoom
    /// 14: the cities' come from a file in the app (CityZoneFile.builtIn), which a launch needn't wait on.
    @ObservationIgnored private let builtInZones: () -> [CityRuleZone]
    @ObservationIgnored private let locationManager: CLLocationManager
    @ObservationIgnored private var isTrackingHeading = false
    @ObservationIgnored private var isSceneActive = true
    /// When the map was last touched, a key pressed or the app brought back to the front.
    @ObservationIgnored private var lastInteractionAt: Date
    /// Automatic refreshes stopped, `refreshPolicy.idlePause` after the last touch, until the next
    /// one: said under the search bar.
    private(set) var isPausedForIdle = false
    @ObservationIgnored private let defaults: UserDefaults
    /// Where the recent place is kept; without one, as in tests and previews, it lasts as long as the model.
    @ObservationIgnored private let recentPlaceStore: RecentPlaceStore?
    @ObservationIgnored private let locationTimeout: Duration
    /// How long before an area whose zones are still on their way is asked for again (zonePendingRetry).
    @ObservationIgnored private let zonePendingRetry: Duration
    @ObservationIgnored private let refreshPolicy: ScooterRefreshPolicy
    @ObservationIgnored private let clock: () -> Date
    @ObservationIgnored private let directions: any WalkingDirectionsClient
    @ObservationIgnored private let openInMaps: @MainActor (ScooterWalkTarget) -> Void
    @ObservationIgnored private let iPhoneLanguages: () -> [String]
    /// The route being found, and the number of the latest request: an
    /// answer to an earlier one is not wanted any more.
    @ObservationIgnored private var routeTask: Task<Void, Never>?
    @ObservationIgnored private var routeRequests = 0
    @ObservationIgnored private var routeRevisions = 0
    @ObservationIgnored private var walkAnnouncements = 0
    /// How precise the last location was: a location this vague may lie that
    /// far from the path without the rider having left it.
    @ObservationIgnored private var locationAccuracy: CLLocationAccuracy = 0
    /// Says when to ask for a rating (ScooterReviewPrompt).
    @ObservationIgnored private var reviewPrompt: ScooterReviewPrompt
    // What the data on the map was requested for. Observed, because the dock
    // only reports an area as empty once the data covers it.
    private var queryBounds: GeoBounds?
    private var queryZoom: Int?
    private var queryMinimumRange: Int?
    @ObservationIgnored private var pendingQueryBounds: GeoBounds?
    @ObservationIgnored private var pendingQueryZoom: Int?
    @ObservationIgnored private var pendingQueryMinimumRange: Int?
    /// Counts the minimum range once the slider rests (setMinimumRange).
    @ObservationIgnored private var rangeTracking: Task<Void, Never>?
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
    @ObservationIgnored private var zoomToken = 0
    @ObservationIgnored private var hasStarted = false
    @ObservationIgnored private var isApplyingResponse = false
    /// Scooters are asked for, and walks measured, from here until the iPhone's location is known.
    @ObservationIgnored private let startCenter: GeoPoint
    @ObservationIgnored private var distanceOrigin: GeoPoint
    @ObservationIgnored private var vehiclesByID: [String: Scooter] = [:]
    /// The zones of the area last answered for, with whether asking failed;
    /// they stay drawn while a new area's are on their way.
    @ObservationIgnored private var zoneAnswer: ScooterZoneAnswer?
    /// Complete answers of the last few minutes, newest first, which serve
    /// views within their area as the browser's copy does on the web.
    @ObservationIgnored private var recentZoneAnswers: [ScooterZoneAnswer] = []
    @ObservationIgnored private var zoneTask: Task<Void, Never>?
    @ObservationIgnored private var zoneTaskArea: ScooterZoneArea?
    /// Where the cities' zones drawn were picked, the map and half of it again on
    /// each side: where hundreds are near, as in Bergen, nearly any pan brings one
    /// in or takes one out, and the overlay, the operators' zones with them, would
    /// be merged again each time. Within it, the same are drawn.
    @ObservationIgnored private var ruleZoneArea: GeoBounds?
    private(set) var mapScooters: [Scooter] = []
    private(set) var mapScootersRevision = 0
    private(set) var mapClusters: [ScooterCluster] = []
    private(set) var mapClustersRevision = 0
    /// The last-seen scooters and groups drawn faded, filtered as those above.
    private(set) var mapLastSeenScooters: [Scooter] = []
    private(set) var mapLastSeenClusters: [ScooterCluster] = []
    private(set) var mapLastSeenRevision = 0
    private(set) var visibleScooterCount = 0
    /// The faded scooters in view that pass the filters, counted apart from the others.
    private(set) var visibleLastSeenCount = 0
    /// The faded scooters in view of each provider, before the provider filter and after the range's,
    /// groups included, as the chips count the others.
    private(set) var visibleLastSeenProviderCounts: [ScooterProvider: Int] = [:]
    private(set) var visibleProviderCounts: [ScooterProvider: Int] = [:]
    private var unfilteredVisibleCount = 0
    private var unfilteredVisibleProviders = Set<ScooterProvider>()

    /// The battery minimum the filters had until the range became their only minimum (issue #12): no longer read,
    /// and taken away at launch.
    private static let legacyMinimumBatteryKey = "minimum-battery"
    private static let minimumRangeKey = "minimum-range"
    private static let unitsKey = "units"
    private static let mapStyleKey = "apple-map-style"
    private static let showsZonesKey = "map-zones"
    private static let appearanceKey = "appearance"
    private static let disabledProvidersKey = "disabled-providers"
    /// Until 4 November 2026 the app kept the providers that were on, so those the catalog added after a rider's
    /// last change of the filters stayed off: RideMovi, new in 1.3.0, for everyone who had changed them in 1.2.0.
    private static let legacyEnabledProvidersKey = "enabled-providers"
    /// The catalog's providers until 11 October 2026, the only ones a rider could have turned off in every version.
    private static let providersBefore11October2026: Set<ScooterProvider> = [.bird, .bolt, .dott, .hopp, .lime, .pony, .publibike, .voi]
    private static let rideEstimateMinutesKey = "ride-estimate-minutes-v1"
    private static let ridePassesKey = "provider-ride-passes-v1"
    private static let hasLocatedOnceKey = "has-located-once"
    /// Locating shows about 350 m across, like zoom 17 on the web.
    static let userFocusMeters: CLLocationDistance = 350
    private static let userFocusZoom = 17

    override convenience init() {
        self.init(
            api: ScooterAPI(), locationManager: CLLocationManager(), defaults: .standard, start: Self.start,
            cityZoneCache: CityZoneCache.standard, recentPlaceStore: RecentPlaceStore.standard
        )
    }

    init(
        api: any ScooterAPIClient,
        locationManager: CLLocationManager,
        defaults: UserDefaults,
        locationTimeout: Duration = .seconds(5),
        zonePendingRetry: Duration = ScooterMapModel.zonePendingRetry,
        refreshPolicy: ScooterRefreshPolicy = .standard,
        now: @escaping () -> Date = Date.init,
        directions: any WalkingDirectionsClient = MapKitWalkingDirections(),
        openInMaps: @escaping @MainActor (ScooterWalkTarget) -> Void = { $0.openInMaps() },
        iPhoneLanguages: @escaping () -> [String] = { ScooterLanguage.iPhoneLanguages },
        start: ScooterMapStart = .switzerland,
        cityZoneCache: CityZoneCache? = nil,
        recentPlaceStore: RecentPlaceStore? = nil,
        builtInZones: @autoclosure @escaping () -> [CityRuleZone] = CityRuleZone.onMap
    ) {
        startCenter = start.center
        distanceOrigin = start.center
        viewport = GeoBounds(region: start.region)
        viewportZoom = start.zoom
        viewportZoomLevel = Double(start.zoom)
        self.api = api
        cityZoneDownloads = CityZoneDownloads(api: api, cache: cityZoneCache, now: now)
        self.builtInZones = builtInZones
        self.directions = directions
        self.openInMaps = openInMaps
        self.iPhoneLanguages = iPhoneLanguages
        self.locationManager = locationManager
        self.defaults = defaults
        self.recentPlaceStore = recentPlaceStore
        recentPlace = recentPlaceStore?.load()
        self.locationTimeout = locationTimeout
        self.zonePendingRetry = zonePendingRetry
        self.refreshPolicy = refreshPolicy
        clock = now
        lastInteractionAt = now()
        knownAuthorizationStatus = locationManager.authorizationStatus
        hasLocatedOnce = defaults.bool(forKey: Self.hasLocatedOnceKey)
        reviewPrompt = ScooterReviewPrompt(defaults: defaults, version: ScooterLinks.appVersion)
        reviewPrompt.forgetLastOpenIn()
        #if DEBUG
        // A screenshot's camera stays where it was set when the rider is located.
        keepsMapOnFirstFix = defaults.string(forKey: "ScreenshotCamera") != nil
        // Every calm map with a fresh feed is the moment to ask, the first one too.
        reviewPrompt.alwaysDue = defaults.bool(forKey: "ReviewPromptDue")
        #endif

        let savedUnits = ScooterUnits(rawValue: defaults.string(forKey: Self.unitsKey) ?? "") ?? .automatic
        units = savedUnits
        ScooterUnits.current = savedUnits
        // Read in whole steps of the unit shown. A battery minimum an earlier version kept goes, unread.
        chosenMinimumRange = max(0, defaults.object(forKey: Self.minimumRangeKey) as? Int ?? 0)
        defaults.removeObject(forKey: Self.legacyMinimumBatteryKey)

        let savedStyle = defaults.string(forKey: Self.mapStyleKey)
        // The quiet ground is what the dots are made for; a style chosen in
        // Settings is kept.
        mapStyle = AppleMapStyle(rawValue: savedStyle ?? "") ?? .quiet
        showsZones = defaults.object(forKey: Self.showsZonesKey) as? Bool ?? true
        // Day and night until one is chosen in Settings.
        appearance = ScooterAppearance(rawValue: defaults.string(forKey: Self.appearanceKey) ?? "") ?? .sun

        let savedEstimateMinutes = defaults.object(
            forKey: Self.rideEstimateMinutesKey
        ) as? Int ?? RideEstimateDuration.defaultMinutes
        rideEstimateMinutes = RideEstimateDuration.normalized(savedEstimateMinutes)
        ridePasses = Self.loadRidePasses(from: defaults)

        if let disabledIDs = defaults.array(forKey: Self.disabledProvidersKey) as? [String] {
            enabledProviders = Set(ScooterProvider.allCases).subtracting(disabledIDs.compactMap(ScooterProvider.init(rawValue:)))
        } else if let savedProviderIDs = defaults.array(forKey: Self.legacyEnabledProvidersKey) as? [String] {
            // A legacy list of those on turns off only the providers of before 11 October 2026 it lacks: it also lacks
            // those added after it was written, which the rider never saw.
            let savedProviders = Set(savedProviderIDs.compactMap(ScooterProvider.init(rawValue:)))
            if savedProviders.count == savedProviderIDs.count {
                enabledProviders = Set(ScooterProvider.allCases)
                    .subtracting(Self.providersBefore11October2026.subtracting(savedProviders))
            }
        }

        super.init()

        cityZoneDownloads.onChange = { [weak self] in self?.rebuildMapZones() }
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
        minimumRange > 0 || !allProvidersSelected
    }

    /// The providers that are not sharing data here: a feed of theirs failed, they
    /// operate in the viewport and the map holds none of their scooters in view,
    /// whatever the rider's filters hide. City totals name no one, and neither does
    /// data that cannot tell who has scooters here: loaded for another area, or
    /// already without the scooters under the range minimum, which the server
    /// leaves out of clusters.
    var providerHealth: ScooterProviderHealth {
        guard let responseMetadata, responseMetadata.overview != true, viewportIsLoaded,
              (queryMinimumRange ?? 0) == 0 else { return .healthy }
        return ScooterProviderHealth(
            failedSources: responseMetadata.failedSources,
            operating: ScooterProviderCoverage.providers(in: viewport),
            inView: unfilteredVisibleProviders
        )
    }

    /// The calm lines under the dock status: a night ban, the season, providers down, truncation, parking.
    var dockNotices: [ScooterDockNotice] {
        guard let responseMetadata else { return [] }
        return ScooterDockNotice.notices(
            curfew: RentalCurfew.active(at: viewport.center, on: clock()),
            season: ScooterSeasonalPause.active(at: viewport.center, on: clock(), seasonOver: responseMetadata.seasonOver),
            scootersInView: unfilteredVisibleCount > 0,
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
        let statuses = lastSeenStatuses
        return availableProviders.map { provider in
            let count = count(for: provider)
            let isDown = down.contains(provider)
            let isEnabled = enabledProviders.contains(provider)
            let fadedCount = visibleLastSeenProviderCounts[provider, default: 0]
            return ScooterProviderEntry(
                provider: provider,
                count: count,
                isEnabled: isEnabled,
                isSelected: isFilteringProviders && isEnabled && !isDown,
                isDown: isDown,
                faded: statuses[provider].flatMap { status in
                    fadedCount > 0
                        ? ScooterProviderEntry.Faded(count: fadedCount, seenAt: status.seenAt, updating: status.updating)
                        : nil
                }
            )
        }
    }

    /// The apps whose scooters are drawn faded in view now, in catalogue order: those shown by the
    /// provider filter, with what is known of theirs.
    var fadedApps: [ScooterFadedApp] {
        guard visibleLastSeenCount > 0 else { return [] }
        let statuses = lastSeenStatuses
        return ScooterProvider.allCases.compactMap { provider in
            guard let status = statuses[provider], visibleLastSeenProviderCounts[provider, default: 0] > 0,
                  enabledProviders.contains(provider) else { return nil }
            return ScooterFadedApp(provider: provider, status: status)
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
        // Faded scooters on screen: the map is not empty, and the status line says whose they are.
        let showsFaded = visibleLastSeenCount > 0
        let fadedApps = fadedApps
        if isEmpty {
            // No provider operates here, whatever the pending request answers.
            if availableProviders.isEmpty, !showsFaded { return .outsideCoverage(closestCities) }
            // The data on the map is for another area: no count to show yet.
            guard viewportIsLoaded else { return .finding(chips: dockChips) }
            if !showsFaded, let filterSummary = hiddenByFilters { return .filtersHideEverything(filterSummary) }
            // None counted yet, only faded ones: the server's sweep is finding them, which may take a minute
            // or two. The line under says whose and since when.
            if let status = ScooterDockStatus.updating(fadedApps) {
                return .finding(chips: dockChips, notices: dockNotices, status: status)
            }
        }

        let isOverview = responseMetadata?.overview == true
        let down = providerHealth.downProviders
        let everyProviderDown = !down.isEmpty && Set(availableProviders).isSubset(of: down)
        let hint: ScooterDockHint? = if isEmpty {
            everyProviderDown || showsFaded ? nil : .emptyArea
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
            lead: isOverview ? nil : dockLead,
            everyProviderDown: everyProviderDown,
            fadedApps: fadedApps,
            staleApps: staleApps
        ))
    }

    /// Scooters stand faded where they were last seen, and new positions of theirs are on their way.
    private var isFilling: Bool {
        loadIssue == nil && fadedApps.contains(where: \.status.updating)
    }

    private var refreshFailure: ScooterLoadFailure? {
        guard case let .refreshFailed(failure, _) = loadIssue else { return nil }
        return failure
    }

    /// The failed refresh or the delay to report at the top of a scooter or bay
    /// card, which hides the dock's own status line. Nil while the data is healthy,
    /// and while faded scooters stand where they were last seen, which the dock
    /// reports as an update rather than a delay.
    var cardStatus: ScooterDockStatus? {
        if case let .refreshFailed(failure, showing) = loadIssue {
            return failure == .offline ? .offline(showing: showing) : .refreshFailed(showing: showing)
        }
        guard let lastUpdated, !isFilling else { return nil }
        return ScooterDockStatus.delayed(
            isStale: responseMetadata?.stale == true, showing: lastUpdated, staleApps: staleApps, at: clock()
        )
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

    /// What the dock shows, in the one line a folded panel has under its
    /// search bar: the nearest scooter as "23 m · Bird · 1 min · Live", the
    /// count with the status where there is none, and the title of any other
    /// card. The map is beside it, so it says no more than a glance needs and
    /// fits the panel's width at the standard text size: "3'784 scooters",
    /// not "on this map". The status changes as the data ages, so ask again
    /// over time.
    func dockLine(at now: Date) -> ScooterDockLine {
        switch dock {
        case let .scooter(scooter):
            // The provider's name with its colour beside it says which card it is.
            let walk = approximateWalkingMinutes(to: scooter).map { walkPart(minutes: $0) }
            return ScooterDockLine(
                mark: .provider(scooter.providerInfo),
                title: scooter.providerInfo?.briefName ?? scooter.provider.capitalized,
                details: [walk, formattedDistance(for: scooter)].compactMap { $0 }
            )
        case let .parking(parking):
            let walk = approximateWalkingMinutes(to: parking).map { walkPart(minutes: $0) }
            return ScooterDockLine(
                mark: .provider(parking.providerInfo),
                title: parking.bayTitle,
                details: [parking.name.isEmpty ? nil : parking.name, walk].compactMap { $0 }
            )
        case .outOfDate:
            return ScooterDockLine(
                mark: .symbol("clock"),
                title: String(localized: "These positions are out of date"),
                isWarning: true
            )
        case let .finding(_, _, status):
            return ScooterDockLine(mark: .progress, title: String(localized: "Finding scooters…"), status: status)
        case .waiting:
            return ScooterDockLine(mark: .symbol("hourglass"), title: String(localized: "Waiting for scooter data"))
        case .outsideCoverage:
            return ScooterDockLine(mark: .symbol("map"), title: String(localized: "No scooter data here yet"))
        case let .filtersHideEverything(summary):
            return ScooterDockLine(
                mark: .symbol("line.3.horizontal.decrease"),
                title: summary.title,
                details: summary.body.isEmpty ? [] : [summary.body]
            )
        case let .summary(summary):
            // Beside the nearest scooter the dock leaves "Live" out; alone on
            // its line the status is the only one in view, so it is always said.
            let status = summary.status(at: now)
            if let lead = summary.lead {
                return ScooterDockLine(
                    mark: .provider(lead.scooter.providerInfo),
                    title: lead.distance,
                    details: [lead.briefProviderName, String(format: String(localized: "%lld min"), Int64(lead.minutes))],
                    status: status
                )
            }
            let count = summary.count.formatted(.number.locale(ScooterLanguage.current.locale))
            let noun = ScooterPlural.isSingular(summary.count)
                ? String(localized: "scooter")
                : String(localized: "scooters")
            return ScooterDockLine(mark: .symbol("scooter"), title: "\(count) \(noun)", status: status)
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
        // filtered clustered data by range or cut the list short.
        let isCountKnown = (queryMinimumRange ?? 0) == 0 && responseMetadata?.truncated != true
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
            minimumRange: minimumRange > 0 ? minimumRange : nil
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
                searchedDestination.title.isolated,
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
        let walk = walkPart(minutes: minutes)
        guard !parking.name.isEmpty else { return walk }
        return String(format: String(localized: "%1$@ · %2$@"), parking.name.isolated, walk)
    }

    /// "≈3 min walk", or "≈3 min walk from Zürich HB" when the origin is a
    /// searched place.
    private func walkPart(minutes: Int) -> String {
        guard let searchedDestination else {
            return String(format: String(localized: "≈%lld min walk"), Int64(minutes))
        }
        return String(
            format: String(localized: "≈%1$lld min walk from %2$@"),
            Int64(minutes),
            searchedDestination.title.isolated
        )
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
        // Coming back to the app counts as a touch.
        lastInteractionAt = clock()
        isPausedForIdle = false
        if hasStarted { startHeadingUpdates() }
        expireParkingIfNeeded()
        // Back in the foreground a due refresh starts at once. The old data
        // stays on the map until the outcome is known.
        refreshIfDue(respectingAttemptGap: false)
        // Data not due for a refresh is as fresh as one would make it, and the
        // map may be the moment to ask for a rating. Before the first load, as
        // while the first fix is found, that load decides.
        if fetchTask == nil, lastSuccessAt != nil { reviewAfterLoad() }
    }

    func becameInactive() {
        isSceneActive = false
        stopHeadingUpdates()
        refreshTimerTask?.cancel()
        refreshTimerTask = nil
        // A moment to ask for a rating ends when the rider leaves.
        reviewDue = false
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

    /// Which way up the screen shows, for the heading to be the way the person faces.
    func setHeadingOrientation(_ orientation: CLDeviceOrientation) {
        guard locationManager.headingOrientation != orientation else { return }
        locationManager.headingOrientation = orientation
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
        // A city's rules start and end with their hours.
        rebuildMapZones()
        refreshIfDue(respectingAttemptGap: true)
    }

    private var refreshAfter: TimeInterval {
        if let asked = refreshPolicy.askedFollowUp(responseMetadata) { return asked }
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
            // Nobody has touched the map for a while: it stops asking until someone does.
            if clock().timeIntervalSince(lastInteractionAt) >= refreshPolicy.idlePause {
                isPausedForIdle = true
                refreshTimerTask?.cancel()
                refreshTimerTask = nil
            } else {
                refresh()
            }
        } else {
            scheduleAutomaticRefresh()
        }
    }

    /// A touch anywhere in the window, or a key: a paused map refreshes at once
    /// if its data is due, and the automatic refreshes start again.
    func noteInteraction() {
        lastInteractionAt = clock()
        // The ask for a rating waits for a map nobody touches: the next fresh
        // load is the next moment.
        reviewDue = false
        guard isPausedForIdle else { return }
        isPausedForIdle = false
        refreshIfDue(respectingAttemptGap: false)
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
        updateZones()
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
        askAgainForFailedZones()
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
        // A range the slider had not rested on was never chosen.
        rangeTracking?.cancel()
        let minimumChanged = minimumRange != 0
        chosenMinimumRange = 0
        enabledProviders = Set(ScooterProvider.allCases)
        if minimumChanged { refetchFilteredClusters() }
    }

    /// Sets the minimum range in metres to the nearest whole step of the slider's unit (4 900 m → 5 km,
    /// or 3 mi where lengths are in miles).
    func setMinimumRange(_ metres: Int) {
        let normalizedValue = ScooterRangeFilter.snapped(metres, unit: rangeUnit)
        guard normalizedValue != minimumRange else { return }
        chosenMinimumRange = normalizedValue
        refetchFilteredClusters()
        // A drag of the slider passes many steps and is one choice: the minimum is counted where it rests,
        // in metres.
        rangeTracking?.cancel()
        rangeTracking = Task {
            do { try await Task.sleep(for: .seconds(1)) } catch { return }
            ScooterAnalytics.shared.track("range_filter", value: normalizedValue)
        }
    }

    /// The groups the server counted were counted with the minimums of before: they are asked for again.
    private func refetchFilteredClusters() {
        guard ScooterClusteringPolicy.shouldCluster(at: viewportZoom) else { return }
        clusters = []
        lastSeenClusters = []
        scheduleFetch(for: viewport.expanded(by: 0.25), zoom: viewportZoom, debounce: true)
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

    /// ⌘+ and ⌘−: the map comes `steps` closer in, or goes out with a
    /// negative number, around what is in the middle of it.
    func zoom(by steps: Int) {
        guard steps != 0 else { return }
        zoomToken += 1
        zoomRequest = MapZoomRequest(steps: steps, token: zoomToken)
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
    /// times and the search's recent place, and the map moves there.
    func focusOnAddress(_ destination: MapDestination) {
        ScooterAnalytics.shared.track("search_select")
        choosePlace(destination)
    }

    /// The recent place's row in the search: chosen again like a result, also
    /// when the bar shows it already, which brings the map back to it.
    func chooseRecentPlace() {
        guard let recentPlace else { return }
        ScooterAnalytics.shared.track("search_select", result: "recent")
        choosePlace(recentPlace)
    }

    /// The ✕ of the recent place: the search and the device forget it. A place
    /// the bar shows stays there, and the map stays where it is.
    func forgetRecentPlace() {
        guard recentPlace != nil else { return }
        ScooterAnalytics.shared.track("search_forget")
        recentPlace = nil
    }

    /// `remembers`: whether the place becomes the search's recent place, as
    /// every place the rider chose does; a link's city is not one of them.
    private func choosePlace(_ destination: MapDestination, remembers: Bool = true) {
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
        if remembers { recentPlace = destination }
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

    /// A link to the map from the website (ScooterMapLink). A city's centre,
    /// which is what the site's links carry, opens like the city chosen in the
    /// search, but does not replace the search's recent place, which the rider
    /// chose; any other point moves the map there and clears a place searched
    /// before, so the bar shows its placeholder as for a map the rider moved.
    /// Either way the first fix of the rider's location leaves the map where
    /// the link put it, also when the link opened the app before locating began.
    func open(_ link: ScooterMapLink) {
        // A link changes the map: a moment to ask for a rating waits for its fresh load.
        reviewDue = false
        if let range = link.minimumRange { setMinimumRange(range) }
        guard let origin = link.origin else {
            ScooterAnalytics.shared.track("link_open", result: "map")
            return
        }
        keepsMapOnFirstFix = true
        if let city = ScooterCityCatalog.city(linkedAt: origin) {
            ScooterAnalytics.shared.track("link_open", result: "city")
            choosePlace(city.destination, remembers: false)
        } else {
            ScooterAnalytics.shared.track("link_open", result: "place")
            // The bar says what the map shows: a place searched before is not
            // where the map goes, so it leaves the bar (clearAddressSearch).
            searchedDestination = nil
            focusToken += 1
            focusRequest = .city(origin, token: focusToken)
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
        // Its card opens in the panel, which unfolds to show it.
        if id != nil { isPanelCollapsed = false }
    }

    /// Selects a parking bay by id, or closes the bay card with nil. The map
    /// reports `parking_select` itself, so nothing is tracked here.
    func selectParking(_ id: String?) {
        guard id != selectedParkingID else { return }
        if id != nil { selectedScooterID = nil }
        selectedParkingID = id
        if id != nil { isPanelCollapsed = false }
    }

    /// A tap on the map background: closes the scooter or the bay card.
    func clearSelection() {
        selectScooter(nil)
        selectedParkingID = nil
    }

    func dismissLocationIssue() {
        locationIssueDismissed = true
    }

    private func passesMinimums(_ scooter: Scooter) -> Bool {
        ScooterFiltering.passesRange(scooter, minimumRange: minimumRange, batteryRanges: batteryRanges)
    }

    /// The minimum range changed, the unit it is read in, or how far a full battery takes each app's scooters.
    private func filtersDidChange() {
        rebuildMapScooters()
        rebuildMapLastSeen()
        rebuildVisibleCounts()
        clearSelectionIfHidden()
    }

    private func rebuildMapScooters() {
        var next = ScooterFiltering.mapScooters(
            from: vehicles,
            minimumRange: minimumRange,
            batteryRanges: batteryRanges,
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

    /// A faded group keeps the providers that are shown, as the others do, and
    /// is drawn only where the server groups the scooters.
    private func rebuildMapLastSeen() {
        let scooters = ScooterFiltering.mapScooters(
            from: lastSeenVehicles,
            minimumRange: minimumRange,
            batteryRanges: batteryRanges,
            enabledProviders: enabledProviders
        )
        let groups = responseMetadata?.mode == "clusters"
            ? lastSeenClusters.compactMap { $0.filtered(to: enabledProviders) }
            : []
        guard scooters != mapLastSeenScooters || groups != mapLastSeenClusters else { return }
        mapLastSeenScooters = scooters
        mapLastSeenClusters = groups
        mapLastSeenRevision &+= 1
    }

    private func rebuildVehicleIndex() {
        vehiclesByID = Dictionary(
            vehicles.map { ($0.id, $0) },
            uniquingKeysWith: { _, latest in latest }
        )
    }

    private func rebuildVisibleCounts() {
        let summary = ScooterFiltering.visibleSummary(
            for: vehicles, viewport: viewport, minimumRange: minimumRange, batteryRanges: batteryRanges,
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

        let lastSeen = ScooterFiltering.visibleSummary(
            for: lastSeenVehicles, viewport: viewport, minimumRange: minimumRange, batteryRanges: batteryRanges,
            enabledProviders: enabledProviders
        )
        var lastSeenCount = lastSeen.count
        var lastSeenProviders = lastSeen.providerCounts
        if responseMetadata?.mode == "clusters" {
            for cluster in lastSeenClusters where viewport.contains(latitude: cluster.latitude, longitude: cluster.longitude) {
                lastSeenCount += cluster.filtered(to: enabledProviders)?.count ?? 0
                for (providerID, providerCount) in cluster.providers where providerCount > 0 {
                    guard let provider = ScooterProvider(rawValue: providerID) else { continue }
                    lastSeenProviders[provider, default: 0] += providerCount
                }
            }
        }
        visibleLastSeenCount = lastSeenCount
        visibleLastSeenProviderCounts = lastSeenProviders
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
        ) && passesMinimums(selectedScooter) && (
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
        // Grouped by the server, the scooters are filtered there; one by one, here.
        let clustered = ScooterClusteringPolicy.shouldCluster(at: zoom)
        let requestMinimumRange = clustered ? minimumRange : 0
        activeRequestID = requestID
        pendingQueryBounds = bounds
        pendingQueryZoom = zoom
        pendingQueryMinimumRange = requestMinimumRange
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
                    minimumRange: requestMinimumRange
                )
                guard !Task.isCancelled, activeRequestID == requestID else { return }
                // The backend preserves recent successful feeds independently.
                // Accept healthy cities even when another operator is unavailable.
                // A response is shown whatever its own timestamps say.
                let receivedAt = clock()
                // The card's scooter as it was, unless a walk holds it (followWalkTarget), and the ids listed before.
                let cardScooter = selectedScooter.flatMap { scooter in
                    walk.map { $0.holdsCard && $0.target == .scooter(scooter) } == true ? nil : scooter
                }
                let previousIDs = cardScooter == nil && walk == nil ? [] : Set(vehiclesByID.keys)
                let generatedAt = Self.apiDate(response.meta?.generatedAt, clockOffset: response.clockOffset)
                let observedAt = min(generatedAt ?? receivedAt, receivedAt)
                isApplyingResponse = true
                vehicles = response.vehicles
                clusters = response.clusters
                lastSeenVehicles = response.lastSeenVehicles
                lastSeenClusters = response.lastSeenClusters
                parking = response.parking
                batteryRanges = response.batteryRanges
                responseMetadata = response.meta
                isApplyingResponse = false
                queryBounds = bounds
                queryZoom = zoom
                queryMinimumRange = requestMinimumRange
                rebuildVehicleIndex()
                followWalkTarget(in: response.meta, loadedFor: bounds, receivedAt: receivedAt, previousIDs: previousIDs)
                if let cardScooter { followCardScooter(cardScooter, previousIDs: previousIDs) }
                noteNeighbours()
                rebuildMapScooters()
                rebuildMapClusters()
                rebuildMapLastSeen()
                rebuildVisibleCounts()
                distanceOrigin = fetchOrigin
                lastUpdated = observedAt
                lastSeenReports = response.lastSeenStatuses(receivedAt: receivedAt)
                staleReports = response.staleProviderTimes(receivedAt: receivedAt)
                lastSuccessAt = receivedAt
                lastAttemptAt = receivedAt
                // The server is collecting feeds of this answer again: ask again when it says (followUpMs), at
                // once while a quick feed is on its way. A server that does not say is asked once more soon, but
                // only once in a row, unless scooters stand where they were last seen, which its sweeps replace.
                let query = ScooterFollowUpQuery(
                    bounds: bounds, zoom: zoom, minimumRange: requestMinimumRange
                )
                let refreshing = response.meta?.refreshing == true
                let filling = !response.lastSeenVehicles.isEmpty || !response.lastSeenClusters.isEmpty
                followUpGap = refreshPolicy.askedFollowUp(response.meta)
                    ?? (refreshing && (filling || followedUpQuery != query) ? refreshPolicy.followUpGap : nil)
                followedUpQuery = refreshing ? query : nil
                loadIssue = nil
                scheduleDataExpiry(response.meta, receivedAt: receivedAt, clockOffset: response.clockOffset)
                expireParkingIfNeeded()
                clearSelectionIfHidden()
                reviewAfterLoad()
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
                reviewAfterLoad()
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
        lastSeenVehicles = []
        lastSeenClusters = []
        lastSeenReports = [:]
        staleReports = nil
        // The figures were those of the scooters cleared.
        batteryRanges = [:]
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
        pendingQueryMinimumRange = nil
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
        return ScooterServerTime.date(value)?.addingTimeInterval(clockOffset)
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
        let storedMinimumRange = pending ? pendingQueryMinimumRange : self.queryMinimumRange
        guard bounds?.contains(targetViewport) == true,
              let storedZoom,
              ScooterClusteringPolicy.representationsMatch(storedZoom, zoom) else { return false }

        let clustered = ScooterClusteringPolicy.shouldCluster(at: zoom)
        return storedMinimumRange == (clustered ? minimumRange : 0)
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
        if status == .denied || status == .restricted { forgetUserLocation() }
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
            forgetUserLocation()
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

    /// Location taken back in Settings, or refused by Core Location: where the
    /// rider was goes with it, so that nothing goes on using it, a walk from
    /// there, the next Directions or the scooters asked for around it, until
    /// location is allowed again. A searched place stays, and its walk with it.
    private func forgetUserLocation() {
        bestLocationCandidate = nil
        locationAccuracy = 0
        distanceOrigin = startCenter
        userLocation = nil
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
    /// route then follows it; or data that would list it no longer does
    /// twice, from two reads of its app, which mostly means someone took
    /// it: one missing from one update comes back. Scooters get new ids now
    /// and then, so one of the same provider standing where it stood, under an
    /// id the data before didn't list (`previousIDs`), is that scooter, unless it
    /// stands where another of its app seen near it stood (`successor`). The
    /// walk follows it whatever its phase: one the rider is at stays so, and one
    /// said to be taken is back after all.
    private func followWalkTarget(
        in meta: ScooterResponseMetadata?,
        loadedFor bounds: GeoBounds,
        receivedAt: Date,
        previousIDs: Set<String>
    ) {
        guard var walk, case let .scooter(scooter) = walk.target else { return }
        if let fresh = vehiclesByID[scooter.id] {
            guard walk.holdsCard else { return }
            guard walk.phase != .gone else {
                // Back on the map: its card is a scooter's card again.
                self.walk = nil
                return
            }
            guard fresh != scooter || walk.missedRead != nil else { return }
            walk.target = .scooter(fresh)
            walk.missedRead = nil
            self.walk = walk
            if walkTargetLeftRoute, walk.origin == .rider, let userLocation { rerouteIfAllowed(from: userLocation) }
            return
        }
        guard walk.isUnderway else {
            guard let successor = successor(of: scooter, previousIDs: previousIDs) else { return }
            if walk.phase == .gone {
                // Back on the map after all, under a new id: its card is a scooter's card again.
                self.walk = nil
            } else {
                walk.target = .scooter(successor)
                self.walk = walk
            }
            follow(to: successor.id)
            return
        }
        let point = GeoPoint(scooter.coordinate)
        guard Self.listsEveryScooter(of: scooter.provider, at: point, in: meta, loadedFor: bounds) else { return }
        if let successor = successor(of: scooter, previousIDs: previousIDs) {
            walk.target = .scooter(successor)
            walk.missedRead = nil
            self.walk = walk
            follow(to: successor.id)
            if walkTargetLeftRoute, walk.origin == .rider, let userLocation { rerouteIfAllowed(from: userLocation) }
            return
        }
        // Faded where it was last seen while its app is collected again: neither seen nor taken until the
        // app's new positions say which.
        if lastSeenVehicles.contains(where: { $0.id == scooter.id }) ||
            Self.nearest(ofTheProviderOf: scooter, among: lastSeenVehicles) != nil {
            return
        }
        let read = Self.read(of: scooter.provider, in: meta) ?? receivedAt
        guard let missedRead = walk.missedRead else {
            walk.missedRead = read
            self.walk = walk
            return
        }
        // The same read of its app again says nothing new, however late another app in view is.
        guard missedRead != read else { return }
        cancelRouteRequest()
        walk.phase = .gone
        walk.route = nil
        self.walk = walk
        announceWalk(ScooterWalkNote.gone.text)
    }

    /// When the positions shown of `provider` were seen, as the server wrote it: its own time (meta.shownSince), or
    /// the answer's (generatedAt), the oldest of every app's, from a server that doesn't name it. Nil without either.
    private static func read(of provider: String, in meta: ScooterResponseMetadata?) -> Date? {
        meta?.shownSince?[provider].flatMap(ScooterServerTime.date) ?? meta?.generatedAt.flatMap(ScooterServerTime.date)
    }

    /// A plain card's scooter that the data no longer lists under its id. Bird and Pony give every scooter a new id on
    /// each read, others after each ride, and the server its own after a gap or a restart: the scooter that takes
    /// over (`successor`) is that scooter, and the card stays open on it. A scooter that was already listed there, or
    /// stood where one seen near it stood, is another one, and the card closes as it did.
    private func followCardScooter(_ scooter: Scooter, previousIDs: Set<String>) {
        guard selectedScooterID == scooter.id, vehiclesByID[scooter.id] == nil,
              let successor = successor(of: scooter, previousIDs: previousIDs) else { return }
        follow(to: successor.id)
    }

    /// The scooter under a new id that is `scooter`, which the data no longer lists under its own: the nearest of its
    /// provider within a few metres of where it stood, under an id the data before didn't list, and nearer where it
    /// stood than where any other scooter of its app seen near it since it was chosen stood (ScooterNeighbours).
    private func successor(of scooter: Scooter, previousIDs: Set<String>) -> Scooter? {
        let stood = GeoPoint(scooter.coordinate)
        return Self.nearest(ofTheProviderOf: scooter, among: vehicles.filter { candidate in
            !previousIDs.contains(candidate.id) && neighbours?.mayTakeOver(candidate, from: stood) != false
        })
    }

    /// The nearest scooter of the same provider within a few metres of where `scooter` stood.
    private static func nearest(ofTheProviderOf scooter: Scooter, among candidates: [Scooter]) -> Scooter? {
        let point = GeoPoint(scooter.coordinate)
        return candidates
            .filter { $0.provider == scooter.provider }
            .map { (scooter: $0, metres: $0.distance(from: point)) }
            .filter { $0.metres <= WalkRoute.rebindDistance }
            .min { $0.metres < $1.metres }?
            .scooter
    }

    /// Remembers the scooters of its app, live or faded, standing near the selected scooter, or where it was last
    /// seen while a walk holds its card.
    private func noteNeighbours() {
        guard let selectedScooter else { return }
        neighbours?.note(vehicles + lastSeenVehicles, around: selectedScooter)
    }

    /// Moves the selection to the scooter's new id, the same choice.
    private func follow(to id: String) {
        isFollowingScooter = true
        selectedScooterID = id
        isFollowingScooter = false
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

// MARK: - Zones

/// The zones of an area as the server answered, or the failure to get them.
struct ScooterZoneAnswer: Sendable {
    let area: ScooterZoneArea
    let zones: [ScooterZone]
    /// Asking failed, or some of the area's zones are unknown: some feeds' could not be read, or were still on
    /// their way after the last try. Those that came are drawn all the same.
    let failed: Bool
    /// Some feeds' zones were still on their way, and the area is asked for again.
    let pending: Bool
    /// Zones were left out to keep the answer small.
    var truncated = false
    let receivedAt: Date

    var isComplete: Bool { !failed && !pending }

    /// Whether it serves a view's `area`: any within its own, but for one with zones left out, which serves its own
    /// alone, as a smaller area may have them all, and the legend asks to zoom in for them.
    func serves(_ area: ScooterZoneArea) -> Bool {
        truncated ? self.area == area : self.area.contains(area)
    }

    /// What the legend says of it: the rest still on the way is loading, and an answer with zones left out asks to
    /// zoom in beside the kinds it names.
    var state: ScooterZoneState {
        if failed { return .failed }
        if pending { return .loading }
        return truncated ? .partial : .shown
    }
}

extension ScooterMapModel {
    /// Coalesces the moves of one gesture, as the web does.
    static let zoneDebounce = Duration.milliseconds(250)
    /// While some feeds' zones are still being read, the same area is asked for again this much later, a few times.
    static let zonePendingRetry = Duration.seconds(3)
    static let zonePendingRetries = 3
    /// The server lets an answer be kept five minutes.
    static let zoneAnswerLifetime: TimeInterval = 300
    private static let recentZoneAnswerLimit = 8

    /// Asks for the zones of the map's area, the area the scooters are asked
    /// for rounded out to the grid, unless an answer at hand covers it.
    fileprivate func updateZones() {
        guard showsZones else {
            cancelZoneRequest()
            zoneAnswer = nil
            setZones(state: .off)
            return
        }
        guard viewportZoom >= ScooterZoneArea.minimumZoom else {
            // A whole answer is kept for when the map comes close again; any
            // other is asked for again then.
            cancelZoneRequest()
            if zoneAnswer?.isComplete == false { zoneAnswer = nil }
            setZones(state: .zoomIn)
            return
        }
        guard let area = ScooterZoneArea(covering: viewport.expanded(by: 0.25)) else {
            cancelZoneRequest()
            zoneAnswer = nil
            setZones(state: .shown)
            return
        }
        if let answer = zoneAnswer, answer.serves(area) {
            // Unless a pending answer is being asked for again, it stands; the
            // cities' zones follow the map either way.
            if zoneTaskArea == nil { setZones(state: answer.state) } else { rebuildMapZones() }
            return
        }
        if let taskArea = zoneTaskArea, taskArea.contains(area) {
            // The cities' zones follow the map meanwhile.
            rebuildMapZones()
            return
        }
        let now = clock()
        recentZoneAnswers.removeAll { now.timeIntervalSince($0.receivedAt) > Self.zoneAnswerLifetime }
        if let recent = recentZoneAnswers.first(where: { $0.serves(area) }) {
            cancelZoneRequest()
            zoneAnswer = recent
            setZones(state: recent.state)
            return
        }
        requestZones(in: area, after: Self.zoneDebounce, retries: Self.zonePendingRetries)
    }

    private func requestZones(in area: ScooterZoneArea, after delay: Duration, retries: Int) {
        zoneTask?.cancel()
        zoneTaskArea = area
        if zoneAnswer?.area != area { setZones(state: .loading) }
        zoneTask = Task { [weak self] in
            do { try await Task.sleep(for: delay) } catch { return }
            guard let self else { return }
            let answer: ScooterZoneAnswer
            do {
                let response = try await api.zones(in: area)
                guard !Task.isCancelled, zoneTaskArea == area else { return }
                let pending = response.pending && retries > 0
                // An area whose zones are partly unknown says so, keeping those that came: it would otherwise read
                // as one with none. Not complete, it is asked for again with the scooters.
                let unknown = !pending && (response.unavailable || response.pending)
                answer = ScooterZoneAnswer(
                    area: area, zones: response.zones, failed: unknown, pending: pending, truncated: response.truncated,
                    receivedAt: clock()
                )
            } catch {
                guard !Task.isCancelled, zoneTaskArea == area, !(error is CancellationError) else { return }
                // The area's zones stay drawn if they were; another area's go.
                let kept = zoneAnswer?.area == area ? zoneAnswer?.zones ?? [] : []
                answer = ScooterZoneAnswer(area: area, zones: kept, failed: true, pending: false, receivedAt: clock())
            }
            zoneAnswer = answer
            if answer.pending {
                // What came is drawn meanwhile.
                requestZones(in: area, after: zonePendingRetry, retries: retries - 1)
            } else {
                zoneTask = nil
                zoneTaskArea = nil
            }
            if answer.isComplete {
                recentZoneAnswers.removeAll { $0.area == area }
                recentZoneAnswers.insert(answer, at: 0)
                recentZoneAnswers = Array(recentZoneAnswers.prefix(Self.recentZoneAnswerLimit))
            }
            setZones(state: answer.state)
        }
    }

    /// A failed answer for the zones stands while the map stays in its area, so each refresh of the scooters, on
    /// its own or asked for, asks for them again: after a load lost to the network, or a feed the server could not
    /// read and tries again a minute later, they come back with the scooters, instead of staying unavailable until
    /// the map leaves the area. What was drawn stays drawn meanwhile.
    fileprivate func askAgainForFailedZones() {
        guard showsZones, zoneTaskArea == nil, let answer = zoneAnswer, answer.failed else { return }
        requestZones(in: answer.area, after: .zero, retries: Self.zonePendingRetries)
    }

    private func cancelZoneRequest() {
        zoneTask?.cancel()
        zoneTask = nil
        zoneTaskArea = nil
    }

    private func setZones(state: ScooterZoneState) {
        if zoneState != state { zoneState = state }
        rebuildMapZones()
    }

    /// Like the scooters: only the zones of the providers switched on, and
    /// none further out than zoom 14; and the cities' rules and zones over the map.
    fileprivate func rebuildMapZones() {
        let shown = zoneState == .off || zoneState == .zoomIn ? [] : (zoneAnswer?.zones ?? []).filter { zone in
            ScooterProvider(rawValue: zone.provider).map { enabledProviders.contains($0) } ?? false
        }
        if viewportZoom < ScooterZoneArea.minimumZoom {
            ruleZoneArea = nil
        } else if ruleZoneArea?.contains(viewport) != true {
            ruleZoneArea = viewport.expanded(by: 0.5)
        }
        var rules: [CityRuleZone.Shown] = []
        var notices: [CityZoneDownloads.Notice] = []
        if let ruleZoneArea {
            // The cities' zones built in, and those downloaded; the others the area reaches are asked for.
            cityZoneDownloads.request(over: ruleZoneArea)
            let downloaded = cityZoneDownloads.shown(over: ruleZoneArea)
            let now = clock()
            rules = CityRuleZone.shown(over: ruleZoneArea, zoom: viewportZoom, at: now, among: builtInZones()) +
                CityRuleZone.shown(over: ruleZoneArea, zoom: viewportZoom, at: now, among: downloaded.zones)
            notices = downloaded.notices.filter { $0.city.bounds.intersects(viewport) }
        }
        let rulesInView = rules.filter { $0.rule.reaches(viewport) }
        if rulesInView != mapRuleZones { mapRuleZones = rulesInView }
        if notices != mapZoneNotices { mapZoneNotices = notices }
        if shown.count != mapOperatorZoneCount { mapOperatorZoneCount = shown.count }
        let slowSpeeds = ScooterZoneSpeeds(slowZonesOf: shown)
        if slowSpeeds != mapOperatorSlowSpeeds { mapOperatorSlowSpeeds = slowSpeeds }
        let drawn = rules.map(\.mapZone) + shown
        guard drawn != mapZones else { return }
        mapZones = drawn
        mapZonesRevision += 1
    }
}

// MARK: - Rating

extension ScooterMapModel {
    /// The screen asks for a rating now, once the map has rested since the moment came: true once, while the map is
    /// still calm and nothing went wrong meanwhile.
    func takeReviewMoment() -> Bool {
        guard reviewDue else { return false }
        reviewDue = false
        let now = clock()
        guard reviewPrompt.isDue(at: now, calm: reviewCalm) else { return false }
        reviewPrompt.asked(at: now)
        return true
    }

    /// Something went over the map, or changed on it, before the wait for `moment` was over: that moment asks no
    /// more, and the next fresh load is the next one. A wait ended by the next moment leaves that one waiting.
    func dropReviewMoment(_ moment: Int) {
        guard moment == reviewMoments else { return }
        reviewDue = false
    }

    /// After each load: a fresh feed counts the day with use, and trouble keeps the day from asking. A calm map in
    /// front, from the third day with a fresh feed, is then the moment to ask, once the screen has seen it rest; a
    /// moment already waiting goes on waiting.
    private func reviewAfterLoad() {
        let now = clock()
        if loadIssue == nil, responseMetadata?.stale != true { reviewPrompt.noteUse(at: now) }
        if reviewTrouble { reviewPrompt.noteBadMoment(at: now) }
        guard isSceneActive, !reviewDue, reviewPrompt.isDue(at: now, calm: reviewCalm) else { return }
        reviewDue = true
        reviewMoments += 1
    }

    /// The map at rest with a healthy feed: the count and its chips, in the dock or the panel, folded or not, not a
    /// card or a reason for an empty map; no location being found or gone wrong, no walk, no scooters faded while
    /// they are collected again. What is over the map, the search, the sheets and the popover, is the screen's.
    private var reviewCalm: Bool {
        guard case .summary = dock, !isLocating, locationIssue == nil, !isWalking, !isFilling else { return false }
        return !reviewTrouble
    }

    /// What makes a bad day: the feed failed or is out of date, the data shown is delayed, every provider here is
    /// down, or the rider is where no operator shares data.
    private var reviewTrouble: Bool {
        if loadIssue != nil || responseMetadata?.stale == true { return true }
        let down = Set(providerHealth.downProviders)
        if !down.isEmpty, Set(availableProviders).isSubset(of: down) { return true }
        guard let userLocation else { return false }
        return !ScooterProviderCoverage.contains(latitude: userLocation.latitude, longitude: userLocation.longitude)
    }
}
