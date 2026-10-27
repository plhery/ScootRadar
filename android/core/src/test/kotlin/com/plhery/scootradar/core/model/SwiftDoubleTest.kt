package com.plhery.scootradar.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// No iOS test: what Double(String) gives each text was read from Swift 6.4 on macOS.
class SwiftDoubleTest {
    @Test
    fun aTextIsReadAsSwiftReadsIt() {
        val numbers = mapOf(
            "1" to 1.0, "1." to 1.0, ".5" to 0.5, "+.5" to 0.5, "-0" to -0.0, "00012" to 12.0,
            "1e5" to 100_000.0, "1E+5" to 100_000.0, "1.e5" to 100_000.0, "1.5E-3" to 0.0015,
            "1e400" to Double.POSITIVE_INFINITY, "-1e400" to Double.NEGATIVE_INFINITY, "1e-400" to 0.0,
            "0x10" to 16.0, "-0x10" to -16.0, "+0x1" to 1.0, "0xA" to 10.0, "0xa" to 10.0, "0x1e3" to 483.0,
            "0x1p3" to 8.0, "0x1P-2" to 0.25, "+0x1P+3" to 8.0, "0x1.8p1" to 3.0, "0x1.8" to 1.5, "0x.8" to 0.5,
            "0x1." to 1.0, "0x0.0p0" to 0.0, "-0x0" to -0.0, "0x1p2000" to Double.POSITIVE_INFINITY,
            "0x00000000000000000000000001p-10" to 0.0009765625,
            "inf" to Double.POSITIVE_INFINITY, "-inf" to Double.NEGATIVE_INFINITY, "+inf" to Double.POSITIVE_INFINITY,
            "INF" to Double.POSITIVE_INFINITY, "Infinity" to Double.POSITIVE_INFINITY, "inFinity" to Double.POSITIVE_INFINITY,
            "-iNf" to Double.NEGATIVE_INFINITY, "-Infinity" to Double.NEGATIVE_INFINITY,
        )
        for ((text, number) in numbers) {
            // Their bits tell -0.0 from 0.0.
            assertEquals(text, number.toRawBits(), swiftDouble(text)?.toRawBits())
        }

        val notNumbers = listOf(
            "nan", "NaN", "NAN", "nAn", "-nan", "+nan", "nan()", "nan(0x1)", "nan(12)", "nan(00)", "nan(0x)",
            "nan(0xff)", "nan(0xFF)", "snan", "SNAN", "sNaN", "-snan", "+snan()", "snan(1)",
        )
        for (text in notNumbers) assertTrue(text, swiftDouble(text)?.isNaN() == true)

        val nothing = listOf(
            "", "+", "-", ".", "e5", "1e", "1e+", "1_000", " 1", "1 ", "inf ", "infin", "infx", "infinityx",
            "0X10", "0XA", "0x", "0xg", "0x1p", "0x1p+", "0x1_0", "0x-1", "0x.p1", "-0x.p1",
            "nan(", "nan(abc)", "nan(1.5)", "nan(-1)", "nan(_)", "nan( )", "nan(ff)", "nan(0X1)", "nan(0xZ)",
            "nan(a b)", "nan(0x1p)", "nan()x",
            // Digits of other scripts.
            "\u0663", "\uFF11",
        )
        for (text in nothing) assertNull(text, swiftDouble(text))
    }

    @Test
    fun aScreenshotCameraTakesWhatSwiftReadsAsNumbers() {
        val defaults = InMemoryScooterDefaults()
        defaults.set("47.37, 8.54,inf,0x14,nan", forKey = "ScreenshotCamera")
        val camera = ScooterScreenshotCamera.fromLaunchArguments(defaults)
        assertEquals(GeoPoint(latitude = 47.37, longitude = 8.54), camera?.center)
        assertEquals(Double.POSITIVE_INFINITY, camera?.distance)
        assertEquals(20.0, camera?.pitch)
        assertTrue(camera?.heading?.isNaN() == true)

        // A value that is no number is dropped, and four are no camera.
        defaults.set("47.37,8.54,0X10,0,0", forKey = "ScreenshotCamera")
        assertNull(ScooterScreenshotCamera.fromLaunchArguments(defaults))
    }
}
