package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterGridClustering
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenPoint
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.math.floor
import kotlin.math.log10

/** The clusters on the map: the server's and its city totals, the app's own grid, and what a tap on one does. */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMarkerClustersTest {
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current

    private val selections = mutableListOf<String?>()
    private val events = mutableListOf<String>()
    private val moves = mutableListOf<CameraMove>()
    private val scene = ScooterMarkerScene(
        art,
        onSelectionChange = { selections += it },
        track = { name, _ -> events += name },
        move = { moves += it },
        now = { 100.0 },
        animates = { true },
    )

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        Locale.setDefault(locale)
        ScooterLanguage.current = language
    }

    /**
     * A map at the iPhone's 14.3, centred on the middle of one of the web's cells at 14, 64 of its pixels across:
     * 4,096 map points, 79 pt on the screen.
     */
    private fun cellMap(): FlatMarkerMap {
        val zurich = MapPoint(GeoPoint(47.3769, 8.5417))
        val middle = MapPoint((floor(zurich.x / 4096) + 0.5) * 4096, (floor(zurich.y / 4096) + 0.5) * 4096)
        return FlatMarkerMap(centre = middle.coordinate, mapLibreZoom = 13.3)
    }

    @Test
    fun theClusteringZoomIsTheIPhonesOneLevelAboveMapLibres() {
        // MapLibre's 14 is the iPhone's and the server's 15, the closest zoom that clusters (MAP-313).
        val clustering = FlatMarkerMap(mapLibreZoom = 13.99)
        assertEquals(14.99, MapZoom.level(on = clustering), 1e-9)
        assertTrue(scene.updateClusteringMode(MapZoom.level(on = clustering), clustering))
        assertEquals(true, scene.clusteringEnabled)
        val street = FlatMarkerMap(mapLibreZoom = 14.01)
        assertTrue(scene.updateClusteringMode(MapZoom.level(on = street), street))
        assertEquals(false, scene.clusteringEnabled)
    }

    @Test
    fun theServersClustersAndCityTotalsAreDiscsWithTheirNumbers() {
        val zurich = ScooterCluster("city:ch:Zürich", 47.3769, 8.5417, count = 1288, providers = mapOf("voi" to 700, "lime" to 588), city = "Zürich")
        val group = ScooterCluster("13:4290:2868", 47.39, 8.51, count = 12, providers = mapOf("bird" to 6, "lime" to 6))
        scene.reconcileClusters(listOf(zurich, group), revision = 1)

        val features = MarkerFeatures.markers(scene, art)
        assertEquals(listOf("g:city:ch:Zürich", "g:13:4290:2868"), features.map { it.id })
        // The disc grows with the digits, glows in the leading provider's colour, the first of the catalog's
        // order among equals, and the larger total is drawn over the smaller.
        val total = scene.clusters()[0]
        assertEquals(ScooterProvider.Voi, total.provider)
        assertEquals(44.0, total.diameter, 0.0)
        assertEquals((500 + log10(1289.0) * 60).toFloat(), features[0].sortKey)
        assertEquals(ScooterMarkerArt.ClusterKey(ScooterProvider.Voi, 44.0, isDark = false, count = "1288").id, features[0].image)
        assertEquals(ScooterProvider.Bird, scene.clusters()[1].provider)
        assertEquals(36.0, scene.clusters()[1].diameter, 0.0)
        assertTrue(features[0].sortKey > features[1].sortKey)
        // Its picture is the disc and its glow, with the count written in it.
        val picture = features[0].picture()
        assertEquals((44 + 32) * 3, picture.width)

        // The same revision changes nothing; a total that changes keeps its mark; one that goes is taken off.
        val version = scene.markersVersion
        scene.reconcileClusters(emptyList(), revision = 1)
        assertEquals(version, scene.markersVersion)
        scene.reconcileClusters(listOf(zurich.copy(count = 1290, providers = mapOf("voi" to 702, "lime" to 588))), revision = 2)
        assertSame(total, scene.clusters().single())
        assertEquals(1290, total.cluster.count)
        // A dark map draws them dark.
        scene.isDark = true
        val dark = ScooterMarkerArt.ClusterKey(ScooterProvider.Voi, 44.0, isDark = true, count = "1290")
        assertEquals(dark.id, MarkerFeatures.markers(scene, art).single().image)
    }

    @Test
    fun zoomedOutTheAppGathersItsScootersAsTheWebDoes() {
        val map = cellMap()
        val scooters = listOf(
            scooter("a", "lime", at = map.at(195.0, 422.0)),
            scooter("b", "lime", at = map.at(197.0, 423.0)),
            scooter("c", "voi", at = map.at(193.0, 421.0)),
            scooter("alone", "bolt", at = map.at(60.0, 120.0)),
        )
        scene.reconcile(scooters, revision = 1)
        val level = MapZoom.level(on = map)
        scene.updateClusteringMode(level, map)
        scene.updateClusters(level)

        // The web's grid at the map's whole zoom: the iPhone's 14.
        val web = ScooterGridClustering.cluster(scooters, 14.0)
        assertEquals(web.clusters, scene.clusters().map { it.cluster })
        assertEquals(1, web.clusters.size)
        val cluster = scene.clusters().single()
        assertEquals(listOf("lime:a", "lime:b", "voi:c"), cluster.members!!.map { it.id })
        assertEquals(ScooterProvider.Lime, cluster.provider)
        // Its scooters are not drawn on their own.
        assertEquals(listOf("bolt:alone"), scene.drawnMarks().map { it.scooter.id })
        assertEquals(listOf("v:bolt:alone", "c:${cluster.id}"), MarkerFeatures.markers(scene, art).map { it.id })

        // The scooter walked to stands on its own.
        scene.parent = MarkerParent(isWalking = true)
        scene.applySelection("voi:c", map)
        scene.updateClusters(level)
        assertEquals(listOf("lime:a", "lime:b"), scene.clusters().single().members!!.map { it.id })
        assertEquals(setOf("bolt:alone", "voi:c"), scene.drawnMarks().map { it.scooter.id }.toSet())

        // At street level there are none.
        val street = FlatMarkerMap(mapLibreZoom = 15.0)
        scene.updateClusteringMode(MapZoom.level(on = street), street)
        scene.updateClusters(MapZoom.level(on = street))
        assertTrue(scene.clusters().isEmpty())
        assertEquals(4, scene.drawnMarks().size)
    }

    @Test
    fun aClusterOfTheAppsOpensOntoItsScooters() {
        val map = cellMap()
        val scooters = listOf(scooter("a", "lime", at = map.at(195.0, 422.0)), scooter("b", "voi", at = map.at(197.0, 424.0)))
        scene.reconcile(scooters, revision = 1)
        scene.updateClusteringMode(MapZoom.level(on = map), map)
        scene.updateClusters(MapZoom.level(on = map))
        scene.applySelection("lime:other", map)

        val centre = map.point(scene.clusters().single().cluster.coordinate)
        // Off its disc, inside its 48 pt view.
        scene.tap(ScreenPoint(centre.x + 22, centre.y - 22), map)

        assertEquals(listOf("cluster_select"), events)
        assertEquals(listOf<CameraMove>(CameraMove.Fit(scooters.map { it.coordinate }, ofCluster = true)), moves)
        // No dot was in reach: the card closes, as the iPhone's own tap closes it.
        assertEquals(listOf<String?>(null), selections)
    }

    @Test
    fun aGroupOfTheServersOpensOntoItsCitiesAndATotalOntoItsCity() {
        val map = FlatMarkerMap(mapLibreZoom = 6.0)
        val bounds = GeoBounds(south = 48.8397, west = 2.2399, north = 48.8566, east = 2.3522)
        val group = ScooterCluster("group:city:fr:Paris", 48.8566, 2.3522, count = 4200, providers = mapOf("dott" to 3200), city = "Paris, Boulogne", bounds = bounds)
        val city = ScooterCluster("city:fr:Lyon", 45.764, 4.8357, count = 900, providers = mapOf("voi" to 900), city = "Lyon")
        val cell = ScooterCluster("13:4150:2818", 45.0, 5.5, count = 30, providers = mapOf("voi" to 30))

        for (cluster in listOf(group, city, cell)) scene.open(ClusterMark(cluster, members = null), map)

        // A phone's span, 390 pt across.
        val (paris, lyon, closer) = moves.map { (it as CameraMove.Region).region }
        assertEquals(bounds.center.latitude, paris.center.latitude, 1e-12)
        assertEquals(bounds.center.longitude, paris.center.longitude, 1e-12)
        assertEquals(0.08, paris.latitudeDelta, 1e-12)
        assertEquals(bounds.longitudeSpan * 1.6, paris.longitudeDelta, 1e-12)
        assertEquals(45.764, lyon.center.latitude, 0.0)
        assertEquals(0.08, lyon.latitudeDelta, 0.0)
        assertEquals(0.12, lyon.longitudeDelta, 0.0)
        // Two zoom levels closer.
        val span = MapZoom.region(of = map.visibleMapRect)
        assertEquals(span.latitudeDelta / 4, closer.latitudeDelta, 1e-12)
        assertEquals(span.longitudeDelta / 4, closer.longitudeDelta, 1e-12)
        assertEquals(listOf("cluster_select", "cluster_select", "cluster_select"), events)
    }

    @Test
    fun aTapOnAClusterWithADotInReachSelectsTheDotAndZoomsIn() {
        val map = FlatMarkerMap(mapLibreZoom = 12.0)
        // A scooter the server sends alone, beside one of its clusters.
        scene.parent = MarkerParent(usesServerClusters = true)
        scene.reconcile(listOf(scooter("alone", "lime", at = map.at(195.0, 400.0))), revision = 1)
        scene.reconcileClusters(listOf(ScooterCluster("12:2145:1434", map.at(215.0, 400.0).latitude, map.at(215.0, 400.0).longitude, 12, mapOf("voi" to 12))), revision = 1)

        // On the dot's square and on the cluster's view, the cluster drawn above: both (MAP-209).
        scene.tap(ScreenPoint(205.0, 400.0), map)
        assertEquals(listOf<String?>("lime:alone"), selections)
        assertEquals(1, moves.size)

        // Selected, the dot is above every cluster: the tap is the dot's alone.
        scene.tap(ScreenPoint(205.0, 400.0), map)
        assertEquals(1, moves.size)
        assertNull(scene.topCluster(ScreenPoint(205.0, 400.0), map))
        // Beyond the dot's square the cluster is on top again.
        assertEquals("12:2145:1434", scene.topCluster(ScreenPoint(230.0, 400.0), map)?.id)
        assertTrue(scene.clusters().single().isServer)
    }
}
