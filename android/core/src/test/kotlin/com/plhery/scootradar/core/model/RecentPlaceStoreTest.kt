package com.plhery.scootradar.core.model

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** The last place chosen in the search, as it is kept between launches: the iPhone's fields, and nothing it cannot read. */
class RecentPlaceStoreTest {
    private val key = "recent-place-v1"

    @Test
    fun aPlaceIsReadBackAsItWasKept() {
        val kept = InMemoryScooterDefaults()
        val places = listOf(
            MapDestination("Bahnhofstrasse 12", "8001 Zürich, Switzerland", GeoPoint(47.3717, 8.5392), MapDestination.Kind.Address, true),
            MapDestination("Zürich", "", GeoPoint(47.3769, 8.5417), MapDestination.Kind.City, true),
            MapDestination("Lyngen", "Norway", GeoPoint(69.5779, 20.2198), MapDestination.Kind.Address, false),
        )
        for (place in places) {
            RecentPlaceStore(kept).save(place)
            // Another store on the same file, as the app's next launch makes.
            assertEquals(place, RecentPlaceStore(kept).load())
        }

        RecentPlaceStore(kept).save(null)
        assertNull(kept.string(forKey = key))
        assertNull(RecentPlaceStore(kept).load())
    }

    /** The fields and words the website's localStorage and the iPhone's file hold. */
    @Test
    fun itIsKeptWithTheFieldsTheOtherAppsUse() {
        val kept = InMemoryScooterDefaults()
        RecentPlaceStore(kept).save(MapDestination("Zürich", "", GeoPoint(47.3769, 8.5417), MapDestination.Kind.City, true))
        val written = Json.parseToJsonElement(kept.string(forKey = key)!!).jsonObject
        assertEquals(setOf("title", "subtitle", "latitude", "longitude", "kind", "isCovered"), written.keys)
        assertEquals(JsonPrimitive("city"), written["kind"])

        kept.set(
            """{"title":"Bahnhofstrasse 12","subtitle":"8001 Zürich","latitude":47.3717,"longitude":8.5392,"kind":"address","isCovered":false}""",
            forKey = key,
        )
        assertEquals(
            MapDestination("Bahnhofstrasse 12", "8001 Zürich", GeoPoint(47.3717, 8.5392), MapDestination.Kind.Address, false),
            RecentPlaceStore(kept).load(),
        )
    }

    /** What is not a place is not offered, and is removed so that it is not read again. */
    @Test
    fun whatIsNotAPlaceIsIgnoredAndRemoved() {
        val place = """"title":"Bellevue","subtitle":"8001 Zürich","isCovered":true"""
        for (text in listOf(
            "",
            "not JSON",
            "null",
            "[]",
            "{}",
            """{"title":"Bellevue"}""",
            """{$place,"latitude":47.3667,"longitude":8.545,"kind":"street"}""",
            """{$place,"latitude":91,"longitude":8.545,"kind":"address"}""",
            """{$place,"latitude":47.3667,"longitude":-181,"kind":"address"}""",
            """{"title":" ","subtitle":"","latitude":47.3667,"longitude":8.545,"kind":"address","isCovered":true}""",
        )) {
            val kept = InMemoryScooterDefaults()
            kept.set(text, forKey = key)
            assertNull(text, RecentPlaceStore(kept).load())
            assertNull(text, kept.string(forKey = key))
        }

        // Something of another kind under the key is not read either.
        val other = InMemoryScooterDefaults()
        other.set(true, forKey = key)
        assertNull(RecentPlaceStore(other).load())
    }
}
