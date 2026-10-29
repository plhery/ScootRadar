package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.generated.ScooterProvider.Bird
import com.plhery.scootradar.core.generated.ScooterProvider.Dott
import com.plhery.scootradar.core.generated.ScooterProvider.Lime
import com.plhery.scootradar.core.generated.ScooterProvider.Voi
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.core.model.ScooterResponse
import java.time.Instant
import java.util.Locale
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

// The events ios/ScootRadar/ViewModels/ScooterMapModel.swift sends through ScooterAnalytics.swift, with the names
// and the data the iPhone gives them (docs/analytics.md). The behaviour that sends each is tested in
// ScooterMapControllerTest; these tests read what reaches the analytics.
@OptIn(ExperimentalCoroutinesApi::class)
class ScooterMapEventsTest {
    private val launchLocale = ScooterLanguage.launchLocale
    private val atLaunch = ScooterLanguage.atLaunch

    @Before
    fun pinTheLocale() {
        ScooterLanguage.launchLocale = { Locale.US }
    }

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.atLaunch = atLaunch
        ScooterLanguage.current = atLaunch
        ScooterLanguage.launchLocale = launchLocale
    }

    private fun empty(): StubScooterAPI = StubScooterAPI(ScooterResponse(vehicles = emptyList()))

    @Test
    fun theFiltersTellWhichProvidersAndWhichMinimum() = runTest {
        val analytics = RecordingAnalytics()
        val model = makeController(empty(), analytics = analytics)

        model.showProviders(setOf(Bird))
        model.showProviders(setOf(Bird, Dott))
        model.toggle(Dott)
        model.toggle(Voi)
        model.showAllProviders()
        // A quick chip: from all to one, and from that one back to all.
        model.toggleQuickProvider(Lime)
        model.toggleQuickProvider(Lime)
        model.setMinimumBattery(75.0)
        // 70 snaps down to the 60 already set: nothing changes, nothing is sent.
        model.setMinimumBattery(70.0)
        model.resetFilters()

        assertEquals(
            listOf(
                // The provider only when there is exactly one, and how many are shown.
                TrackedEvent("provider_filter", provider = "bird", value = 1),
                TrackedEvent("provider_filter", value = 2),
                // A toggle says what it did.
                TrackedEvent("provider_filter", provider = "dott", result = "disabled"),
                TrackedEvent("provider_filter", provider = "voi", result = "enabled"),
                TrackedEvent("providers_all"),
                TrackedEvent("provider_filter", provider = "lime", value = 1),
                TrackedEvent("providers_all"),
                TrackedEvent("battery_filter", value = 60),
                TrackedEvent("filters_reset"),
            ),
            analytics.events,
        )
    }

    @Test
    fun aPreferenceIsSentWhenItChangesAndAPassWithoutItsAmounts() = runTest {
        val analytics = RecordingAnalytics()
        val model = makeController(empty(), analytics = analytics)

        // The quiet ground, Automatic, the zones and ten minutes are already set.
        model.setMapStyle(AppleMapStyle.Quiet)
        model.setAppearance(ScooterAppearance.Sun)
        model.setShowsZones(true)
        model.setRideEstimateMinutes(10)
        assertEquals(emptyList<TrackedEvent>(), analytics.events)

        model.setMapStyle(AppleMapStyle.Satellite)
        model.setMapStyle(AppleMapStyle.Standard)
        model.setMapStyle(AppleMapStyle.Quiet)
        // The appearance goes under the map style's name, with the web's "auto" for the phone's.
        model.setAppearance(ScooterAppearance.System)
        model.setAppearance(ScooterAppearance.Light)
        model.setAppearance(ScooterAppearance.Dark)
        model.setAppearance(ScooterAppearance.Sun)
        model.setShowsZones(false)
        model.setShowsZones(false)
        model.setShowsZones(true)
        model.setRideEstimateMinutes(20)
        // Seven minutes is not offered: ten.
        model.setRideEstimateMinutes(7)
        model.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 30, expiryDate = Instant.ofEpochSecond(1_800_000_000)), Lime)
        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.Fr))
        model.setLanguageChoice(ScooterLanguageChoice.Automatic)

        assertEquals(
            listOf(
                TrackedEvent("map_style", result = "satellite"),
                TrackedEvent("map_style", result = "standard"),
                TrackedEvent("map_style", result = "quiet"),
                TrackedEvent("map_style", result = "auto"),
                TrackedEvent("map_style", result = "light"),
                TrackedEvent("map_style", result = "dark"),
                TrackedEvent("map_style", result = "sun"),
                TrackedEvent("zones_toggle", result = "disabled"),
                TrackedEvent("zones_toggle", result = "enabled"),
                TrackedEvent("ride_duration", value = 20),
                TrackedEvent("ride_duration", value = 10),
                // Never the pass's expiry or its amounts.
                TrackedEvent("ride_pass_change", provider = "lime"),
                TrackedEvent("language_change", result = "fr"),
                TrackedEvent("language_change", result = "auto"),
            ),
            analytics.events,
        )
    }

    @Test
    fun theMapStylesAreSentUnderTheIPhonesNames() {
        // The analytics' values: a style Android adds needs a value of its own (LOG-394).
        assertEquals(listOf("standard", "quiet", "satellite"), AppleMapStyle.entries.map { it.rawValue })
    }

    @Test
    fun aManualRefreshIsCountedBeforeItIsAskedForAndAnAutomaticOneIsNot() = runTest {
        val analytics = RecordingAnalytics()
        val api = empty()
        val model = makeController(api, analytics = analytics)

        model.retryLoad()

        assertEquals(listOf<String?>("refresh"), analytics.names)
        assertEquals(0, api.calls)
        settle()
        assertEquals(1, api.calls)

        model.refresh()
        settle()
        assertEquals(2, api.calls)
        assertEquals(listOf<String?>("refresh"), analytics.names)
    }

    @Test
    fun aPlaceOrACityChosenInTheSearchIsCountedAndTheClosestCityIsNot() = runTest {
        val analytics = RecordingAnalytics()
        val model = makeController(empty(), analytics = analytics)
        val place = MapDestination(title = "Paradeplatz", subtitle = "Zürich", point = GeoPoint(latitude = 47.3698, longitude = 8.5392))
        val city = TestCatalog.zurich

        model.focusOnAddress(place)
        // A "Cities with scooters" chip, as the city chosen in the search.
        model.chooseCity(city)
        assertEquals(listOf(TrackedEvent("search_select"), TrackedEvent("search_select")), analytics.events)

        // The chip of the closest city, outside coverage, moves the map and is not a search.
        model.focusOnCity(city)
        assertEquals(2, analytics.events.size)
        assertEquals(city.destination, model.searchedDestination.value)
    }

    @Test
    fun choosingAScooterSendsItsProviderAndClosingItSendsNone() = runTest {
        val analytics = RecordingAnalytics()
        val lime = scooter(id = "lime-1", provider = "lime")
        val bird = scooter(id = "bird-1", provider = "bird", latitude = 47.3772)
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(lime, bird)))
        val model = makeController(api, analytics = analytics)
        model.setUserLocation(GeoPoint(latitude = 47.3769, longitude = 8.5417))
        model.refresh()
        assertTrue(waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })

        model.selectScooter(lime.id)
        // The same scooter again changes nothing.
        model.selectScooter(lime.id)
        model.selectScooter(bird.id)
        // A tap on the empty map.
        model.clearSelection()
        // With nothing selected, nothing is closed.
        model.clearSelection()

        assertEquals(
            listOf(
                TrackedEvent("vehicle_select", provider = "lime"),
                TrackedEvent("vehicle_select", provider = "bird"),
                TrackedEvent("vehicle_dismiss"),
            ),
            analytics.events,
        )
        assertNull(model.selectedScooterID.value)
    }

    @Test
    fun aFailureIsReportedOnceWhenFailuresStartAndACancellationNever() = runTest {
        val analytics = RecordingAnalytics()
        val api = empty()
        val model = makeController(api, analytics = analytics)
        api.setFailure(ScooterAPIError.TimedOut())

        model.refresh()
        assertTrue(waitUntil { api.calls == 1 && model.loadIssue.value != null && !model.isLoading.value })
        assertEquals(listOf(TrackedEvent("data_error", result = "request_failed")), analytics.events)

        // Retries while the failure shows are not counted again.
        model.refresh()
        assertTrue(waitUntil { api.calls == 2 && !model.isLoading.value })
        assertEquals(1, analytics.events.size)

        // Once a load succeeds, the next failure starts again.
        api.setFailure(null)
        model.refresh()
        assertTrue(waitUntil { api.calls == 3 && model.loadIssue.value == null && !model.isLoading.value })
        api.setFailure(ScooterAPIError.HttpStatus(503))
        model.refresh()
        assertTrue(waitUntil { api.calls == 4 && model.loadIssue.value != null && !model.isLoading.value })
        assertEquals(2, analytics.events.size)

        val cancelled = RecordingAnalytics()
        val cancelling = CancelledAPI()
        val other = makeController(cancelling, analytics = cancelled)
        other.refresh()
        assertTrue(waitUntil { cancelling.callCount() == 1 && !other.isLoading.value })
        assertEquals(emptyList<TrackedEvent>(), cancelled.events)
    }

    @Test
    fun locatingIsCountedWithItsOutcomeAndOnlyTheFirstFix() = runTest {
        val rider = GeoPoint(latitude = 47.3769, longitude = 8.5417)
        fun fix(at: GeoPoint) = ScooterLocationFix(coordinate = at, horizontalAccuracy = 10.0, timestamp = Instant.now())

        // Near me, then a fix, then another.
        val located = RecordingAnalytics()
        val allowed = FakeLocationManager(ScooterAuthorizationStatus.AuthorizedWhenInUse)
        val model = makeController(empty(), locationManager = allowed, analytics = located)
        model.focusOnUser()
        model.locationsUpdated(listOf(fix(rider)))
        model.locationsUpdated(listOf(fix(GeoPoint(latitude = 47.38, longitude = 8.55))))
        // With a location, the card's "Turn on location" has nothing to do.
        model.locateForWalkingTime()
        assertEquals(listOf(TrackedEvent("locate"), TrackedEvent("location_result", result = "success")), located.events)

        // Refused.
        val refused = RecordingAnalytics()
        val denied = makeController(empty(), locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied), analytics = refused)
        denied.focusOnUser()
        assertEquals(listOf(TrackedEvent("locate"), TrackedEvent("location_result", result = "denied")), refused.events)

        // Allowed, and no fix in time; from a card's "Turn on location to see walking time".
        val unanswered = RecordingAnalytics()
        val waiting = makeController(
            empty(),
            locationManager = FakeLocationManager(ScooterAuthorizationStatus.AuthorizedWhenInUse),
            analytics = unanswered,
        )
        waiting.locateForWalkingTime()
        assertEquals(listOf(TrackedEvent("locate")), unanswered.events)
        advanceTimeBy(5_001)
        runCurrent()
        assertEquals(listOf(TrackedEvent("locate"), TrackedEvent("location_result", result = "unavailable")), unanswered.events)
    }

    /** LOG-324 and LOG-267: a link to the map says whether it opened the map as it was, a city or another place. */
    @Test
    fun aLinkSaysWhetherItOpenedTheMapACityOrAPlace() = runTest {
        val analytics = RecordingAnalytics()
        val model = makeController(empty(), analytics = analytics)
        val city = TestCatalog.zurich

        model.open(ScooterMapLink())
        model.open(ScooterMapLink(origin = city.center))
        // The middle of the Atlantic, where no city is.
        model.open(ScooterMapLink(origin = GeoPoint(latitude = 30.0, longitude = -40.0)))

        // And nothing else: none carries a battery, and a place a link opens sends no search_select.
        assertEquals(
            listOf(TrackedEvent("link_open", result = "map"), TrackedEvent("link_open", result = "city"), TrackedEvent("link_open", result = "place")),
            analytics.events,
        )
    }
}
