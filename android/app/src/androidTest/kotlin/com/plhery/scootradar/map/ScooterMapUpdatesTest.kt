package com.plhery.scootradar.map

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneLook
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.WalkTrailLook
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.sources.GeoJsonSource
import kotlin.math.cos

/**
 * ScooterMap's updates, as ios/ScootRadar/Views/ScooterMapView.swift's updateUIView makes them, on MapLibre's map
 * with the app's ground: a switch to dark and back drawing each thing over the map in the other appearance
 * (MAP-025, MAP-133), and the margins set before a move asked for in the same update (MAP-026).
 */
@RunWith(AndroidJUnit4::class)
class ScooterMapUpdatesTest {
    private val zurich = GeoPoint(47.3769, 8.5417)
    private val language = ScooterLanguage.current
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = language
    }

    @Test
    fun aDarkSwitchDrawsTheDotsClustersFadedMarkersZonesAndTrailDarkAndBack() {
        val route = listOf(at(east = -150.0, north = -120.0), at(east = 0.0, north = -100.0), at(east = 60.0, north = 40.0), at(east = 150.0, north = 120.0))
        val target = Scooter("voi", route.last().latitude, route.last().longitude, battery = 80, vehicleID = "walked")
        val other = at(east = -120.0, north = 160.0).let { Scooter("lime", it.latitude, it.longitude, battery = 60, vehicleID = "other") }
        val seen = at(east = 200.0, north = -200.0).let { Scooter("bolt", it.latitude, it.longitude, vehicleID = "seen") }
        val group = at(east = -220.0, north = -60.0)
        val seenGroup = at(east = 220.0, north = 260.0)
        val api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(
                vehicles = listOf(target, other),
                clusters = listOf(ScooterCluster("16:1:1", group.latitude, group.longitude, count = 12, providers = mapOf("voi" to 12))),
                lastSeenVehicles = listOf(seen),
                lastSeenClusters = listOf(ScooterCluster("16:1:2", seenGroup.latitude, seenGroup.longitude, count = 7, providers = mapOf("dott" to 7))),
                meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters"),
            )

            override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(
                zones = listOf(
                    square("slow", ScooterZoneKind.Slow, east = 100.0, north = -150.0),
                    square("parking", ScooterZoneKind.NoParking, east = -100.0, north = 250.0),
                    square("riding", ScooterZoneKind.NoRide, east = 250.0, north = 50.0),
                ),
                pending = false,
                truncated = false,
            )
        }
        val controller = onMain {
            ScooterMapController(
                api = api,
                locationManager = NotDeterminedLocationManager(),
                defaults = InMemoryScooterDefaults(),
                scope = scope,
                directions = object : WalkingDirectionsClient {
                    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = route
                },
                openInMaps = {},
                phoneLanguages = { listOf("en-US") },
            )
        }
        withScooterMap(controller, streetStart) { shown ->
            settle()
            shown.phone.onMain {
                controller.refresh()
                controller.setShowsZones(true)
            }
            waitFor("the scooters, the faded marks and the zones are drawn") {
                shown.phone.onMain {
                    controller.mapScooters.value.any { it.id == target.id } && controller.mapLastSeenScooters.value.isNotEmpty() &&
                        controller.zoneState.value == ScooterZoneState.Shown && controller.mapZones.value.size == 3
                }
            }
            shown.phone.onMain {
                controller.setUserLocation(route.first())
                controller.selectScooter(target.id)
                controller.showWalkingRoute(ScooterWalkTarget.Scooter(target))
            }
            waitFor("the route is shown") { shown.phone.onMain { controller.walk.value?.phase == ScooterWalkPhase.Shown } }
            settle()
            waitFor("every kind of marker is drawn") { kinds(shown) == setOf("dot", "cluster", "seen", "seen-group") }
            assertDrawn(shown, dark = false)

            for (dark in listOf(true, false)) {
                shown.phone.onMain { shown.dark.value = dark }
                waitFor("the markers drawn with dark $dark") { images(shown).all { isDark(it) == dark } }
                settle()
                assertDrawn(shown, dark)
            }
        }
    }

    @Test
    fun aPlaceAskedForAsThePanelOpensIsShownBesideItInOneMove() {
        // MAP-026: the margins first, then the focus, in each update: a move asked for in the update that opens the
        // panel is measured with the panel's margins, and made once.
        val frames = MapChromeFrames()
        val controller = onMain { testController(scope) }
        val place = GeoPoint(47.3700, 8.5300)
        withScooterMap(controller, zurichStart, width = 1376, height = 1032, chrome = frames) { shown ->
            settle()
            val before = shown.phone.onMain { shown.camera.movesToPlaces }
            shown.phone.onMain {
                frames.layout = ScooterChromeLayout.Panel
                frames.panel = ScreenRect(16.0, 16.0, 380.0, 1000.0)
                controller.focusOnAddress(
                    MapDestination(title = "Bahnhofplatz", subtitle = "", point = place, kind = MapDestination.Kind.Address, isCovered = true),
                )
            }
            settle()
            shown.phone.onMain {
                assertEquals(16 + 380 + 16.0, shown.camera.margins.left, 0.5)
                val at = shown.phone.projection.point(place)
                assertEquals(886.0, at.x, 3.0)
                assertEquals(516.0, at.y, 3.0)
                assertEquals(1, shown.camera.movesToPlaces - before)
            }
        }
    }

    // Helpers

    /** Zürich's centre at street level, where each scooter is a dot of its own. */
    private val streetStart = ScooterMapStart(MapRegion.around(GeoPoint(47.3769, 8.5417), 900.0, 900.0), zoom = 16)

    /** The pictures the markers' and the faded markers' sources draw now. */
    private fun images(shown: ThemedMap): List<String> = shown.phone.onMain {
        listOf(ScooterMarkerLayers.MARKERS_SOURCE, ScooterMarkerLayers.LAST_SEEN_SOURCE).flatMap { id ->
            shown.style().getSourceAs<GeoJsonSource>(id)!!.querySourceFeatures(Expression.literal(true)).mapNotNull { it.getStringProperty("image") }
        }.filter { it.substringBefore('/') in setOf("dot", "cluster", "seen", "seen-group") }.distinct()
    }

    private fun kinds(shown: ThemedMap): Set<String> = images(shown).map { it.substringBefore('/') }.toSet()

    /** Whether a picture's name is of its dark version: the part of the name each kind keeps for it. */
    private fun isDark(image: String): Boolean {
        val parts = image.split('/')
        return when (parts[0]) {
            "dot" -> parts[5]
            "cluster", "seen-group" -> parts[3]
            else -> parts[2]
        } == "1"
    }

    /** Every marker, zone and the walk's trail as they are drawn in the appearance. */
    private fun assertDrawn(shown: ThemedMap, dark: Boolean) {
        val images = images(shown)
        assertEquals(setOf("dot", "cluster", "seen", "seen-group"), images.map { it.substringBefore('/') }.toSet())
        assertTrue("$images", images.all { isDark(it) == dark })
        shown.phone.onMain {
            val style = shown.style()
            fun opaque(color: Long) = (0xFF000000 or (color and 0xFFFFFF)).toInt()
            for (kind in ScooterZoneKind.belowFirst) {
                val fill = style.getLayer(ZoneLayers.fillID(kind)) as FillLayer
                if (kind == ScooterZoneKind.NoRide) {
                    assertTrue("$kind: ${fill.fillPattern}", fill.fillPattern.toString().contains(ZoneHatch.name(dark)))
                } else {
                    assertEquals("$kind's fill", opaque(ScooterZoneLook.color(kind, dark)), fill.fillColorAsInt)
                }
            }
            for (kind in ZoneLayers.edgeOrder) {
                val edge = style.getLayer(ZoneLayers.edgeID(kind)) as LineLayer
                assertEquals("$kind's edge", opaque(ScooterZoneLook.color(kind, dark)), edge.lineColorAsInt)
            }
            val casing = style.getLayer(GroundOverlays.TRAIL_CASING) as CircleLayer
            assertEquals("the trail's casing", opaque(WalkTrailLook.casingColor(dark)), casing.circleColorAsInt)
            assertNotNull(style.getSourceAs<GeoJsonSource>(GroundOverlays.TRAIL_SOURCE))
        }
    }

    /** A point `east` and `north` metres from Zürich's centre. */
    private fun at(east: Double, north: Double): GeoPoint =
        GeoPoint(zurich.latitude + north / 111_195.0, zurich.longitude + east / (111_195.0 * cos(Math.toRadians(zurich.latitude))))

    private fun square(id: String, kind: ScooterZoneKind, east: Double, north: Double, side: Double = 120.0): ScooterZone {
        val h = side / 2
        val ring = listOf(at(east - h, north - h), at(east + h, north - h), at(east + h, north + h), at(east - h, north + h), at(east - h, north - h))
        return ScooterZone(id = id, provider = "voi", kind = kind, polygons = listOf(listOf(ring)))
    }

    private fun <T> onMain(block: () -> T): T {
        var result: Result<T>? = null
        InstrumentationRegistry.getInstrumentation().runOnMainSync { result = runCatching(block) }
        return result!!.getOrThrow()
    }

    private fun waitFor(what: String, timeout: Long = 15_000, condition: () -> Boolean) {
        val deadline = System.currentTimeMillis() + timeout
        while (System.currentTimeMillis() < deadline) {
            if (condition()) return
            Thread.sleep(50)
        }
        assertTrue(what, condition())
    }
}
