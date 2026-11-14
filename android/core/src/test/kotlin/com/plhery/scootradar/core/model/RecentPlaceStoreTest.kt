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

    /** The fields and words the website's localStorage and the iPhone's file hold, and the build that wrote them. */
    @Test
    fun itIsKeptWithTheFieldsTheOtherAppsUse() {
        val kept = InMemoryScooterDefaults()
        RecentPlaceStore(kept, build = "11").save(MapDestination("Zürich", "", GeoPoint(47.3769, 8.5417), MapDestination.Kind.City, true))
        val written = Json.parseToJsonElement(kept.string(forKey = key)!!).jsonObject
        assertEquals(setOf("title", "subtitle", "latitude", "longitude", "kind", "isCovered", "build"), written.keys)
        assertEquals(JsonPrimitive("city"), written["kind"])
        assertEquals(JsonPrimitive("11"), written["build"])

        kept.set(
            """{"title":"Bahnhofstrasse 12","subtitle":"8001 Zürich","latitude":47.3717,"longitude":8.5392,"kind":"address","isCovered":true}""",
            forKey = key,
        )
        assertEquals(
            MapDestination("Bahnhofstrasse 12", "8001 Zürich", GeoPoint(47.3717, 8.5392), MapDestination.Kind.Address, true),
            RecentPlaceStore(kept).load(),
        )
    }

    /**
     * Whether the map has data at the place kept is as it is today, not as when the place was chosen: Manama, kept as
     * "No data" before Hopp's feed there was added on 4 November 2026, has data, and Lungern, kept as having some, has
     * none (week review, finding 3.4; the iPhone's 9fb2c282). The flag is still written, for the iPhone's file and
     * older versions.
     */
    @Test
    fun aPlaceKeptHasDataAsTheMapHasItTodayNotAsWhenItWasChosen() {
        val kept = InMemoryScooterDefaults()
        kept.set(
            """{"title":"Manama","subtitle":"Bahrain","latitude":26.2235,"longitude":50.5876,"kind":"address","isCovered":false}""",
            forKey = key,
        )
        assertEquals(true, RecentPlaceStore(kept).load()?.isCovered)

        kept.set(
            """{"title":"Paradeplatz","subtitle":"Lungern OW","latitude":46.7741,"longitude":8.1558,"kind":"address","isCovered":true}""",
            forKey = key,
        )
        assertEquals(false, RecentPlaceStore(kept).load()?.isCovered)

        RecentPlaceStore(kept).save(MapDestination("Paradeplatz", "Lungern OW", GeoPoint(46.7741, 8.1558), MapDestination.Kind.Address, false))
        assertEquals(JsonPrimitive(false), Json.parseToJsonElement(kept.string(forKey = key)!!).jsonObject["isCovered"])
    }

    /**
     * The build that kept the place reads whether it has data as the search said, from that day's service areas: a town
     * whose feed is newer than the build's bundled ones still has data at the next launch, where it read "No data" (Desk
     * [372]). Lungern stands for such a town, which the bundled areas leave out, and Zürich for a place the search said
     * has none. Another build works it out again from its own bundled areas, as the test above.
     */
    @Test
    fun aPlaceKeptByThisBuildHasDataAsTheSearchSaid() {
        val lungern = MapDestination("Paradeplatz", "Lungern OW", GeoPoint(46.7741, 8.1558), MapDestination.Kind.Address, true)
        val zurich = MapDestination("Bahnhofstrasse 12", "8001 Zürich", GeoPoint(47.3717, 8.5392), MapDestination.Kind.Address, false)
        val kept = InMemoryScooterDefaults()
        for (place in listOf(lungern, zurich)) {
            RecentPlaceStore(kept).save(place)
            // The next launch of the same build.
            assertEquals(place, RecentPlaceStore(kept).load())
        }

        // By the version code the app gives the store.
        RecentPlaceStore(kept, build = "11").save(lungern)
        assertEquals(true, RecentPlaceStore(kept, build = "11").load()?.isCovered)
        assertEquals(false, RecentPlaceStore(kept, build = "12").load()?.isCovered)
        RecentPlaceStore(kept, build = "11").save(zurich)
        assertEquals(false, RecentPlaceStore(kept, build = "11").load()?.isCovered)
        assertEquals(true, RecentPlaceStore(kept, build = "12").load()?.isCovered)
        // Kept again by the build after, it is that build's.
        RecentPlaceStore(kept, build = "12").save(lungern)
        assertEquals(true, RecentPlaceStore(kept, build = "12").load()?.isCovered)

        // What a build before the field kept is read as the bundled areas have it, by any build.
        kept.set(
            """{"title":"Paradeplatz","subtitle":"Lungern OW","latitude":46.7741,"longitude":8.1558,"kind":"address","isCovered":true}""",
            forKey = key,
        )
        assertEquals(false, RecentPlaceStore(kept).load()?.isCovered)
        assertEquals(false, RecentPlaceStore(kept, build = "11").load()?.isCovered)
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
