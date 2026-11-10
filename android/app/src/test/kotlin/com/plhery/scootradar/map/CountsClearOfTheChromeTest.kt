package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterParking
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
    fun theChromeIsTheSystemsBarsTheSearchBarThePanelTheFoldWhatFloatsAtTheFootAndTheCredits() {
        val map = FlatMarkerMap()
        val bar = ScreenRect(16.0, 55.0, 358.0, 56.0)
        val panel = ScreenRect(16.0, 55.0, 300.0, 500.0)
        val fold = ScreenRect(0.0, 420.0, 390.0, 4.0)
        val legend = ScreenRect(120.0, 620.0, 190.0, 36.0)
        val dock = ScreenRect(0.0, 670.0, 390.0, 174.0)
        val credits = ScreenRect(60.0, 590.0, 230.0, 18.0)
        scene.parent = MarkerParent(
            interactionExclusionFrame = bar,
            panelFrame = panel,
            foldFrame = fold,
            bottomChromeFrames = listOf(ScreenRect(318.0, 600.0, 0.0, 0.0), legend, dock),
            creditsFrame = credits,
        )
        // The status bar, a tablet's window handle in it, is all above the safe area; a frame of nothing is left out.
        // The search bar and the panel, 16 in from the map's sides, reach to them; the legend and the credits, further
        // in, stay as they are.
        val status = ScreenRect(0.0, 0.0, 390.0, 47.0)
        val wideBar = ScreenRect(0.0, 55.0, 390.0, 56.0)
        val widePanel = ScreenRect(0.0, 55.0, 316.0, 500.0)
        assertEquals(listOf(status, wideBar, widePanel, fold, legend, dock, credits), scene.countChrome(map))
        assertEquals(listOf(wideBar, widePanel, fold, legend, dock, credits), scene.countChrome(FlatMarkerMap(safeTop = 0.0)))

        // The 3-button navigation bar: at the foot, or held sideways at a side. Not the gesture handle's strip.
        scene.parent = MarkerParent()
        val buttons = FlatMarkerMap(width = 360.0, height = 640.0, safeTop = 24.0, safeBottom = 48.0)
        assertEquals(listOf(ScreenRect(0.0, 0.0, 360.0, 24.0), ScreenRect(0.0, 592.0, 360.0, 48.0)), scene.countChrome(buttons))
        val sideways = FlatMarkerMap(width = 640.0, height = 360.0, safeTop = 24.0, safeLeft = 0.0, safeRight = 48.0)
        assertEquals(listOf(ScreenRect(0.0, 0.0, 640.0, 24.0), ScreenRect(592.0, 0.0, 48.0, 360.0)), scene.countChrome(sideways))
        val leftSideways = FlatMarkerMap(width = 640.0, height = 360.0, safeTop = 24.0, safeLeft = 48.0)
        assertEquals(ScreenRect(0.0, 0.0, 48.0, 360.0), scene.countChrome(leftSideways).last())
        val gestures = FlatMarkerMap(width = 360.0, height = 640.0, safeTop = 24.0, safeBottom = 16.0, bars = MapInsets.zero)
        assertEquals(listOf(ScreenRect(0.0, 0.0, 360.0, 24.0)), scene.countChrome(gestures))
    }

    /**
     * A punch-hole phone held sideways, its camera's hole on the left: the safe area counts the cutout down the whole
     * side, 34 in, but only the hole covers the map. A count on the hole is hidden; one near that side above or below
     * it, its disc within the cutout's inset but clear of the hole, stays, as on the iPhone. The 3-button bar on the
     * other side still hides a count under it.
     */
    @Test
    fun aCountNearACutoutsSideButClearOfTheHoleStays() {
        val hole = ScreenRect(0.0, 160.0, 34.0, 40.0)
        val map = FlatMarkerMap(
            width = 640.0,
            height = 360.0,
            safeTop = 24.0,
            safeLeft = 34.0,
            safeRight = 48.0,
            bars = MapInsets(top = 0.0, left = 0.0, bottom = 0.0, right = 48.0),
            cutouts = listOf(hole),
        )
        assertEquals(
            listOf(ScreenRect(0.0, 0.0, 640.0, 24.0), ScreenRect(592.0, 0.0, 48.0, 360.0), hole),
            scene.countChrome(map),
        )
        scene.parent = MarkerParent(isOverview = true)
        scene.reconcileClusters(
            listOf(
                cluster("above", map.at(24.0, 90.0), 63),
                cluster("onTheHole", map.at(24.0, 180.0), 63),
                cluster("below", map.at(24.0, 280.0), 63),
                cluster("underTheButtons", map.at(616.0, 180.0), 63),
            ),
            revision = 1,
        )
        scene.clearCounts(map)
        assertEquals(listOf("onTheHole", "underTheButtons"), scene.clusters().filter { it.isHidden }.map { it.id }.sorted())
    }

    @Test
    fun aFrameReachesTheSideItStandsNearerThanACountIsWideAndOnlyGrows() {
        val bounds = ScreenRect(0.0, 0.0, 1280.0, 720.0)
        with(ScooterMarkerScene) {
            // A tablet's panel, 16 in from the leading side and from the top, 48 above the foot.
            assertEquals(ScreenRect(0.0, 0.0, 356.0, 672.0), ScreenRect(16.0, 32.0, 340.0, 640.0).reachingSides(bounds))
            // In from the trailing side, as a right-to-left panel stands.
            assertEquals(ScreenRect(924.0, 0.0, 356.0, 672.0), ScreenRect(924.0, 32.0, 340.0, 640.0).reachingSides(bounds))
            // 36 in, a two-digit count's width, stays.
            val apart = ScreenRect(36.0, 100.0, 300.0, 100.0)
            assertEquals(apart, apart.reachingSides(bounds))
            // One measured past the map's edge, as a dock laid out before the map turned, is never cut down to it.
            val below = ScreenRect(300.0, 730.0, 560.0, 200.0)
            assertEquals(below, below.reachingSides(bounds))
            val above = ScreenRect(16.0, -245.0, 358.0, 56.0)
            assertEquals(ScreenRect(0.0, -245.0, 374.0, 56.0), above.reachingSides(bounds))
        }
    }

    /**
     * Phone_Min's three-button navigation bar, under the dock, hides a count as the dock does. With gesture navigation
     * the dock's foot stands 32 over the window's, over the handle's strip, 16 tall: a count below the dock there, cut by
     * the window's foot, is hidden as the dock reaches the foot. Beside a tablet's panel the handle's strip, see-through
     * but for the handle, is all that stands at the foot: a count there stays, as under the iPhone's home indicator.
     */
    @Test
    fun aCountUnderTheNavigationBarIsHiddenAndOneInTheGestureHandlesStripStays() {
        val buttons = FlatMarkerMap(width = 360.0, height = 640.0, safeTop = 24.0, safeBottom = 48.0)
        scene.parent = MarkerParent(isOverview = true, bottomChromeTop = 400.0, bottomChromeFrames = listOf(ScreenRect(10.0, 400.0, 340.0, 182.0)))
        scene.reconcileClusters(
            listOf(
                cluster("bar", buttons.at(125.0, 615.0), 3344),
                cluster("aboveTheDock", buttons.at(180.0, 300.0), 1207),
            ),
            revision = 1,
        )
        scene.clearCounts(buttons)
        assertEquals(listOf("bar"), scene.clusters().filter { it.isHidden }.map { it.id })
        assertNull(scene.topCluster(buttons.point(mark("bar").cluster.coordinate), buttons))
        // Read by TalkBack no more than tapped.
        val read = MarkerElements.of(scene, buttons).filterIsInstance<MarkerElement.Cluster>().map { it.cluster.id }
        assertEquals(listOf("aboveTheDock"), read)

        // Gesture navigation: a count of two digits 20 below the dock's foot, its disc clear of the dock.
        val gestures = FlatMarkerMap(width = 360.0, height = 640.0, safeTop = 24.0, safeBottom = 16.0, bars = MapInsets.zero)
        scene.parent = MarkerParent(isOverview = true, bottomChromeTop = 426.0, bottomChromeFrames = listOf(ScreenRect(10.0, 426.0, 340.0, 182.0)))
        scene.reconcileClusters(
            listOf(cluster("handle", gestures.at(200.0, 628.0), 63), cluster("aboveTheDock", gestures.at(180.0, 300.0), 1207)),
            revision = 2,
        )
        scene.clearCounts(gestures)
        assertEquals(listOf("handle"), scene.clusters().filter { it.isHidden }.map { it.id })

        // Beside a tablet's panel: a count in the handle's strip stays, as one clear above it; over a pinned taskbar,
        // 48 tall, the one in it is hidden.
        val tablet = FlatMarkerMap(width = 1280.0, height = 720.0, safeTop = 24.0, safeBottom = 20.0, bars = MapInsets.zero)
        scene.parent = MarkerParent(isOverview = true, panelFrame = ScreenRect(16.0, 32.0, 340.0, 640.0))
        scene.reconcileClusters(
            listOf(cluster("strip", tablet.at(700.0, 690.0), 63), cluster("clear", tablet.at(800.0, 640.0), 63)),
            revision = 3,
        )
        scene.clearCounts(tablet)
        assertEquals(emptyList<String>(), scene.clusters().filter { it.isHidden }.map { it.id })
        val taskbar = FlatMarkerMap(width = 1280.0, height = 720.0, safeTop = 24.0, safeBottom = 48.0)
        scene.clearCounts(taskbar)
        assertEquals(listOf("strip"), scene.clusters().filter { it.isHidden }.map { it.id })
    }

    /**
     * The map's credits, drawn over it in its corner beside a tablet's panel, hide a count under them, which fades back
     * as they go out of sight; a count by them, clear of their frame, stays.
     */
    @Test
    fun aCountUnderTheMapsCreditsIsHiddenWhileTheyAreSeen() {
        val map = FlatMarkerMap(width = 1280.0, height = 720.0, safeTop = 24.0, safeBottom = 24.0)
        val panel = ScreenRect(16.0, 32.0, 340.0, 640.0)
        val credits = ScreenRect(372.0, 670.0, 330.0, 18.0)
        val beside = MarkerParent(isOverview = true, panelFrame = panel)
        scene.parent = beside.copy(creditsFrame = credits)
        scene.reconcileClusters(
            listOf(cluster("under", map.at(500.0, 668.0), 581), cluster("above", map.at(500.0, 620.0), 699)),
            revision = 1,
        )
        scene.clearCounts(map)
        assertEquals(listOf("under"), scene.clusters().filter { it.isHidden }.map { it.id })

        // Out of sight, where the chrome leaves them no room, they cover nothing: it fades back in.
        scene.parent = beside
        assertTrue(scene.clearCounts(map))
        assertFalse(mark("under").isHidden)
        assertEquals(0.5, mark("under").clearance(time + 0.1), 1e-3)
    }

    /**
     * Beside a tablet's panel the strip to the window's side, 16 wide, is the panel's: a count there, which no disc
     * fits in, fades as one under the panel does, in either direction. Below the panel the side is open: a count the
     * rider pans in there stays, cut by the window's edge, as at any open edge of the map.
     */
    @Test
    fun theStripBesideAPanelIsThePanelsAndTheMapsOpenEdgesKeepTheirCounts() {
        val map = FlatMarkerMap(width = 1280.0, height = 720.0, safeTop = 24.0)
        scene.parent = MarkerParent(isOverview = true, panelFrame = ScreenRect(16.0, 32.0, 340.0, 640.0))
        scene.reconcileClusters(
            listOf(
                // Its disc from -22 to 14: clear of the panel, cut by the window's side.
                cluster("strip", map.at(-4.0, 300.0), 63),
                cluster("belowThePanel", map.at(-4.0, 700.0), 63),
                cluster("trailingEdge", map.at(1284.0, 300.0), 63),
                cluster("foot", map.at(700.0, 716.0), 63),
            ),
            revision = 1,
        )
        scene.clearCounts(map)
        assertEquals(listOf("strip"), scene.clusters().filter { it.isHidden }.map { it.id })

        // Right to left, the panel down the trailing side.
        scene.parent = MarkerParent(isOverview = true, panelFrame = ScreenRect(924.0, 32.0, 340.0, 640.0))
        scene.clearCounts(map)
        assertEquals(listOf("trailingEdge"), scene.clusters().filter { it.isHidden }.map { it.id })

        // A phone's search bar, 12 in from its sides: a count cut beside it is hidden; one at the open side below stays.
        val phone = FlatMarkerMap(width = 360.0, height = 640.0, safeTop = 24.0)
        scene.parent = MarkerParent(isOverview = true, interactionExclusionFrame = ScreenRect(12.0, 32.0, 336.0, 56.0))
        scene.reconcileClusters(
            listOf(cluster("besideTheBar", phone.at(-6.0, 60.0), 63), cluster("open", phone.at(-6.0, 300.0), 63)),
            revision = 2,
        )
        scene.clearCounts(phone)
        assertEquals(listOf("besideTheBar"), scene.clusters().filter { it.isHidden }.map { it.id })
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
        val hidden = scene.clusters().filter { it.isHidden }.map { it.id }
        assertEquals(listOf("status", "peeks", "notice", "locate", "dock"), hidden)
        // Placed for the first time, each is hidden or shown at once, never seen fading.
        for (cluster in scene.clusters()) {
            assertEquals(cluster.id, if (cluster.isHidden) 0.0 else 1.0, cluster.clearance(time), 0.0)
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
        assertEquals(listOf("edge", "handle", "corner"), scene.clusters().filter { it.isHidden }.map { it.id })
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
        assertTrue(zurich.isHidden)
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
        assertTrue(mark("basel").isHidden)
        assertNull(mark("basel").clearing)
        assertEquals(0.0, mark("basel").clearance(time), 0.0)
    }

    /**
     * In the overview the totals are drawn over the rider, and the rider over the selected scooter, as on the iPhone:
     * a total whose disc meets the scooter walked to, which stays on the map at any zoom, or its "N min" name is
     * hidden instead, takes no tap and is not read; one clear of them, or on the rider alone, stays
     * (review-app-aq-ar 2).
     */
    @Test
    fun inTheOverviewATotalOnTheScooterWalkedToOrItsNameIsHiddenAndOneClearOfThemStays() {
        val map = FlatMarkerMap(mapLibreZoom = 9.0)
        val rider = map.at(195.0, 560.0)
        val walking = MarkerParent(
            origin = rider,
            walkRemainingMetres = 900.0,
            isWalking = true,
            usesServerClusters = true,
            isOverview = true,
            userLocation = rider,
        )
        scene.parent = walking
        assertTrue(scene.updateClusteringMode(9.0, map))
        scene.reconcile(listOf(scooter("held", "lime", at = map.at(195.0, 400.0))), revision = 1)
        scene.applySelection("lime:held", map)
        val held = scene.mark("lime:held")!!
        assertTrue(held.shownPill?.time != null)
        // Its dot, in the square of its footprint, and its name.
        val (dot, name) = scene.heldFrames(map)
        val centre = scene.dotCentre(held, map)
        assertEquals(held.look.footprint, dot.width, 0.0)
        assertEquals(centre.x, dot.midX, 1e-9)
        assertEquals(scene.shownPillFrames(map).single().second, name)
        // Beyond the far end of its name, by less than its radius.
        val beyond = if (name.midX > centre.x) name.maxX + 12 else name.minX - 12
        scene.reconcileClusters(
            listOf(
                cluster("zurich", map.at(centre.x + 6, centre.y - 6), 7023),
                cluster("name", map.at(beyond, name.midY), 63),
                cluster("rider", rider, 247),
                cluster("winterthur", map.at(195.0, 700.0), 300),
            ),
            revision = 1,
        )
        assertTrue(scene.clearCounts(map))
        assertEquals(listOf("zurich", "name"), scene.clusters().filter { it.isHidden }.map { it.id })
        assertNull(scene.topCluster(map.point(mark("name").cluster.coordinate), map))
        assertSame(mark("rider"), scene.topCluster(map.point(rider), map))
        val read = MarkerElements.of(scene, map).filterIsInstance<MarkerElement.Cluster>().map { it.cluster.id }
        assertEquals(listOf("rider", "winterthur"), read)

        // Away from the overview the clusters are drawn under the selected dot and its name: none makes way.
        scene.parent = walking.copy(isOverview = false)
        assertTrue(scene.heldFrames(map).isEmpty())
        assertTrue(scene.clearCounts(map))
        assertTrue(scene.clusters().none { it.isHidden })

        // Back in the overview they make way again, and once the walk is over and the scooter has left the map, they
        // fade back in.
        scene.parent = walking
        assertTrue(scene.clearCounts(map))
        assertEquals(listOf("zurich", "name"), scene.clusters().filter { it.isHidden }.map { it.id })
        time = 101.0
        scene.parent = MarkerParent(usesServerClusters = true, isOverview = true, userLocation = rider)
        scene.applySelection(null, map)
        scene.reconcile(emptyList(), revision = 2)
        assertTrue(scene.heldFrames(map).isEmpty())
        assertTrue(scene.clearCounts(map))
        assertTrue(scene.clusters().none { it.isHidden })
        assertEquals(0.5, mark("zurich").clearance(101.1), 1e-3)
    }

    /**
     * The bay walked to stays on the map at any zoom too, its balloon in the selected markers' layer under the totals:
     * a total whose disc meets the balloon is hidden instead, takes no tap and is not read, as the iPhone draws the
     * selected bay over every total; one clear of it stays (week review, finding 6.1).
     */
    @Test
    fun inTheOverviewATotalOnTheBayWalkedToIsHiddenAndOneClearOfItStays() {
        val map = FlatMarkerMap(mapLibreZoom = 9.0)
        val rider = map.at(195.0, 560.0)
        val walking = MarkerParent(
            origin = rider,
            walkRemainingMetres = 900.0,
            isWalking = true,
            usesServerClusters = true,
            isOverview = true,
            userLocation = rider,
        )
        scene.parent = walking
        assertTrue(scene.updateClusteringMode(9.0, map))
        val place = map.at(195.0, 400.0)
        scene.reconcileParking(listOf(ScooterParking("voi:bay", "voi", "Bahnhofplatz", place.latitude, place.longitude, mandatory = false)))
        scene.applyParkingSelection("voi:bay")
        // Its balloon, as it is drawn selected.
        val balloon = scene.bayFrame(scene.parking.single(), map)
        assertEquals(listOf(balloon), scene.heldFrames(map))
        val onBalloon = map.at(balloon.midX + 6, balloon.midY - 6)
        scene.reconcileClusters(
            listOf(cluster("zurich", onBalloon, 7023), cluster("winterthur", map.at(195.0, 700.0), 300)),
            revision = 1,
        )
        assertTrue(scene.clearCounts(map))
        assertEquals(listOf("zurich"), scene.clusters().filter { it.isHidden }.map { it.id })
        // A tap on the total's middle is not the total's, and TalkBack reads only the total clear of the bay.
        assertNull(scene.topCluster(map.point(onBalloon), map))
        val read = MarkerElements.of(scene, map).filterIsInstance<MarkerElement.Cluster>().map { it.cluster.id }
        assertEquals(listOf("winterthur"), read)

        // Away from the overview the clusters are drawn under the selected bay: none makes way.
        scene.parent = walking.copy(isOverview = false)
        assertTrue(scene.heldFrames(map).isEmpty())
        assertTrue(scene.clearCounts(map))
        assertTrue(scene.clusters().none { it.isHidden })

        // Back in the overview the total makes way again, and comes back once the bay has left the map.
        scene.parent = walking
        assertTrue(scene.clearCounts(map))
        assertTrue(mark("zurich").isHidden)
        scene.parent = MarkerParent(usesServerClusters = true, isOverview = true, userLocation = rider)
        scene.applyParkingSelection(null)
        scene.reconcileParking(emptyList())
        assertTrue(scene.heldFrames(map).isEmpty())
        assertTrue(scene.clearCounts(map))
        assertTrue(scene.clusters().none { it.isHidden })
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
