package com.plhery.scootradar.ui.glass

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// UI-185: the glass gives way to the fill only on a phone that can't keep up with the blur, and tries the blur once
// more when the map has rested a minute (app-aw, the lead's call).

class FrameWatchTest {
    /** A 120 Hz frame's deadline, in nanoseconds. */
    private val deadline = 8_333_333L

    /** Feeds [count] frames, [slow] of them first at [slowNanos] and the rest on time: the frame at which it tripped, or -1. */
    private fun SlowFrames.feed(count: Int, slow: Int, slowNanos: Long = deadline * 3): Int {
        for (frame in 0 until count) {
            if (count(if (frame < slow) slowNanos else deadline / 2, deadline)) return frame
        }
        return -1
    }

    @Test
    fun aQuarterOfTheFramesSlowInThreeWindowsRunningStopsTheBlurAtTheThirdWindowsEnd() {
        val frames = SlowFrames()
        assertEquals("the first window", -1, frames.feed(120, slow = 30))
        assertEquals("the second", -1, frames.feed(120, slow = 30))
        assertEquals("the third, at its last frame", 119, frames.feed(120, slow = 30))
    }

    @Test
    fun oneFrameShortOfAQuarterInAWindowStartsTheCountAgain() {
        val frames = SlowFrames()
        assertEquals(-1, frames.feed(120, slow = 30))
        assertEquals(-1, frames.feed(120, slow = 30))
        assertEquals("29 of 120", -1, frames.feed(120, slow = 29))
        assertEquals(-1, frames.feed(120, slow = 30))
        assertEquals(-1, frames.feed(120, slow = 30))
        assertEquals("three slow windows again", 119, frames.feed(120, slow = 30))
    }

    @Test
    fun aPinchsBurstDoesNotStopTheBlur() {
        // Two windows of a zoom with every other frame dropped, then the map at rest drawing on time.
        val frames = SlowFrames()
        assertEquals(-1, frames.feed(120, slow = 60))
        assertEquals(-1, frames.feed(120, slow = 120))
        assertEquals(-1, frames.feed(1_200, slow = 0))
    }

    @Test
    fun aFrameIsSlowOnlyPastTwiceItsDeadline() {
        val frames = SlowFrames()
        // At 1.5 times its deadline a frame was slow before app-aw; at twice it, not yet.
        assertEquals(-1, frames.feed(360, slow = 360, slowNanos = deadline * 2))
        assertEquals("just past twice", 359, frames.feed(360, slow = 360, slowNanos = deadline * 2 + 1))
    }

    @Test
    fun theBlurComesBackOnceAfterAMinuteOfTheMapAtRest() {
        val run = BlurRun()
        assertTrue(run.blurs)
        assertFalse("nothing to try again while it blurs", run.mayTryAgain)

        run.stop(now = 10_000)
        assertFalse(run.blurs)
        assertTrue(run.mayTryAgain)
        // A hand on the map 5 s after it stopped: the minute counts from there.
        assertEquals(60_000L, run.restLeft(now = 10_000, touched = 0))
        assertEquals(55_000L, run.restLeft(now = 20_000, touched = 15_000))
        assertEquals(0L, run.restLeft(now = 75_000, touched = 15_000))

        run.tryAgain()
        assertTrue("back after the rest", run.blurs)
        assertFalse(run.mayTryAgain)

        run.stop(now = 200_000)
        assertFalse(run.blurs)
        assertFalse("stopped twice, no more tries in this run", run.mayTryAgain)
        run.tryAgain()
        assertFalse(run.blurs)
    }
}
