package com.plhery.scootradar.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs
import kotlin.random.Random

/**
 * MAP-328 (ScooterMapLook.swift:111-113, :192): equal distances go to the smaller id, and dots on one spot take
 * their places in the order of their ids. Swift orders the ids with `String <`, Kotlin with `compareTo`; the
 * list below is the order `ids.sorted(by: <)` printed with Swift 6 for ids written as the app writes them, from
 * real feeds' vehicle ids and from coordinates where a feed has none.
 */
class ScooterIdOrderTest {
    @Test
    fun idsAreOrderedAsSwiftOrdersThem() {
        for (seed in 0 until 20) {
            val shuffled = swiftOrder.shuffled(Random(seed))
            assertEquals(swiftOrder, shuffled.sortedWith { first, second -> first.compareTo(second) })
        }
        for ((first, second) in swiftOrder.zipWithNext()) assertTrue("$first < $second", first < second)
    }

    @Test
    fun idsAreWrittenAsTheOnesSwiftOrdered() {
        // The ids above without a vehicle are the scooter's coordinates as Swift writes a Double.
        assertEquals("bird:1e-05:8.5", Scooter("bird", latitude = 0.00001, longitude = 8.5).id)
        assertEquals("bird:-33.8688:151.2093", Scooter("bird", latitude = -33.8688, longitude = 151.2093).id)
        assertEquals("bird:47.37:8.5", Scooter("bird", latitude = 47.37, longitude = 8.5).id)
        assertEquals(
            "voi:voi_se_1:scooter-a",
            Scooter("voi", latitude = 59.33, longitude = 18.07, vehicleID = "voi_se_1:scooter-a").id,
        )
    }

    @Test
    fun anEqualDistanceNamesTheScooterWhoseIdSwiftPutsFirst() {
        for ((first, second) in swiftOrder.zipWithNext()) {
            val heads = ScooterMapLook.heads(
                among = listOf(ScooterDistance(second, "voi", 50.0), ScooterDistance(first, "voi", 50.0)),
            )
            assertEquals(listOf(first), heads.map { it.id })
        }
    }

    @Test
    fun aTouchBetweenTwoDotsMeansTheOneWhoseIdSwiftPutsFirst() {
        for ((first, second) in swiftOrder.zipWithNext()) {
            val among = listOf(
                ScooterMapLook.TouchableDot(second, ScreenPoint(0.0, 0.0), reach = 22.0),
                ScooterMapLook.TouchableDot(first, ScreenPoint(0.0, 0.0), reach = 22.0),
            )
            assertEquals(first, ScooterMapLook.nearestDot(to = ScreenPoint(3.0, 4.0), among = among)?.id)
        }
    }

    @Test
    fun theDockLeadsWithTheScooterWhoseIdSwiftPutsFirstAtAnEqualDistance() {
        val rider = GeoPoint(47.3770, 8.5410)
        val view = GeoBounds(south = 47.3760, west = 8.5390, north = 47.3790, east = 8.5440)
        for ((first, second) in swiftOrder.zipWithNext()) {
            val scooters = listOf(second, first).map {
                Scooter(it.substringBefore(':'), latitude = 47.3775, longitude = 8.5415, vehicleID = it.substringAfter(':'))
            }
            assertEquals(listOf(second, first), scooters.map { it.id })
            val lead = ScooterDockLead.nearest(of = scooters, from = rider, viewport = view, grouped = false)
            assertEquals(first, lead?.scooter?.id)
        }
    }

    @Test
    fun dotsOnOneSpotTakeTheirPlacesInSwiftsOrderOfTheirIds() {
        for ((group, ids) in swiftOrder.chunked(4).filter { it.size == 4 }.withIndex()) {
            fun dots(order: List<String>) = order.map { ScooterSpreadDot(it, ScreenPoint(100.0, 100.0), footprint = 10.0) }
            val offsets = ScooterMapLook.spread(dots(ids.shuffled(Random(group))))
            assertEquals(offsets, ScooterMapLook.spread(dots(ids.reversed())))
            // A ring of four starts at twelve o'clock and goes round clockwise on screen.
            val ring = 11 / (2 * kotlin.math.sin(Math.PI / 4))
            val expected = listOf(ScreenPoint(0.0, -ring), ScreenPoint(ring, 0.0), ScreenPoint(0.0, ring), ScreenPoint(-ring, 0.0))
            for ((slot, id) in ids.withIndex()) {
                val offset = offsets.getValue(id)
                assertTrue(
                    "$id in slot $slot is at $offset",
                    abs(offset.x - expected[slot].x) < 1e-9 && abs(offset.y - expected[slot].y) < 1e-9,
                )
            }
        }
    }

    private companion object {
        val swiftOrder = listOf(
            "beam:beam:9 1",
            "beam:beam:91",
            "binbin:binbin_tr_eskisehir:7001",
            "binbin:binbin_tr_eskisehir:7002",
            "binbin:binbin_tr_eşkişehir:7001",
            "bird:-33.8688:151.2093",
            "bird:0.0001:8.5",
            "bird:1e-05:8.5",
            "bird:47.3769:-0.1",
            "bird:47.3769:8.54",
            "bird:47.3769:8.5417",
            "bird:47.3769:8.5417 ",
            "bird:47.37:8.5",
            "bolt:bolt_zurich:009",
            "bolt:bolt_zurich:10",
            "bolt:bolt_zurich:100",
            "bolt:bolt_zurich:9",
            "dott:dott_de_hamburg:A",
            "dott:dott_de_hamburg:Z",
            "dott:dott_de_hamburg:a",
            "dott:dott_de_hamburg:e1",
            "dott:dott_de_hamburg:f1",
            "dott:dott_de_hamburg:z",
            "dott:dott_de_hamburg:É1",
            "dott:dott_de_hamburg:é1",
            "jet:jet:S-123",
            "jet:jet:S.123",
            "jet:jet:s.123",
            "lime:lime_ch_zurich:ET-7Q2KD",
            "lime:lime_ch_zurich:ET_7Q2KD",
            "lime:lime_ch_zurich:aGVsbG8+/=",
            "lime:lime_ch_zurich:aGVsbG8-_",
            "lime:lime_ch_zurich:et-7q2kd",
            "nextbike:nextbike_zurich:42",
            "nextbike:nextbike_zz:42",
            "nextbike:nextbike_zû:42",
            "nextbike:nextbike_zürich:42",
            "publibike:publibike:123",
            "publibike:publibike:1230",
            "tier:tier_düsseldorf:ss9",
            "tier:tier_düsseldorf:Ü1",
            "tier:tier_düsseldorf:ß9",
            "tier:tier_düsseldorf:ü1",
            "voi:voi_ch_zurich:3F2504E0-4F89-11D3-9A0C-0305E82C3301",
            "voi:voi_ch_zurich:3f2504e0-4f89-11d3-9a0c-0305e82c3301",
            "voi:voi_se_1:Scooter-B",
            "voi:voi_se_1:scooter-a",
            "zeus:zeus:Ä",
            "zeus:zeus:Å",
            "zeus:zeus:Ö",
            "zeus:zeus:Ø",
        )
    }
}
