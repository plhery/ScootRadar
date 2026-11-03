package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode

/**
 * A cluster's number, a city's total on the Europe view above all, is read whole or not at all: one whose disc meets
 * the chrome over the map fades out, and back in as the map takes it clear. The cities' totals are drawn over the
 * rider, whose dot would hide its own city's digits.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class CountsClearOfTheChromeTest {
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private var time = 100.0
    private var animates = true
    private val scene = ScooterMarkerScene(art, now = { time }, animates = { animates })

    private fun cluster(id: String, at: GeoPoint, count: Int) =
        ScooterCluster(id, at.latitude, at.longitude, count = count, providers = mapOf("lime" to count), city = id)

    private fun mark(id: String): ClusterMark = scene.clusters().first { it.id == id }

    @Test
    fun aDiscMeetsARectangleWhereItsEdgeGoesIntoIt() {
        val bar = ScreenRect(16.0, 47.0, 358.0, 56.0)
        // Below the bar by less than its radius, its top is under it; by its radius, it touches it and no more.
        assertTrue(ScooterMarkerScene.discMeets(ScreenPoint(100.0, 120.0), 20.0, bar))
        assertFalse(ScooterMarkerScene.discMeets(ScreenPoint(100.0, 123.0), 20.0, bar))
        // Off a corner, by the distance to the corner, not by the square around the disc.
        assertFalse(ScooterMarkerScene.discMeets(ScreenPoint(390.0, 119.0), 20.0, bar))
        assertTrue(ScooterMarkerScene.discMeets(ScreenPoint(386.0, 115.0), 20.0, bar))
        // Its centre in it.
        assertTrue(ScooterMarkerScene.discMeets(ScreenPoint(100.0, 60.0), 20.0, bar))
    }

    @Test
    fun theChromeIsTheStatusBarTheSearchBarThePanelTheFoldAndWhatFloatsAtTheFoot() {
        val map = FlatMarkerMap()
        val bar = ScreenRect(16.0, 55.0, 358.0, 56.0)
        val panel = ScreenRect(16.0, 55.0, 340.0, 500.0)
        val fold = ScreenRect(0.0, 420.0, 390.0, 4.0)
        val legend = ScreenRect(120.0, 620.0, 190.0, 36.0)
        val dock = ScreenRect(0.0, 670.0, 390.0, 174.0)
        scene.parent = MarkerParent(
            interactionExclusionFrame = bar,
            panelFrame = panel,
            foldFrame = fold,
            bottomChromeFrames = listOf(ScreenRect(318.0, 600.0, 0.0, 0.0), legend, dock),
        )
        // The status bar, a tablet's window handle in it, is all above the safe area; a frame of nothing is left out.
        val status = ScreenRect(0.0, 0.0, 390.0, 47.0)
        assertEquals(listOf(status, bar, panel, fold, legend, dock), scene.countChrome(map))
        assertEquals(listOf(bar, panel, fold, legend, dock), scene.countChrome(FlatMarkerMap(safeTop = 0.0)))
    }

    @Test
    fun aCountUnderTheStatusBarTheSearchBarTheNoticeTheLocateButtonOrTheDockIsHidden() {
        val map = FlatMarkerMap()
        val searchBar = ScreenRect(16.0, 55.0, 358.0, 56.0)
        val locate = ScreenRect(318.0, 600.0, 56.0, 56.0)
        // The zone legend, saying "Zoom in to see the zones" over the Europe view.
        val notice = ScreenRect(120.0, 620.0, 190.0, 36.0)
        val dock = ScreenRect(0.0, 670.0, 390.0, 174.0)
        scene.parent = MarkerParent(
            isOverview = true,
            interactionExclusionFrame = searchBar,
            bottomChromeTop = dock.minY,
            bottomChromeFrames = listOf(locate, notice, dock),
        )
        scene.reconcileClusters(
            listOf(
                // A total of four digits has a disc of 44 pt, of three 40 pt, of two 36 pt.
                cluster("status", map.at(300.0, 30.0), 1630),
                cluster("peeks", map.at(195.0, 125.0), 247),
                cluster("clearOfTheBar", map.at(300.0, 132.0), 247),
                cluster("zurich", map.at(195.0, 400.0), 7023),
                cluster("notice", map.at(215.0, 605.0), 63),
                cluster("locate", map.at(346.0, 585.0), 725),
                cluster("beside", map.at(60.0, 640.0), 95),
                cluster("dock", map.at(40.0, 655.0), 4932),
            ),
            revision = 1,
        )
        assertTrue(scene.clearCounts(map))
        val hidden = scene.clusters().filter { it.isUnderChrome }.map { it.id }
        assertEquals(listOf("status", "peeks", "notice", "locate", "dock"), hidden)
        // Placed for the first time, each is hidden or shown at once, never seen fading.
        for (cluster in scene.clusters()) {
            assertEquals(cluster.id, if (cluster.isUnderChrome) 0.0 else 1.0, cluster.clearance(time), 0.0)
            assertNull(cluster.id, cluster.clearing)
        }
        // Placed again where they are, none changes.
        assertFalse(scene.clearCounts(map))

        // A tap where a hidden count is finds no count there; one in the clear opens.
        assertNull(scene.topCluster(map.point(mark("peeks").cluster.coordinate), map))
        assertNull(scene.topCluster(map.point(mark("notice").cluster.coordinate), map))
        assertSame(mark("zurich"), scene.topCluster(map.point(mark("zurich").cluster.coordinate), map))
    }

    @Test
    fun besideAPanelACountIsHiddenAtItsEdgeAndShownBelowIt() {
        val map = FlatMarkerMap(width = 1280.0, height = 720.0, safeTop = 24.0)
        // The search bar and the card, one panel; the locate button and the notice in the corner.
        val panel = ScreenRect(16.0, 32.0, 340.0, 640.0)
        val locate = ScreenRect(1208.0, 600.0, 56.0, 56.0)
        val notice = ScreenRect(980.0, 610.0, 220.0, 36.0)
        scene.parent = MarkerParent(isOverview = true, panelFrame = panel, bottomChromeFrames = listOf(locate, notice))
        scene.reconcileClusters(
            listOf(
                cluster("edge", map.at(370.0, 300.0), 2169),
                cluster("past", map.at(380.0, 300.0), 2169),
                cluster("below", map.at(200.0, 700.0), 152),
                cluster("handle", map.at(640.0, 10.0), 1630),
                cluster("corner", map.at(1100.0, 600.0), 725),
            ),
            revision = 1,
        )
        scene.clearCounts(map)
        assertEquals(listOf("edge", "handle", "corner"), scene.clusters().filter { it.isUnderChrome }.map { it.id })
    }

    @Test
    fun aCountFadesOutUnderTheChromeAndBackAsTheMapTakesItClear() {
        val map = FlatMarkerMap()
        fun dockAt(top: Double) = MarkerParent(bottomChromeTop = top, bottomChromeFrames = listOf(ScreenRect(0.0, top, 390.0, 844.0 - top)))
        scene.parent = dockAt(700.0)
        scene.reconcileClusters(listOf(cluster("zurich", map.at(195.0, 600.0), 7023)), revision = 1)
        assertFalse(scene.clearCounts(map))
        val zurich = mark("zurich")
        assertEquals(1.0, zurich.clearance(time), 0.0)

        // The dock rises over it: it fades out over 0.2 s, in and out, as a name does.
        scene.parent = dockAt(610.0)
        assertTrue(scene.clearCounts(map))
        assertTrue(zurich.isUnderChrome)
        assertEquals(1.0, zurich.clearance(100.0), 1e-9)
        assertEquals(0.5, zurich.clearance(100.1), 1e-3)
        assertEquals(0.0, zurich.clearance(100.2), 1e-9)
        assertTrue(scene.settleClearings(100.1))
        assertFalse(scene.settleClearings(100.25))
        assertNull(zurich.clearing)
        time = 100.3
        assertFalse(scene.clearCounts(map))
        assertEquals(0.0, zurich.clearance(time), 0.0)

        // It comes back as the dock goes down, and turned back half way it goes on from where it has got to.
        scene.parent = dockAt(700.0)
        assertTrue(scene.clearCounts(map))
        time = 100.4
        val half = zurich.clearance(time)
        assertEquals(0.5, half, 1e-3)
        scene.parent = dockAt(610.0)
        assertTrue(scene.clearCounts(map))
        assertEquals(half, zurich.clearance(100.4), 1e-9)
        assertEquals(0.0, zurich.clearance(100.6), 1e-9)

        // With animations off, at once.
        time = 101.0
        animates = false
        scene.parent = dockAt(700.0)
        assertTrue(scene.clearCounts(map))
        assertNull(zurich.clearing)
        assertEquals(1.0, zurich.clearance(time), 0.0)
        // With the map off the screen, at once too.
        animates = true
        scene.parent = dockAt(610.0)
        assertTrue(scene.clearCounts(FlatMarkerMap(isShown = false)))
        assertNull(zurich.clearing)
        assertEquals(0.0, zurich.clearance(time), 0.0)

        // A count that comes under the chrome is hidden from its first frame.
        scene.reconcileClusters(listOf(zurich.cluster, cluster("basel", map.at(100.0, 650.0), 300)), revision = 2)
        assertTrue(scene.clearCounts(map))
        assertSame(zurich, mark("zurich"))
        assertTrue(mark("basel").isUnderChrome)
        assertNull(mark("basel").clearing)
        assertEquals(0.0, mark("basel").clearance(time), 0.0)
    }

    @Test
    fun theCitiesTotalsAreDrawnOverTheRiderAndOtherClustersUnderIt() {
        val order = ScooterMarkerLayers.order
        assertEquals(ScooterMarkerLayers.CITIES, order.last())
        assertTrue(order.indexOf(ScooterMarkerLayers.CITIES) > order.indexOf(ScooterMarkerLayers.RIDER))
        val cities = ScooterMarkerLayers.cities
        assertEquals(ScooterMarkerLayers.MARKERS_SOURCE, cities.source)
        assertEquals("[\"has\",\"over\"]", cities.filter)
        // Hidden under the chrome as the other clusters are.
        assertEquals(
            SymbolLayerSpec.Json("[\"*\",[\"number\",[\"feature-state\",\"clear\"],1],[\"get\",\"opacity\"]]"),
            cities.paint["icon-opacity"],
        )
        val markers = ScooterMarkerLayers.specs.first { it.id == ScooterMarkerLayers.MARKERS }
        assertEquals(markers.layout, cities.layout)

        // Away from the overview a cluster stays in the scooters' layer, under the rider.
        val map = FlatMarkerMap()
        scene.reconcileClusters(listOf(cluster("zurich", map.at(195.0, 400.0), 7023)), revision = 1)
        val street = MarkerFeatures.markers(scene, art).single()
        assertFalse(street.isOver)
        assertFalse(properties(street).has("over"))
        // In the overview, the cities' totals go over it: written again once, as the overview starts.
        val version = scene.markersVersion
        scene.parent = MarkerParent(isOverview = true)
        assertEquals(version + 1, scene.markersVersion)
        val overview = MarkerFeatures.markers(scene, art).single()
        assertTrue(overview.isOver)
        assertTrue(properties(overview).getBoolean("over"))
        assertEquals("g:zurich", overview.id)
        // The chrome moving writes nothing.
        scene.parent = scene.parent.copy(bottomChromeTop = 600.0)
        assertEquals(version + 1, scene.markersVersion)
    }

    private fun properties(feature: MarkerFeature): JSONObject =
        JSONObject(MarkerFeatures.json(listOf(feature))).getJSONArray("features").getJSONObject(0).getJSONObject("properties")
}
