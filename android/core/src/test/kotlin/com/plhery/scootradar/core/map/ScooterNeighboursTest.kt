package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import kotlin.math.PI
import kotlin.math.cos
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** What the walk and the card remember of the scooters of its app beside the one they follow (findings 1.2, 1.3). */
class ScooterNeighboursTest {
    private val origin = GeoPoint(latitude = 47.3769, longitude = 8.5417)
    private val followed = lime("s1", east = 0)

    @Test
    fun aScooterNearerToWhereANeighbourStoodThanToTheOneFollowedIsNotIt() {
        val neighbours = ScooterNeighbours()
        assertTrue("nothing remembered", neighbours.mayBe(followed, candidate = lime("new", east = 9)))

        neighbours.note(followed, seen = listOf(followed, lime("s2", east = 9), lime("far", east = 31), scooter("b1", "bird", east = 3)))
        assertFalse("where the neighbour stood", neighbours.mayBe(followed, candidate = lime("new", east = 9)))
        assertFalse("as far from either", neighbours.mayBe(followed, candidate = lime("new", east = 4.5)))
        assertTrue("nearer the one followed", neighbours.mayBe(followed, candidate = lime("new", east = 4)))
        // Further than 30 m, or of another app, it is no neighbour.
        assertTrue(neighbours.mayBe(followed, candidate = lime("new", east = -14)))
        assertTrue(neighbours.mayBe(followed, candidate = lime("new", east = 2)))

        neighbours.forget()
        assertTrue("forgotten", neighbours.mayBe(followed, candidate = lime("new", east = 9)))
    }

    /**
     * A neighbour is remembered where it was seen last within 30 m of the scooter followed, as the iPhone remembers it
     * (Desk [372]): seen further away, as when it is ridden off, it keeps that place, and a scooter standing there is
     * not taken for the one followed.
     */
    @Test
    fun aNeighbourIsRememberedWhereItWasSeenLastWithin30Metres() {
        val neighbours = ScooterNeighbours()
        neighbours.note(followed, seen = listOf(lime("s2", east = 9)))
        assertFalse(neighbours.mayBe(followed, candidate = lime("new", east = 9)))
        // Moved within 30 m: its new place is its.
        neighbours.note(followed, seen = listOf(lime("s2", east = 20)))
        assertTrue(neighbours.mayBe(followed, candidate = lime("new", east = 9)))
        assertFalse(neighbours.mayBe(followed, candidate = lime("new", east = 20)))
        // Ridden away, and seen 400 m off, or 31 m: it stood 20 m east last.
        for (east in listOf(400, 31, -31)) {
            neighbours.note(followed, seen = listOf(lime("s2", east = east)))
            assertFalse("seen $east m east", neighbours.mayBe(followed, candidate = lime("new", east = 20)))
            assertTrue("seen $east m east", neighbours.mayBe(followed, candidate = lime("new", east = 9)))
        }
        // A scooter of its app first seen further than 30 m is not remembered, and one at 30 m is.
        neighbours.note(followed, seen = listOf(lime("s3", north = 31)))
        assertTrue(neighbours.mayBe(followed, candidate = lime("new", north = 31)))
        neighbours.note(followed, seen = listOf(lime("s4", north = -29.9)))
        assertFalse(neighbours.mayBe(followed, candidate = lime("new", north = -29.9)))
    }

    @Test
    fun theIDsOfTheScooterFollowedAreNeverANeighbours() {
        val neighbours = ScooterNeighbours()
        neighbours.note(followed, seen = listOf(followed))
        // Followed under a new id, it stands faded under the one before.
        val renamed = lime("s1-next", east = 1)
        neighbours.note(renamed, seen = listOf(followed, renamed))
        assertTrue(neighbours.mayBe(renamed, candidate = lime("s1-third", east = 0)))
    }

    @Test
    fun theFiftyNearestAreKept() {
        val neighbours = ScooterNeighbours()
        // 50 from 10 to 20 m east of it.
        neighbours.note(followed, seen = (0 until 50).map { lime("n$it", east = 10 + it * 0.2) })
        // One more, 25 m west, the farthest: not kept.
        neighbours.note(followed, seen = listOf(lime("west", east = -25)))
        assertTrue(neighbours.mayBe(followed, candidate = lime("new", east = -25)))
        // One nearer than them all is kept, in place of the farthest of the fifty.
        neighbours.note(followed, seen = listOf(lime("west-near", east = -6)))
        assertFalse(neighbours.mayBe(followed, candidate = lime("new", east = -6)))
        assertFalse(neighbours.mayBe(followed, candidate = lime("new", east = 10)))
    }

    private fun lime(id: String, east: Number = 0, north: Number = 0): Scooter = scooter(id, "lime", east = east, north = north)

    private fun scooter(id: String, provider: String, east: Number = 0, north: Number = 0): Scooter {
        val metresPerDegree = 6_371_008.8 * PI / 180
        return scooter(
            id,
            provider,
            latitude = origin.latitude + north.toDouble() / metresPerDegree,
            longitude = origin.longitude + east.toDouble() / (metresPerDegree * cos(origin.latitude * PI / 180)),
        )
    }
}
