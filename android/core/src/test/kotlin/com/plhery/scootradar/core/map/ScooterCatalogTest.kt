package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.generated.ScooterProvider.Bird
import com.plhery.scootradar.core.generated.ScooterProvider.Lime
import com.plhery.scootradar.core.generated.ScooterProvider.Voi
import com.plhery.scootradar.core.model.CatalogData
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.RentalCurfew
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterProviderCoverage
import com.plhery.scootradar.core.model.ScooterResponse
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

// The seam the map's tests hand the controller a catalog of their own through (LOG-370). Android's only: the
// iPhone's tests read its generated catalog.
class ScooterCatalogTest {
    @Test
    fun theAppsMapReadsTheCatalogGeneratedFromData() = runTest {
        val model = ScooterMapController(
            api = StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            locationManager = FakeLocationManager(),
            defaults = InMemoryScooterDefaults(),
            scope = backgroundScope,
            directions = NoWalkingDirections,
            openInMaps = {},
            phoneLanguages = { listOf("en-US") },
        )
        assertSame(ScooterCatalog.Generated, model.catalog)

        val generated = ScooterCatalog.Generated
        assertEquals(ScooterCityCatalog.cities, generated.cities)
        assertEquals(RentalCurfew.all, generated.curfews)
        assertEquals(CityRuleZone.onMap, generated.ruleZones)
        // Each of the service areas, Swiss and abroad, as the coverage reads them; and none in the middle of the Atlantic.
        val data = CatalogData.value
        for (area in data.swissAreas + data.regionalSystems.map { it.second }) {
            assertEquals(ScooterProviderCoverage.providers(area), generated.providers(area))
            assertTrue(generated.contains(area.center))
        }
        assertFalse(generated.contains(GeoPoint(latitude = 30.0, longitude = -40.0)))
    }

    @Test
    fun aListedCatalogHasEachProviderWhereOneOfItsAreasReaches() {
        val zurich = GeoBounds(south = 47.27, west = 8.34, north = 47.49, east = 8.73)
        val lyon = GeoBounds(south = 45.7065, west = 4.757, north = 45.8489, east = 4.9294)
        val catalog = ScooterCatalog.Listed(areas = listOf(Voi to zurich, Bird to zurich, Lime to lyon, Voi to lyon))

        // In the catalogue's order, once each.
        assertEquals(
            ScooterProvider.entries.filter { it == Bird || it == Voi },
            catalog.providers(GeoBounds(south = 47.3, west = 8.4, north = 47.4, east = 8.5)),
        )
        assertEquals(
            ScooterProvider.entries.filter { it == Bird || it == Lime || it == Voi },
            catalog.providers(GeoBounds(south = 45.0, west = 4.0, north = 48.0, east = 9.0)),
        )
        assertEquals(emptyList<ScooterProvider>(), catalog.providers(GeoBounds(south = 46.7, west = 8.1, north = 46.8, east = 8.2)))
        assertTrue(catalog.contains(GeoPoint(latitude = 45.76, longitude = 4.83)))
        assertFalse(catalog.contains(GeoPoint(latitude = 46.7741, longitude = 8.1558)))
        assertEquals(emptyList<RentalCurfew>(), catalog.curfews)
    }
}
