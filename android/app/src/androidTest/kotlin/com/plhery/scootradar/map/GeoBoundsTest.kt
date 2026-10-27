package com.plhery.scootradar.map

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapRegion
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

// The map's part of ios/ScootRadarTests/GeoBoundsTests.swift.
@RunWith(AndroidJUnit4::class)
class GeoBoundsTest {
    // New Zealand lies just west of 180°: Auckland west of the line, the Chatham Islands east of it.
    private val auckland = GeoPoint(latitude = -36.8485, longitude = 174.7633)
    private val chatham = GeoPoint(latitude = -43.95, longitude = -176.56)

    @Test
    fun mapKitDrawsBothSidesOfTheLineOnScreen() = withPhoneMap { phone ->
        // The markers stand where the map puts their coordinates: on screen, on either side of 180°.
        val center = GeoPoint(latitude = -36.52, longitude = -178.6)
        phone.setRegion(MapRegion(center = center, latitudeDelta = 21.08, longitudeDelta = 20.0))
        phone.onMain {
            val west = phone.projection.point(auckland)
            val east = phone.projection.point(chatham)
            assertTrue("$west", phone.projection.bounds.contains(west))
            assertTrue("$east", phone.projection.bounds.contains(east))
            assertTrue(west.x < east.x)
            assertTrue(GeoBounds(MapZoom.region(of = phone.projection.visibleMapRect)).crossesDateLine)
        }
    }
}
