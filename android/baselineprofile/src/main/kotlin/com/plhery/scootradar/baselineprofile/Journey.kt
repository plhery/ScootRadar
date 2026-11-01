package com.plhery.scootradar.baselineprofile

// Android's own (X-AD30): the steps the Baseline Profile records and the startup benchmark waits for, driven with
// UiAutomator from outside the app, through what TalkBack reads of the screen. The markers are the map's virtual
// views (ScooterMarkerAccessibility): a cluster reads "617 scooters", a scooter "Voi scooter, Battery: 84 percent".
// The phone's language is English, as the lane's emulators are.

import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import java.util.regex.Pattern

const val PACKAGE = "com.plhery.scootradar"

/** A cluster on the map: a number of scooters, and nothing else ("Bolt, 847 scooters" is a provider's chip). */
private val CLUSTER: BySelector = By.pkg(PACKAGE).desc(Pattern.compile("[0-9][0-9,]* scooters"))

/** A scooter's dot on the map. */
private val SCOOTER: BySelector = By.pkg(PACKAGE).desc(Pattern.compile("[^,]+ scooter(, .*)?"))

/** Any marker of scooters on the map. */
private val MARKER: BySelector = By.pkg(PACKAGE).desc(Pattern.compile("[0-9][0-9,]* scooters|[^,]+ scooter(, .*)?"))

/** How long the map may take to load the scooters from scootradar.com. */
private const val LOADING_MS = 30_000L

/**
 * How long the first markers' light-up may wait for their tiles (ScooterMarkers.MOST_HELD, 1.5 s), and a margin:
 * the launch is reported fully drawn once it starts, after TalkBack can already read them.
 */
private const val LIGHT_UP_MS = 2_000L

/** Waits for the map's first markers, then for their light-up to start, when the app reports itself fully drawn. */
fun MacrobenchmarkScope.waitForMarkers() {
    check(device.wait(Until.hasObject(MARKER), LOADING_MS)) { "No scooters on the map after ${LOADING_MS / 1000} s" }
    Thread.sleep(LIGHT_UP_MS)
}

/**
 * Opens a scooter's card: taps clusters until scooters' dots show, then a dot near the middle of the screen, clear
 * of the search bar above and the dock below.
 */
fun MacrobenchmarkScope.openScooterCard() {
    repeat(4) {
        middleMost(device.findObjects(SCOOTER))?.let { scooter ->
            scooter.click()
            check(device.wait(Until.hasObject(By.pkg(PACKAGE).desc("Close scooter details")), LOADING_MS)) {
                "No scooter card"
            }
            return
        }
        val cluster = checkNotNull(middleMost(device.findObjects(CLUSTER))) { "Neither a scooter nor a cluster on the map" }
        cluster.click()
        device.wait(Until.hasObject(SCOOTER), 5_000)
    }
    error("No scooter after four clusters opened")
}

/** Opens the search, looks for Bern, and closes it again. */
fun MacrobenchmarkScope.openSearch() {
    // A card open over the dock is closed first, as a rider would.
    device.findObject(By.pkg(PACKAGE).desc("Close scooter details"))?.click()
    val bar = checkNotNull(device.wait(Until.findObject(By.pkg(PACKAGE).desc("Search city or address")), LOADING_MS)) {
        "No search bar"
    }
    bar.click()
    val field = checkNotNull(device.wait(Until.findObject(By.pkg(PACKAGE).clazz("android.widget.EditText")), 5_000)) {
        "No search field"
    }
    field.text = "Bern"
    // The city's row, its country under its name.
    device.wait(Until.hasObject(By.pkg(PACKAGE).textContains("Switzerland")), 10_000)
    device.pressBack()
    device.pressBack()
    device.waitForIdle()
}

/** Of [objects], the one nearest the middle of the screen, among those in its middle half. */
private fun MacrobenchmarkScope.middleMost(objects: List<UiObject2>): UiObject2? {
    val height = device.displayHeight
    val width = device.displayWidth
    return objects
        .filter { val y = it.visibleCenter.y; y > height / 4 && y < height * 3 / 4 }
        .minByOrNull { val c = it.visibleCenter; (c.x - width / 2) * (c.x - width / 2) + (c.y - height / 2) * (c.y - height / 2) }
}
