package com.plhery.scootradar.map

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import java.util.Random

/** The numbers the layers write again are written as Double.toString writes them (app-ax). */
class NumberTextsTest {
    @Test
    fun aNumberIsWrittenAsDoubleToStringWritesIt() {
        val texts = NumberTexts()
        val random = Random(3)
        val numbers = listOf(0.0, -0.0, 1.0, -1.0, 500.0, 612.9032287597656, 0.8467741935483871, 8.5417, 47.3769, 1e-7, 1e21) +
            List(20_000) { (random.nextDouble() - 0.5) * 360 } + List(2_000) { random.nextFloat().toDouble() * 700 }
        // Twice over: the second time from the table, emptied more than once on the way.
        repeat(2) {
            for (number in numbers) assertEquals(number.toString(), texts.of(number))
        }
    }

    @Test
    fun aNumberWrittenAgainIsTakenFromTheTable() {
        val texts = NumberTexts()
        val first = texts.of(47.376912345678)
        assertSame(first, texts.of(47.376912345678))
        // -0.0 is not 0.0.
        assertEquals("0.0", texts.of(0.0))
        assertEquals("-0.0", texts.of(-0.0))
    }
}
