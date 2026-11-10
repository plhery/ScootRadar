package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.CityZoneDownloads
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneSpeeds
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.timeIntervalSince
import java.time.Instant
import kotlin.time.Duration
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

// ScooterZoneAnswer and the zones of ios/ScootRadar/ViewModels/ScooterMapModel.swift.

/** The zones of an area as the server answered, or the failure to get them. */
data class ScooterZoneAnswer(
    val area: ScooterZoneArea,
    val zones: List<ScooterZone>,
    /**
     * Asking failed, or some of the area's zones are unknown: some feeds' could not be read, or were still on their way
     * after the last try. Those that came are drawn all the same.
     */
    val failed: Boolean,
    /** Some feeds' zones were still on their way, and the area is asked for again. */
    val pending: Boolean,
    /** Zones were left out to keep the answer small. */
    val truncated: Boolean = false,
    val receivedAt: Instant,
) {
    val isComplete: Boolean get() = !failed && !pending

    /**
     * Whether it serves a view's [area]: any within its own, but for one with zones left out, which serves its own
     * alone, as a smaller area may have them all, and the legend asks to zoom in for them.
     */
    fun serves(area: ScooterZoneArea): Boolean = if (truncated) this.area == area else this.area.contains(area)

    /**
     * What the legend says of it: the rest still on the way is loading, and an answer with zones left out asks to zoom
     * in beside the kinds it names.
     */
    val state: ScooterZoneState
        get() = when {
            failed -> ScooterZoneState.Failed
            pending -> ScooterZoneState.Loading
            truncated -> ScooterZoneState.Partial
            else -> ScooterZoneState.Shown
        }
}

/** Asks for the zones of the map's area, the area the scooters are asked for rounded out to the grid, unless an answer at hand covers it. */
internal fun ScooterMapController.updateZones() {
    if (!showsZones.value) {
        cancelZoneRequest()
        zoneAnswer = null
        setZones(ScooterZoneState.Off)
        return
    }
    if (viewportZoom.value < ScooterZoneArea.minimumZoom) {
        // A whole answer is kept for when the map comes close again; any other is asked for again then.
        cancelZoneRequest()
        if (zoneAnswer?.isComplete == false) zoneAnswer = null
        setZones(ScooterZoneState.ZoomIn)
        return
    }
    val area = ScooterZoneArea(covering = viewport.value.expanded(by = 0.25))
    if (area == null) {
        cancelZoneRequest()
        zoneAnswer = null
        setZones(ScooterZoneState.Shown)
        return
    }
    val answer = zoneAnswer
    if (answer != null && answer.serves(area)) {
        // Unless a pending answer is being asked for again, it stands; the cities' zones follow the map either way.
        if (zoneTaskArea == null) setZones(answer.state) else rebuildMapZones()
        return
    }
    val taskArea = zoneTaskArea
    if (taskArea != null && taskArea.contains(area)) {
        // The cities' zones follow the map meanwhile. Should the answer come with zones left out, the view's own area
        // is asked for then.
        rebuildMapZones()
        return
    }
    val now = clock()
    recentZoneAnswers = recentZoneAnswers.filter { now.timeIntervalSince(it.receivedAt) <= ScooterMapController.zoneAnswerLifetime }
    val recent = recentZoneAnswers.firstOrNull { it.serves(area) }
    if (recent != null) {
        cancelZoneRequest()
        zoneAnswer = recent
        setZones(recent.state)
        return
    }
    requestZones(area, after = ScooterMapController.zoneDebounce, retries = ScooterMapController.zonePendingRetries)
}

private fun ScooterMapController.requestZones(area: ScooterZoneArea, after: Duration, retries: Int) {
    zoneTask?.cancel()
    zoneTaskArea = area
    if (zoneAnswer?.area != area) setZones(ScooterZoneState.Loading)
    zoneTask = scope.launch {
        delay(after)
        val answer = try {
            val response = api.zonesIn(area)
            if (!isActive || zoneTaskArea != area) return@launch
            val pending = response.pending && retries > 0
            // An area whose zones are partly unknown says so, keeping those that came: it would otherwise read as one
            // with none. Not complete, it is asked for again with the scooters.
            val unknown = !pending && (response.unavailable || response.pending)
            ScooterZoneAnswer(
                area = area, zones = response.zones, failed = unknown, pending = pending, truncated = response.truncated,
                receivedAt = clock(),
            )
        } catch (_: CancellationException) {
            return@launch
        } catch (_: Exception) {
            if (!isActive || zoneTaskArea != area) return@launch
            // The area's zones stay drawn if they were; another area's go.
            val kept = if (zoneAnswer?.area == area) zoneAnswer?.zones ?: emptyList() else emptyList()
            ScooterZoneAnswer(area = area, zones = kept, failed = true, pending = false, receivedAt = clock())
        }
        zoneAnswer = answer
        if (answer.pending) {
            // What came is drawn meanwhile.
            requestZones(area, after = ScooterMapController.zonePendingRetry, retries = retries - 1)
        } else {
            zoneTask = null
            zoneTaskArea = null
        }
        if (answer.isComplete) {
            recentZoneAnswers = (listOf(answer) + recentZoneAnswers.filter { it.area != area })
                .take(ScooterMapController.RECENT_ZONE_ANSWER_LIMIT)
        }
        setZones(answer.state)
        // One with zones left out serves its own area alone: a view zoomed into it while it was on its way, which
        // waited for it, asks for its own now (the iPhone's 35d7a34c).
        if (answer.truncated && zoneTaskArea == null) updateZones()
    }
}

/**
 * A failed answer for the zones stands while the map stays in its area, so each refresh of the scooters, on its own or
 * asked for, asks for them again: after a load lost to the network, or a feed the server could not read and tries again
 * a minute later, they come back with the scooters, instead of staying unavailable until the map leaves the area. What
 * was drawn stays drawn meanwhile.
 */
internal fun ScooterMapController.askAgainForFailedZones() {
    if (!showsZones.value || zoneTaskArea != null) return
    val answer = zoneAnswer ?: return
    if (!answer.failed) return
    requestZones(answer.area, after = Duration.ZERO, retries = ScooterMapController.zonePendingRetries)
}

private fun ScooterMapController.cancelZoneRequest() {
    zoneTask?.cancel()
    zoneTask = null
    zoneTaskArea = null
}

private fun ScooterMapController.setZones(state: ScooterZoneState) {
    if (zoneState.value != state) _zoneState.value = state
    rebuildMapZones()
}

/**
 * Like the scooters: only the zones of the providers switched on, and none further out than zoom 14; and the cities'
 * rules and zones over the map.
 */
internal fun ScooterMapController.rebuildMapZones() {
    val shown = if (zoneState.value == ScooterZoneState.Off || zoneState.value == ScooterZoneState.ZoomIn) {
        emptyList()
    } else {
        (zoneAnswer?.zones ?: emptyList()).filter { zone ->
            ScooterProvider.fromRawValue(zone.provider)?.let { it in enabledProviders.value } ?: false
        }
    }
    val view = viewport.value
    if (viewportZoom.value < ScooterZoneArea.minimumZoom) {
        ruleZoneArea = null
    } else if (ruleZoneArea?.contains(view) != true) {
        ruleZoneArea = view.expanded(by = 0.5)
    }
    var rules: List<CityRuleZone.Shown> = emptyList()
    var notices: List<CityZoneDownloads.Notice> = emptyList()
    ruleZoneArea?.let { area ->
        // The cities' zones built in, and those downloaded; the others the area reaches are asked for.
        cityZoneDownloads.request(over = area)
        val downloaded = cityZoneDownloads.shown(over = area)
        val now = clock()
        rules = CityRuleZone.shown(over = area, zoom = viewportZoom.value, at = now, among = catalog.ruleZones) +
            CityRuleZone.shown(over = area, zoom = viewportZoom.value, at = now, among = downloaded.zones)
        notices = downloaded.notices.filter { it.city.bounds.intersects(view) }
    }
    val rulesInView = rules.filter { it.rule.reaches(view) }
    if (rulesInView != mapRuleZones.value) _mapRuleZones.value = rulesInView
    if (notices != mapZoneNotices.value) _mapZoneNotices.value = notices
    if (shown.size != mapOperatorZoneCount.value) _mapOperatorZoneCount.value = shown.size
    val slowSpeeds = ScooterZoneSpeeds.ofSlowZones(shown)
    if (slowSpeeds != mapOperatorSlowSpeeds.value) _mapOperatorSlowSpeeds.value = slowSpeeds
    val drawn = rules.map { it.mapZone } + shown
    if (drawn == mapZones.value) return
    _mapZones.value = drawn
    _mapZonesRevision.value += 1
}
