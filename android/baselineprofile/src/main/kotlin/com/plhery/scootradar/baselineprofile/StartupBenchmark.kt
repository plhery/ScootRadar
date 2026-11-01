package com.plhery.scootradar.baselineprofile

// Android's own (X-AD30): the app's cold start, measured on the benchmarkRelease build, minified as release, with
// and without the Baseline Profile. timeToInitialDisplayMs is the first frame of the activity; timeToFullDisplayMs
// the first markers on the map (ScooterMarkers.markersShown, reported by ScooterMap), scootradar.com's answer
// included. On an emulator the numbers only compare the two.

import androidx.benchmark.macro.BaselineProfileMode
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val rule = MacrobenchmarkRule()

    /** Interpreted and JIT-compiled only, as an app installed without its profile starts. */
    @Test
    fun startupWithoutCompilation() = startup(CompilationMode.None())

    /** Compiled ahead of time from the Baseline Profile, as Play installs the app. */
    @Test
    fun startupWithTheBaselineProfile() = startup(CompilationMode.Partial(BaselineProfileMode.Require))

    private fun startup(compilation: CompilationMode) = rule.measureRepeated(
        packageName = PACKAGE,
        metrics = listOf(StartupTimingMetric()),
        compilationMode = compilation,
        startupMode = StartupMode.COLD,
        iterations = 10,
        setupBlock = { pressHome() },
    ) {
        startActivityAndWait()
        waitForMarkers()
    }
}
