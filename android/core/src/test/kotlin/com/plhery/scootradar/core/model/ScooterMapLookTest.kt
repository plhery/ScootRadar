package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.text.DecimalFormatSymbols
import java.time.Instant
import java.util.Locale
import kotlin.math.PI
import kotlin.math.hypot
import kotlin.math.sin

// ios/ScootRadarTests/ScooterMapLookTests.swift.
class ScooterMapLookTest {
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun pinTheLocale() {
        ScooterLanguage.launchLocale = { Locale.US }
    }

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
    }

    // Heads

    @Test
    fun aDotsViewDrawsTheDiameterOfItsLook() {
        // The parts of T060 and T061 (ScooterFilteringTests.swift:387, :421) that are not the MapKit view.
        assertEquals(16.0, ScooterMapLook.look(metres = 400.0, state = ScooterDotState.Selected, metresPerPoint = 1.07).diameter, 0.0)
        assertEquals(8.0, ScooterMapLook.look(metres = 400.0, state = ScooterDotState.Plain, metresPerPoint = 1.07).diameter, 0.0)
        val closeUp = ScooterMapLook.look(metres = null, state = ScooterDotState.Plain, metresPerPoint = 0.4)
        assertTrue(closeUp.showsInitials)
        assertEquals(20.0, closeUp.diameter, 0.0)
    }

    @Test
    fun theNearestScooterOfEachProviderIsItsHeadNearestFirst() {
        val heads = ScooterMapLook.heads(
            among = listOf(
                ScooterDistance(id = "voi:far", provider = "voi", metres = 310.0),
                ScooterDistance(id = "lime:only", provider = "lime", metres = 120.0),
                ScooterDistance(id = "voi:near", provider = "voi", metres = 60.0),
                ScooterDistance(id = "bolt:only", provider = "bolt", metres = 90.0),
            ),
        )

        assertEquals(listOf("voi:near", "bolt:only", "lime:only"), heads.map { it.id })
    }

    @Test
    fun scootersAtTheSameDistanceGiveTheSameHeadWhateverTheirOrder() {
        val pair = listOf(
            ScooterDistance(id = "voi:b", provider = "voi", metres = 40.0),
            ScooterDistance(id = "voi:a", provider = "voi", metres = 40.0),
        )

        assertEquals(listOf("voi:a"), ScooterMapLook.heads(among = pair).map { it.id })
        assertEquals(listOf("voi:a"), ScooterMapLook.heads(among = pair.reversed()).map { it.id })
        assertTrue(ScooterMapLook.heads(among = emptyList()).isEmpty())
    }

    @Test
    fun noScooterIsNamedWhileTheServerCountsThemInGroups() {
        // Zoomed out, the server sends a lone scooter 105 minutes away beside
        // its groups; it is not the nearest Lime and gets no name.
        val alone = listOf(ScooterDistance(id = "lime:alone", provider = "lime", metres = 8_400.0))

        assertTrue(ScooterMapLook.heads(among = alone, countedInGroups = true).isEmpty())
        assertEquals(listOf("lime:alone"), ScooterMapLook.heads(among = alone).map { it.id })
    }

    // Size and strength

    @Test
    fun dotsShrinkAndFadeWithTheirDistance() {
        assertEquals(12.0, ScooterMapLook.dotDiameter(metres = 80.0, state = ScooterDotState.Plain), 0.0)
        assertEquals(10.0, ScooterMapLook.dotDiameter(metres = 81.0, state = ScooterDotState.Plain), 0.0)
        assertEquals(10.0, ScooterMapLook.dotDiameter(metres = 240.0, state = ScooterDotState.Plain), 0.0)
        assertEquals(8.0, ScooterMapLook.dotDiameter(metres = 241.0, state = ScooterDotState.Plain), 0.0)
        assertEquals(14.0, ScooterMapLook.dotDiameter(metres = 900.0, state = ScooterDotState.Head), 0.0)
        assertEquals(16.0, ScooterMapLook.dotDiameter(metres = 900.0, state = ScooterDotState.Selected), 0.0)

        assertEquals(1.0, ScooterMapLook.dotStrength(metres = 0.0, state = ScooterDotState.Plain), 0.0)
        assertEquals(0.5, ScooterMapLook.dotStrength(metres = 310.0, state = ScooterDotState.Plain), 0.001)
        assertEquals(0.42, ScooterMapLook.dotStrength(metres = 5_000.0, state = ScooterDotState.Plain), 0.0)
        // The nearest of a provider and the selected scooter never fade.
        assertEquals(1.0, ScooterMapLook.dotStrength(metres = 5_000.0, state = ScooterDotState.Head), 0.0)
        assertEquals(1.0, ScooterMapLook.dotStrength(metres = 5_000.0, state = ScooterDotState.Selected), 0.0)
    }

    @Test
    fun withoutAnOriginEveryDotLooksTheSame() {
        assertEquals(10.0, ScooterMapLook.dotDiameter(metres = null, state = ScooterDotState.Plain), 0.0)
        assertEquals(1.0, ScooterMapLook.dotStrength(metres = null, state = ScooterDotState.Plain), 0.0)
        assertEquals(500f, ScooterMapLook.zPriority(metres = null, state = ScooterDotState.Plain), 0f)
    }

    @Test
    fun nearerDotsAreDrawnOnTopAndTheSelectedOneOnTopOfAll() {
        val far = ScooterMapLook.zPriority(metres = 400.0, state = ScooterDotState.Plain)
        val near = ScooterMapLook.zPriority(metres = 20.0, state = ScooterDotState.Plain)
        val farHead = ScooterMapLook.zPriority(metres = 2_000.0, state = ScooterDotState.Head)
        val selected = ScooterMapLook.zPriority(metres = 2_000.0, state = ScooterDotState.Selected)

        assertTrue(near > far)
        assertTrue(farHead > ScooterMapLook.zPriority(metres = 0.0, state = ScooterDotState.Plain))
        assertTrue(selected > ScooterMapLook.zPriority(metres = 0.0, state = ScooterDotState.Head))
        // The selected marker's priority, under the highest a marker takes.
        assertEquals(900f, selected, 0f)
        assertTrue(selected < 1000f)
    }

    // Scale

    @Test
    fun dotsGrowAsTheMapClosesInAndNameThemselvesCloseUp() {
        assertEquals(1.0, ScooterMapLook.zoomFactor(metresPerPoint = 1.07), 0.001)
        assertEquals(0.8, ScooterMapLook.zoomFactor(metresPerPoint = 12.0), 0.0)
        assertEquals(1.9, ScooterMapLook.zoomFactor(metresPerPoint = 0.1), 0.0)

        val street = ScooterMapLook.look(metres = 60.0, state = ScooterDotState.Plain, metresPerPoint = 1.07)
        assertEquals(12.0, street.diameter, 0.0)
        assertFalse(street.showsInitials)

        val closer = ScooterMapLook.look(metres = 60.0, state = ScooterDotState.Plain, metresPerPoint = 0.7)
        assertTrue(closer.diameter > street.diameter)
        assertTrue(closer.diameter < 20)
        assertFalse(closer.showsInitials)

        // Close up every dot is a disc with its provider's initials, however far it is.
        val closeUp = ScooterMapLook.look(metres = 500.0, state = ScooterDotState.Plain, metresPerPoint = 0.5)
        assertEquals(20.0, closeUp.diameter, 0.0)
        assertTrue(closeUp.showsInitials)
        assertTrue(closeUp.strength >= 0.7)
        assertEquals(24.0, ScooterMapLook.look(metres = 500.0, state = ScooterDotState.Head, metresPerPoint = 0.4).diameter, 0.0)
    }

    // Scooters on one spot

    @Test
    fun twoScootersOnOneSpotStandSideBySide() {
        val offsets = ScooterMapLook.spread(
            listOf(
                dot("b", x = 100.0, y = 100.0),
                dot("a", x = 100.0, y = 100.0),
            ),
        )

        // One dot and a point between the centres, on one line.
        assertEquals(ScreenPoint(x = -6.5, y = 0.0), offsets["a"])
        assertEquals(ScreenPoint(x = 6.5, y = 0.0), offsets["b"])
    }

    @Test
    fun threeScootersOnOneSpotFormATriangleWithTheFirstOnTop() {
        val offsets = ScooterMapLook.spread(
            listOf(dot("a", x = 0.0, y = 0.0), dot("b", x = 0.0, y = 0.0), dot("c", x = 0.0, y = 0.0)),
        )
        val a = offsets.getValue("a")
        val b = offsets.getValue("b")
        val c = offsets.getValue("c")

        val radius = 13 / (2 * sin(PI / 3))
        assertEquals(0.0, a.x, 0.001)
        assertEquals(-radius, a.y, 0.001)
        // Clockwise from twelve o'clock, each a dot and a point from the next.
        assertTrue(b.x > 0)
        assertTrue(c.x < 0)
        for ((first, second) in listOf(a to b, b to c, c to a)) {
            assertEquals(13.0, hypot(first.x - second.x, first.y - second.y), 0.001)
        }
    }

    @Test
    fun aGroupStaysOnItsSharedCentre() {
        // A metre or two apart: the dots still cover each other.
        val offsets = ScooterMapLook.spread(
            listOf(dot("a", x = 50.0, y = 50.0), dot("b", x = 54.0, y = 50.0), dot("c", x = 52.0, y = 53.0), dot("d", x = 51.0, y = 49.0)),
        )

        assertEquals(4, offsets.size)
        val places = listOf(Triple("a", 50.0, 50.0), Triple("b", 54.0, 50.0), Triple("c", 52.0, 53.0), Triple("d", 51.0, 49.0))
            .map { (id, x, y) -> ScreenPoint(x = x + offsets[id]!!.x, y = y + offsets[id]!!.y) }
        assertEquals(51.75, places.sumOf { it.x } / 4, 0.001)
        assertEquals(50.5, places.sumOf { it.y } / 4, 0.001)
        // Four on a ring: neighbours a dot and a point apart, the first on top.
        assertEquals(13.0, hypot(places[0].x - places[1].x, places[0].y - places[1].y), 0.001)
        assertEquals(51.75, places[0].x, 0.001)
        assertTrue(places[0].y < 50.5)
    }

    @Test
    fun moreThanEightOnOneSpotArePackedAroundItRatherThanSetOnAWideRing() {
        val twenty = (0 until 20).map { dot("s" + it.toString().padStart(2, '0'), x = 0.0, y = 0.0) }
        val offsets = ScooterMapLook.spread(twenty)
        val places = twenty.map { offsets.getValue(it.id) }

        // A ring of twenty would reach 41.5 pt from the spot.
        assertTrue((places.maxOfOrNull { hypot(it.x, it.y) } ?: 0.0) < 34)
        // None covers another: 70% of a 12 pt dot is 8.4 pt.
        for ((index, first) in places.withIndex()) {
            for (second in places.drop(index + 1)) {
                assertTrue(hypot(first.x - second.x, first.y - second.y) > 8.4)
            }
        }

        // Eight still share a ring.
        val eight = ScooterMapLook.spread(twenty.take(8))
        assertEquals(8, eight.size)
        for (offset in eight.values) {
            assertEquals(13 / (2 * sin(PI / 8)), hypot(offset.x, offset.y), 0.001)
        }
    }

    @Test
    fun scootersThatAreCloseButDoNotCoverEachOtherKeepTheirPlaces() {
        // 70% of a 12 pt dot is 8.4 pt.
        assertTrue(ScooterMapLook.spread(listOf(dot("a", x = 0.0, y = 0.0), dot("b", x = 9.0, y = 0.0))).isEmpty())
        assertEquals(2, ScooterMapLook.spread(listOf(dot("a", x = 0.0, y = 0.0), dot("b", x = 8.0, y = 0.0))).size)
        assertTrue(ScooterMapLook.spread(listOf(dot("a", x = 0.0, y = 0.0))).isEmpty())
        assertTrue(ScooterMapLook.spread(emptyList()).isEmpty())
    }

    @Test
    fun spreadingDoesNotDependOnTheOrderTheScootersArriveIn() {
        val dots = mutableListOf<ScooterSpreadDot>()
        for (index in 0 until 40) {
            // Piles of one to four on a line of spots, and a few stragglers.
            dots += dot("s$index", x = (index / 4).toDouble() * 60 + (index % 3).toDouble(), y = (index % 2).toDouble() * 3)
        }
        val expected = ScooterMapLook.spread(dots)

        assertFalse(expected.isEmpty())
        assertEquals(expected, ScooterMapLook.spread(dots.reversed()))
        assertEquals(expected, ScooterMapLook.spread(dots.sortedByDescending { it.point.x }))
    }

    @Test
    fun aNeighbourStaysClearOfTheRingOfAHeadOrOfTheSelectedDot() {
        val head = ScooterDotLook(state = ScooterDotState.Head, diameter = 14.0)
        val plain = ScooterDotLook()
        assertEquals(22.0, head.footprint, 0.0)
        assertEquals(10.0, plain.footprint, 0.0)

        val offsets = ScooterMapLook.spread(
            listOf(
                ScooterSpreadDot(id = "a", point = ScreenPoint.zero, footprint = head.footprint),
                ScooterSpreadDot(id = "b", point = ScreenPoint.zero, footprint = plain.footprint),
            ),
        )
        // Half of each and a point.
        assertEquals(17.0, offsets.getValue("b").x - offsets.getValue("a").x, 0.001)
    }

    // Touches

    @Test
    fun aTouchPicksTheDotWhoseCentreIsNearest() {
        val dots = listOf(
            ScooterMapLook.TouchableDot("a", ScreenPoint(x = 100.0, y = 100.0), 22.0),
            ScooterMapLook.TouchableDot("b", ScreenPoint(x = 113.0, y = 100.0), 22.0),
            ScooterMapLook.TouchableDot("c", ScreenPoint(x = 106.5, y = 111.0), 22.0),
        )

        assertEquals("b", ScooterMapLook.nearestDot(to = ScreenPoint(x = 111.0, y = 99.0), among = dots)?.id)
        assertEquals("c", ScooterMapLook.nearestDot(to = ScreenPoint(x = 104.0, y = 110.0), among = dots)?.id)
        // 44 pt across: a touch 20 pt from a lone dot still means it, 23 pt does not.
        assertEquals("a", ScooterMapLook.nearestDot(to = ScreenPoint(x = 80.0, y = 100.0), among = dots)?.id)
        assertNull(ScooterMapLook.nearestDot(to = ScreenPoint(x = 77.0, y = 100.0), among = dots))
        assertNull(ScooterMapLook.nearestDot(to = ScreenPoint.zero, among = emptyList()))
    }

    // Names

    @Test
    fun aNameGoesToTheRightOfItsDotWhenNothingIsInTheWay() {
        val placements = ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0)))

        assertEquals(listOf(ScooterPillSide.Right), placements.map { it.side })
        // 2 pt clear of the ring of a head, centred on the dot.
        assertEquals(ScreenPoint(x = 13.0, y = -13.0), placements.firstOrNull()?.origin)
    }

    @Test
    fun aNameAvoidsTheRiderTheOtherNamedDotsAndTheNamesAlreadyPlaced() {
        // The rider stands just right of the first dot.
        val rider = ScreenRect(x = 215.0, y = 285.0, width = 30.0, height = 30.0)
        assertEquals(
            listOf(ScooterPillSide.Left),
            ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0)), avoiding = listOf(rider)).map { it.side },
        )

        // A second named dot where the first name would go: the first name
        // moves aside, and the second keeps clear of it.
        val pair = ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0), pill("lime", x = 240.0, y = 300.0)))
        assertEquals(listOf(ScooterPillSide.Left, ScooterPillSide.Right), pair.map { it.side })

        // Two dots one above the other both want the right; they both fit.
        val stacked = ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0), pill("lime", x = 200.0, y = 340.0)))
        assertEquals(listOf(ScooterPillSide.Right, ScooterPillSide.Right), stacked.map { it.side })
        // Closer than a name is high, the second gives way.
        val tight = ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0), pill("lime", x = 200.0, y = 320.0)))
        assertEquals(ScooterPillSide.Right, tight.firstOrNull()?.side)
        assertNotEquals(ScooterPillSide.Right, tight.lastOrNull()?.side)
        assertFalse(
            frame(tight[0], of = pill("voi", x = 200.0, y = 300.0))
                .intersects(frame(tight[1], of = pill("lime", x = 200.0, y = 320.0))),
        )
    }

    @Test
    fun whereNoSideIsFreeANameTakesTheOneThatCoversLeast() {
        // Walls all around, with a gap of a few points at the bottom left.
        val walls = listOf(
            ScreenRect(x = 0.0, y = 0.0, width = 400.0, height = 285.0),
            ScreenRect(x = 211.0, y = 0.0, width = 200.0, height = 600.0),
            ScreenRect(x = 0.0, y = 330.0, width = 400.0, height = 300.0),
            ScreenRect(x = 0.0, y = 0.0, width = 150.0, height = 600.0),
        )

        val placement = ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0, width = 60.0)), avoiding = walls)
        assertEquals(listOf(ScooterPillSide.Left), placement.map { it.side })
    }

    @Test
    fun aNameMakesRoomForOneThatHasNoOtherPlace() {
        // The second name has room only above its dot, where the first
        // would stand; the first is as well off on its left.
        val walls = listOf(
            ScreenRect(x = 0.0, y = 329.0, width = 289.0, height = 300.0),
            ScreenRect(x = 343.0, y = 300.0, width = 300.0, height = 400.0),
            ScreenRect(x = 0.0, y = 352.0, width = 600.0, height = 300.0),
        )
        val requests = listOf(pill("voi", x = 200.0, y = 300.0), pill("lime", x = 300.0, y = 340.0))

        val placements = ScooterMapLook.placePills(requests, avoiding = walls)

        assertEquals(listOf(ScooterPillSide.Left, ScooterPillSide.Above), placements.map { it.side })
        assertFalse(frame(placements[0], of = requests[0]).intersects(frame(placements[1], of = requests[1])))
    }

    @Test
    fun aNameDoesNotHopBetweenSidesThatAllCoverSomething() {
        // Walls all around: the left covers least, the right a little more.
        val walls = listOf(
            ScreenRect(x = 0.0, y = 0.0, width = 400.0, height = 285.0),
            ScreenRect(x = 0.0, y = 330.0, width = 400.0, height = 300.0),
            ScreenRect(x = 0.0, y = 0.0, width = 146.0, height = 600.0),
            ScreenRect(x = 250.0, y = 0.0, width = 200.0, height = 600.0),
        )
        var request = pill("voi", x = 200.0, y = 300.0, width = 60.0)
        assertEquals(listOf(ScooterPillSide.Left), ScooterMapLook.placePills(listOf(request), avoiding = walls).map { it.side })

        request = request.copy(preferred = ScooterPillSide.Right)
        assertEquals(listOf(ScooterPillSide.Right), ScooterMapLook.placePills(listOf(request), avoiding = walls).map { it.side })
        // A side that covers far more is left for a better one.
        request = request.copy(preferred = ScooterPillSide.Above)
        assertEquals(listOf(ScooterPillSide.Left), ScooterMapLook.placePills(listOf(request), avoiding = walls).map { it.side })
    }

    @Test
    fun aNameKeepsItsSideWhileThatSideIsFree() {
        val request = pill("voi", x = 200.0, y = 300.0).copy(preferred = ScooterPillSide.Below)
        assertEquals(listOf(ScooterPillSide.Below), ScooterMapLook.placePills(listOf(request)).map { it.side })

        // Once something covers that side, the usual order applies again.
        val obstacle = ScreenRect(x = 180.0, y = 320.0, width = 40.0, height = 20.0)
        assertEquals(listOf(ScooterPillSide.Right), ScooterMapLook.placePills(listOf(request), avoiding = listOf(obstacle)).map { it.side })
    }

    @Test
    fun aNameStaysInsideWhatIsVisibleAndPrefersNotToCoverADot() {
        // The dot is near the right edge: the name goes to its left.
        val visible = ScreenRect(x = 0.0, y = 100.0, width = 390.0, height = 500.0)
        assertEquals(
            listOf(ScooterPillSide.Left),
            ScooterMapLook.placePills(listOf(pill("voi", x = 360.0, y = 300.0)), inside = visible).map { it.side },
        )

        // A dot without a name to the right: the name takes another free side.
        val neighbour = ScreenRect(x = 225.0, y = 294.0, width = 12.0, height = 12.0)
        assertEquals(
            listOf(ScooterPillSide.Left),
            ScooterMapLook.placePills(listOf(pill("voi", x = 200.0, y = 300.0)), sparing = listOf(neighbour)).map { it.side },
        )
        // Between a name and a dot without one, the dot is covered.
        val name = ScreenRect(x = 100.0, y = 280.0, width = 86.0, height = 120.0)
        val boxedIn = ScooterMapLook.placePills(
            listOf(pill("voi", x = 200.0, y = 300.0)),
            avoiding = listOf(
                name,
                ScreenRect(x = 100.0, y = 240.0, width = 200.0, height = 44.0),
                ScreenRect(x = 100.0, y = 316.0, width = 200.0, height = 44.0),
            ),
            sparing = listOf(neighbour),
        )
        assertEquals(listOf(ScooterPillSide.Right), boxedIn.map { it.side })
    }

    @Test
    fun aNameThatWouldBeCutIsNotShown() {
        val visible = ScreenRect(x = 0.0, y = 100.0, width = 390.0, height = 700.0)
        val dock = ScreenRect(x = 10.0, y = 600.0, width = 370.0, height = 180.0)
        val whole = ScreenRect(x = 100.0, y = 300.0, width = 90.0, height = 26.0)

        assertTrue(ScooterMapLook.pillCanBeRead(whole, inside = visible, under = listOf(dock)))
        // A third may hide behind the edge of the map, not more.
        assertTrue(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx = -130.0, dy = 0.0), inside = visible, under = listOf(dock)))
        assertFalse(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx = -131.0, dy = 0.0), inside = visible, under = listOf(dock)))
        // The search bar above and the dock below hide as the edge does.
        assertFalse(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx = 0.0, dy = -210.0), inside = visible, under = listOf(dock)))
        assertFalse(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx = 0.0, dy = 290.0), inside = visible, under = listOf(dock)))
        assertTrue(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx = 0.0, dy = 280.0), inside = visible, under = listOf(dock)))
    }

    @Test
    fun ofTwoNamesOnEachOtherTheFirstStays() {
        val visible = ScreenRect(x = 0.0, y = 100.0, width = 390.0, height = 700.0)
        val first = ScreenRect(x = 100.0, y = 300.0, width = 90.0, height = 26.0)

        // Half of the second lies under the first.
        assertEquals(
            setOf("bird"),
            ScooterMapLook.unreadablePills(
                listOf("selected" to first, "bird" to first.offsetBy(dx = 45.0, dy = 0.0), "voi" to first.offsetBy(dx = 0.0, dy = 40.0)),
                inside = visible,
                under = emptyList(),
            ),
        )
        // Names that merely touch both stay.
        assertTrue(
            ScooterMapLook.unreadablePills(
                listOf("a" to first, "b" to first.offsetBy(dx = 84.0, dy = 0.0)),
                inside = visible,
                under = emptyList(),
            ).isEmpty(),
        )
        // A name that is left out hides no one: the third is clear of the first.
        assertEquals(
            setOf("b"),
            ScooterMapLook.unreadablePills(
                listOf("a" to first, "b" to first.offsetBy(dx = 60.0, dy = 0.0), "c" to first.offsetBy(dx = 120.0, dy = 0.0)),
                inside = visible,
                under = emptyList(),
            ),
        )
        // And so is a name cut by the dock, whatever its place in the order.
        assertEquals(
            setOf("a"),
            ScooterMapLook.unreadablePills(
                listOf("a" to first.offsetBy(dx = 0.0, dy = 290.0), "b" to first),
                inside = visible,
                under = listOf(ScreenRect(x = 10.0, y = 600.0, width = 370.0, height = 180.0)),
            ),
        )
    }

    @Test
    fun namesSitFurtherOutAroundLargerDots() {
        for (side in ScooterPillSide.entries) {
            val small = ScooterMapLook.pillOrigin(side, width = 80.0, reach = 11.0)
            val large = ScooterMapLook.pillOrigin(side, width = 80.0, reach = 16.0)
            val box = ScreenRect(x = large.x, y = large.y, width = 80.0, height = ScooterMapLook.pillHeight)
            // Never over its own dot, rings included.
            val dot = ScreenRect(x = -16.0, y = -16.0, width = 32.0, height = 32.0).insetBy(dx = 5.0, dy = 5.0)!!
            assertFalse("$side", box.intersects(dot))
            assertNotEquals("$side", small, large)
        }
    }

    // Colours

    @Test
    fun initialsAndNamesReadOnEveryProviderColour() {
        for (provider in ScooterProvider.entries) {
            for (isDark in listOf(false, true)) {
                val ratio = ScooterMapLook.contrastRatio(
                    between = ScooterMapLook.ink(on = provider, isDark = isDark),
                    and = ScooterMapLook.dotColor(provider, isDark = isDark),
                )
                // White stands out from every colour: least from Lime's green, at 2.1 to 1.
                assertTrue("${provider.displayName}, dark: $isDark", ratio >= 2)
            }
        }
    }

    @Test
    fun birdAndSwingAreDrawnAlmostWhiteOnADarkMap() {
        val nearBlack = listOf(ScooterProvider.Bird, ScooterProvider.Swing)
        for (provider in nearBlack) {
            assertEquals(provider.color, ScooterMapLook.dotColor(provider, isDark = false))
            assertTrue(
                provider.displayName,
                ScooterMapLook.contrastRatio(
                    between = ScooterMapLook.dotColor(provider, isDark = true),
                    and = ScooterMapLook.darkGround,
                ) >= 10,
            )
        }
        // The others keep their colour in both appearances.
        for (provider in ScooterProvider.entries.filter { it !in nearBlack }) {
            assertEquals(provider.color, ScooterMapLook.dotColor(provider, isDark = true))
        }
    }

    @Test
    fun aNameOnAPillIsShortEnoughForIt() {
        assertEquals("PubliBike", ScooterProvider.Publibike.briefName)
        assertEquals("Voi", ScooterProvider.Voi.briefName)
    }

    // The card

    @Test
    fun cardShowsWalkDistanceAndPriceAndLeavesTheRestToTheLineUnderTheName() {
        val scooter = scooter(battery = 80, rangeMeters = 50_000, pricing = pricing)
        val quote = RidePriceEstimator.quote(pricing = pricing, durationMinutes = 10)
        val content = ScooterCardContent(scooter = scooter, metres = 60.0, quote = quote, locale = swiss)

        assertEquals(
            listOf(ScooterCardFigure.Kind.Walk, ScooterCardFigure.Kind.Distance, ScooterCardFigure.Kind.Price),
            content.figures.map { it.kind },
        )
        assertEquals("1", content.figures[0].value)
        assertEquals("min", content.figures[0].unit)
        assertEquals("on foot", content.figures[0].label)
        assertEquals("60", content.figures[1].value)
        assertEquals("m", content.figures[1].unit)
        assertEquals("away", content.figures[1].label)
        assertEquals(RidePriceFormatter.amount(minorUnits = 520, currency = "CHF"), content.figures[2].value)
        assertNull(content.figures[2].unit)
        assertEquals("CHF, 10 min", content.figures[2].label)
        assertEquals("80% battery, 50\u00A0km range", content.facts)
        assertEquals(
            "${price(100)} to unlock, then ${price(42)} a minute",
            content.note,
        )
    }

    @Test
    fun withoutAPriceTheBatteryTakesTheThirdCellOrElseTheRange() {
        val both = ScooterCardContent(
            scooter = scooter(battery = 80, rangeMeters = 39_000), metres = 400.0, quote = null, locale = swiss,
        )
        assertEquals(
            listOf(ScooterCardFigure.Kind.Walk, ScooterCardFigure.Kind.Distance, ScooterCardFigure.Kind.Battery),
            both.figures.map { it.kind },
        )
        assertEquals("5", both.figures[0].value)
        assertEquals("80", both.figures[2].value)
        assertEquals("%", both.figures[2].unit)
        assertEquals("battery", both.figures[2].label)
        assertEquals("39\u00A0km range", both.facts)
        assertEquals("Price shown in the Voi app", both.note)

        val rangeOnly = ScooterCardContent(scooter = scooter(rangeMeters = 39_000), metres = 400.0, quote = null, locale = swiss)
        assertEquals(
            listOf(ScooterCardFigure.Kind.Walk, ScooterCardFigure.Kind.Distance, ScooterCardFigure.Kind.Range),
            rangeOnly.figures.map { it.kind },
        )
        assertEquals("39", rangeOnly.figures[2].value)
        assertEquals("km", rangeOnly.figures[2].unit)
        assertEquals("range", rangeOnly.figures[2].label)
        assertNull(rangeOnly.facts)

        val bare = ScooterCardContent(scooter = scooter(), metres = 400.0, quote = null)
        assertEquals(listOf(ScooterCardFigure.Kind.Walk, ScooterCardFigure.Kind.Distance), bare.figures.map { it.kind })
        assertNull(bare.facts)
    }

    @Test
    fun withoutAnOriginTheCellsShowWhatIsKnownOfTheScooter() {
        val scooter = scooter(battery = 80, rangeMeters = 39_000, pricing = pricing)
        val quote = RidePriceEstimator.quote(pricing = pricing, durationMinutes = 20)
        val content = ScooterCardContent(scooter = scooter, metres = null, quote = quote)

        assertEquals(
            listOf(ScooterCardFigure.Kind.Battery, ScooterCardFigure.Kind.Range, ScooterCardFigure.Kind.Price),
            content.figures.map { it.kind },
        )
        assertEquals("CHF, 20 min", content.figures[2].label)
        // Nothing is left for the line under the name, which asks for the location.
        assertNull(content.facts)

        assertTrue(ScooterCardContent(scooter = scooter(), metres = null, quote = null).figures.isEmpty())
    }

    @Test
    fun theWalkNamesTheSearchedPlaceItStartsFrom() {
        val content = ScooterCardContent(
            scooter = scooter(), metres = 1_250.0, placeTitle = "Zürich HB", quote = null, locale = swiss,
        )

        assertEquals("16", content.figures[0].value)
        assertEquals("from Zürich HB", content.figures[0].label)
        // Halves go up, as everywhere in the app.
        assertEquals("1.3", content.figures[1].value)
        assertEquals("km", content.figures[1].unit)
    }

    @Test
    fun thePriceNoteSaysWhenUnlockingIsFreeAndWhenAPassApplies() {
        val free = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 0, minuteFeeMinorUnits = 35)
        val plain = ScooterCardContent(
            scooter = scooter(pricing = free),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = free, durationMinutes = 10),
        )
        assertEquals("No unlock fee, ${price(35)} a minute", plain.note)

        val pass = ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 5)
        val withPass = ScooterCardContent(
            scooter = scooter(pricing = pricing),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = pricing, durationMinutes = 10, pass = pass),
        )
        assertEquals(RidePriceFormatter.amount(minorUnits = 210, currency = "CHF"), withPass.figures[2].value)
        // The note keeps the provider's tariff and says a pass lowers the figure.
        assertEquals("${price(100)} to unlock, then ${price(42)} a minute · Pass applied", withPass.note)
    }

    @Test
    fun theCardSaysPlusTaxAfterThePricesTaxIsAddedTo() {
        ScooterLanguage.current = ScooterLanguage.En
        // Veo in New York: USD 1 to unlock and USD 0.42 a minute, before sales tax.
        val taxed = ScooterRidePricing(currency = "USD", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 42, plusTax = true)
        val content = ScooterCardContent(
            scooter = scooter(pricing = taxed),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = taxed, durationMinutes = 10),
        )
        val unlock = RidePriceFormatter.string(minorUnits = 100, currency = "USD")
        val minute = RidePriceFormatter.string(minorUnits = 42, currency = "USD")
        assertEquals("$unlock to unlock, then $minute a minute + tax", content.note)
        assertEquals("USD, 10 min", content.figures[2].label)

        ScooterLanguage.current = ScooterLanguage.Fr
        assertEquals("x + taxes", taxed.taxed("x"))
        ScooterLanguage.current = ScooterLanguage.De
        assertEquals("x + Steuern", taxed.taxed("x"))
    }

    @Test
    fun theCardSaysWhenAPriceCopiedFromAPriceListWasChecked() {
        ScooterLanguage.current = ScooterLanguage.En
        // Lime in Chicago publishes no price in its feed: USD 1 to unlock and USD 0.39 a minute on its site.
        val listed = ScooterRidePricing(
            currency = "USD", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 39, plusTax = true, listedOn = "2026-10-18",
        )
        val content = ScooterCardContent(
            scooter = scooter(provider = "lime", pricing = listed),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = listed, durationMinutes = 10),
        )
        val unlock = RidePriceFormatter.string(minorUnits = 100, currency = "USD")
        val minute = RidePriceFormatter.string(minorUnits = 39, currency = "USD")
        val day = RidePriceFormatter.listedDay("2026-10-18") ?: ""
        assertEquals("$unlock to unlock, then $minute a minute + tax · published price, checked $day", content.note)

        // The year only when it isn't this one; the order of day and month follows the region.
        val december = Instant.ofEpochSecond(1_796_083_200) // 1 December 2026
        val thisYear = RidePriceFormatter.listedDay("2026-10-18", now = december) ?: ""
        assertTrue(thisYear, thisYear.contains("18") && thisYear.contains("Oct") && !thisYear.contains("2026"))
        val lastYear = RidePriceFormatter.listedDay("2025-12-30", now = december) ?: ""
        assertTrue(lastYear, lastYear.contains("Dec") && lastYear.contains("2025"))
        assertNull(RidePriceFormatter.listedDay("soon"))
        ScooterLanguage.current = ScooterLanguage.De
        assertTrue(RidePriceFormatter.listedDay("2026-10-18", now = december)?.contains("Okt") == true)
        assertTrue(listed.listed("x").startsWith("x · veröffentlichter Preis, Stand "))
    }

    @Test
    fun theCardSaysFromWhereTheOperatorGivesARangeAMinute() {
        ScooterLanguage.current = ScooterLanguage.En
        // Lime in New York: USD 1 to unlock, then USD 0.45 to 0.50 a minute.
        val range = ScooterRidePricing(
            currency = "USD", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 45, minuteFeeFrom = true, plusTax = true,
        )
        val content = ScooterCardContent(
            scooter = scooter(provider = "lime", pricing = range),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = range, durationMinutes = 10),
        )
        val unlock = RidePriceFormatter.string(minorUnits = 100, currency = "USD")
        val minute = RidePriceFormatter.string(minorUnits = 45, currency = "USD")
        assertEquals("$unlock to unlock, then from $minute a minute + tax", content.note)

        val free = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 0, minuteFeeMinorUnits = 45, minuteFeeFrom = true)
        val freeContent = ScooterCardContent(
            scooter = scooter(provider = "lime", pricing = free),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = free, durationMinutes = 10),
        )
        assertEquals(
            "No unlock fee, from ${RidePriceFormatter.string(minorUnits = 45, currency = "CHF")} a minute",
            freeContent.note,
        )
    }

    @Test
    fun theCardShowsForintsAndKronurWithoutDecimals() {
        // Hopp in Pécs: HUF 272 to start and HUF 76 a minute.
        val forints = ScooterRidePricing(currency = "HUF", unlockFeeMinorUnits = 27_200, minuteFeeMinorUnits = 7_600)
        val content = ScooterCardContent(
            scooter = scooter(provider = "hopp", pricing = forints),
            metres = 60.0,
            quote = RidePriceEstimator.quote(pricing = forints, durationMinutes = 10),
        )
        val separator = DecimalFormatSymbols.getInstance(ScooterLanguage.current.locale).decimalSeparator.toString()
        val decimals = { text: String -> text.contains(separator) }

        assertEquals("1032", content.figures[2].value.filter(Char::isDigit))
        assertFalse(content.figures[2].value, decimals(content.figures[2].value))
        assertEquals("HUF, 10 min", content.figures[2].label)
        val unlock = RidePriceFormatter.string(minorUnits = 27_200, currency = "HUF")
        val minute = RidePriceFormatter.string(minorUnits = 7_600, currency = "huf")
        assertEquals("$unlock to unlock, then $minute a minute", content.note)
        assertTrue(unlock, unlock.contains("272") && !decimals(unlock))
        assertTrue(minute, minute.contains("76") && !decimals(minute))

        val kronur = RidePriceFormatter.string(minorUnits = 35_000, currency = "ISK")
        assertTrue(kronur, kronur.contains("350") && !decimals(kronur))
        assertEquals(
            listOf(0, 0, 0, 2, 2),
            listOf(
                RidePriceFormatter.fractionDigits("HUF"), RidePriceFormatter.fractionDigits("huf"),
                RidePriceFormatter.fractionDigits("ISK"), RidePriceFormatter.fractionDigits("CHF"),
                RidePriceFormatter.fractionDigits("UAH"),
            ),
        )
        // 3electra's UAH 5.60 a minute in Kyiv keeps its kopiyky.
        val hryvnias = RidePriceFormatter.string(minorUnits = 560, currency = "UAH")
        assertTrue(hryvnias, hryvnias.contains("5") && hryvnias.contains("60") && decimals(hryvnias))
    }

    // The lead of the dock

    @Test
    fun theLeadNamesTheNearestScooterItsDistanceAndTheWalk() {
        val lead = ScooterDockLead(scooter = scooter(provider = "publibike"), metres = 62.0)

        assertEquals(1, lead.minutes)
        assertEquals("62\u00A0m", lead.distance(locale = swiss))
        assertEquals(Scooter.formattedLength(meters = 62.0), lead.distance)
        assertEquals("PubliBike, 1 min on foot", lead.detail)
        assertEquals(
            "Nearest scooter: PubliBike / Velospot, 62\u00A0m away, 1 min on foot. Show details.",
            lead.accessibilityLabel(locale = swiss),
        )
        assertEquals(3, ScooterDockLead(scooter = scooter(), metres = 161.0).minutes)
    }

    @Test
    fun theLeadIsTheNearestOfTheScootersInView() {
        val rider = GeoPoint(latitude = 47.3763, longitude = 8.5395)
        val view = GeoBounds(south = 47.3760, west = 8.5390, north = 47.3790, east = 8.5440)
        val outside = scooter(provider = "publibike", latitude = 47.3758, longitude = 8.5395, vehicleID = "outside")
        val near = scooter(provider = "bolt", latitude = 47.3770, longitude = 8.5400, vehicleID = "near")
        val far = scooter(provider = "dott", latitude = 47.3785, longitude = 8.5430, vehicleID = "far")

        // The one just off the map is nearer, and is not among those the chips count.
        val lead = ScooterDockLead.nearest(of = listOf(far, outside, near), from = rider, viewport = view, grouped = false)
        assertEquals(near, lead?.scooter)
        assertEquals(near.distance(from = rider), lead?.metres ?: 0.0, 0.01)
        // The order the server gives them in changes nothing.
        assertEquals(lead, ScooterDockLead.nearest(of = listOf(near, far, outside), from = rider, viewport = view, grouped = false))
        assertNull(ScooterDockLead.nearest(of = listOf(outside), from = rider, viewport = view, grouped = false))
        assertNull(ScooterDockLead.nearest(of = emptyList(), from = rider, viewport = view, grouped = false))
    }

    @Test
    fun theDockCountsInsteadWhileTheRiderIsOffTheMapOrScootersAreGrouped() {
        val view = GeoBounds(south = 47.3760, west = 8.5390, north = 47.3790, east = 8.5440)
        val inside = GeoPoint(latitude = 47.3763, longitude = 8.5395)
        val justOutside = GeoPoint(latitude = 47.3759, longitude = 8.5395)
        val scooters = listOf(scooter(latitude = 47.3770, longitude = 8.5400))

        assertNotNull(ScooterDockLead.nearest(of = scooters, from = inside, viewport = view, grouped = false))
        assertNull(ScooterDockLead.nearest(of = scooters, from = justOutside, viewport = view, grouped = false))
        assertNull(ScooterDockLead.nearest(of = scooters, from = null, viewport = view, grouped = false))
        assertNull(ScooterDockLead.nearest(of = scooters, from = inside, viewport = view, grouped = true))
    }

    @Test
    fun twoScootersOnOneSpotGiveTheSameLeadWhateverTheirOrder() {
        val rider = GeoPoint(latitude = 47.3763, longitude = 8.5395)
        val view = GeoBounds(south = 47.37, west = 8.53, north = 47.38, east = 8.55)
        val first = scooter(vehicleID = "a")
        val second = scooter(vehicleID = "b")

        assertEquals(
            first,
            ScooterDockLead.nearest(of = listOf(first, second), from = rider, viewport = view, grouped = false)?.scooter,
        )
        assertEquals(
            first,
            ScooterDockLead.nearest(of = listOf(second, first), from = rider, viewport = view, grouped = false)?.scooter,
        )
    }

    // Helpers

    /** Lengths in metres whatever the region of the machine: a US one writes them in feet. */
    private val swiss = Locale.forLanguageTag("en-CH")

    private val pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 42)

    private fun dot(id: String, x: Double, y: Double, footprint: Double = 12.0): ScooterSpreadDot =
        ScooterSpreadDot(id = id, point = ScreenPoint(x = x, y = y), footprint = footprint)

    /** A name of 80 pt beside a head: a 14 pt dot with its gap and its ring. */
    private fun pill(id: String, x: Double, y: Double, width: Double = 80.0): ScooterPillRequest =
        ScooterPillRequest(id = id, anchor = ScreenPoint(x = x, y = y), reach = 11.0, width = width)

    private fun frame(placement: ScooterPillPlacement, of: ScooterPillRequest): ScreenRect =
        ScreenRect(
            x = of.anchor.x + placement.origin.x,
            y = of.anchor.y + placement.origin.y,
            width = of.width,
            height = ScooterMapLook.pillHeight,
        )

    private fun price(minorUnits: Int): String = RidePriceFormatter.string(minorUnits = minorUnits, currency = "CHF")

    private fun scooter(
        provider: String = "voi",
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
        battery: Int? = null,
        rangeMeters: Int? = null,
        vehicleID: String = "one",
        pricing: ScooterRidePricing? = null,
    ): Scooter =
        Scooter(
            provider = provider,
            latitude = latitude,
            longitude = longitude,
            battery = battery,
            rangeMeters = rangeMeters,
            vehicleID = vehicleID,
            deepLink = null,
            rentalURIs = null,
            distanceMeters = 0.0,
            pricing = pricing,
        )
}
