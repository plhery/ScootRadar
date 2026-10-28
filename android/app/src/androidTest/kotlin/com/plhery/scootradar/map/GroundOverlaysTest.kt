package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PointF
import android.view.Choreographer
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.hideWalkingRoute
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneLook
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.WalkTrail
import com.plhery.scootradar.core.model.WalkTrailLook
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Point
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.pow

// The zones and the walk's trail on MapLibre's map (map.md MAP-151 to MAP-185): the zones of a fake server read back
// from the map and off its pixels, their edges cut where no riding lies over them; a route fitted, drawn frame by
// frame without its source written again, partly walked, then faded; and T371, the walk's scooter kept selected
// while its trail is drawn. The screens are kept in the run's additional output, as zones-*.png and trail-*.png.
@RunWith(AndroidJUnit4::class)
class GroundOverlaysTest {
    private val zurich = GeoPoint(47.3769, 8.5417)
    private val language = ScooterLanguage.current

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = language
    }

    /** The map with the app's camera, zones, trail and markers, as ScooterMap puts them together. */
    private class Ground(
        val phone: PhoneMap,
        val controller: ScooterMapController,
        val camera: MapCamera,
        val zones: ScooterZoneLayer,
        val trail: WalkTrailLayer,
        val markers: ScooterMarkers,
    ) {
        val ratio: Float get() = phone.view.pixelRatio

        fun point(of: GeoPoint): ScreenPoint = phone.onMain { phone.projection.point(of) }

        /** The features of a layer drawn at a point of the map, in points. */
        fun drawn(at: ScreenPoint, layer: String): Int = phone.onMain {
            phone.map.queryRenderedFeatures(PointF((at.x * ratio).toFloat(), (at.y * ratio).toFloat()), layer).size
        }

        /** The numbers of the trail's dots that its filter shows. */
        fun shownDots(layer: String = GroundOverlays.TRAIL): List<Int> = phone.onMain {
            val style = phone.map.style!!
            val source = style.getSourceAs<GeoJsonSource>(sourceOf(layer))!!
            val filter = (style.getLayer(layer) as CircleLayer).filter!!
            source.querySourceFeatures(filter).map { it.getNumberProperty("i").toInt() }.distinct().sorted()
        }

        /** The numbers the trail's filter lets through, read back from the layer. */
        fun range(layer: String = GroundOverlays.TRAIL): IntRange = phone.onMain { rangeOf((phone.map.style!!.getLayer(layer) as CircleLayer).filter.toString()) }

        /** How many dots the trail's source has. */
        fun dotCount(): Int = phone.onMain {
            val source = phone.map.style!!.getSourceAs<GeoJsonSource>(GroundOverlays.TRAIL_SOURCE)!!
            source.querySourceFeatures(Expression.literal(true)).map { it.getNumberProperty("i").toInt() }.distinct().size
        }

        /** Where the trail's dot of that number is. */
        fun dot(index: Int): GeoPoint = phone.onMain {
            val source = phone.map.style!!.getSourceAs<GeoJsonSource>(GroundOverlays.TRAIL_SOURCE)!!
            val feature = source.querySourceFeatures(Expression.eq(Expression.get("i"), index)).first()
            val point = feature.geometry() as Point
            GeoPoint(point.latitude(), point.longitude())
        }

        private fun sourceOf(layer: String) =
            if (layer.startsWith(GroundOverlays.FADING_TRAIL)) GroundOverlays.FADING_TRAIL_SOURCE else GroundOverlays.TRAIL_SOURCE
    }

    private fun withGround(api: ScooterAPIClient, directions: WalkingDirectionsClient? = null, zoom: Double, test: (Ground) -> Unit) {
        val start = CameraPosition.Builder().target(LatLng(zurich.latitude, zurich.longitude)).zoom(zoom).build()
        withPhoneMap(start) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
            try {
                val ground = phone.onMain {
                    val controller = if (directions == null) {
                        testController(scope, api)
                    } else {
                        ScooterMapController(
                            api = api,
                            locationManager = NotDeterminedLocationManager(),
                            defaults = InMemoryScooterDefaults(),
                            scope = scope,
                            directions = directions,
                            openInMaps = {},
                            phoneLanguages = { listOf("en-US") },
                        )
                    }
                    val camera = MapCamera(phone.map, phone.view, controller, MapCameraMemory(), frames)
                    val zones = ScooterZoneLayer(phone.map, phone.view, controller, frames)
                    val trail = WalkTrailLayer(phone.map, phone.view, controller, frames, fit = { camera.show(it) })
                    camera.rested = { animated ->
                        trail.mapDidRest(animated)
                        zones.mapDidRest()
                    }
                    val markers = ScooterMarkers(phone.map, phone.view, controller, analytics = null, scope = frames, move = { camera.show(it) })
                    Ground(phone, controller, camera, zones, trail, markers)
                }
                try {
                    test(ground)
                } finally {
                    phone.onMain {
                        ground.markers.close()
                        ground.trail.close()
                        ground.zones.close()
                        ground.camera.close()
                    }
                }
            } finally {
                frames.cancel()
                scope.cancel()
            }
        }
    }

    @Test
    fun theZonesOfAFakeServerAreFilledHatchedAndEdgedTheirEdgesGivingWayToNoRiding() {
        // No parking to the west; to the east a slow zone, a corner of it under no riding.
        val parking = square("parking", ScooterZoneKind.NoParking, east = -180.0, north = 0.0, side = 120.0)
        val slow = square("slow", ScooterZoneKind.Slow, east = 90.0, north = 0.0, side = 160.0)
        val riding = square("riding", ScooterZoneKind.NoRide, east = 170.0, north = 70.0, side = 120.0)
        val api = zonesAPI(listOf(parking, slow, riding))
        withGround(api, zoom = 15.0) { ground ->
            ground.phone.onMain { ground.controller.setShowsZones(true) }
            waitFor("the zones are asked for and drawn") {
                ground.phone.onMain { ground.controller.zoneState.value == ScooterZoneState.Shown && ground.controller.mapZones.value.size == 3 }
            }
            settle()
            // Each zone where it is, in its own layer.
            val parkingMiddle = ground.point(at(east = -180.0, north = 0.0))
            val slowOnly = ground.point(at(east = 50.0, north = -40.0))
            val ridingOnly = ground.point(at(east = 200.0, north = 100.0))
            waitFor("the fills are drawn") { ground.drawn(parkingMiddle, ZoneLayers.fillID(ScooterZoneKind.NoParking)) == 1 }
            assertEquals(1, ground.drawn(slowOnly, ZoneLayers.fillID(ScooterZoneKind.Slow)))
            assertEquals(1, ground.drawn(ridingOnly, ZoneLayers.fillID(ScooterZoneKind.NoRide)))
            assertEquals(0, ground.drawn(parkingMiddle, ZoneLayers.fillID(ScooterZoneKind.Slow)))
            // The slow zone's edge, drawn where no riding isn't, and cut where it is.
            val slowEdgeOutside = ground.point(at(east = 50.0, north = 80.0))
            val slowEdgeUnder = ground.point(at(east = 140.0, north = 80.0))
            assertEquals(1, ground.drawn(slowEdgeOutside, ZoneLayers.edgeID(ScooterZoneKind.Slow)))
            assertEquals(0, ground.drawn(slowEdgeUnder, ZoneLayers.edgeID(ScooterZoneKind.Slow)))
            assertEquals(1, ground.drawn(ground.point(at(east = 110.0, north = 70.0)), ZoneLayers.edgeID(ScooterZoneKind.NoRide)))

            // Off the pixels: no parking's fill over the land, no riding's hatch in stripes.
            val pixels = snapshot(ground)
            val land = Color.parseColor("#eef0f4")
            val orange = ScooterZoneLook.color(ScooterZoneKind.NoParking, isDark = false).toInt()
            val fill = pixels.at(ground, parkingMiddle)
            val alpha = ScooterZoneLook.fillOpacity(ScooterZoneKind.NoParking)
            for ((channel, name) in listOf<(Int) -> Int>(Color::red, Color::green, Color::blue).zip(listOf("red", "green", "blue"))) {
                val expected = channel(land) * (1 - alpha) + channel(orange) * alpha
                assertEquals("no parking's $name", expected, channel(fill).toDouble(), 4.0)
            }
            val reds = (0 until 12).flatMap { dx -> (0 until 12).map { dy -> pixels.at(ground, ScreenPoint(ridingOnly.x + dx, ridingOnly.y + dy)) } }
                .map { Color.red(it) - Color.blue(it) }
            assertTrue("no riding's hatch has stripes: ${reds.min()} to ${reds.max()}", reds.max() - reds.min() > 40)
            save(pixels, "zones-clipped")

            // The pair: the same edges uncut, as they would be without giving way.
            val scale = ground.phone.onMain { MapPoint.worldSize / (512 * 2.0.pow(ground.phone.map.cameraPosition.zoom)) }
            val uncut = merged(ZoneDrawing(listOf(parking, slow)).edges(scale), ZoneDrawing(listOf(riding)).edges(scale))
            ground.phone.onMain { ground.phone.map.style!!.getSourceAs<GeoJsonSource>(GroundOverlays.ZONE_EDGES_SOURCE)!!.setGeoJson(uncut) }
            waitFor("the uncut edge is drawn") { ground.drawn(slowEdgeUnder, ZoneLayers.edgeID(ScooterZoneKind.Slow)) == 1 }
            save(snapshot(ground), "zones-unclipped")
        }
    }

    @Test
    fun aRouteIsFittedThenDrawnFrameByFrameWithoutWritingItsSourceAgainThenWalkedAndFaded() {
        withGround(zonesAPI(emptyList()), zoom = 12.5) { ground ->
            settle()
            val points = route()
            val writesBefore = ground.trail.writes
            // Each frame, the dots shown and the source's writes, from the route to the end of its reveal.
            val frames = mutableListOf<Pair<IntRange, Int>>()
            val done = CountDownLatch(1)
            val watch = object : Choreographer.FrameCallback {
                override fun doFrame(frameTimeNanos: Long) {
                    val style = ground.phone.map.style ?: return
                    frames += rangeOf((style.getLayer(GroundOverlays.TRAIL) as CircleLayer).filter.toString()) to ground.trail.writes
                    if (frames.size < 400) Choreographer.getInstance().postFrameCallback(this) else done.countDown()
                }
            }
            val shownAt = System.nanoTime()
            ground.phone.onMain {
                ground.trail.applyTrail(WalkTrail(revision = 1, points = points, walked = 0.0, reveals = true))
                Choreographer.getInstance().postFrameCallback(watch)
            }
            waitFor("the whole route is drawn") { drawnWhole(ground) }
            val drawnAfter = (System.nanoTime() - shownAt) / 1e9
            // The fit's move, then the reveal's 0.7 s.
            assertTrue("drawn whole after $drawnAfter s", drawnAfter in 1.0..3.5)
            settle()
            ground.phone.onMain { Choreographer.getInstance().removeFrameCallback(watch) }

            // Fitted: the whole route 40 points in from the map's edges, give or take a point.
            ground.phone.onMain {
                val bounds = ground.phone.projection.bounds
                for (point in points) {
                    val at = ground.phone.projection.point(point)
                    assertTrue("$at in $bounds", at.x >= 39 && at.x <= bounds.width - 39 && at.y >= 39 && at.y <= bounds.height - 39)
                }
            }
            // Drawn frame by frame, by the filter alone: the source written once for the route, and once more at most
            // for the zoom the fit settled on, before the first dot shows.
            val reveal = frames.map { it.first }.distinct()
            assertTrue("${reveal.size} steps", reveal.size >= 15)
            val firstDot = frames.indexOfFirst { !it.first.isEmpty() }
            assertTrue(firstDot > 0)
            val writes = frames.drop(firstDot).map { it.second }.distinct()
            assertEquals("no write once the dots show", 1, writes.size)
            assertTrue("${writes.single() - writesBefore} writes", writes.single() - writesBefore in 1..2)
            val dots = ground.shownDots()
            assertEquals((0..dots.last()).toList(), dots)
            assertTrue(ground.drawn(ground.point(points.first()), GroundOverlays.TRAIL) >= 1)
            assertTrue(ground.drawn(ground.point(points.first()), GroundOverlays.TRAIL_CASING) >= 1)
            save(snapshot(ground), "trail-drawn")

            // Halfway: the walked part goes, by the filter again.
            val writesDrawn = ground.trail.writes
            ground.phone.onMain { ground.trail.applyTrail(WalkTrail(revision = 1, points = points, walked = 0.5, reveals = true)) }
            waitFor("the walked half goes") { ground.shownDots().first() > dots.size / 3 }
            assertEquals(writesDrawn, ground.trail.writes)
            assertEquals(dots.last(), ground.shownDots().last())
            settle()
            assertEquals(0, ground.drawn(ground.point(points.first()), GroundOverlays.TRAIL))
            // The blue of the last dot, over its casing.
            val last = ground.point(ground.dot(dots.last()))
            val pixels = snapshot(ground)
            val middle = pixels.at(ground, last)
            assertTrue("the last dot's blue: ${Integer.toHexString(middle)}", Color.blue(middle) > 200 && Color.red(middle) < 60)
            // Its casing, white, a point and a half beyond the blue.
            val rim = pixels.at(ground, ScreenPoint(last.x + 3.8, last.y))
            assertTrue("the casing's white: ${Integer.toHexString(rim)}", Color.red(rim) > 200 && Color.green(rim) > 200)
            save(pixels, "trail-walked")

            // Hidden: the source emptied at once, and the dots that showed fade in a quarter of a second.
            val opacities = mutableListOf<Pair<Long, Float>>()
            val fading = object : Choreographer.FrameCallback {
                override fun doFrame(frameTimeNanos: Long) {
                    val layer = ground.phone.map.style?.getLayer(GroundOverlays.FADING_TRAIL) as? CircleLayer ?: return
                    opacities += frameTimeNanos to layer.circleOpacity.value!!
                    if (opacities.size < 60) Choreographer.getInstance().postFrameCallback(this)
                }
            }
            ground.phone.onMain {
                ground.trail.applyTrail(null)
                Choreographer.getInstance().postFrameCallback(fading)
            }
            settle()
            assertTrue(ground.shownDots().isEmpty())
            val fade = opacities.dropWhile { it.second >= 1f }
            assertTrue("${opacities.map { it.second }}", fade.size >= 5)
            assertTrue(fade.zipWithNext().all { (a, b) -> b.second <= a.second })
            val gone = fade.first { it.second <= 0f }.first
            val took = (gone - opacities.first().first) / 1e9
            assertTrue("faded in $took s", took in 0.2..0.4)
            assertEquals(0, ground.drawn(last, GroundOverlays.FADING_TRAIL))
            assertEquals(0, ground.drawn(last, GroundOverlays.TRAIL))
        }
    }

    /** T371: the walk's scooter stays selected through a tap on the empty map while its trail is drawn, and not after. */
    @Test
    fun theMapKeepsTheScooterWalkedToSelectedAndDrawsItsTrail() {
        val points = route()
        val target = Scooter(provider = "voi", latitude = points.last().latitude, longitude = points.last().longitude, battery = 80, vehicleID = "s1")
        val api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = listOf(target))
        }
        val directions = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = points
        }
        withGround(api, directions, zoom = 15.0) { ground ->
            settle()
            ground.phone.onMain {
                val controller = ground.controller
                controller.refresh()
            }
            waitFor("the scooter is on the map") { ground.phone.onMain { ground.controller.mapScooters.value.any { it.id == target.id } } }
            ground.phone.onMain {
                val controller = ground.controller
                controller.setSearchedDestination(
                    MapDestination("Start", "", points.first(), MapDestination.Kind.Address, isCovered = true),
                )
                controller.selectScooter(target.id)
                controller.showWalkingRoute(ScooterWalkTarget.Scooter(target))
            }
            waitFor("the route is shown") { ground.phone.onMain { ground.controller.walk.value?.phase == ScooterWalkPhase.Shown } }
            waitFor("the whole route is drawn") { drawnWhole(ground) }
            settle()
            // The dots and their casing, at the spacing of the map the fit settled on, from the start of the walk.
            ground.phone.onMain {
                val style = ground.phone.map.style!!
                assertEquals(WalkTrailLook.dotWidth / 2, (style.getLayer(GroundOverlays.TRAIL) as CircleLayer).circleRadius.value!!.toDouble(), 0.0)
                assertEquals(WalkTrailLook.casingWidth / 2, (style.getLayer(GroundOverlays.TRAIL_CASING) as CircleLayer).circleRadius.value!!.toDouble(), 0.0)
            }
            val spacing = ground.phone.onMain { WalkTrailLook.mapPointsPerPoint(ground.phone.projection)!! * WalkTrailLook.dotSpacing }
            val expected = WalkTrailLook.dots(along = points.map { MapPoint(it) }, spacing = spacing)
            assertTrue(expected.size > 5)
            assertEquals(expected.size, ground.shownDots().size)
            assertEquals(expected.size, ground.shownDots(GroundOverlays.TRAIL_CASING).size)

            // A tap on the empty map: the walk keeps its scooter.
            val empty = ground.phone.onMain { ground.phone.projection.bounds }.let { ScreenPoint(it.width / 2, 60.0) }
            tap(ground, empty)
            Thread.sleep(500)
            assertEquals(target.id, ground.phone.onMain { ground.controller.selectedScooterID.value })

            // Hide route: the trail goes, and the next tap closes the card.
            ground.phone.onMain { ground.controller.hideWalkingRoute() }
            waitFor("the trail is gone") { ground.shownDots().isEmpty() && ground.shownDots(GroundOverlays.FADING_TRAIL).isEmpty() }
            tap(ground, empty)
            waitFor("the tap closes the card") { ground.phone.onMain { ground.controller.selectedScooterID.value == null } }
        }
    }

    // Helpers

    /** A walk of about 700 m from Zürich's centre north-east, with a turn and a step back. */
    private fun route(): List<GeoPoint> = listOf(
        at(east = -200.0, north = -150.0), at(east = 0.0, north = -120.0), at(east = 60.0, north = 40.0),
        at(east = 30.0, north = 60.0), at(east = 200.0, north = 260.0),
    )

    /** The whole route drawn: the filter lets through every dot of the source. */
    private fun drawnWhole(ground: Ground): Boolean {
        val range = ground.range()
        return !range.isEmpty() && range.first == 0 && range.last == ground.dotCount() - 1
    }

    /** A point `east` and `north` metres from Zürich's centre. */
    private fun at(east: Double, north: Double): GeoPoint =
        GeoPoint(zurich.latitude + north / 111_195.0, zurich.longitude + east / (111_195.0 * kotlin.math.cos(Math.toRadians(zurich.latitude))))

    private fun square(id: String, kind: ScooterZoneKind, east: Double, north: Double, side: Double): ScooterZone {
        val h = side / 2
        val ring = listOf(
            at(east - h, north - h), at(east + h, north - h), at(east + h, north + h), at(east - h, north + h), at(east - h, north - h),
        )
        return ScooterZone(id = id, provider = "voi", kind = kind, polygons = listOf(listOf(ring)))
    }

    private fun zonesAPI(zones: List<ScooterZone>) = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = emptyList())

        override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = zones, pending = false, truncated = false)
    }

    /** Two collections of features as one. */
    private fun merged(first: String, second: String): String {
        val head = "{\"type\":\"FeatureCollection\",\"features\":["
        val a = first.removePrefix(head).removeSuffix("]}")
        val b = second.removePrefix(head).removeSuffix("]}")
        return head + listOf(a, b).filter { it.isNotEmpty() }.joinToString(",") + "]}"
    }

    private fun tap(ground: Ground, at: ScreenPoint) = ground.phone.onMain {
        ground.phone.view.tap?.invoke((at.x * ground.ratio).toFloat(), (at.y * ground.ratio).toFloat())
    }

    /** What the map draws now. */
    private fun snapshot(ground: Ground): Bitmap {
        val ready = CountDownLatch(1)
        var taken: Bitmap? = null
        ground.phone.onMain {
            ground.phone.map.snapshot { bitmap ->
                taken = bitmap
                ready.countDown()
            }
        }
        assertTrue("the map's snapshot", ready.await(10, TimeUnit.SECONDS))
        return taken!!
    }

    private fun Bitmap.at(ground: Ground, point: ScreenPoint): Int =
        getPixel((point.x * ground.ratio).toInt().coerceIn(0, width - 1), (point.y * ground.ratio).toInt().coerceIn(0, height - 1))

    private fun save(bitmap: Bitmap, name: String) {
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    private fun waitFor(what: String, condition: () -> Boolean) {
        val deadline = System.currentTimeMillis() + 15_000
        while (System.currentTimeMillis() < deadline) {
            if (condition()) return
            Thread.sleep(50)
        }
        assertTrue(what, condition())
    }
}

/** The numbers a filter of TrailLayers.filter lets through: its last two numbers, as MapLibre writes it back. */
private fun rangeOf(filter: String): IntRange {
    val (low, high) = Regex("-?\\d+(\\.\\d+)?").findAll(filter).map { it.value.toDouble().toInt() }.toList().takeLast(2)
    return low..high
}
