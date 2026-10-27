package com.plhery.scootradar.map

import kotlinx.coroutines.launch
import kotlinx.coroutines.test.currentTime
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.fail
import org.junit.Test
import java.io.IOException

// src/lib/quietGround.test.ts's groundTileUrl, and the ground's retries from src/components/MapComponent.tsx.
class GroundTilesTest {
    private val tiles = "https://tiles.openfreemap.org/planet/20261007_001001_pt/{z}/{x}/{y}.pbf"

    /** A server that answers every request with this body, or with a 503. */
    private class Answering(private val body: String, private val ok: Boolean = true) {
        val asked = mutableListOf<String>()
        val fetch: suspend (String) -> GroundTiles.Answer = { url ->
            asked += url
            GroundTiles.Answer(if (ok) 200 else 503, body)
        }
    }

    private suspend fun failure(tiles: GroundTiles): String? = try {
        tiles.url()
        null
    } catch (error: Exception) {
        error.message
    }

    @Test
    fun asksOncePerVisitWhereTheTilesAre() = runTest {
        val server = Answering("""{"tiles":["$tiles"]}""")
        val ground = GroundTiles(server.fetch)
        assertNull(ground.known)

        assertEquals(tiles, ground.url())
        assertEquals(tiles, ground.url())
        assertEquals(listOf("https://tiles.openfreemap.org/planet"), server.asked)
        assertEquals(tiles, ground.known)
    }

    @Test
    fun doesNotRememberAFailureSoThatTheNextTryAsksAgain() = runTest {
        var answer: suspend (String) -> GroundTiles.Answer = Answering("{}", ok = false).fetch
        val ground = GroundTiles { url -> answer(url) }
        assertEquals("Map tiles: 503", failure(ground))
        answer = { throw IOException("offline") }
        assertEquals("offline", failure(ground))
        assertNull(ground.known)

        answer = Answering("""{"tiles":["$tiles"]}""").fetch
        assertEquals(tiles, ground.url())
    }

    @Test
    fun refusesWhatIsNotOpenFreeMapsTileAddress() = runTest {
        for ((name, body) in listOf(
            "no address at all" to "{}",
            "an address on another host" to """{"tiles":["https://example.com/{z}/{x}/{y}.pbf"]}""",
            "an address that is not a tile pattern" to """{"tiles":["https://tiles.openfreemap.org/planet"]}""",
            "an address with a query" to """{"tiles":["$tiles?key=1"]}""",
            "something that is not text" to """{"tiles":[42]}""",
            "an address and a line after it" to """{"tiles":["$tiles\n"]}""",
        )) {
            assertEquals(name, "Map tiles: unexpected address", failure(GroundTiles(Answering(body).fetch)))
        }
    }

    @Test
    fun asksAgainAfter2515And30SecondsThenEvery30() = runTest {
        val tries = mutableListOf<Long>()
        val ground = GroundTiles {
            tries += currentTime
            if (tries.size < 7) throw IOException("offline")
            GroundTiles.Answer(200, """{"tiles":["$tiles"]}""")
        }
        var url: String? = null
        launch { url = ground.urlWhenReachable() }
        testScheduler.advanceUntilIdle()
        assertEquals(tiles, url)
        assertEquals(listOf(0L, 2_000L, 7_000L, 22_000L, 52_000L, 82_000L, 112_000L), tries)
    }

    @Test
    fun stopsAskingWhenTheMapIsGone() = runTest {
        var asked = 0
        val ground = GroundTiles {
            asked += 1
            throw IOException("offline")
        }
        val waiting = launch {
            ground.urlWhenReachable()
            fail("The address can't be had")
        }
        testScheduler.advanceTimeBy(10_000)
        waiting.cancel()
        testScheduler.advanceUntilIdle()
        assertEquals(3, asked)
    }
}
