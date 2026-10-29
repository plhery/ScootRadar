package com.plhery.scootradar.map

import android.os.SystemClock
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
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
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng

/**
 * The pictures the style keeps for the markers (MAP-247, ScooterMarkerArt.swift:37-46): zooming through every
 * scale and switching to dark draws many, and once more than 600 are kept those no layer draws are taken out of
 * the style, while those drawn stay in it. The copies the dots' bands grew as they lit up stay in it until then, and
 * go with them.
 */
@RunWith(AndroidJUnit4::class)
class ScooterMarkerImagesTest {
    private val zurich = GeoPoint(47.3769, 8.5417)
    private val language = ScooterLanguage.current

    /** One scooter of each provider, a few metres apart around Zürich's station. */
    private val scooters = ScooterProvider.entries.mapIndexed { index, provider ->
        Scooter(
            provider = provider.rawValue,
            latitude = zurich.latitude + (index / 7 - 3) * 0.0002,
            longitude = zurich.longitude + (index % 7 - 3) * 0.0003,
            battery = 80,
            vehicleID = "s$index",
            distanceMeters = 0.0,
        )
    }
    private val api = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = scooters)
    }

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = language
    }

    @Test
    fun picturesNoLayerDrawsAreTakenOutOfTheStyleOnceSixHundredAreKept() {
        val start = CameraPosition.Builder().target(LatLng(zurich.latitude, zurich.longitude)).zoom(15.0).build()
        withPhoneMap(start) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
            val (camera, markers, controller) = phone.onMain {
                val controller = testController(scope, api)
                val camera = MapCamera(phone.map, phone.view, controller, MapCameraMemory(), frames)
                val markers = ScooterMarkers(phone.map, phone.view, controller, analytics = null, scope = scope, move = { camera.show(it) })
                // The rider is on the map: the first scooters light up from there.
                controller.setUserLocation(zurich)
                val projection = phone.projection
                val level = MapZoom.level(on = projection)
                controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), MapZoom.apiZoom(level), level)
                controller.refresh()
                Triple(camera, markers, controller)
            }
            try {
                waitFor("every provider's dot") { phone.onMain { markers.scene.marks.size == scooters.size } }

                /** The pictures the layers draw now, once the style has every one of them. */
                fun drawn(): Set<String> {
                    InstrumentationRegistry.getInstrumentation().waitForIdleSync()
                    var names = emptySet<String>()
                    waitFor("the style has the pictures drawn") {
                        phone.onMain {
                            val scene = markers.scene
                            names = (MarkerFeatures.markers(scene, markers.art) + MarkerFeatures.pills(scene, markers.art, at = SystemClock.uptimeMillis() / 1000.0) +
                                MarkerFeatures.lastSeen(scene, markers.art)).mapTo(HashSet()) { it.image }
                            val style = phone.map.style!!
                            names.all { style.getImage(it) != null }
                        }
                    }
                    return names
                }

                fun inStyle(names: Collection<String>): Set<String> = phone.onMain {
                    val style = phone.map.style!!
                    names.filterTo(HashSet()) { style.getImage(it) != null }
                }

                // The dots lit up, grown in their bands' own copies of their pictures, which stay once it is over.
                // The rider goes, and the names of the walks to the scooters with it.
                waitFor("the light-up is over") { phone.onMain { phone.map.style!!.layers.none { "-band-" in it.id } } }
                val copies = phone.onMain { markers.copiesKept }
                assertTrue("no copies", copies.isNotEmpty())
                assertEquals(copies, inStyle(copies))
                val lit = drawn()
                phone.onMain { controller.setUserLocation(null) }

                // Every tenth of a zoom from 15 to 16.6 draws the dots at one size of the next, light and then dark,
                // until more than 600 have been drawn. The switch to dark draws them dark where the map is.
                val first = drawn()
                assertTrue(first.joinToString(), first.any { it.startsWith("dot/") })
                // The style has those drawn with the rider too.
                val kept = HashSet(lit + first)
                var crossed: Set<String>? = null

                /** Whether what is drawn now takes the pictures drawn past 600; up to 600 the first ones are kept. */
                fun crosses(at: String): Boolean {
                    val names = drawn()
                    if ((kept + names).size > 600) crossed = names
                    kept += names
                    if (crossed == null) {
                        assertEquals("the first pictures $at", first, inStyle(first))
                        assertEquals("the copies $at", copies, inStyle(copies))
                    }
                    return crossed != null
                }
                loop@ for (dark in listOf(false, true)) {
                    phone.onMain { markers.setDark(dark) }
                    if (crosses("as dark is $dark")) break@loop
                    for (tenth in 150..166) {
                        phone.onMain { phone.map.moveCamera(CameraUpdateFactory.zoomTo(tenth / 10.0)) }
                        SystemClock.sleep(100)
                        if (crosses("at $tenth, dark $dark")) break@loop
                    }
                }
                assertNotNull("only ${kept.size} pictures were drawn", crossed)
                val now = crossed!!

                // Those drawn now stay; the first ones, no longer drawn, are gone, and so are all but a few others.
                assertEquals(now, inStyle(now))
                assertEquals(emptySet<String>(), inStyle(first - now))
                assertTrue("${inStyle(kept).size} of ${kept.size} kept", inStyle(kept).size <= 600)
                // The copies are gone with them.
                assertEquals(emptySet<String>(), inStyle(copies))
                assertEquals(emptySet<String>(), phone.onMain { markers.copiesKept })
            } finally {
                phone.onMain {
                    markers.close()
                    camera.close()
                }
                frames.cancel()
                scope.cancel()
            }
        }
    }

    /** Waits up to 10 s for a condition, and fails if it never holds. */
    private fun waitFor(what: String, condition: () -> Boolean) {
        val end = SystemClock.uptimeMillis() + 10_000
        while (SystemClock.uptimeMillis() < end) {
            if (condition()) return
            SystemClock.sleep(50)
        }
        assertTrue(what, condition())
    }
}
