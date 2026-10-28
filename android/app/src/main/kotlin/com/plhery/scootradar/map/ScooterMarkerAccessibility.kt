// The map's annotation views as VoiceOver elements, from ios/ScootRadar/Views/ScooterMapView.swift: what MapKit
// gives the iPhone for every marker, the app gives TalkBack as virtual views over the map (MAP-215, MAP-307).

package com.plhery.scootradar.map

import android.graphics.Rect
import android.os.Bundle
import android.view.View
import android.view.accessibility.AccessibilityEvent
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.AccessibilityActionCompat
import androidx.customview.widget.ExploreByTouchHelper
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import kotlin.math.hypot
import kotlin.math.roundToInt
import kotlin.math.roundToLong

/** A marker TalkBack can reach: a scooter's dot, a bay, or a cluster or city total, where its view is on the map. */
sealed interface MarkerElement {
    /** The marker's feature id, which names it for as long as it is on the map. */
    val key: String

    /** Its view on the map, in points: what TalkBack outlines and what a finger exploring the map finds. */
    val frame: ScreenRect

    /** What TalkBack reads of it, in the app's language at the moment it reads it. */
    val description: MarkerDescription

    /** A scooter, in a square of 44 pt around its dot (MAP-233). */
    class Dot(val mark: ScooterMark, override val frame: ScreenRect) : MarkerElement {
        override val key: String get() = "v:${mark.scooter.id}"
        override val description: MarkerDescription get() = MarkerDescriptions.of(mark)
    }

    /** A bay, in its balloon. */
    class Bay(val bay: ScooterParking, override val frame: ScreenRect) : MarkerElement {
        override val key: String get() = "p:${bay.id}"
        override val description: MarkerDescription get() = MarkerDescriptions.of(bay)
    }

    /** The searched place's pin, read by its title (MAP-222). */
    class Pin(val destination: MapDestination, override val frame: ScreenRect) : MarkerElement {
        override val key: String get() = "a:search"
        override val description: MarkerDescription get() = MarkerDescription(destination.title, value = null, hint = null)
    }

    /** A cluster or a city total, in its view of 48 pt. */
    class Cluster(val cluster: ClusterMark, override val frame: ScreenRect) : MarkerElement {
        override val key: String get() = (if (cluster.isServer) "g:" else "c:") + cluster.id
        override val description: MarkerDescription get() = MarkerDescriptions.of(cluster.cluster)
    }
}

object MarkerElements {
    /**
     * The markers on the map that TalkBack reads, top to bottom, then left to right (MAP-228, MAP-306). The
     * names speak through their dots, and the faded markers of scooters last seen are not read (MAP-223).
     */
    fun of(scene: ScooterMarkerScene, map: MarkerMap): List<MarkerElement> {
        if (!map.isShown) return emptyList()
        val projection = map.projection
        val bounds = projection.bounds
        val elements = mutableListOf<MarkerElement>()
        for (mark in scene.drawnMarks()) {
            val centre = scene.dotCentre(mark, projection)
            elements += MarkerElement.Dot(mark, square(centre, ScooterMarkerScene.MARKER_SIZE))
        }
        for (bay in scene.parking) elements += MarkerElement.Bay(bay, scene.bayFrame(bay, projection))
        for (cluster in scene.clusters()) {
            elements += MarkerElement.Cluster(cluster, square(projection.point(cluster.cluster.coordinate), ScooterMarkerScene.CLUSTER_SIZE))
        }
        val destination = scene.destination
        val pin = scene.destinationFrame(projection)
        if (destination != null && pin != null) elements += MarkerElement.Pin(destination, pin)
        // Views whose tops are a fraction of a point apart are on one line.
        return elements
            .filter { it.frame.intersection(bounds) != null }
            .sortedWith(compareBy<MarkerElement>({ it.frame.minY.roundToLong() }, { it.frame.minX }, { it.key }))
    }

    /** The trait VoiceOver reads of a scooter while it is selected (setSelected). */
    fun isSelected(element: MarkerElement, scene: ScooterMarkerScene): Boolean =
        element is MarkerElement.Dot && element.mark.scooter.id == scene.appliedSelectionID

    /**
     * The marker a finger exploring the map is on: the one a tap there would take, the cluster on top of the
     * others if no dot or bay is meant; else, among the views under it, the one whose middle is nearest.
     */
    fun at(point: ScreenPoint, among: List<MarkerElement>, scene: ScooterMarkerScene, map: MarkerMap): MarkerElement? {
        val scooter = scene.scooterMark(at = point, map = map)
        val bay = scene.bay(at = point, beside = scooter, map = map)
        val key = when {
            bay != null -> "p:${bay.id}"
            scooter != null -> "v:${scooter.first.scooter.id}"
            else -> scene.topCluster(at = point, map = map)?.let { (if (it.isServer) "g:" else "c:") + it.id }
        }
        return among.firstOrNull { it.key == key }
            ?: among.filter { it.frame.contains(point) }.minByOrNull { hypot(it.frame.midX - point.x, it.frame.midY - point.y) }
    }

    /** A double tap: what MapKit's selection of the marker does, the scooter's or the bay's card, or the cluster opened. */
    fun activate(element: MarkerElement, scene: ScooterMarkerScene, map: MarkerMap) {
        when (element) {
            is MarkerElement.Dot -> scene.select(element.mark, map)
            is MarkerElement.Bay -> scene.select(element.bay)
            is MarkerElement.Cluster -> scene.open(element.cluster, map)
            // MapKit's callout with the title is not drawn on Android (MAP-033).
            is MarkerElement.Pin -> Unit
        }
    }

    private fun square(centre: ScreenPoint, side: Double) = ScreenRect(centre.x - side / 2, centre.y - side / 2, side, side)
}

/**
 * TalkBack's view of the markers: one virtual view for each scooter, bay, cluster and city total on the map, with
 * what VoiceOver reads of it. The markers call [refresh] when the map comes to rest and when they change, and the
 * views are listed again where they are then; what a view reads, and whether it is selected, is read as TalkBack
 * asks for it.
 */
class ScooterMarkerAccessibility(
    host: View,
    private val scene: ScooterMarkerScene,
    private val map: MarkerMap,
    /** Pixels in a point. */
    private val ratio: Float,
    /** Draws what a double tap changed. */
    private val changed: () -> Unit,
) : ExploreByTouchHelper(host) {
    /** The number of each marker's virtual view, kept while the marker is listed so that TalkBack's focus stays on it. */
    private var ids = HashMap<String, Int>()
    private var nextID = 0

    /** The markers as last listed, by the numbers of their views, and whether they are listed as they are now. */
    private var listed = HashMap<Int, MarkerElement>()
    private var elements: List<MarkerElement> = emptyList()
    private var isCurrent = false

    /** The markers have moved or changed: TalkBack is told, and they are listed again when it asks. */
    fun refresh() {
        isCurrent = false
        invalidateRoot()
    }

    /** The numbers of the virtual views, in TalkBack's order: for the tests. */
    internal fun virtualViews(): List<Int> = mutableListOf<Int>().also { getVisibleVirtualViews(it) }

    /** The number of the virtual view at a point of the map, in pixels: for the tests. */
    internal fun virtualViewAt(x: Float, y: Float): Int = getVirtualViewAt(x, y)

    private fun current(): List<MarkerElement> {
        if (isCurrent) return elements
        val elements = MarkerElements.of(scene, map)
        val numbers = HashMap<String, Int>(elements.size)
        val byNumber = HashMap<Int, MarkerElement>(elements.size)
        for (element in elements) {
            val id = ids[element.key] ?: nextID++
            numbers[element.key] = id
            byNumber[id] = element
        }
        ids = numbers
        listed = byNumber
        this.elements = elements
        isCurrent = true
        return elements
    }

    override fun getVirtualViewAt(x: Float, y: Float): Int {
        val elements = current()
        val element = MarkerElements.at(ScreenPoint(x / ratio.toDouble(), y / ratio.toDouble()), elements, scene, map)
        return element?.let { ids[it.key] } ?: INVALID_ID
    }

    override fun getVisibleVirtualViews(virtualViewIds: MutableList<Int>) {
        for (element in current()) virtualViewIds += ids.getValue(element.key)
    }

    // ExploreByTouchHelper makes the bounds on the screen, and whether the view is visible, from those in the map.
    @Suppress("DEPRECATION")
    override fun onPopulateNodeForVirtualView(virtualViewId: Int, node: AccessibilityNodeInfoCompat) {
        current()
        val element = listed[virtualViewId]
        if (element == null) {
            // A marker gone since TalkBack last asked: a view with nothing to read, nowhere.
            node.contentDescription = ""
            node.setBoundsInParent(Rect())
            return
        }
        val description = element.description
        // TalkBack has no value of its own; read after the label, it keeps VoiceOver's order (MAP-217).
        node.contentDescription = listOfNotNull(description.label, description.value).joinToString(", ")
        node.setBoundsInParent(pixels(element.frame))
        // The pin has its label only, as MapKit gives VoiceOver.
        if (element is MarkerElement.Pin) return
        node.className = BUTTON
        node.isSelected = MarkerElements.isSelected(element, scene)
        node.isClickable = true
        // TalkBack reads the hint as "double-tap to …" (MAP-218, UI-327).
        node.addAction(AccessibilityActionCompat(AccessibilityNodeInfoCompat.ACTION_CLICK, description.hint))
    }

    override fun onPerformActionForVirtualView(virtualViewId: Int, action: Int, arguments: Bundle?): Boolean {
        if (action != AccessibilityNodeInfoCompat.ACTION_CLICK) return false
        current()
        val element = listed[virtualViewId] ?: return false
        MarkerElements.activate(element, scene, map)
        changed()
        sendEventForVirtualView(virtualViewId, AccessibilityEvent.TYPE_VIEW_CLICKED)
        return true
    }

    private fun pixels(frame: ScreenRect): Rect = Rect(
        (frame.minX * ratio).roundToInt(),
        (frame.minY * ratio).roundToInt(),
        (frame.maxX * ratio).roundToInt(),
        (frame.maxY * ratio).roundToInt(),
    )

    private companion object {
        const val BUTTON = "android.widget.Button"
    }
}
