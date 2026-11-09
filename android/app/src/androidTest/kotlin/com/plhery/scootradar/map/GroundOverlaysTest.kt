package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PointF
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.util.Log
import android.view.Choreographer
import android.view.MotionEvent
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.core.view.children
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.hideWalkingRoute
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.map.walkTrail
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
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
import com.plhery.scootradar.core.model.ScooterZoneOverlay
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.WalkTrail
import com.plhery.scootradar.core.model.WalkTrailLook
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Feature
import org.maplibre.geojson.Point
import java.io.File
import java.util.concurrent.CountDownLatch
import kotlin.math.abs

// The zones and the walk's trail on MapLibre's map (map.md MAP-151 to MAP-185): the zones of a fake server read back
// from the map and off its pixels, their edges cut where no riding lies over them; a route fitted, drawn frame by
// frame without its source written again, partly walked, then faded; T371, the walk's scooter kept selected while
// its trail is drawn; and a route shown as it was on a map made again (X-AD17). The screens are kept in the run's
// additional output, as zones-*.png and trail-*.png.
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
        /** What the view model keeps for a map made again, and the frames the map's moves are drawn on. */
        val memory: MapCameraMemory,
        val frames: CoroutineScope,
    ) {
        val ratio: Float get() = phone.view.pixelRatio

        fun point(of: GeoPoint): ScreenPoint = phone.onMain { phone.projection.point(of) }

        /** The features of a layer drawn at a point of the map, in points. */
        fun drawn(at: ScreenPoint, layer: String): Int = features(at, layer).size

        fun features(at: ScreenPoint, layer: String): List<Feature> = phone.onMain {
            phone.map.queryRenderedFeatures(PointF((at.x * ratio).toFloat(), (at.y * ratio).toFloat()), layer)
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

    private fun withGround(api: ScooterAPIClient, directions: WalkingDirectionsClient? = null, zoom: Double, at: GeoPoint = zurich, test: (Ground) -> Unit) {
        val start = CameraPosition.Builder().target(LatLng(at.latitude, at.longitude)).zoom(zoom).build()
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
                    ground(phone, controller, MapCameraMemory(), frames)
                }
                try {
                    test(ground)
                } finally {
                    phone.onMain { ground.close() }
                }
            } finally {
                frames.cancel()
                scope.cancel()
            }
        }
    }

    /** The camera, zones, trail and markers on the map, as ScooterMap puts them together. On the main thread. */
    private fun ground(phone: PhoneMap, controller: ScooterMapController, memory: MapCameraMemory, frames: CoroutineScope): Ground {
        val camera = MapCamera(phone.map, phone.view, controller, memory, frames)
        val zones = ScooterZoneLayer(phone.map, phone.view, controller, frames)
        val trail = WalkTrailLayer(phone.map, phone.view, controller, memory, frames, fit = { camera.show(it) })
        camera.rested = { animated ->
            trail.mapDidRest(animated)
            zones.mapDidRest()
        }
        val markers = ScooterMarkers(phone.map, phone.view, controller, analytics = null, scope = frames, move = { camera.show(it) })
        return Ground(phone, controller, camera, zones, trail, markers, memory, frames)
    }

    private fun Ground.close() {
        markers.close()
        trail.close()
        zones.close()
        camera.close()
    }

    /**
     * The map made again, as a new density makes the activity and its map (X-AD17): its parts go, the map takes a
     * new style, with none of the old one's sources, layers and filters, and opens where the memory says, as
     * ScooterMap opens a new map; then new parts on it, with the same memory. On the main thread.
     */
    private fun madeAgain(ground: Ground): Ground {
        ground.close()
        ground.phone.newStyle()
        ground.memory.position?.let { ground.phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(it)) }
        return ground(ground.phone, ground.controller, ground.memory, ground.frames)
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
            // The fake server's three, with Zürich's own zones built in drawn too, as the app draws them: none of the
            // points read below lies in one of the city's (ScooterZonesTests.swift's operatorZones).
            waitFor("the zones are asked for and drawn") {
                ground.phone.onMain { ground.controller.zoneState.value == ScooterZoneState.Shown && ground.controller.mapOperatorZoneCount.value == 3 }
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
            val scale = ground.phone.onMain { ZoneLayers.scale(ground.phone.map.cameraPosition.zoom) }
            val uncut = merged(ZoneDrawing(listOf(parking, slow)).edges(scale), ZoneDrawing(listOf(riding)).edges(scale))
            ground.phone.onMain { ground.phone.map.style!!.getSourceAs<GeoJsonSource>(GroundOverlays.ZONE_EDGES_SOURCE)!!.setGeoJson(uncut) }
            waitFor("the uncut edge is drawn") { ground.drawn(slowEdgeUnder, ZoneLayers.edgeID(ScooterZoneKind.Slow)) == 1 }
            save(snapshot(ground), "zones-unclipped")
        }
    }

    /**
     * UI-411: Antalya's boulevard as the catalog has it, two carriageways that meet and part again: no riding's band
     * from zoom 14 and none at 13, at full strength at any hour. Its pieces are merged into one, and at zooms 14 to 17
     * it lies under every point of both lines and the middle of every stretch between them, and from 16, where the
     * band is wide enough to tell, no edge crosses it. It is built off the main thread in well under a second, and
     * the map's frames keep coming as it appears under a pan and as a finger pans along it at zoom 15. Each zoom is a
     * fiftieth below the whole one, which the map's measured level would otherwise round either way. Near a tile's
     * edge the map returns the one piece once from each tile, so "drawn" there is any number above none. The
     * numbers are logged as "boulevard: …" and the screens kept as boulevard-*.png.
     */
    @Test
    fun antalyasBoulevardIsDrawnWholeFromZoom14AndQuickly() {
        // By its id, and below only it of what the map shows: another street of the catalog's near it can't fail this.
        val boulevard = CityRuleZone.all.single { it.id == "antalya-yasar-sobutay-bulvari" }
        // Each point of the lines and the middle of each stretch between them, from Trendy Lara in the east.
        val points = boulevard.lines.flatMap { line ->
            line + line.zipWithNext { a, b -> GeoPoint((a.latitude + b.latitude) / 2, (a.longitude + b.longitude) / 2) }
        }.distinct().sortedByDescending { it.longitude }
        val east = points.first()
        val fill = ZoneLayers.fillID(ScooterZoneKind.NoRide)
        val edge = ZoneLayers.edgeID(ScooterZoneKind.NoRide)
        val log = StringBuilder("boulevard: ${boulevard.lines.map { it.size }} points in its lines, ${points.size} looked at\n")
        withGround(zonesAPI(emptyList()), zoom = MapZoom.mapLibreZoom(13 - NEAR), at = east) { ground ->
            // Zoom 13: nothing of it.
            look(ground, east, level = 13 - NEAR)
            settle()
            assertEquals(13, ground.phone.onMain { ground.controller.viewportZoom.value })
            assertEquals(emptyList<CityRuleZone.Shown>(), ground.phone.onMain { ground.controller.mapRuleZones.value })
            assertEquals(0, ground.drawn(ground.point(east), fill))
            save(snapshot(ground), "boulevard-13")

            // Zoom 14: built as the map comes to rest, and drawn.
            val asked = SystemClock.uptimeMillis()
            look(ground, east, level = 14 - NEAR)
            waitFor("the band is drawn at zoom 14") { ground.drawn(ground.point(east), fill) > 0 }
            log.append("zoom 14 to drawn: ${SystemClock.uptimeMillis() - asked} ms\n")
            assertEquals(14, ground.phone.onMain { ground.controller.viewportZoom.value })
            val shown = ground.phone.onMain { ground.controller.mapRuleZones.value }
            assertEquals(listOf(boulevard.id to true), shown.filter { it.rule.id == boulevard.id }.map { it.rule.id to it.inForce })

            // What the overlay's work takes for this view, off the main thread, as the layer does it.
            val zones = ground.phone.onMain { ground.controller.mapZones.value }.filter { it.id == "rule:${boulevard.id}" }
            assertEquals(1, zones.size)
            val scale = ground.phone.onMain { ZoneLayers.scale(ground.phone.map.cameraPosition.zoom) }
            val merging = mutableListOf<Long>()
            val drawing = mutableListOf<Long>()
            lateinit var overlay: ScooterZoneOverlay
            runBlocking(Dispatchers.Default) {
                repeat(5) {
                    var start = SystemClock.elapsedRealtimeNanos()
                    overlay = ScooterZoneOverlay(zones, isDark = false)
                    merging += (SystemClock.elapsedRealtimeNanos() - start) / 1_000_000
                    start = SystemClock.elapsedRealtimeNanos()
                    // Its fills are written as it is made.
                    ZoneDrawing(zones).edges(scale)
                    drawing += (SystemClock.elapsedRealtimeNanos() - start) / 1_000_000
                }
            }
            log.append("${zones.sumOf { it.polygons.size }} pieces merged into ${overlay.shapes.size} in $merging ms; merged, filled and edged in $drawing ms\n")
            assertEquals(1, overlay.shapes.size)
            assertTrue("the band built in ${drawing.sorted()[2]} ms", drawing.sorted()[2] < 1_000)

            // Whole along both carriageways, at full strength.
            for (level in 14..17) {
                val unseen = points.toMutableList()
                var looks = 0
                while (unseen.isNotEmpty()) {
                    val next = unseen.first()
                    look(ground, next, level - NEAR)
                    assertEquals(level, ground.phone.onMain { ground.controller.viewportZoom.value })
                    waitFor("the band drawn at zoom $level by $next") { ground.drawn(ground.point(next), fill) > 0 }
                    val inView = ground.phone.onMain {
                        unseen.filter { point ->
                            val shown = ground.phone.projection.point(point)
                            shown.x in 20.0..370.0 && shown.y in 20.0..824.0
                        }
                    }
                    assertTrue("$next in the middle of the view", next in inView)
                    for (point in inView) {
                        // The one piece, from each of the map's tiles whose edge it is near.
                        val features = ground.features(ground.point(point), fill)
                        assertTrue("the band at zoom $level at $point", features.isNotEmpty())
                        for (feature in features) {
                            assertEquals("its strength at $point", ScooterZoneLook.fillOpacity(ScooterZoneKind.NoRide), feature.getNumberProperty("opacity").toDouble(), 1e-9)
                        }
                        if (level >= 16) assertEquals("an edge across the band at zoom $level at $point", 0, ground.drawn(ground.point(point), edge))
                    }
                    if (looks == 0) save(snapshot(ground), "boulevard-$level-east")
                    looks += 1
                    unseen -= inView.toSet()
                }
                log.append("zoom $level: ${points.size} points under the band, in $looks views\n")
            }

            // Frames: the band appearing as a finger pans it into a view at zoom 14, from 2.5 km east of its end, and a
            // finger panning along it at zoom 15.
            val off = GeoPoint(east.latitude, east.longitude + 0.028)
            look(ground, off, level = 14 - NEAR)
            waitFor("the band gone off the view") { ground.phone.onMain { ground.controller.mapRuleZones.value.isEmpty() } }
            log.append("appearing as a pan brings it in at zoom 14: ${pan(ground, millis = 1_600)}\n")
            waitFor("the band shown after the pan") { ground.phone.onMain { ground.controller.mapRuleZones.value.isNotEmpty() } }
            look(ground, east, level = 15 - NEAR)
            waitFor("the band drawn at zoom 15") { ground.drawn(ground.point(east), fill) > 0 }
            save(snapshot(ground), "boulevard-15-before-pan")
            log.append("panning along it at zoom 15: ${pan(ground)}\n")
            save(snapshot(ground), "boulevard-15-after-pan")
        }
        Log.i("GroundOverlaysTest", log.toString())
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

            // Hidden: the dots that showed fade in a quarter of a second, the route itself until it is taken off
            // 100 ms on, as iOS keeps its old lines, and then its copy, unseen under it till then.
            val opacities = mutableListOf<Triple<Long, Float, Float>>()
            val fading = object : Choreographer.FrameCallback {
                override fun doFrame(frameTimeNanos: Long) {
                    val style = ground.phone.map.style ?: return
                    val route = (style.getLayer(GroundOverlays.TRAIL) as CircleLayer).circleOpacity.value!!
                    val copy = (style.getLayer(GroundOverlays.FADING_TRAIL) as CircleLayer).circleOpacity.value!!
                    opacities += Triple(frameTimeNanos, route, copy)
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
            val start = opacities.first().first
            val gone = fade.first { it.second <= 0f }.first
            val took = (gone - start) / 1e9
            assertTrue("faded in $took s", took in 0.2..0.4)
            assertTrue("${opacities.map { it.second to it.third }}", opacities.all { it.third == 0f || it.third == it.second })
            val copied = (opacities.first { it.third > 0f }.first - start) / 1e9
            assertTrue("the copy shown after $copied s", copied in 0.08..0.25)
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
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumRange: Int) = ScooterResponse(vehicles = listOf(target))
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
                controller.setUserLocation(points.first())
                controller.selectScooter(target.id)
                controller.showWalkingRoute(ScooterWalkTarget.Scooter(target))
            }
            waitFor("the route is shown") { ground.phone.onMain { ground.controller.walk.value?.phase == ScooterWalkPhase.Shown } }
            waitFor("the whole route is drawn") { drawnWhole(ground) }
            settle()
            // A fifth of the way walked, as iOS's test starts (ScooterWalkTests.swift:474).
            ground.phone.onMain { ground.controller.setUserLocation(along(points, share = 0.2)) }
            val walked = ground.phone.onMain { ground.controller.walkTrail?.walked ?: 0.0 }
            assertEquals(0.2, walked, 0.01)
            // The dots and their casing, at the spacing of the map the fit settled on, but those of the part walked.
            ground.phone.onMain {
                val style = ground.phone.map.style!!
                assertEquals(WalkTrailLook.dotWidth / 2, (style.getLayer(GroundOverlays.TRAIL) as CircleLayer).circleRadius.value!!.toDouble(), 0.0)
                assertEquals(WalkTrailLook.casingWidth / 2, (style.getLayer(GroundOverlays.TRAIL_CASING) as CircleLayer).circleRadius.value!!.toDouble(), 0.0)
            }
            val spacing = ground.phone.onMain { WalkTrailLook.mapPointsPerPoint(ground.phone.projection)!! * WalkTrailLook.dotSpacing }
            val expected = WalkTrailLook.dots(along = points.map { MapPoint(it) }, spacing = spacing, from = walked)
            assertTrue(expected.size > 5)
            waitFor("the walked part goes") { ground.shownDots().size == expected.size }
            assertEquals(expected.size, ground.shownDots(GroundOverlays.TRAIL_CASING).size)
            val first = MapPoint(ground.dot(ground.shownDots().first()))
            assertEquals(expected.first().x, first.x, spacing / 100)
            assertEquals(expected.first().y, first.y, spacing / 100)

            // A tap on the empty map: the walk keeps its scooter. The map takes a tap on the main thread, and the
            // selection is settled when it returns.
            val empty = ground.phone.onMain { ground.phone.projection.bounds }.let { ScreenPoint(it.width / 2, 60.0) }
            tap(ground, empty)
            assertEquals(target.id, ground.phone.onMain { ground.controller.selectedScooterID.value })

            // Hide route: the trail goes, and the next tap closes the card.
            ground.phone.onMain { ground.controller.hideWalkingRoute() }
            waitFor("the trail is gone") { ground.shownDots().isEmpty() && ground.shownDots(GroundOverlays.FADING_TRAIL).isEmpty() }
            tap(ground, empty)
            waitFor("the tap closes the card") { ground.phone.onMain { ground.controller.selectedScooterID.value == null } }
        }
    }

    /**
     * X-AD17: a new density or display size makes the activity and its map again. The iPhone's screen is never made
     * again, and fits a route once, as it is found: the new map shows the route as it was, where the hand had moved
     * the map since, neither fitted again nor drawn again from its start, in the first frame its style has the trail.
     */
    @Test
    fun aRouteShownIsNeitherFittedNorDrawnAgainOnAMapMadeAgain() {
        val points = route()
        withGround(scooterAPI(points), directions(points), zoom = 15.0) { ground ->
            walkTo(ground, points)
            waitFor("the route is shown") { ground.phone.onMain { ground.controller.walk.value?.phase == ScooterWalkPhase.Shown } }
            waitFor("the whole route is drawn") { drawnWhole(ground) }
            settle()
            // The hand moves the map a kilometre north, off the route.
            ground.phone.onMain {
                ground.phone.map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(zurich.latitude + 0.009, zurich.longitude)))
            }
            settle()
            val moved = ground.phone.onMain { ground.phone.map.cameraPosition }
            // Made again, with a new style. What the trail shows, each frame from then: nothing while the style loads.
            val ranges = mutableListOf<IntRange?>()
            val watch = object : Choreographer.FrameCallback {
                override fun doFrame(frameTimeNanos: Long) {
                    ranges += (ground.phone.map.style?.getLayer(GroundOverlays.TRAIL) as? CircleLayer)?.let { rangeOf(it.filter.toString()) }
                    if (ranges.size < 120) Choreographer.getInstance().postFrameCallback(this)
                }
            }
            val remade = ground.phone.onMain {
                madeAgain(ground).also { Choreographer.getInstance().postFrameCallback(watch) }
            }
            try {
                settle()
                ground.phone.onMain {
                    val position = ground.phone.map.cameraPosition
                    assertEquals(moved.target!!.latitude, position.target!!.latitude, 1e-9)
                    assertEquals(moved.target!!.longitude, position.target!!.longitude, 1e-9)
                    assertEquals(moved.zoom, position.zoom, 1e-9)
                }
                val dots = remade.dotCount()
                assertTrue("the new style's route has $dots dots", dots > 5)
                val drawn = ranges.dropWhile { it == null }
                assertTrue("${drawn.size} frames with the trail of ${ranges.size}", drawn.size >= 60)
                assertTrue("the route whole from the first frame: ${drawn.distinct()}", drawn.all { it == 0 until dots })
            } finally {
                ground.phone.onMain { remade.close() }
            }
        }
    }

    /**
     * X-AD17: a route found after the map was made again, while it was being looked for, is new to the map: it is
     * fitted, then draws itself from its start, as on the first map and on the iPhone's (review-app-ac 3).
     */
    @Test
    fun aRouteFoundOnAMapMadeAgainIsFittedThenDrawsItself() {
        val points = route()
        val found = CompletableDeferred<Unit>()
        val directions = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
                found.await()
                return points
            }
        }
        withGround(scooterAPI(points), directions, zoom = 15.0) { ground ->
            walkTo(ground, points)
            waitFor("the route is looked for") { ground.phone.onMain { ground.controller.walk.value?.phase == ScooterWalkPhase.Finding } }
            val remade = ground.phone.onMain { madeAgain(ground) }
            try {
                settle()
                val before = ground.phone.onMain { ground.phone.map.cameraPosition.zoom }
                // Each frame from when the route is found, the dots the new style's trail shows.
                val ranges = mutableListOf<IntRange?>()
                val watch = object : Choreographer.FrameCallback {
                    override fun doFrame(frameTimeNanos: Long) {
                        ranges += (ground.phone.map.style?.getLayer(GroundOverlays.TRAIL) as? CircleLayer)?.let { rangeOf(it.filter.toString()) }
                        if (ranges.size < 400) Choreographer.getInstance().postFrameCallback(this)
                    }
                }
                ground.phone.onMain {
                    found.complete(Unit)
                    Choreographer.getInstance().postFrameCallback(watch)
                }
                waitFor("the route is shown") { ground.phone.onMain { ground.controller.walk.value?.phase == ScooterWalkPhase.Shown } }
                waitFor("the whole route is drawn") { drawnWhole(remade) }
                settle()
                // Fitted: the camera came closer, the whole route is 40 points in from the map's edges, and it spans
                // the room inside them across or down, as a fit leaves it: all of it but 2%, which a fit 45 points in
                // (0.97 of it on PhoneMap's 390 points across) would not reach.
                ground.phone.onMain {
                    val zoom = ground.phone.map.cameraPosition.zoom
                    val bounds = ground.phone.projection.bounds
                    val at = points.map { ground.phone.projection.point(it) }
                    for (point in at) {
                        assertTrue("$point in $bounds", point.x >= 39 && point.x <= bounds.width - 39 && point.y >= 39 && point.y <= bounds.height - 39)
                    }
                    val across = (at.maxOf { it.x } - at.minOf { it.x }) / (bounds.width - 80)
                    val down = (at.maxOf { it.y } - at.minOf { it.y }) / (bounds.height - 80)
                    assertTrue("fitted from zoom $before to $zoom, the route across $across and down $down of the room", zoom > before + 0.1 && maxOf(across, down) > 0.98)
                }
                // Drawn from its start, frame by frame.
                val reveal = ranges.filterNotNull().distinct()
                assertTrue("drawn in ${reveal.size} steps: $reveal", reveal.size >= 15)
                assertTrue("from its start: $reveal", reveal.filterNot { it.isEmpty() }.all { it.first == 0 })
                assertEquals(ground.phone.onMain { ground.controller.walkTrail?.revision }, ground.memory.trailRevision)
            } finally {
                ground.phone.onMain { remade.close() }
            }
        }
    }

    // Helpers

    /** A server with a scooter at the end of the route. */
    private fun scooterAPI(points: List<GeoPoint>) = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumRange: Int) = ScooterResponse(vehicles = listOf(walkTarget(points)))
    }

    private fun walkTarget(points: List<GeoPoint>) =
        Scooter(provider = "voi", latitude = points.last().latitude, longitude = points.last().longitude, battery = 80, vehicleID = "s1")

    /** A router that finds the route. */
    private fun directions(points: List<GeoPoint>) = object : WalkingDirectionsClient {
        override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = points
    }

    /** The scooter at the route's end loaded, selected, and walked to from the route's start. */
    private fun walkTo(ground: Ground, points: List<GeoPoint>) {
        val target = walkTarget(points)
        settle()
        ground.phone.onMain { ground.controller.refresh() }
        waitFor("the scooter is on the map") { ground.phone.onMain { ground.controller.mapScooters.value.any { it.id == target.id } } }
        ground.phone.onMain {
            val controller = ground.controller
            controller.setUserLocation(points.first())
            controller.selectScooter(target.id)
            controller.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        }
    }

    /** A walk of about 700 m from Zürich's centre north-east, with a turn and a step back. */
    private fun route(): List<GeoPoint> = listOf(
        at(east = -200.0, north = -150.0), at(east = 0.0, north = -120.0), at(east = 60.0, north = 40.0),
        at(east = 30.0, north = 60.0), at(east = 200.0, north = 260.0),
    )

    /** The point a share of the way along a route, measured in metres on the ground. */
    private fun along(points: List<GeoPoint>, share: Double): GeoPoint {
        val metresPerDegree = 111_195.0
        val cosine = kotlin.math.cos(Math.toRadians(zurich.latitude))
        fun length(a: GeoPoint, b: GeoPoint) =
            kotlin.math.hypot((b.longitude - a.longitude) * metresPerDegree * cosine, (b.latitude - a.latitude) * metresPerDegree)
        var left = share * points.zipWithNext().sumOf { (a, b) -> length(a, b) }
        for ((a, b) in points.zipWithNext()) {
            val segment = length(a, b)
            if (left <= segment) {
                val t = left / segment
                return GeoPoint(a.latitude + (b.latitude - a.latitude) * t, a.longitude + (b.longitude - a.longitude) * t)
            }
            left -= segment
        }
        return points.last()
    }

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
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumRange: Int) = ScooterResponse(vehicles = emptyList())

        override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = zones, pending = false, truncated = false)
    }

    /**
     * The camera put flat over [at] at the iPhone's zoom [level], and, unless told not to [waits], the controller told
     * the view, which it is once the map rests.
     */
    private fun look(ground: Ground, at: GeoPoint, level: Double, waits: Boolean = true) {
        ground.phone.onMain {
            val position = CameraPosition.Builder().target(LatLng(at.latitude, at.longitude)).zoom(MapZoom.mapLibreZoom(level)).tilt(0.0).bearing(0.0).build()
            ground.phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(position))
        }
        if (!waits) return
        waitFor("the controller told zoom $level over $at") {
            ground.phone.onMain {
                val view = ground.controller.viewport.value
                abs(ground.controller.viewportZoomLevel.value - level) < 0.005 && at.latitude in view.south..view.north && at.longitude in view.west..view.east
            }
        }
    }

    /** A pan's frames: a finger drawn across the map for [millis], 800 ms a swipe, the view moving west. */
    private fun pan(ground: Ground, millis: Long = 4_000): String {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        gfxinfo("reset")
        val drawn = mutableListOf<Long>()
        val frames = MapView.OnDidFinishRenderingFrameListener { _, _, _ -> drawn += SystemClock.uptimeMillis() }
        ground.phone.onMain { ground.phone.view.addOnDidFinishRenderingFrameListener(frames) }
        val ratio = ground.ratio
        val until = SystemClock.uptimeMillis() + millis
        while (SystemClock.uptimeMillis() < until) {
            val down = SystemClock.uptimeMillis()
            fun send(action: Int, x: Float) {
                val event = MotionEvent.obtain(down, SystemClock.uptimeMillis(), action, x * ratio, 420f * ratio, 0)
                instrumentation.runOnMainSync { ground.phone.view.dispatchTouchEvent(event) }
                event.recycle()
            }
            send(MotionEvent.ACTION_DOWN, 60f)
            for (step in 1..PAN_STEPS) {
                SystemClock.sleep(16)
                send(MotionEvent.ACTION_MOVE, 60f + 270f * step / PAN_STEPS)
            }
            // Held still before it is let go, so that it doesn't fling.
            SystemClock.sleep(100)
            send(MotionEvent.ACTION_MOVE, 330f)
            send(MotionEvent.ACTION_UP, 330f)
        }
        ground.phone.onMain { ground.phone.view.removeOnDidFinishRenderingFrameListener(frames) }
        val stats = gfxinfo("")
        val janky = Regex("Janky frames: (\\d+) \\(([\\d.]+)%\\)").find(stats)?.groupValues
        val total = Regex("Total frames rendered: (\\d+)").find(stats)?.groupValues?.get(1)
        val percentiles = listOf(50, 90, 99).joinToString("/") { Regex("${it}th percentile: (\\d+)ms").find(stats)?.groupValues?.get(1) ?: "?" }
        val gaps = drawn.zipWithNext { a, b -> b - a }.sorted()
        val p90 = gaps.getOrNull((gaps.size * 0.9).toInt()) ?: 0L
        return "window frames $total, janky ${janky?.let { "${it[1]} (${it[2]} %)" }}, $percentiles ms; map frames ${drawn.size} in $millis ms, " +
            "p90 gap $p90 ms, longest ${gaps.lastOrNull()} ms, over 50 ms ${gaps.count { it > 50 }}"
    }

    private fun gfxinfo(argument: String): String {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val output = instrumentation.uiAutomation.executeShellCommand("dumpsys gfxinfo ${instrumentation.targetContext.packageName} $argument".trim())
        return ParcelFileDescriptor.AutoCloseInputStream(output).use { String(it.readBytes()) }
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

    /**
     * What the map draws now, all of it, past the screen's edges too: its texture's last frame. MapLibre's own
     * snapshot waits for a frame that a map at rest doesn't draw.
     */
    private fun snapshot(ground: Ground): Bitmap = ground.phone.onMain {
        val frame = ground.phone.view.texture()?.bitmap
        assertNotNull("the map's frame", frame)
        frame!!
    }

    private fun View.texture(): TextureView? = when (this) {
        is TextureView -> this
        is ViewGroup -> children.firstNotNullOfOrNull { it.texture() }
        else -> null
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

/** How far below a whole zoom the boulevard's test looks: the map's measured level might round it either way. */
private const val NEAR = 0.02

/** The moves of a finger's swipe across the map, one a frame. */
private const val PAN_STEPS = 50
