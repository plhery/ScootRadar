package com.plhery.scootradar.app

import android.Manifest
import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.location.LocationRequest
import android.os.Looper
import android.os.Process
import android.os.UserManager
import android.provider.Settings
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterHeadingReading
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLocationIssue
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowLocationManager
import java.time.Instant

// LOG-241 to LOG-260 and X-AD11 to X-AD13: the phone's location service on LocationManager.

@RunWith(AndroidJUnit4::class)
class AndroidLocationManagerTest {
    private val context: Application = ApplicationProvider.getApplicationContext()
    private val locationManager = context.getSystemService(LocationManager::class.java)
    private val shadowLocations: ShadowLocationManager = shadowOf(locationManager)
    private val defaults = InMemoryScooterDefaults()
    private val events = mutableListOf<String>()
    private val fixes = mutableListOf<List<ScooterLocationFix>>()

    /** The clock since boot, in nanoseconds, which the test moves. */
    private var uptime = 1_000_000_000_000L
    private val asked = mutableListOf<List<String>>()

    private val delegate = object : AndroidLocationManager.Delegate {
        override fun authorizationChanged() {
            events += "authorizationChanged"
        }

        override fun locationsUpdated(locations: List<ScooterLocationFix>) {
            events += "locationsUpdated"
            fixes += locations
        }

        override fun headingUpdated(heading: ScooterHeadingReading) {
            events += "headingUpdated"
        }

        override fun locationFailed(error: ScooterLocationError) {
            events += "locationFailed $error"
        }
    }

    @Before
    fun setUp() {
        shadowLocations.setLocationEnabled(true)
        shadowLocations.setProviderEnabled(LocationManager.GPS_PROVIDER, true)
        shadowLocations.setProviderEnabled(LocationManager.NETWORK_PROVIDER, true)
    }

    @After
    fun tearDown() {
        shadowOf(context).denyPermissions(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        shadowOf(context.getSystemService(UserManager::class.java)).clearUserRestrictions(Process.myUserHandle())
    }

    private fun manager(): AndroidLocationManager =
        AndroidLocationManager(context, defaults, elapsedRealtimeNanos = { uptime }).also {
            it.delegate = delegate
            it.permissionRequester = AndroidLocationManager.PermissionRequester { permissions -> asked += permissions.toList() }
        }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    /** Android's dialog answered: each permission as it stands now. */
    private fun AndroidLocationManager.answered() = permissionsAnswered(
        AndroidLocationManager.PERMISSIONS.associateWith { context.checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED },
    )

    /** A location service whose reports go to a controller, as the view model has it. */
    private fun controlled(controllers: TestControllers): Pair<AndroidLocationManager, ScooterMapController> {
        val manager = AndroidLocationManager(context, defaults, elapsedRealtimeNanos = { uptime })
        val controller = controllers.make(EmptyScooterAPI, locationManager = manager)
        manager.delegate = object : AndroidLocationManager.Delegate {
            override fun authorizationChanged() = controller.authorizationChanged()

            override fun locationsUpdated(locations: List<ScooterLocationFix>) = controller.locationsUpdated(locations)

            override fun headingUpdated(heading: ScooterHeadingReading) = controller.headingUpdated(heading)

            override fun locationFailed(error: ScooterLocationError) = controller.locationFailed(error)
        }
        manager.permissionRequester = AndroidLocationManager.PermissionRequester { permissions -> asked += permissions.toList() }
        return manager to controller
    }

    private fun grant(vararg permissions: String) = shadowOf(context).grantPermissions(*permissions)

    private fun revoke(vararg permissions: String) = shadowOf(context).denyPermissions(*permissions)

    private fun restrict(restriction: String) = shadowOf(context.getSystemService(UserManager::class.java))
        .setUserRestriction(Process.myUserHandle(), restriction, true)

    private fun location(provider: String, latitude: Double, accuracy: Float, ageSeconds: Long): Location =
        Location(provider).apply {
            this.latitude = latitude
            longitude = 8.5417
            this.accuracy = accuracy
            elapsedRealtimeNanos = uptime - ageSeconds * 1_000_000_000L
            time = 0
        }

    @Test
    fun theAnswerFollowsThePermissionAndThePhonesLocation() {
        val manager = manager()
        assertEquals("never asked", ScooterAuthorizationStatus.NotDetermined, manager.authorizationStatus)

        manager.requestWhenInUseAuthorization()
        assertEquals("both, so that Android 12 offers precise and approximate", listOf(AndroidLocationManager.PERMISSIONS.toList()), asked)

        // Refused, or refused by Android itself after two refusals: the same.
        manager.answered()
        idle()
        assertEquals(ScooterAuthorizationStatus.Denied, manager.authorizationStatus)
        assertEquals(listOf("authorizationChanged"), events)
        assertEquals("a refusal is kept", ScooterAuthorizationStatus.Denied, manager().authorizationStatus)

        grant(Manifest.permission.ACCESS_COARSE_LOCATION)
        assertEquals("approximate is allowed", ScooterAuthorizationStatus.AuthorizedWhenInUse, manager.authorizationStatus)
        assertTrue(manager.isApproximateOnly)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        assertEquals(ScooterAuthorizationStatus.AuthorizedWhenInUse, manager.authorizationStatus)
        assertFalse(manager.isApproximateOnly)

        // Location off for the whole phone is refused, as iOS reports it (LOG-247, X-AD12).
        shadowLocations.setLocationEnabled(false)
        assertEquals(ScooterAuthorizationStatus.Denied, manager.authorizationStatus)
        assertEquals(Settings.ACTION_LOCATION_SOURCE_SETTINGS, manager.settingsIntent(context).action)
        shadowLocations.setLocationEnabled(true)
        val appPage = manager.settingsIntent(context)
        assertEquals(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, appPage.action)
        assertEquals("package:${context.packageName}", appPage.dataString)
        assertTrue(appPage.flags and Intent.FLAG_ACTIVITY_NEW_TASK != 0)
    }

    @Test
    fun aGrantForOnlyThisTimeThatRanOutIsAskedForAgain() {
        val manager = manager()
        manager.requestWhenInUseAuthorization()
        grant(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        manager.answered()
        assertEquals(ScooterAuthorizationStatus.AuthorizedWhenInUse, manager.authorizationStatus)

        // Android takes a grant for this time only back some time after the app has left the screen (LOG-251).
        revoke(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        assertEquals(ScooterAuthorizationStatus.NotDetermined, manager().authorizationStatus)
    }

    @Test
    fun aRefusalEndsWithAGrantMadeInSettingsSoThatTakenBackItIsAskedForAgain() {
        val manager = manager()
        manager.cameToForeground()
        manager.requestWhenInUseAuthorization()
        manager.answered()
        assertEquals(ScooterAuthorizationStatus.Denied, manager.authorizationStatus)

        // Allowed in Settings, the app away, and seen as it comes back.
        manager.leftForeground()
        grant(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        manager.cameToForeground()
        assertEquals(ScooterAuthorizationStatus.AuthorizedWhenInUse, manager.authorizationStatus)

        // Then "Ask every time", or Android resetting an unused app: a question to ask again, as iOS has it.
        manager.leftForeground()
        revoke(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        manager.cameToForeground()
        assertEquals(ScooterAuthorizationStatus.NotDetermined, manager.authorizationStatus)
        assertEquals("on the next launch too", ScooterAuthorizationStatus.NotDetermined, manager().authorizationStatus)
    }

    @Test
    fun aRequestAndroidCancelsWhileItsDialogIsUpIsNoAnswer() {
        val controllers = TestControllers()
        val (manager, controller) = controlled(controllers)
        manager.cameToForeground()
        controller.start()
        controller.focusOnUser()
        assertEquals(1, asked.size)

        // A second request while the dialog is up, answered at once with nothing (an empty result).
        manager.permissionsAnswered(emptyMap())
        idle()
        assertEquals(ScooterAuthorizationStatus.NotDetermined, manager.authorizationStatus)
        assertNull("no card behind the dialog", controller.locationIssue.value)
        assertTrue("still waiting for the rider", controller.isLocating.value)

        // The dialog's own answer.
        grant(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        manager.answered()
        idle()
        assertEquals(ScooterAuthorizationStatus.AuthorizedWhenInUse, manager.authorizationStatus)
        assertNull(controller.locationIssue.value)
        controllers.close()
    }

    @Test
    fun restrictedWhenThePhonesOwnerKeepsLocationFromTheRider() {
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        restrict(UserManager.DISALLOW_CONFIG_LOCATION)
        assertEquals(
            "location on, which the rider may not change, still finds the phone",
            ScooterAuthorizationStatus.AuthorizedWhenInUse,
            manager().authorizationStatus,
        )
        shadowLocations.setLocationEnabled(false)
        assertEquals("off, and the rider may not turn it on", ScooterAuthorizationStatus.Restricted, manager().authorizationStatus)

        shadowOf(context.getSystemService(UserManager::class.java)).clearUserRestrictions(Process.myUserHandle())
        revoke(Manifest.permission.ACCESS_FINE_LOCATION)
        restrict(UserManager.DISALLOW_SHARE_LOCATION)
        assertEquals(ScooterAuthorizationStatus.Restricted, manager().authorizationStatus)
    }

    @Test
    fun theFusedProviderIsUsedWhereThePhoneHasOne() {
        shadowLocations.setProviderEnabled(LocationManager.FUSED_PROVIDER, true)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        val manager = manager()
        manager.distanceFilter = 20.0
        manager.cameToForeground()
        manager.startUpdatingLocation()

        assertEquals(listOf(LocationManager.FUSED_PROVIDER), manager.providers)
        assertEquals(1, shadowLocations.getLocationUpdateListeners(LocationManager.FUSED_PROVIDER).size)
        assertTrue(shadowLocations.getLocationUpdateListeners(LocationManager.GPS_PROVIDER).isEmpty())
        assertTrue(shadowLocations.getLocationUpdateListeners(LocationManager.NETWORK_PROVIDER).isEmpty())
        val request = shadowLocations.getLocationRequests(LocationManager.FUSED_PROVIDER).single()
        assertEquals(LocationRequest.QUALITY_HIGH_ACCURACY, request.quality)
        assertEquals(1_000L, request.intervalMillis)
        assertEquals(20f, request.minUpdateDistanceMeters)
    }

    @Test
    fun elseGpsAndTheNetworkTogetherEachReportingOnlyItsNewFix() {
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        val controllers = TestControllers()
        val (manager, controller) = controlled(controllers)
        manager.cameToForeground()
        controller.start()
        controller.focusOnUser()
        assertEquals(listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER), manager.providers)

        // Walking: the network's fix, then GPS's newer one, a little wider but 50 m on.
        shadowLocations.simulateLocation(location(LocationManager.NETWORK_PROVIDER, 47.3769, accuracy = 20f, ageSeconds = 15))
        idle()
        assertEquals(47.3769, controller.userLocation.value?.latitude)
        shadowLocations.simulateLocation(location(LocationManager.GPS_PROVIDER, 47.37735, accuracy = 25f, ageSeconds = 0))
        idle()

        // The dot goes on with the new fix, and does not go back to the network's, sent again (X-AD13).
        assertEquals(47.37735, controller.userLocation.value?.latitude)
        assertEquals(25.0, controller.locationAccuracy.value, 0.0)
        controllers.close()
    }

    @Test
    fun aFixIsTimedByTheClockSinceBootNotByItsDate() {
        shadowLocations.setProviderEnabled(LocationManager.FUSED_PROVIDER, true)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        val now = Instant.now()
        val manager = AndroidLocationManager(context, defaults, now = { now }, elapsedRealtimeNanos = { uptime })
        manager.delegate = delegate
        manager.cameToForeground()
        manager.startUpdatingLocation()

        // A phone whose date is a year off still has the fix's age right (LOG-252).
        shadowLocations.simulateLocation(
            location(LocationManager.FUSED_PROVIDER, 47.0, accuracy = 12f, ageSeconds = 4).apply { time = 1_000 },
        )
        idle()
        val fix = fixes.single().single()
        assertEquals(now.minusSeconds(4), fix.timestamp)
        assertEquals(12.0, fix.horizontalAccuracy, 0.0)

        val noAccuracy = manager.fix(Location(LocationManager.FUSED_PROVIDER).apply { time = 5_000 })
        assertEquals("no accuracy is an invalid fix", -1.0, noAccuracy.horizontalAccuracy, 0.0)
        assertEquals("no time since boot falls back on its date", Instant.ofEpochMilli(5_000), noAccuracy.timestamp)

        // The emulator's GPS puts the date where the time since boot goes: a fix from after now has its date.
        val emulated = manager.fix(
            Location(LocationManager.GPS_PROVIDER).apply {
                time = now.toEpochMilli() - 1_000
                elapsedRealtimeNanos = now.toEpochMilli() * 1_000_000
            },
        )
        assertEquals(Instant.ofEpochMilli(now.toEpochMilli() - 1_000), emulated.timestamp)
    }

    @Test
    fun theDistanceFilterIsTheRequestsMinimumDistance() {
        shadowLocations.setProviderEnabled(LocationManager.FUSED_PROVIDER, true)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        val manager = manager()
        manager.distanceFilter = 20.0
        manager.cameToForeground()
        manager.startUpdatingLocation()
        assertEquals(20f, shadowLocations.getLocationRequests(LocationManager.FUSED_PROVIDER).single().minUpdateDistanceMeters)

        // A walk asks for every 5 m (LOG-258), in place of the request before.
        manager.distanceFilter = 5.0
        assertEquals(5f, shadowLocations.getLocationRequests(LocationManager.FUSED_PROVIDER).single().minUpdateDistanceMeters)
        manager.distanceFilter = 20.0
        assertEquals(20f, shadowLocations.getLocationRequests(LocationManager.FUSED_PROVIDER).single().minUpdateDistanceMeters)
    }

    @Test
    fun updatesStopWhenTheAppLeavesTheScreenAndGoOnWhenItComesBack() {
        shadowLocations.setProviderEnabled(LocationManager.FUSED_PROVIDER, true)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        val manager = manager()
        manager.cameToForeground()
        assertTrue("nothing asked before the controller asks", shadowLocations.getLocationUpdateListeners().isEmpty())
        manager.startUpdatingLocation()
        assertEquals(1, shadowLocations.getLocationUpdateListeners().size)

        // Nothing in the background (LOG-259, X-AD38).
        manager.leftForeground()
        assertTrue(shadowLocations.getLocationUpdateListeners().isEmpty())
        manager.startUpdatingLocation()
        assertTrue("asked while away, it waits", shadowLocations.getLocationUpdateListeners().isEmpty())
        manager.cameToForeground()
        assertEquals(1, shadowLocations.getLocationUpdateListeners().size)

        manager.close()
        assertTrue(shadowLocations.getLocationUpdateListeners().isEmpty())
    }

    @Test
    fun aChangeMadeInSettingsMeanwhileIsReportedOnTheWayBack() {
        val manager = manager()
        manager.cameToForeground()
        manager.leftForeground()
        manager.cameToForeground()
        idle()
        assertEquals("nothing changed", emptyList<String>(), events)

        manager.leftForeground()
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        manager.cameToForeground()
        idle()
        assertEquals(listOf("authorizationChanged"), events)

        // Precise taken back for approximate is a change too, as iOS reports its accuracy's.
        manager.leftForeground()
        revoke(Manifest.permission.ACCESS_FINE_LOCATION)
        grant(Manifest.permission.ACCESS_COARSE_LOCATION)
        manager.cameToForeground()
        idle()
        assertEquals(listOf("authorizationChanged", "authorizationChanged"), events)
    }

    @Test
    fun locationTurnedOffChangesTheAnswerAndAProviderGoneIsLocationUnknown() {
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        val manager = manager()
        manager.cameToForeground()
        manager.startUpdatingLocation()

        // GPS gone with the network left: nothing to say.
        shadowLocations.setProviderEnabled(LocationManager.GPS_PROVIDER, false)
        idle()
        assertEquals(emptyList<String>(), events)
        // Every provider gone, the phone's location still on: the wait for a fix decides (LOG-254).
        shadowLocations.setProviderEnabled(LocationManager.NETWORK_PROVIDER, false)
        idle()
        assertEquals(listOf("locationFailed LocationUnknown"), events)

        // Location off for the whole phone, from the quick settings with the app in front.
        events.clear()
        shadowLocations.setLocationEnabled(false)
        context.sendBroadcast(Intent(LocationManager.MODE_CHANGED_ACTION))
        idle()
        assertEquals(ScooterAuthorizationStatus.Denied, manager.authorizationStatus)
        assertTrue(events.contains("authorizationChanged"))
        assertFalse(events.contains("locationFailed LocationUnknown"))
    }

    @Test
    fun theLastFixIsKeptForTheNextLaunchOnlyWithThePermission() {
        shadowLocations.setLastKnownLocation(LocationManager.GPS_PROVIDER, location(LocationManager.GPS_PROVIDER, 47.2, 8f, ageSeconds = 10))
        shadowLocations.setLastKnownLocation(LocationManager.NETWORK_PROVIDER, location(LocationManager.NETWORK_PROVIDER, 47.3, 30f, ageSeconds = 2))
        assertNull(manager().location)

        grant(Manifest.permission.ACCESS_COARSE_LOCATION)
        val location = manager().location
        assertEquals("the better of the providers' fixes", 47.2, location?.coordinate?.latitude)
    }

    @Test
    fun tryAgainWithApproximateLocationOnlyAsksForPreciseFirst() {
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        var locates = 0
        manager().retry { locates += 1 }
        assertEquals("precise already: it locates at once", 1, locates)
        assertTrue(asked.isEmpty())

        revoke(Manifest.permission.ACCESS_FINE_LOCATION)
        grant(Manifest.permission.ACCESS_COARSE_LOCATION)
        val manager = manager()
        manager.retry { locates += 1 }
        assertEquals("Android's dialog to change to precise", listOf(AndroidLocationManager.PERMISSIONS.toList()), asked)
        assertEquals(1, locates)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        manager.answered()
        idle()
        assertEquals(2, locates)
        assertEquals(listOf("authorizationChanged"), events)
        assertEquals("approximate stays allowed, not refused", ScooterAuthorizationStatus.AuthorizedWhenInUse, manager.authorizationStatus)
    }

    @Test
    fun aRefusalShowsTheCardAndAGrantLocatesWithTheController() {
        shadowLocations.setProviderEnabled(LocationManager.FUSED_PROVIDER, true)
        val controllers = TestControllers()
        val (manager, controller) = controlled(controllers)
        manager.cameToForeground()
        controller.start()
        assertTrue("never asked at launch (LOG-242)", asked.isEmpty())

        controller.focusOnUser()
        assertEquals(1, asked.size)
        manager.answered()
        idle()
        assertEquals(ScooterLocationIssue.Denied, controller.locationIssue.value)
        assertFalse(controller.isLocating.value)

        // Allowed later in Settings: back in the app, it locates.
        manager.leftForeground()
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        manager.cameToForeground()
        idle()
        assertTrue(controller.isLocating.value)
        shadowLocations.simulateLocation(location(LocationManager.FUSED_PROVIDER, 47.3769, accuracy = 10f, ageSeconds = 0))
        idle()
        assertEquals(47.3769, controller.userLocation.value?.latitude)
        assertTrue(controller.hasLocatedOnce.value)
        controllers.close()
    }

    @Test
    fun locatedOnceSurvivesARestart() {
        // UI-310: the round button stays for good, through ScooterDefaults on SharedPreferences.
        val preferences = context.getSharedPreferences("AndroidLocationManagerTest", Context.MODE_PRIVATE)
        val defaults = SharedPreferencesScooterDefaults(preferences)
        val controllers = TestControllers()
        val manager = AndroidLocationManager(context, defaults, elapsedRealtimeNanos = { uptime })
        val controller = controllers.make(EmptyScooterAPI, locationManager = manager, defaults = defaults)
        grant(Manifest.permission.ACCESS_FINE_LOCATION)
        controller.locationsUpdated(listOf(manager.fix(location(LocationManager.GPS_PROVIDER, 47.3769, 10f, ageSeconds = 0))))
        assertTrue(controller.hasLocatedOnce.value)

        val relaunched = controllers.make(EmptyScooterAPI, locationManager = manager, defaults = SharedPreferencesScooterDefaults(preferences))
        assertTrue(relaunched.hasLocatedOnce.value)
        controllers.close()
        preferences.edit().clear().commit()
    }
}
