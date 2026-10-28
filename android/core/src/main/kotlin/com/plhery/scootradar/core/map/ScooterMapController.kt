package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIJson
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.MapZoomRequest
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.RideEstimateDuration
import com.plhery.scootradar.core.model.RidePriceEstimator
import com.plhery.scootradar.core.model.RidePriceQuote
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterBatteryFilter
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterCityGrouping
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterFiltering
import com.plhery.scootradar.core.model.ScooterFollowUpQuery
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterRefreshPolicy
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterReviewPrompt
import com.plhery.scootradar.core.model.ScooterStartPlace
import com.plhery.scootradar.core.model.ScooterWalk
import com.plhery.scootradar.core.model.ScooterWalkAnnouncement
import com.plhery.scootradar.core.model.ScooterWalkFailure
import com.plhery.scootradar.core.model.ScooterWalkNote
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.UserInterfaceStyle
import com.plhery.scootradar.core.model.WalkRoute
import com.plhery.scootradar.core.model.addingTimeInterval
import com.plhery.scootradar.core.model.city
import com.plhery.scootradar.core.model.distance
import com.plhery.scootradar.core.model.timeIntervalSince
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeParseException
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

// ios/ScootRadar/ViewModels/ScooterMapModel.swift.

/**
 * What the map screen shows and does: the scooters, groups and bays of the area on screen, the filters, the
 * selection and its card, the rider's location and heading, the walk to a scooter and the zones.
 *
 * Confined to one thread, the main thread in the app, as the iPhone's model is to the main actor: every call,
 * and every callback of the location manager, comes on it, and `scope` runs all of its work there, its
 * requests, timers and waits, after the call that started them returns. Nothing in it takes a lock.
 *
 * What the screen observes is a StateFlow; what is worked out from it is a plain property, read again when
 * one of them changes.
 */
class ScooterMapController(
    internal val api: ScooterAPIClient,
    internal val locationManager: ScooterLocationManager,
    private val defaults: ScooterDefaults,
    /**
     * Where the controller's requests, timers and waits run: the screen's, on the main thread. Its dispatcher is
     * Dispatchers.Main, not Main.immediate, so that work starts after the call that asked for it returns, as a
     * Swift Task does.
     */
    internal val scope: CoroutineScope,
    internal val directions: WalkingDirectionsClient,
    internal val openInMaps: (ScooterWalkTarget) -> Unit,
    private val locationTimeout: Duration = 5.seconds,
    private val refreshPolicy: ScooterRefreshPolicy = ScooterRefreshPolicy.standard,
    now: () -> Instant = Instant::now,
    /**
     * The phone's languages, most preferred first, as BCP 47 tags: the system's, as the iPhone's AppleLanguages
     * of any application are, not the app's. A language chosen for the app becomes Locale.getDefault() and
     * LocaleList.getDefault(), so the app reads LocaleManagerCompat.getSystemLocales.
     */
    private val phoneLanguages: () -> List<String>,
    /** What the language followed as the app started: a language chosen for the app, or the phone's. */
    languageAtLaunch: ScooterLanguageChoice = ScooterLanguageChoice.Automatic,
    /**
     * Keeps the language chosen where Android reads the app's language at launch, its application locales:
     * one tag, or none for Automatic, so that Android follows the phone's languages again.
     */
    private val keepAppLanguages: (List<String>) -> Unit = {},
    /** Where the screen's events go; none in tests and previews. */
    internal val analytics: ScooterAnalytics? = null,
    start: ScooterMapStart = ScooterMapStart.switzerland,
    /** A debug build: a screenshot's camera and a review prompt can be asked for in the defaults. */
    debug: Boolean = false,
) {
    internal val clock: () -> Instant = now

    private val _vehicles = MutableStateFlow<List<Scooter>>(emptyList())
    val vehicles: StateFlow<List<Scooter>> = _vehicles.asStateFlow()

    private val _clusters = MutableStateFlow<List<ScooterCluster>>(emptyList())
    val clusters: StateFlow<List<ScooterCluster>> = _clusters.asStateFlow()

    /**
     * While the server collects an app's map again, where the scooters and groups its sweep has not reached
     * yet were last seen: drawn faded and counted nowhere.
     */
    private val _lastSeenVehicles = MutableStateFlow<List<Scooter>>(emptyList())
    val lastSeenVehicles: StateFlow<List<Scooter>> = _lastSeenVehicles.asStateFlow()

    private val _lastSeenClusters = MutableStateFlow<List<ScooterCluster>>(emptyList())
    val lastSeenClusters: StateFlow<List<ScooterCluster>> = _lastSeenClusters.asStateFlow()

    /** When the oldest of them were seen, on this device's clock. */
    private val _lastSeenAt = MutableStateFlow<Instant?>(null)
    val lastSeenAt: StateFlow<Instant?> = _lastSeenAt.asStateFlow()

    private val _parking = MutableStateFlow<List<ScooterParking>>(emptyList())
    val parking: StateFlow<List<ScooterParking>> = _parking.asStateFlow()

    /** The bays drawn on the map: zoom 16 and closer, for the providers that are shown, and the bay walked to wherever the map is. */
    val mapParking: List<ScooterParking>
        get() {
            val shown = if (viewportZoom.value < 16) {
                mutableListOf()
            } else {
                parking.value.filter { location ->
                    val provider = ScooterProvider.fromRawValue(location.provider) ?: return@filter false
                    provider in enabledProviders.value && viewport.value.contains(location.latitude, location.longitude)
                }.toMutableList()
            }
            val held = walk.value?.heldParking
            if (held != null && shown.none { it.id == held.id }) shown += held
            return shown
        }

    private val _viewport = MutableStateFlow(GeoBounds(start.region))
    val viewport: StateFlow<GeoBounds> = _viewport.asStateFlow()

    private val _viewportZoom = MutableStateFlow(start.zoom)
    val viewportZoom: StateFlow<Int> = _viewportZoom.asStateFlow()

    /** The zoom as the map has it, between whole levels: it decides which city totals are drawn as one. */
    private val _viewportZoomLevel = MutableStateFlow(start.zoom.toDouble())
    val viewportZoomLevel: StateFlow<Double> = _viewportZoomLevel.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isLocating = MutableStateFlow(false)
    val isLocating: StateFlow<Boolean> = _isLocating.asStateFlow()

    /** What went wrong with loading, until a load succeeds again. */
    private val _loadIssue = MutableStateFlow<ScooterLoadIssue?>(null)
    val loadIssue: StateFlow<ScooterLoadIssue?> = _loadIssue.asStateFlow()

    /**
     * When the data on the map was observed. It survives the map being cleared, so the out-of-date card can
     * say when the last update was.
     */
    private val _lastUpdated = MutableStateFlow<Instant?>(null)
    val lastUpdated: StateFlow<Instant?> = _lastUpdated.asStateFlow()

    private val _responseMetadata = MutableStateFlow<ScooterResponseMetadata?>(null)
    val responseMetadata: StateFlow<ScooterResponseMetadata?> = _responseMetadata.asStateFlow()

    private val _userLocation = MutableStateFlow<GeoPoint?>(null)
    val userLocation: StateFlow<GeoPoint?> = _userLocation.asStateFlow()

    private val _userHeading = MutableStateFlow<ScooterUserHeading?>(null)
    val userHeading: StateFlow<ScooterUserHeading?> = _userHeading.asStateFlow()

    /** True once this device has located successfully. Only this boolean is stored. */
    private val _hasLocatedOnce = MutableStateFlow(defaults.bool(forKey = HAS_LOCATED_ONCE_KEY))
    val hasLocatedOnce: StateFlow<Boolean> = _hasLocatedOnce.asStateFlow()

    private var locationProblem: ScooterLocationIssue? = null
    private var locationIssueDismissed = false

    /** The location card under the search bar, unless it was dismissed. The next locate attempt brings it back. */
    private val _locationIssue = MutableStateFlow<ScooterLocationIssue?>(null)
    val locationIssue: StateFlow<ScooterLocationIssue?> = _locationIssue.asStateFlow()

    private val _enabledProviders = MutableStateFlow(savedProviders(defaults) ?: ScooterProvider.entries.toSet())
    val enabledProviders: StateFlow<Set<ScooterProvider>> = _enabledProviders.asStateFlow()

    private val _selectedScooterID = MutableStateFlow<String?>(null)
    val selectedScooterID: StateFlow<String?> = _selectedScooterID.asStateFlow()

    /** Selecting a bay clears the selected scooter, and the other way round. */
    private val _selectedParkingID = MutableStateFlow<String?>(null)
    val selectedParkingID: StateFlow<String?> = _selectedParkingID.asStateFlow()

    /**
     * The panel of a large window folded down to its search bar and one line under it, as the card of Maps
     * folds. Choosing a scooter or a bay opens it again, since their cards are in it. A phone's dock never
     * folds.
     */
    private val _isPanelCollapsed = MutableStateFlow(false)
    val isPanelCollapsed: StateFlow<Boolean> = _isPanelCollapsed.asStateFlow()

    private val _searchedDestination = MutableStateFlow<MapDestination?>(null)
    val searchedDestination: StateFlow<MapDestination?> = _searchedDestination.asStateFlow()

    /**
     * Places chosen during this session, newest first. Never persisted: the privacy notice promises that
     * precise origins are not stored.
     */
    private val _recentPlaces = MutableStateFlow<List<MapDestination>>(emptyList())
    val recentPlaces: StateFlow<List<MapDestination>> = _recentPlaces.asStateFlow()

    private val _focusRequest = MutableStateFlow<MapFocusRequest?>(null)
    val focusRequest: StateFlow<MapFocusRequest?> = _focusRequest.asStateFlow()

    /** A step in or out asked from the keyboard, Ctrl+ and Ctrl−. */
    private val _zoomRequest = MutableStateFlow<MapZoomRequest?>(null)
    val zoomRequest: StateFlow<MapZoomRequest?> = _zoomRequest.asStateFlow()

    /**
     * The walk to the selected scooter or bay, from a tap on Directions until the route is hidden, the card
     * closes or the walk ends on its own. Null while the card simply offers Directions.
     */
    internal val _walk = MutableStateFlow<ScooterWalk?>(null)
    val walk: StateFlow<ScooterWalk?> = _walk.asStateFlow()

    /**
     * What TalkBack is told about the walk: that the way is being found, the route that was found, that none
     * was, or that the rider is there.
     */
    internal val _walkAnnouncement = MutableStateFlow<ScooterWalkAnnouncement?>(null)
    val walkAnnouncement: StateFlow<ScooterWalkAnnouncement?> = _walkAnnouncement.asStateFlow()

    /** Goes up with each moment to ask for a rating: the screen asks once the map has rested. */
    internal val _reviewMoments = MutableStateFlow(0)
    val reviewMoments: StateFlow<Int> = _reviewMoments.asStateFlow()

    /** The moment to ask for a rating came, and the screen has not asked yet (`takeReviewMoment`). */
    var reviewDue: Boolean = false
        internal set

    private val _minimumBattery = MutableStateFlow(
        ScooterBatteryFilter.snapped(defaults.int(forKey = MINIMUM_BATTERY_KEY) ?: 0).toDouble(),
    )
    val minimumBattery: StateFlow<Double> = _minimumBattery.asStateFlow()

    // The quiet ground is what the dots are made for; a style chosen in Settings is kept.
    private val _mapStyle = MutableStateFlow(
        AppleMapStyle.fromRawValue(defaults.string(forKey = MAP_STYLE_KEY) ?: "") ?: AppleMapStyle.Quiet,
    )
    val mapStyle: StateFlow<AppleMapStyle> = _mapStyle.asStateFlow()

    /** The operators' zones over the map, a preview that is off unless turned on in Settings. */
    private val _showsZones = MutableStateFlow(defaults.bool(forKey = SHOWS_ZONES_KEY))
    val showsZones: StateFlow<Boolean> = _showsZones.asStateFlow()

    /** What the zones' legend says. */
    internal val _zoneState = MutableStateFlow(ScooterZoneState.Off)
    val zoneState: StateFlow<ScooterZoneState> = _zoneState.asStateFlow()

    /**
     * The zones drawn on the map: those of the providers shown, from zoom 14, and the streets where a city
     * forbids riding, which show whether or not the zones are on.
     */
    internal val _mapZones = MutableStateFlow<List<ScooterZone>>(emptyList())
    val mapZones: StateFlow<List<ScooterZone>> = _mapZones.asStateFlow()

    internal val _mapZonesRevision = MutableStateFlow(0)
    val mapZonesRevision: StateFlow<Int> = _mapZonesRevision.asStateFlow()

    /** The streets where a city forbids riding over the map, for the legend. */
    internal val _mapRuleZones = MutableStateFlow<List<CityRuleZone.Shown>>(emptyList())
    val mapRuleZones: StateFlow<List<CityRuleZone.Shown>> = _mapRuleZones.asStateFlow()

    // Day and night until one is chosen in Settings.
    private val _appearance = MutableStateFlow(
        ScooterAppearance.fromRawValue(defaults.string(forKey = APPEARANCE_KEY) ?: "") ?: ScooterAppearance.Sun,
    )
    val appearance: StateFlow<ScooterAppearance> = _appearance.asStateFlow()

    /**
     * What the app's language follows: the phone's languages, or one chosen in Settings. A choice changes the
     * app's own text at once. A language is kept where Android reads the app's language at launch, which is
     * where the Settings of the phone keep the one chosen there; Automatic takes it away, so that Android
     * follows the phone's languages again.
     */
    private val _languageChoice = MutableStateFlow(languageAtLaunch)
    val languageChoice: StateFlow<ScooterLanguageChoice> = _languageChoice.asStateFlow()

    /** The language the app is shown in. */
    private val _language = MutableStateFlow(ScooterLanguage.current)
    val language: StateFlow<ScooterLanguage> = _language.asStateFlow()

    private val _rideEstimateMinutes = MutableStateFlow(
        RideEstimateDuration.normalized(defaults.int(forKey = RIDE_ESTIMATE_MINUTES_KEY) ?: RideEstimateDuration.defaultMinutes),
    )
    val rideEstimateMinutes: StateFlow<Int> = _rideEstimateMinutes.asStateFlow()

    private val _ridePasses = MutableStateFlow(loadRidePasses(defaults))
    val ridePasses: StateFlow<Map<ScooterProvider, ProviderRidePass>> = _ridePasses.asStateFlow()

    private var isTrackingHeading = false
    private var isSceneActive = true

    /** The route being found, and the number of the latest request: an answer to an earlier one is not wanted any more. */
    internal var routeTask: Job? = null
    internal var routeRequests = 0
    internal var routeRevisions = 0
    internal var walkAnnouncements = 0

    /** How precise the last location was: a location this vague may lie that far from the path without the rider having left it. */
    internal var locationAccuracy: Double = 0.0

    /** Says when to ask for a rating (ScooterReviewPrompt). */
    internal val reviewPrompt: ScooterReviewPrompt = ScooterReviewPrompt(defaults = defaults, version = ScooterLinks.appVersion)

    /** The rider is back from a ride: the load that follows says whether this is the moment to ask. */
    internal var awaitsReviewLoad = false

    // What the data on the map was requested for: the dock only reports an area as empty once the data covers it.
    private var queryBounds: GeoBounds? = null
    private var queryZoom: Int? = null
    internal var queryMinimumBattery: Int? = null
        private set
    private var pendingQueryBounds: GeoBounds? = null
    private var pendingQueryZoom: Int? = null
    private var pendingQueryMinimumBattery: Int? = null
    private var fetchTask: Job? = null
    private var refreshTimerTask: Job? = null
    private var parkingExpiryTask: Job? = null

    /** When the previous request finished, whatever its outcome. */
    private var lastAttemptAt: Instant? = null
    private var lastSuccessAt: Instant? = null

    /** The gap before the next request when the data on screen asked for a quick follow-up. */
    private var followUpGap: Double? = null

    /** The last response was refreshing, for this query; its follow-up was already granted. */
    private var followedUpQuery: ScooterFollowUpQuery? = null
    private var vehiclesExpireAt: Instant? = null
    private var parkingExpireAt: Instant? = null
    private var locationTimeoutTask: Job? = null
    private var knownAuthorizationStatus: ScooterAuthorizationStatus = locationManager.authorizationStatus
    private var activeRequestID: Long? = null
    private var fetchRequests = 0L
    private var bestLocationCandidate: ScooterLocationFix? = null

    /** Set while a card asked for the location: the first fix leaves the map where it is. */
    private var keepsMapOnFirstFix = false

    /**
     * Counts the places and cities the rider sent the map to, so that a fix can tell whether one was chosen
     * while it was on its way.
     */
    private var placeChoices = 0
    private var placeChoicesAtLocate = 0
    private var focusToken = 0
    private var zoomToken = 0
    private var hasStarted = false

    /** Scooters are asked for, and walks measured, from here until the phone's location is known. */
    private val startCenter: GeoPoint = start.center
    private var distanceOrigin: GeoPoint = start.center
    internal var vehiclesByID: Map<String, Scooter> = emptyMap()
        private set

    /** The zones of the area last answered for, with whether asking failed; they stay drawn while a new area's are on their way. */
    internal var zoneAnswer: ScooterZoneAnswer? = null

    /** Complete answers of the last few minutes, newest first, which serve views within their area as the browser's copy does on the web. */
    internal var recentZoneAnswers: List<ScooterZoneAnswer> = emptyList()
    internal var zoneTask: Job? = null
    internal var zoneTaskArea: ScooterZoneArea? = null

    private val _mapScooters = MutableStateFlow<List<Scooter>>(emptyList())
    val mapScooters: StateFlow<List<Scooter>> = _mapScooters.asStateFlow()

    private val _mapScootersRevision = MutableStateFlow(0)
    val mapScootersRevision: StateFlow<Int> = _mapScootersRevision.asStateFlow()

    private val _mapClusters = MutableStateFlow<List<ScooterCluster>>(emptyList())
    val mapClusters: StateFlow<List<ScooterCluster>> = _mapClusters.asStateFlow()

    private val _mapClustersRevision = MutableStateFlow(0)
    val mapClustersRevision: StateFlow<Int> = _mapClustersRevision.asStateFlow()

    /** The last-seen scooters and groups drawn faded, filtered as those above. */
    private val _mapLastSeenScooters = MutableStateFlow<List<Scooter>>(emptyList())
    val mapLastSeenScooters: StateFlow<List<Scooter>> = _mapLastSeenScooters.asStateFlow()

    private val _mapLastSeenClusters = MutableStateFlow<List<ScooterCluster>>(emptyList())
    val mapLastSeenClusters: StateFlow<List<ScooterCluster>> = _mapLastSeenClusters.asStateFlow()

    private val _mapLastSeenRevision = MutableStateFlow(0)
    val mapLastSeenRevision: StateFlow<Int> = _mapLastSeenRevision.asStateFlow()

    private val _visibleScooterCount = MutableStateFlow(0)
    val visibleScooterCount: StateFlow<Int> = _visibleScooterCount.asStateFlow()

    /** The faded scooters in view that pass the filters, counted apart from the others. */
    private val _visibleLastSeenCount = MutableStateFlow(0)
    val visibleLastSeenCount: StateFlow<Int> = _visibleLastSeenCount.asStateFlow()

    private val _visibleProviderCounts = MutableStateFlow<Map<ScooterProvider, Int>>(emptyMap())
    val visibleProviderCounts: StateFlow<Map<ScooterProvider, Int>> = _visibleProviderCounts.asStateFlow()

    internal var unfilteredVisibleCount = 0
        private set
    internal var unfilteredVisibleProviders: Set<ScooterProvider> = emptySet()
        private set

    init {
        if (debug) {
            // A screenshot's camera stays where it was set when the rider is located.
            keepsMapOnFirstFix = defaults.string(forKey = "ScreenshotCamera") != null
            // The first fresh feed is a return from a ride, and the moment to ask.
            reviewPrompt.alwaysDue = defaults.bool(forKey = "ReviewPromptDue")
            awaitsReviewLoad = reviewPrompt.alwaysDue
        }
        locationManager.distanceFilter = DISTANCE_FILTER
    }

    // What the screen sets.

    fun setViewport(value: GeoBounds) {
        _viewport.value = value
        rebuildVisibleCounts()
    }

    fun setUserLocation(value: GeoPoint?) {
        val oldValue = _userLocation.value
        _userLocation.value = value
        if (value != oldValue) walkOriginDidChange()
    }

    fun setSelectedScooterID(value: String?) {
        val oldValue = _selectedScooterID.value
        _selectedScooterID.value = value
        if (value != null) setSelectedParkingID(null)
        if (value != oldValue) endWalkIfTargetLeftSelection()
    }

    private fun setSelectedParkingID(value: String?) {
        val oldValue = _selectedParkingID.value
        _selectedParkingID.value = value
        if (value != oldValue) endWalkIfTargetLeftSelection()
    }

    fun setPanelCollapsed(value: Boolean) {
        _isPanelCollapsed.value = value
    }

    fun setSearchedDestination(value: MapDestination?) {
        val oldValue = _searchedDestination.value
        _searchedDestination.value = value
        if (value != oldValue) walkOriginDidChange()
    }

    fun setMapStyle(value: AppleMapStyle) {
        val oldValue = _mapStyle.value
        _mapStyle.value = value
        if (oldValue != value) analytics?.track("map_style", result = value.rawValue)
        defaults.set(value.rawValue, forKey = MAP_STYLE_KEY)
    }

    fun setShowsZones(value: Boolean) {
        val oldValue = _showsZones.value
        _showsZones.value = value
        if (oldValue == value) return
        analytics?.track("zones_toggle", result = if (value) "enabled" else "disabled")
        defaults.set(value, forKey = SHOWS_ZONES_KEY)
        updateZones()
    }

    fun setAppearance(value: ScooterAppearance) {
        val oldValue = _appearance.value
        _appearance.value = value
        if (oldValue != value) {
            // Under the name and with the values the web sends.
            analytics?.track("map_style", result = if (value == ScooterAppearance.System) "auto" else value.rawValue)
        }
        defaults.set(value.rawValue, forKey = APPEARANCE_KEY)
    }

    fun setLanguageChoice(value: ScooterLanguageChoice) {
        val oldValue = _languageChoice.value
        _languageChoice.value = value
        if (oldValue == value) return
        when (value) {
            ScooterLanguageChoice.Automatic -> {
                analytics?.track("language_change", result = "auto")
                keepAppLanguages(emptyList())
                setLanguage(phoneLanguage)
            }
            is ScooterLanguageChoice.Language -> {
                analytics?.track("language_change", result = value.language.rawValue)
                keepAppLanguages(listOf(value.language.rawValue))
                setLanguage(value.language)
            }
        }
    }

    private fun setLanguage(value: ScooterLanguage) {
        val oldValue = _language.value
        _language.value = value
        if (oldValue == value) return
        ScooterLanguage.current = value
        // Countries are named in it.
        rebuildMapClusters()
    }

    /** The language the app follows on Automatic: the first of the phone's languages it is translated into, or else English. */
    val phoneLanguage: ScooterLanguage get() = ScooterLanguage.fromPreferences(phoneLanguages())

    /** Light or dark now. Automatic goes by the sun where the rider is, or where the map opened until they are located. */
    val interfaceStyle: UserInterfaceStyle
        get() = appearance.value.interfaceStyle(clock(), userLocation.value ?: startCenter)

    private fun setVehicles(value: List<Scooter>) {
        _vehicles.value = value
        rebuildVehicleIndex()
        rebuildMapScooters()
        rebuildVisibleCounts()
    }

    private fun setClusters(value: List<ScooterCluster>) {
        _clusters.value = value
        rebuildMapClusters()
        rebuildVisibleCounts()
    }

    private fun setLastSeenVehicles(value: List<Scooter>) {
        _lastSeenVehicles.value = value
        rebuildMapLastSeen()
        rebuildVisibleCounts()
    }

    private fun setLastSeenClusters(value: List<ScooterCluster>) {
        _lastSeenClusters.value = value
        rebuildMapLastSeen()
        rebuildVisibleCounts()
    }

    private fun setLocationProblem(value: ScooterLocationIssue?) {
        val oldValue = locationProblem
        locationProblem = value
        if (value != oldValue) locationIssueDismissed = false
        _locationIssue.value = if (locationIssueDismissed) null else locationProblem
    }

    private fun setLocationIssueDismissed(value: Boolean) {
        locationIssueDismissed = value
        _locationIssue.value = if (locationIssueDismissed) null else locationProblem
    }

    private fun setEnabledProviders(value: Set<ScooterProvider>) {
        _enabledProviders.value = value
        // The providers turned off, not those on as iOS keeps them, so that one a later catalog adds shows.
        defaults.set((ScooterProvider.entries - value).map { it.rawValue }.sorted(), forKey = DISABLED_PROVIDERS_KEY)
        rebuildMapScooters()
        rebuildMapClusters()
        rebuildMapLastSeen()
        rebuildMapZones()
        rebuildVisibleCounts()
        clearSelectionIfHidden()
    }

    private fun assignMinimumBattery(value: Double) {
        _minimumBattery.value = value
        defaults.set(value.toInt(), forKey = MINIMUM_BATTERY_KEY)
        rebuildMapScooters()
        rebuildMapLastSeen()
        rebuildVisibleCounts()
        clearSelectionIfHidden()
    }

    internal fun setWalk(value: ScooterWalk?) {
        val oldValue = _walk.value
        _walk.value = value
        walkDidChange(oldValue)
    }

    fun setRideEstimateMinutes(minutes: Int) {
        val normalizedMinutes = RideEstimateDuration.normalized(minutes)
        if (normalizedMinutes == rideEstimateMinutes.value) return
        analytics?.track("ride_duration", value = normalizedMinutes)
        _rideEstimateMinutes.value = normalizedMinutes
        defaults.set(normalizedMinutes, forKey = RIDE_ESTIMATE_MINUTES_KEY)
    }

    fun ridePass(provider: ScooterProvider): ProviderRidePass = ridePasses.value[provider] ?: ProviderRidePass()

    fun setRidePass(pass: ProviderRidePass, provider: ScooterProvider) {
        analytics?.track("ride_pass_change", provider = provider.rawValue)
        _ridePasses.value = ridePasses.value + (provider to pass)
        persistRidePasses()
    }

    fun ridePriceQuote(
        scooter: Scooter,
        now: Instant = Instant.now(),
        zone: ZoneId = ScooterDateFormat.timeZone(),
    ): RidePriceQuote? {
        val pricing = scooter.pricing ?: return null
        val pass = scooter.providerInfo?.let { ridePass(it) }
        return RidePriceEstimator.quote(
            pricing = pricing,
            durationMinutes = rideEstimateMinutes.value,
            pass = pass,
            now = now,
            zone = zone,
        )
    }

    fun start() {
        if (hasStarted) return
        hasStarted = true
        // Android may have closed the app during the ride.
        noteReturnFromRide()

        if (locationManager.authorizationStatus.isAuthorized) {
            startHeadingUpdates()
            val cachedLocation = locationManager.location
            if (cachedLocation != null &&
                ScooterLocationPolicy.isAcceptable(cachedLocation, maximumAccuracy = ScooterLocationPolicy.preferredAccuracy)
            ) {
                acceptLocation(cachedLocation)
            } else {
                requestLocationAccess()
            }
        } else {
            refresh()
        }
    }

    fun becameActive() {
        isSceneActive = true
        if (hasStarted) startHeadingUpdates()
        expireParkingIfNeeded()
        noteReturnFromRide()
        // Back in the foreground a due refresh starts at once. The old data stays on the map until the outcome
        // is known.
        refreshIfDue(respectingAttemptGap = false)
        // Data not due for a refresh is as fresh as one would make it. Before the first load, as while the
        // first fix is found, that load decides.
        if (awaitsReviewLoad && fetchTask == null && lastSuccessAt != null) reviewAfterLoad()
    }

    fun becameInactive() {
        isSceneActive = false
        stopHeadingUpdates()
        refreshTimerTask?.cancel()
        refreshTimerTask = null
        // A moment to ask for a rating ends when the rider leaves.
        awaitsReviewLoad = false
        reviewDue = false
    }

    private fun startHeadingUpdates() {
        if (!isSceneActive || isTrackingHeading || !locationManager.isHeadingAvailable ||
            !locationManager.authorizationStatus.isAuthorized
        ) {
            return
        }
        isTrackingHeading = true
        // Location updates let the phone resolve true north for the map.
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }

    /** Which way up the screen shows, for the heading to be the way the person faces. */
    fun setHeadingOrientation(orientation: ScooterDeviceOrientation) {
        if (locationManager.headingOrientation == orientation) return
        locationManager.headingOrientation = orientation
    }

    private fun stopHeadingUpdates() {
        locationManager.stopUpdatingHeading()
        isTrackingHeading = false
        _userHeading.value = null
    }

    /** What the refresh timer does when it fires: bays past their time go, and the scooters are fetched again once they are due or have expired. */
    fun autoRefreshIfNeeded() {
        expireParkingIfNeeded()
        // A city's rules start and end with their hours.
        rebuildMapZones()
        refreshIfDue(respectingAttemptGap = true)
    }

    private val refreshAfter: Double
        get() {
            refreshPolicy.askedFollowUp(responseMetadata.value)?.let { return it }
            val seconds = responseMetadata.value?.refreshAfterSeconds
            if (seconds == null || seconds <= 0) return refreshPolicy.defaultRefreshAfter
            return seconds.toDouble()
        }

    private fun refreshIfDue(respectingAttemptGap: Boolean) {
        // A request in flight decides the outcome; nothing is cleared meanwhile.
        if (!isSceneActive || fetchTask != null) return
        if (lastAttemptAt == null) {
            if (!isLocating.value) refresh()
            return
        }

        val due = if (respectingAttemptGap) {
            refreshPolicy.nextAttempt(
                lastSuccess = lastSuccessAt,
                refreshAfter = refreshAfter,
                expiresAt = vehiclesExpireAt,
                lastAttempt = lastAttemptAt,
                attemptGap = followUpGap,
            )
        } else {
            refreshPolicy.refreshDue(
                lastSuccess = lastSuccessAt,
                refreshAfter = refreshAfter,
                expiresAt = vehiclesExpireAt,
                attemptGap = followUpGap,
            )
        }
        if (clock() >= due) {
            refresh()
        } else {
            scheduleAutomaticRefresh()
        }
    }

    private fun scheduleAutomaticRefresh() {
        refreshTimerTask?.cancel()
        refreshTimerTask = null
        if (!isSceneActive || fetchTask != null || lastAttemptAt == null) return

        val nextAttempt = refreshPolicy.nextAttempt(
            lastSuccess = lastSuccessAt,
            refreshAfter = refreshAfter,
            expiresAt = vehiclesExpireAt,
            lastAttempt = lastAttemptAt,
            attemptGap = followUpGap,
        )
        val wait = max(0.0, nextAttempt.timeIntervalSince(clock()))
        refreshTimerTask = scope.launch {
            delay(wait.seconds)
            refreshTimerTask = null
            autoRefreshIfNeeded()
        }
    }

    fun updateViewport(region: MapRegion, zoom: Int, zoomLevel: Double? = null) {
        val nextViewport = GeoBounds(region)
        setViewport(nextViewport)
        _viewportZoom.value = zoom
        updateZones()
        val nextZoomLevel = zoomLevel ?: zoom.toDouble()
        if (nextZoomLevel != viewportZoomLevel.value) {
            _viewportZoomLevel.value = nextZoomLevel
            if (responseMetadata.value?.overview == true) rebuildMapClusters()
        }
        clearSelectionIfHidden()

        if (queryCovers(nextViewport, zoom = zoom, pending = false)) {
            if (fetchTask != null && !queryCovers(nextViewport, zoom = zoom, pending = true)) {
                cancelPendingFetch()
            }
            return
        }
        if (queryCovers(nextViewport, zoom = zoom, pending = true)) return
        scheduleFetch(nextViewport.expanded(by = 0.25), zoom = zoom, debounce = true)
    }

    fun refresh() {
        scheduleFetch(viewport.value.expanded(by = 0.25), zoom = viewportZoom.value, debounce = false)
    }

    /** "Try again" and "Refresh": a manual refresh, fetched at once. */
    fun retryLoad() {
        analytics?.track("refresh")
        refresh()
    }

    fun showAllProviders() {
        analytics?.track("providers_all")
        setEnabledProviders(ScooterProvider.entries.toSet())
    }

    fun showProviders(providers: Set<ScooterProvider>) {
        analytics?.track(
            "provider_filter",
            provider = if (providers.size == 1) providers.firstOrNull()?.rawValue else null,
            value = providers.size,
        )
        setEnabledProviders(providers)
    }

    fun toggleQuickProvider(provider: ScooterProvider) {
        if (allProvidersSelected) {
            showProviders(setOf(provider))
        } else if (enabledProviders.value == setOf(provider)) {
            showAllProviders()
        } else {
            toggle(provider)
        }
    }

    fun toggle(provider: ScooterProvider) {
        analytics?.track(
            "provider_filter",
            provider = provider.rawValue,
            result = if (provider in enabledProviders.value) "disabled" else "enabled",
        )
        if (provider in enabledProviders.value) {
            setEnabledProviders(enabledProviders.value - provider)
        } else {
            setEnabledProviders(enabledProviders.value + provider)
        }
    }

    fun resetFilters() {
        analytics?.track("filters_reset")
        val batteryChanged = minimumBattery.value != 0.0
        assignMinimumBattery(0.0)
        setEnabledProviders(ScooterProvider.entries.toSet())
        if (batteryChanged && ScooterClusteringPolicy.shouldCluster(viewportZoom.value)) {
            setClusters(emptyList())
            setLastSeenClusters(emptyList())
            scheduleFetch(viewport.value.expanded(by = 0.25), zoom = viewportZoom.value, debounce = true)
        }
    }

    /** Sets the minimum battery to a preset; other values snap down (45 → 30). */
    fun setMinimumBattery(value: Double) {
        val normalizedValue = ScooterBatteryFilter.snapped(
            if (value.isFinite()) min(100.0, max(0.0, value)).toInt() else 0,
        ).toDouble()
        if (normalizedValue == minimumBattery.value) return
        analytics?.track("battery_filter", value = normalizedValue.toInt())
        assignMinimumBattery(normalizedValue)
        if (ScooterClusteringPolicy.shouldCluster(viewportZoom.value)) {
            setClusters(emptyList())
            setLastSeenClusters(emptyList())
            scheduleFetch(viewport.value.expanded(by = 0.25), zoom = viewportZoom.value, debounce = true)
        }
    }

    fun focusOnUser() {
        analytics?.track("locate")
        setSearchedDestination(null)
        keepsMapOnFirstFix = false
        val userLocation = userLocation.value
        if (userLocation != null) {
            requestUserFocus(userLocation)
        } else {
            _isLocating.value = true
            requestLocationAccess()
        }
    }

    /** Ctrl+ and Ctrl−: the map comes `by` steps closer in, or goes out with a negative number, around what is in the middle of it. */
    fun zoom(by: Int) {
        if (by == 0) return
        zoomToken += 1
        _zoomRequest.value = MapZoomRequest(steps = by, token = zoomToken)
    }

    /**
     * "Turn on location to see walking time" on a card: locates like Near me, but the map stays where it is,
     * so the card is not closed by the map moving away from the scooter.
     */
    fun locateForWalkingTime() {
        if (userLocation.value != null) return
        analytics?.track("locate")
        keepsMapOnFirstFix = true
        _isLocating.value = true
        requestLocationAccess()
    }

    /** Chooses a place found in the search: it becomes the origin for walking times, is remembered for this session and the map moves there. */
    fun focusOnAddress(destination: MapDestination) {
        analytics?.track("search_select")
        choosePlace(destination)
    }

    private fun choosePlace(destination: MapDestination) {
        // A walk under way goes on from the new place when it is still a walk from there. Its route then shows
        // the place and the scooter, and the map fits it rather than move to the place first.
        val keepsWalk = walk.value?.let { it.isUnderway && WalkRoute.isWalk(from = destination.point, to = it.target.point) } ?: false
        if (!keepsWalk) {
            setSelectedScooterID(null)
            setSelectedParkingID(null)
        }
        placeChoices += 1
        setSearchedDestination(destination)
        rememberPlace(destination)
        if (keepsWalk) return
        focusToken += 1
        _focusRequest.value = if (destination.kind == MapDestination.Kind.City) {
            MapFocusRequest.city(destination.point, token = focusToken)
        } else {
            MapFocusRequest(point = destination.point, token = focusToken)
        }
    }

    /** A "Cities with scooters" chip: like choosing the city as a place. */
    fun chooseCity(city: ScooterCity) {
        focusOnAddress(city.destination)
    }

    /** A closest-city chip: the city becomes the place, like its chip in the search, so walking times start there and not at the place without data. */
    fun focusOnCity(city: ScooterCity) {
        choosePlace(city.destination)
    }

    /**
     * A link to the map from the website (ScooterMapLink). A city's centre, which is what the site's links
     * carry, opens like the city chosen in the search; any other point only moves the map there. Either way
     * the first fix of the rider's location leaves the map where the link put it, also when the link opened
     * the app before locating began.
     */
    fun open(link: ScooterMapLink) {
        link.minimumBattery?.let { setMinimumBattery(it.toDouble()) }
        val origin = link.origin
        if (origin == null) {
            analytics?.track("link_open", result = "map")
            return
        }
        keepsMapOnFirstFix = true
        val city = ScooterCityCatalog.city(linkedAt = origin)
        if (city != null) {
            analytics?.track("link_open", result = "city")
            choosePlace(city.destination)
        } else {
            analytics?.track("link_open", result = "place")
            focusToken += 1
            _focusRequest.value = MapFocusRequest.city(origin, token = focusToken)
        }
    }

    private fun rememberPlace(destination: MapDestination) {
        val places = recentPlaces.value.filter { it.id != destination.id }.toMutableList()
        places.add(0, destination)
        _recentPlaces.value = places.take(MAXIMUM_RECENT_PLACES)
    }

    /** The card header: centres the scooter and leaves the zoom as it is. */
    fun focusOnScooter(scooter: Scooter) {
        selectScooter(scooter.id)
        focusToken += 1
        _focusRequest.value = MapFocusRequest.center(scooter.coordinate, token = focusToken)
    }

    fun clearAddressSearch() {
        setSearchedDestination(null)
    }

    fun selectScooter(id: String?) {
        if (id == selectedScooterID.value) return
        analytics?.track(if (id == null) "vehicle_dismiss" else "vehicle_select", provider = id?.let { vehiclesByID[it]?.provider })
        setSelectedScooterID(id)
        // Its card opens in the panel, which unfolds to show it.
        if (id != null) _isPanelCollapsed.value = false
    }

    /** Selects a parking bay by id, or closes the bay card with null. The map reports `parking_select` itself, so nothing is tracked here. */
    fun selectParking(id: String?) {
        if (id == selectedParkingID.value) return
        if (id != null) setSelectedScooterID(null)
        setSelectedParkingID(id)
        if (id != null) _isPanelCollapsed.value = false
    }

    /** A tap on the map background: closes the scooter or the bay card. */
    fun clearSelection() {
        selectScooter(null)
        setSelectedParkingID(null)
    }

    fun dismissLocationIssue() {
        setLocationIssueDismissed(true)
    }

    private fun passesBatteryFilter(scooter: Scooter): Boolean =
        ScooterFiltering.passesBattery(scooter, minimumBattery = minimumBattery.value)

    internal fun rebuildMapScooters() {
        val next = ScooterFiltering.mapScooters(
            from = vehicles.value,
            minimumBattery = minimumBattery.value,
            enabledProviders = enabledProviders.value,
        ).toMutableList()
        // The scooter walked to stays on the map whatever the map shows around it.
        val held = walk.value?.heldScooter
        if (held != null && next.none { it.id == held.id }) next += held
        if (next == mapScooters.value) return
        _mapScooters.value = next
        _mapScootersRevision.value += 1
    }

    private fun rebuildMapClusters() {
        var next = clusters.value.mapNotNull { it.filtered(enabledProviders.value) }
        if (responseMetadata.value?.overview == true) {
            val language = language.value
            val locale = language.locale
            next = ScooterCityGrouping.group(next, zoomLevel = viewportZoomLevel.value, language = language) { code ->
                regionName(code, locale)
            }
        }
        if (next == mapClusters.value) return
        _mapClusters.value = next
        _mapClustersRevision.value += 1
    }

    /** A faded group keeps the providers that are shown, as the others do, and is drawn only where the server groups the scooters. */
    private fun rebuildMapLastSeen() {
        val scooters = ScooterFiltering.mapScooters(
            from = lastSeenVehicles.value,
            minimumBattery = minimumBattery.value,
            enabledProviders = enabledProviders.value,
        )
        val groups = if (responseMetadata.value?.mode == "clusters") {
            lastSeenClusters.value.mapNotNull { it.filtered(enabledProviders.value) }
        } else {
            emptyList()
        }
        if (scooters == mapLastSeenScooters.value && groups == mapLastSeenClusters.value) return
        _mapLastSeenScooters.value = scooters
        _mapLastSeenClusters.value = groups
        _mapLastSeenRevision.value += 1
    }

    private fun rebuildVehicleIndex() {
        // The latest of two scooters with one id wins.
        vehiclesByID = vehicles.value.associateBy { it.id }
    }

    private fun rebuildVisibleCounts() {
        val summary = ScooterFiltering.visibleSummary(
            vehicles = vehicles.value,
            viewport = viewport.value,
            minimumBattery = minimumBattery.value,
            enabledProviders = enabledProviders.value,
        )
        var count = summary.count
        val providers = summary.providerCounts.toMutableMap()
        var unfilteredCount = summary.unfilteredCount
        val unfilteredProviders = summary.unfilteredProviders.toMutableSet()
        if (responseMetadata.value?.mode == "clusters") {
            for (cluster in clusters.value) {
                if (!viewport.value.contains(cluster.latitude, cluster.longitude)) continue
                for ((providerID, providerCount) in cluster.providers) {
                    unfilteredCount += providerCount
                    val provider = ScooterProvider.fromRawValue(providerID) ?: continue
                    if (providerCount > 0) unfilteredProviders += provider
                    providers[provider] = (providers[provider] ?: 0) + providerCount
                    if (provider in enabledProviders.value) count += providerCount
                }
            }
        }
        _visibleScooterCount.value = count
        _visibleProviderCounts.value = providers
        unfilteredVisibleCount = unfilteredCount
        unfilteredVisibleProviders = unfilteredProviders

        var lastSeenCount = ScooterFiltering.visibleSummary(
            vehicles = lastSeenVehicles.value,
            viewport = viewport.value,
            minimumBattery = minimumBattery.value,
            enabledProviders = enabledProviders.value,
        ).count
        if (responseMetadata.value?.mode == "clusters") {
            for (cluster in lastSeenClusters.value) {
                if (!viewport.value.contains(cluster.latitude, cluster.longitude)) continue
                lastSeenCount += cluster.filtered(enabledProviders.value)?.count ?: 0
            }
        }
        _visibleLastSeenCount.value = lastSeenCount
    }

    internal val representedVehicleCount: Int
        get() = vehicles.value.size + clusters.value.sumOf { it.count }

    private fun clearSelectionIfHidden() {
        val selectedParkingID = selectedParkingID.value
        if (selectedParkingID != null && mapParking.none { it.id == selectedParkingID }) {
            setSelectedParkingID(null)
        }

        // The scooter walked to stays selected wherever the map goes.
        val selectedScooter = selectedScooter ?: return
        if (walk.value?.heldScooter?.id == selectedScooter.id) return
        val remainsVisible = viewport.value.contains(selectedScooter.latitude, selectedScooter.longitude) &&
            passesBatteryFilter(selectedScooter) &&
            (allProvidersSelected || selectedScooter.providerInfo?.let { it in enabledProviders.value } == true)

        if (!remainsVisible) {
            setSelectedScooterID(null)
        }
    }

    private fun scheduleFetch(bounds: GeoBounds, zoom: Int, debounce: Boolean) {
        fetchTask?.cancel()
        refreshTimerTask?.cancel()
        refreshTimerTask = null

        fetchRequests += 1
        val requestID = fetchRequests
        val fetchOrigin = userLocation.value ?: startCenter
        val requestMinimumBattery = if (ScooterClusteringPolicy.shouldCluster(zoom)) minimumBattery.value.toInt() else 0
        activeRequestID = requestID
        pendingQueryBounds = bounds
        pendingQueryZoom = zoom
        pendingQueryMinimumBattery = requestMinimumBattery
        fetchTask = scope.launch {
            try {
                if (debounce) delay(180.milliseconds)
                if (!isActive) return@launch
                _isLoading.value = true

                val response = try {
                    api.scooters(bounds = bounds, zoom = zoom, minimumBattery = requestMinimumBattery)
                } catch (_: CancellationException) {
                    return@launch
                } catch (error: Exception) {
                    if (activeRequestID != requestID) return@launch
                    // Retries repeat every few seconds; report a failure once, when it starts.
                    if (loadIssue.value == null) {
                        analytics?.track("data_error", result = "request_failed")
                    }
                    lastAttemptAt = clock()
                    followUpGap = null
                    handleLoadFailure(ScooterLoadFailure(error))
                    reviewAfterLoad()
                    return@launch
                }
                if (!isActive || activeRequestID != requestID) return@launch
                // The backend preserves recent successful feeds independently. Accept healthy cities even when
                // another operator is unavailable. A response is shown whatever its own timestamps say.
                val receivedAt = clock()
                _vehicles.value = response.vehicles
                _clusters.value = response.clusters
                _lastSeenVehicles.value = response.lastSeenVehicles
                _lastSeenClusters.value = response.lastSeenClusters
                _parking.value = response.parking
                _responseMetadata.value = response.meta
                queryBounds = bounds
                queryZoom = zoom
                queryMinimumBattery = requestMinimumBattery
                rebuildVehicleIndex()
                followWalkTarget(response.meta, loadedFor = bounds)
                rebuildMapScooters()
                rebuildMapClusters()
                rebuildMapLastSeen()
                rebuildVisibleCounts()
                distanceOrigin = fetchOrigin
                val generatedAt = apiDate(response.meta?.generatedAt, clockOffset = response.clockOffset)
                _lastUpdated.value = minOf(generatedAt ?: receivedAt, receivedAt)
                _lastSeenAt.value = apiDate(response.meta?.lastSeenAt, clockOffset = response.clockOffset)?.let { minOf(it, receivedAt) }
                lastSuccessAt = receivedAt
                lastAttemptAt = receivedAt
                // The server is collecting feeds of this answer again: ask again when it says (followUpMs), at
                // once while a quick feed is on its way. A server that does not say is asked once more soon, but
                // only once in a row, unless scooters stand where they were last seen, which its sweeps replace.
                val query = ScooterFollowUpQuery(bounds = bounds, zoom = zoom, minimumBattery = requestMinimumBattery)
                val refreshing = response.meta?.refreshing == true
                val filling = response.lastSeenVehicles.isNotEmpty() || response.lastSeenClusters.isNotEmpty()
                followUpGap = refreshPolicy.askedFollowUp(response.meta)
                    ?: if (refreshing && (filling || followedUpQuery != query)) refreshPolicy.followUpGap else null
                followedUpQuery = if (refreshing) query else null
                _loadIssue.value = null
                scheduleDataExpiry(response.meta, receivedAt = receivedAt, clockOffset = response.clockOffset)
                expireParkingIfNeeded()
                clearSelectionIfHidden()
                reviewAfterLoad()
            } finally {
                if (activeRequestID == requestID) clearPendingFetch()
            }
        }
    }

    private fun handleLoadFailure(failure: ScooterLoadFailure) {
        val lastUpdated = lastUpdated.value
        if (lastUpdated == null) {
            _loadIssue.value = ScooterLoadIssue.FirstLoadFailed(failure)
            return
        }
        val loadIssue = loadIssue.value
        if (loadIssue is ScooterLoadIssue.OutOfDate) {
            _loadIssue.value = ScooterLoadIssue.OutOfDate(failure, lastUpdate = loadIssue.lastUpdate)
            return
        }
        val vehiclesExpireAt = vehiclesExpireAt
        if (vehiclesExpireAt == null || clock() < vehiclesExpireAt) {
            // The data on the map is still valid and stays exactly as it is.
            _loadIssue.value = ScooterLoadIssue.RefreshFailed(failure, showing = lastUpdated)
            return
        }

        // Only now is the data both expired and impossible to renew.
        setVehicles(emptyList())
        setClusters(emptyList())
        setLastSeenVehicles(emptyList())
        setLastSeenClusters(emptyList())
        _lastSeenAt.value = null
        setSelectedScooterID(null)
        setSelectedParkingID(null)
        queryBounds = null
        _loadIssue.value = ScooterLoadIssue.OutOfDate(failure, lastUpdate = lastUpdated)
    }

    private fun clearPendingFetch() {
        _isLoading.value = false
        activeRequestID = null
        pendingQueryBounds = null
        pendingQueryZoom = null
        pendingQueryMinimumBattery = null
        fetchTask = null
        scheduleAutomaticRefresh()
    }

    private fun cancelPendingFetch() {
        fetchTask?.cancel()
        clearPendingFetch()
    }

    /**
     * The server's times are moved onto this device's clock first: a clock that is minutes fast would
     * otherwise find every response expired on arrival.
     */
    private fun scheduleDataExpiry(meta: ScooterResponseMetadata?, receivedAt: Instant, clockOffset: Double) {
        val observedAt = minOf(receivedAt, apiDate(meta?.generatedAt, clockOffset) ?: receivedAt)
        val maximumAge = if (meta?.overview == true) 3.0 * 3600 else 900.0
        // Scooters past this moment are only cleared once a refresh has failed.
        vehiclesExpireAt = minOf(apiDate(meta?.expiresAt, clockOffset) ?: distantFuture, observedAt.addingTimeInterval(maximumAge))
        val parkingExpireAt = minOf(apiDate(meta?.parkingExpiresAt, clockOffset) ?: distantFuture, receivedAt.addingTimeInterval(300.0))
        this.parkingExpireAt = parkingExpireAt

        parkingExpiryTask?.cancel()
        val wait = max(0.0, parkingExpireAt.timeIntervalSince(receivedAt))
        parkingExpiryTask = scope.launch {
            delay(wait.seconds)
            expireParkingIfNeeded()
        }
    }

    /** Parking bays expire on their own schedule, whatever happens to the scooters. */
    fun expireParkingIfNeeded() {
        val parkingExpireAt = parkingExpireAt ?: return
        if (clock() < parkingExpireAt) return
        this.parkingExpireAt = null
        _parking.value = emptyList()
        clearSelectionIfHidden()
    }

    private fun fetchIfNeeded(targetViewport: GeoBounds, zoom: Int? = null, debounce: Boolean = false) {
        val targetZoom = zoom ?: viewportZoom.value
        if (queryCovers(targetViewport, zoom = targetZoom, pending = false)) {
            if (fetchTask != null && !queryCovers(targetViewport, zoom = targetZoom, pending = true)) {
                cancelPendingFetch()
            }
            return
        }
        if (queryCovers(targetViewport, zoom = targetZoom, pending = true)) return
        scheduleFetch(targetViewport.expanded(by = 0.25), zoom = targetZoom, debounce = debounce)
    }

    internal fun queryCovers(targetViewport: GeoBounds, zoom: Int, pending: Boolean): Boolean {
        val bounds = if (pending) pendingQueryBounds else queryBounds
        val storedZoom = if (pending) pendingQueryZoom else queryZoom
        val storedMinimumBattery = if (pending) pendingQueryMinimumBattery else queryMinimumBattery
        if (bounds?.contains(targetViewport) != true || storedZoom == null ||
            !ScooterClusteringPolicy.representationsMatch(storedZoom, zoom)
        ) {
            return false
        }

        val targetMinimumBattery = if (ScooterClusteringPolicy.shouldCluster(zoom)) minimumBattery.value.toInt() else 0
        return storedMinimumBattery == targetMinimumBattery
    }

    private val isLocationAuthorized: Boolean get() = locationManager.authorizationStatus.isAuthorized

    private fun requestLocationAccess() {
        // A new attempt brings a dismissed card back and retires the last "not found".
        setLocationIssueDismissed(false)
        if (locationProblem == ScooterLocationIssue.NotFound) setLocationProblem(null)
        placeChoicesAtLocate = placeChoices

        when (locationManager.authorizationStatus) {
            ScooterAuthorizationStatus.NotDetermined -> {
                setLocationProblem(null)
                _isLocating.value = true
                // The wait for a fix starts with the answer to the prompt, however long that takes: the
                // authorization callback begins it.
                locationManager.requestWhenInUseAuthorization()
            }
            ScooterAuthorizationStatus.AuthorizedAlways, ScooterAuthorizationStatus.AuthorizedWhenInUse -> {
                setLocationProblem(null)
                _isLocating.value = true
                locationManager.startUpdatingLocation()
                startHeadingUpdates()
                if (userLocation.value == null) {
                    beginLocationTimeout()
                }
            }
            ScooterAuthorizationStatus.Denied -> {
                setLocationProblem(ScooterLocationIssue.Denied)
                _isLocating.value = false
                finishLocationAttemptWithoutFix()
            }
            ScooterAuthorizationStatus.Restricted -> {
                setLocationProblem(ScooterLocationIssue.Restricted)
                _isLocating.value = false
                finishLocationAttemptWithoutFix()
            }
        }
    }

    /** The location service's authorization changed, or is reported: `locationManager.authorizationStatus` says what it is. */
    fun authorizationChanged() {
        val status = locationManager.authorizationStatus
        val statusChanged = status != knownAuthorizationStatus
        knownAuthorizationStatus = status
        if (!status.isAuthorized) {
            stopHeadingUpdates()
        }
        // The location service can deliver the current authorization state as soon as it is listened to. Wait
        // until the app has actually requested a location so that setting up cannot unexpectedly recentre
        // the map.
        if (!hasStarted && !isLocating.value) return

        when (status) {
            ScooterAuthorizationStatus.AuthorizedAlways, ScooterAuthorizationStatus.AuthorizedWhenInUse -> {
                setLocationProblem(null)
                locationManager.startUpdatingLocation()
                startHeadingUpdates()
                // With a position already in hand there is nothing to wait for.
                if (userLocation.value == null) {
                    _isLocating.value = true
                    beginLocationTimeout()
                }
            }
            ScooterAuthorizationStatus.Denied, ScooterAuthorizationStatus.Restricted -> {
                // The same goes for the location card: a refusal that was already known, with no request
                // pending, answers nothing the user just did.
                if (!statusChanged && !isLocating.value) return
                setLocationProblem(
                    if (status == ScooterAuthorizationStatus.Denied) ScooterLocationIssue.Denied else ScooterLocationIssue.Restricted,
                )
                _isLocating.value = false
                finishLocationAttemptWithoutFix()
            }
            ScooterAuthorizationStatus.NotDetermined -> setLocationProblem(null)
        }
    }

    /** The location service reported positions, oldest first. */
    fun locationsUpdated(locations: List<ScooterLocationFix>) {
        val location = ScooterLocationPolicy.bestCandidate(locations) ?: return

        if (bestLocationCandidate?.let { location.horizontalAccuracy < it.horizontalAccuracy } ?: true) {
            bestLocationCandidate = location
        }

        if (location.horizontalAccuracy > ScooterLocationPolicy.preferredAccuracy) return
        acceptLocation(location)
    }

    /** The compass reported which way the phone points. */
    fun headingUpdated(heading: ScooterHeadingReading) {
        if (!isTrackingHeading) return
        if (abs(heading.timestamp.timeIntervalSince(Instant.now())) > 10) {
            _userHeading.value = null
            return
        }
        _userHeading.value = ScooterUserHeading(
            trueHeading = heading.trueHeading,
            magneticHeading = heading.magneticHeading,
            accuracy = heading.headingAccuracy,
        )
    }

    private fun acceptLocation(location: ScooterLocationFix) {
        locationTimeoutTask?.cancel()
        locationTimeoutTask = null
        bestLocationCandidate = null

        val nextLocation = location.coordinate
        val hadLocation = userLocation.value != null
        if (!hadLocation) analytics?.track("location_result", result = "success")
        locationAccuracy = location.horizontalAccuracy
        setUserLocation(nextLocation)
        _isLocating.value = false
        setLocationProblem(null)
        if (!hasLocatedOnce.value) {
            _hasLocatedOnce.value = true
            defaults.set(true, forKey = HAS_LOCATED_ONCE_KEY)
        }

        // A place chosen while the fix was on its way is the later wish, however late the fix is: the map stays
        // there and the place stays the origin.
        val keepsMap = keepsMapOnFirstFix || placeChoices != placeChoicesAtLocate
        keepsMapOnFirstFix = false
        if (!hadLocation && keepsMap) {
            // Also when a card asked: the walking time appears and the map stays put.
            distanceOrigin = nextLocation
        } else if (!hadLocation) {
            requestUserFocus(nextLocation)
            distanceOrigin = nextLocation

            val focusedRegion = MapRegion.around(
                center = nextLocation,
                latitudinalMeters = userFocusMeters,
                longitudinalMeters = userFocusMeters,
            )
            val focusedViewport = GeoBounds(focusedRegion)
            setViewport(focusedViewport)
            _viewportZoom.value = USER_FOCUS_ZOOM
            fetchIfNeeded(focusedViewport, zoom = viewportZoom.value)
        } else if (distance(distanceOrigin, nextLocation) >= max(75.0, location.horizontalAccuracy)) {
            distanceOrigin = nextLocation
        }
    }

    private fun requestUserFocus(point: GeoPoint) {
        focusToken += 1
        _focusRequest.value = MapFocusRequest(
            point = point,
            token = focusToken,
            latitudinalMeters = userFocusMeters,
            longitudinalMeters = userFocusMeters,
        )
    }

    /** The location service could not locate the phone. */
    fun locationFailed(error: ScooterLocationError) {
        if (error == ScooterLocationError.Denied) {
            when (locationManager.authorizationStatus) {
                ScooterAuthorizationStatus.Denied -> setLocationProblem(ScooterLocationIssue.Denied)
                ScooterAuthorizationStatus.Restricted -> setLocationProblem(ScooterLocationIssue.Restricted)
                else -> {}
            }
        }
        // The location service keeps trying after "location unknown"; the timeout decides.
        if (error == ScooterLocationError.LocationUnknown && locationTimeoutTask != null) return
        _isLocating.value = false
        finishLocationAttemptWithoutFix()
    }

    private fun beginLocationTimeout() {
        locationTimeoutTask?.cancel()
        val timeout = locationTimeout
        locationTimeoutTask = scope.launch {
            delay(timeout)

            val bestLocationCandidate = bestLocationCandidate
            if (bestLocationCandidate != null) {
                acceptLocation(bestLocationCandidate)
            } else {
                _isLocating.value = false
                finishLocationAttemptWithoutFix()
            }
        }
    }

    private fun finishLocationAttemptWithoutFix() {
        // Allowed, and still no position in time.
        if (locationProblem == null && userLocation.value == null && isLocationAuthorized) {
            setLocationProblem(ScooterLocationIssue.NotFound)
        }
        analytics?.track("location_result", result = if (locationProblem == ScooterLocationIssue.Denied) "denied" else "unavailable")
        keepsMapOnFirstFix = false
        val walk = walk.value
        if (walk != null && walk.phase == ScooterWalkPhase.Locating) {
            setWalk(walk.copy(phase = ScooterWalkPhase.Failed(ScooterWalkFailure.NoLocation)))
            announceWalk(ScooterWalkNote.NoLocation.text)
        }
        locationTimeoutTask?.cancel()
        locationTimeoutTask = null
        bestLocationCandidate = null
        fetchIfNeeded(viewport.value)
    }

    private fun persistRidePasses() {
        val storedPasses = ridePasses.value.mapKeys { (provider, _) -> provider.rawValue }
        val encodedPasses = try {
            ScooterAPIJson.encodeToString(ridePassesSerializer, storedPasses)
        } catch (_: Exception) {
            return
        }
        defaults.set(encodedPasses.encodeToByteArray(), forKey = RIDE_PASSES_KEY)
    }

    companion object {
        val switzerlandCenter: GeoPoint get() = ScooterMapStart.switzerlandCenter

        /** Where the app's map opens: the covered city nearest the phone's time zone (ScooterStartPlace). */
        val start: ScooterMapStart by lazy { ScooterStartPlace.start(forTimeZone = TimeZone.getDefault().id) }
        val initialRegion: MapRegion get() = start.region

        /** Locating shows about 350 m across, like zoom 17 on the web. */
        const val userFocusMeters: Double = 350.0
        private const val USER_FOCUS_ZOOM = 17

        const val searchNearMinimumZoom: Double = 10.0

        /**
         * The location service reports a move of this many metres. While the rider walks a route, of a few
         * metres: the trail behind them goes as they walk.
         */
        internal const val DISTANCE_FILTER: Double = 20.0
        internal const val WALKING_DISTANCE_FILTER: Double = 5.0

        /** Coalesces the moves of one gesture, as the web does. */
        val zoneDebounce: Duration = 250.milliseconds

        /** While some feeds' zones are still being read, the same area is asked for again this much later, a few times. */
        val zonePendingRetry: Duration = 3.seconds
        const val zonePendingRetries: Int = 3

        /** The server lets an answer be kept five minutes, in seconds. */
        const val zoneAnswerLifetime: Double = 300.0
        internal const val RECENT_ZONE_ANSWER_LIMIT = 8

        private const val MINIMUM_BATTERY_KEY = "minimum-battery"
        private const val MAP_STYLE_KEY = "apple-map-style"
        private const val SHOWS_ZONES_KEY = "map-zones"
        private const val APPEARANCE_KEY = "appearance"
        private const val DISABLED_PROVIDERS_KEY = "disabled-providers"
        private const val RIDE_ESTIMATE_MINUTES_KEY = "ride-estimate-minutes-v1"
        private const val RIDE_PASSES_KEY = "provider-ride-passes-v1"
        private const val HAS_LOCATED_ONCE_KEY = "has-located-once"
        private const val MAXIMUM_RECENT_PLACES = 3

        /** Date.distantFuture: the first day of the year 4001. */
        private val distantFuture: Instant = Instant.ofEpochSecond(64_092_211_200)

        private val ridePassesSerializer = MapSerializer(String.serializer(), ProviderRidePass.serializer())

        /** The saved provider choice: every provider but those turned off, of which one this version doesn't know is passed over. */
        private fun savedProviders(defaults: ScooterDefaults): Set<ScooterProvider>? {
            val disabledIDs = defaults.stringArray(forKey = DISABLED_PROVIDERS_KEY) ?: return null
            return ScooterProvider.entries.toSet() - disabledIDs.mapNotNull { ScooterProvider.fromRawValue(it) }.toSet()
        }

        private fun loadRidePasses(defaults: ScooterDefaults): Map<ScooterProvider, ProviderRidePass> {
            val encodedPasses = defaults.data(forKey = RIDE_PASSES_KEY) ?: return emptyMap()
            val storedPasses = try {
                ScooterAPIJson.decodeFromString(ridePassesSerializer, encodedPasses.decodeToString())
            } catch (_: Exception) {
                return emptyMap()
            }
            return storedPasses.entries.mapNotNull { (providerID, pass) ->
                ScooterProvider.fromRawValue(providerID)?.let { it to pass }
            }.toMap()
        }

        /** A time the server wrote, on the clock of this device: `clockOffset` is how far this clock is ahead of the server's. */
        private fun apiDate(value: String?, clockOffset: Double): Instant? {
            value ?: return null
            val date = try {
                OffsetDateTime.parse(value).toInstant()
            } catch (_: DateTimeParseException) {
                return null
            }
            return date.addingTimeInterval(clockOffset)
        }

        /** The country or region in the locale's language, or its code in capitals where it has no name. */
        private fun regionName(code: String, locale: Locale): String {
            val region = try {
                Locale.Builder().setRegion(code).build()
            } catch (_: Exception) {
                return code.uppercase()
            }
            // The JDK answers a region it has no name for with its code.
            return region.getDisplayCountry(locale).takeIf { it.isNotEmpty() && it != region.country } ?: code.uppercase()
        }

        internal fun distance(start: GeoPoint, end: GeoPoint): Double = start.distance(to = end)
    }
}
