package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.util.Locale
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

// ios/ScootRadar/Models/ScooterMapLook.swift. What only draws, the dots' pictures and the pills, is the map's.

/** What a dot on the map is: one scooter among others, the nearest of its provider, or the one whose card is open. */
enum class ScooterDotState {
    Plain,
    Head,
    Selected,
}

/** How one scooter is drawn. The map's coordinator works this out for every scooter and the marker draws what it is given. */
data class ScooterDotLook(
    val state: ScooterDotState = ScooterDotState.Plain,
    val diameter: Double = ScooterMapLook.plainDiameter,
    /** Close up the dot is large enough to carry its provider's initials. */
    val showsInitials: Boolean = false,
    /** The opacity: scooters far from the origin fade back. */
    val strength: Double = 1.0,
    /** The nearest are drawn on top, the selected one on top of all. */
    val zPriority: Float = 500f,
    /** Where the dot is drawn from its real place, when scooters on one spot are spread on a ring. */
    val offset: ScreenPoint = ScreenPoint.zero,
) {
    /** How wide the dot is with its rings, which a neighbour stays clear of. */
    val footprint: Double get() = diameter + 2 * ScooterMapLook.ringReach(state)
}

data class ScooterDistance(val id: String, val provider: String, val metres: Double)

data class ScooterSpreadDot(
    val id: String,
    /** On screen, or in any plane with the screen's scale and directions. */
    val point: ScreenPoint,
    val footprint: Double,
)

enum class ScooterPillSide {
    Right,
    Left,
    Above,
    Below,
    AboveRight,
    AboveLeft,
    BelowRight,
    BelowLeft,
}

data class ScooterPillRequest(
    val id: String,
    /** The centre of the dot the pill names. */
    val anchor: ScreenPoint,
    /** How far the dot reaches from its centre, rings included. */
    val reach: Double,
    val width: Double,
    /** The side the pill is on now. It stays there while that side is free, so a pill does not hop about as the map moves. */
    val preferred: ScooterPillSide? = null,
)

data class ScooterPillPlacement(
    val id: String,
    val side: ScooterPillSide,
    /** The pill's top left corner, from the centre of its dot. */
    val origin: ScreenPoint,
)

/**
 * The look of the map at street level: every scooter is a dot at its own place, the nearest of each provider
 * carries its name, and nothing merges. What can be decided without a map is decided here.
 */
object ScooterMapLook {
    const val plainDiameter: Double = 10.0
    const val pillHeight: Double = 26.0

    /**
     * At this scale and closer a dot is a disc with its provider's initials. Bolt and Lime are nearly the same
     * green: close up they name themselves.
     */
    const val closeUpMetresPerPoint: Double = 0.5

    /** The scale at which dots have their plain sizes: a little wider than the view the map opens on around the rider. */
    const val referenceMetresPerPoint: Double = 1.07
    private const val walkingMetresPerMinute = 80.0

    /** Dots whose centres are closer than this share of their width cover each other. */
    private const val overlapShare = 0.7

    /** The app's walking estimate: 80 m a minute in a straight line, at least a minute. */
    fun walkingMinutes(metres: Double): Int = max(1, ceil(metres / walkingMetresPerMinute).toInt())

    /**
     * The nearest scooter of each provider, nearest first. Equal distances go to the smaller id, so a refresh
     * does not hand the name to a neighbour. Where the server counts most scooters in groups, the few it sends
     * alone are not the nearest, so none is named, as on the web.
     */
    fun heads(among: List<ScooterDistance>, countedInGroups: Boolean = false): List<ScooterDistance> {
        if (countedInGroups) return emptyList()
        val nearest = HashMap<String, ScooterDistance>()
        for (scooter in among) {
            if (!scooter.metres.isFinite()) continue
            val current = nearest[scooter.provider]
            if (current != null && !isNearer(scooter, current)) continue
            nearest[scooter.provider] = scooter
        }
        return nearest.values.sortedWith(nearestFirst)
    }

    private fun isNearer(first: ScooterDistance, second: ScooterDistance): Boolean =
        if (first.metres != second.metres) first.metres < second.metres else first.id < second.id

    private val nearestFirst = Comparator<ScooterDistance> { first, second ->
        when {
            isNearer(first, second) -> -1
            isNearer(second, first) -> 1
            else -> 0
        }
    }

    /** 12 pt within 80 m, 10 within 240 m and 8 beyond; 10 without an origin. */
    fun dotDiameter(metres: Double?, state: ScooterDotState): Double = when (state) {
        ScooterDotState.Selected -> 16.0
        ScooterDotState.Head -> 14.0
        ScooterDotState.Plain -> when {
            metres == null -> plainDiameter
            metres <= 80 -> 12.0
            metres <= 240 -> 10.0
            else -> 8.0
        }
    }

    fun dotStrength(metres: Double?, state: ScooterDotState): Double {
        if (state != ScooterDotState.Plain || metres == null) return 1.0
        return max(0.42, 1 - metres / 620)
    }

    /** Dots grow as the map closes in and shrink a little as it backs away. */
    fun zoomFactor(metresPerPoint: Double): Double {
        if (!(metresPerPoint > 0)) return 1.0
        return min(1.9, max(0.8, sqrt(referenceMetresPerPoint / metresPerPoint)))
    }

    fun look(metres: Double?, state: ScooterDotState, metresPerPoint: Double): ScooterDotLook {
        val strength = dotStrength(metres, state)
        val zPriority = zPriority(metres, state)
        if (metresPerPoint <= closeUpMetresPerPoint) {
            val diameter = when (state) {
                ScooterDotState.Plain -> 20.0
                ScooterDotState.Head -> 24.0
                ScooterDotState.Selected -> 26.0
            }
            // Faded further, the initials could not be read.
            return ScooterDotLook(state, diameter, showsInitials = true, strength = max(0.7, strength), zPriority = zPriority)
        }
        // Half points keep the number of pictures to draw small.
        val scaled = dotDiameter(metres, state) * zoomFactor(metresPerPoint)
        return ScooterDotLook(state, (scaled * 2).roundedAwayFromZero() / 2, strength = strength, zPriority = zPriority)
    }

    /**
     * Plain dots keep the map's default and rise with their nearness; a head is above them, a selected dot
     * above the heads and the rider above all.
     */
    fun zPriority(metres: Double?, state: ScooterDotState): Float {
        val nearness = metres?.let { (1 - min(1.0, max(0.0, it) / 620)).toFloat() } ?: 0f
        return when (state) {
            ScooterDotState.Plain -> 500 + 200 * nearness
            ScooterDotState.Head -> 720 + 60 * nearness
            ScooterDotState.Selected -> 900f
        }
    }

    /** The gap and the ring around a head or a selected dot. */
    fun ringReach(state: ScooterDotState): Double = when (state) {
        ScooterDotState.Plain -> 0.0
        ScooterDotState.Head -> 4.0
        ScooterDotState.Selected -> 6.0
    }

    /**
     * Scooters standing on one spot would be one dot. Each group of dots that cover each other goes on a small
     * ring around its shared centre: two side by side, three in a triangle, more in a ring with the first at
     * twelve o'clock, and beyond eight packed as the seeds of a sunflower, as on the web. The result is how far
     * each of them moves; a dot alone is not in it. Groups are made in the order of the ids, so the same
     * scooters get the same places whatever order they arrive in.
     */
    fun spread(dots: List<ScooterSpreadDot>): Map<String, ScreenPoint> {
        val sorted = dots.sortedWith { first, second -> first.id.compareTo(second.id) }
        val reach = overlapShare * (sorted.maxOfOrNull { it.footprint } ?: 0.0)
        if (!(sorted.size > 1 && reach > 0)) return emptyMap()

        // Only the dots of the neighbouring cells can be close enough.
        fun cell(point: ScreenPoint) = SpreadCell(floor(point.x / reach).toInt(), floor(point.y / reach).toInt())
        val cells = HashMap<SpreadCell, MutableList<Int>>()
        for ((index, dot) in sorted.withIndex()) {
            cells.getOrPut(cell(dot.point)) { mutableListOf() } += index
        }

        val isGrouped = BooleanArray(sorted.size)
        val offsets = LinkedHashMap<String, ScreenPoint>()
        for ((index, seed) in sorted.withIndex()) {
            if (isGrouped[index]) continue
            isGrouped[index] = true
            val members = mutableListOf(index)
            val home = cell(seed.point)
            for (x in home.x - 1..home.x + 1) {
                for (y in home.y - 1..home.y + 1) {
                    for (other in cells[SpreadCell(x, y)].orEmpty()) {
                        if (isGrouped[other]) continue
                        val candidate = sorted[other]
                        val limit = overlapShare * (seed.footprint + candidate.footprint) / 2
                        val distance = hypot(candidate.point.x - seed.point.x, candidate.point.y - seed.point.y)
                        if (distance < limit) {
                            isGrouped[other] = true
                            members += other
                        }
                    }
                }
            }
            if (members.size <= 1) continue
            members.sort()

            val count = members.size.toDouble()
            val centre = ScreenPoint(
                x = members.fold(0.0) { sum, member -> sum + sorted[member].point.x } / count,
                y = members.fold(0.0) { sum, member -> sum + sorted[member].point.y } / count,
            )
            // Neighbours are one dot and a point apart; a head or a selected dot is wider by its ring, which its
            // neighbour stays clear of.
            val widest = members.map { sorted[it].footprint }.sortedDescending()
            val spacing = (widest[0] + widest[1]) / 2 + 1
            val ring = if (members.size == 2) spacing / 2 else spacing / (2 * sin(PI / count))
            for ((slot, member) in members.withIndex()) {
                val radius: Double
                val angle: Double
                if (members.size == 2) {
                    radius = ring
                    angle = if (slot == 0) PI else 0.0
                } else if (members.size <= ringLimit) {
                    radius = ring
                    angle = -PI / 2 + 2 * PI * slot / count
                } else {
                    // A ring of so many would be wide and empty.
                    radius = 0.58 * spacing * sqrt(slot + 0.5)
                    angle = -PI / 2 + slot * goldenAngle
                }
                val dot = sorted[member]
                offsets[dot.id] = ScreenPoint(
                    x = centre.x + radius * cos(angle) - dot.point.x,
                    y = centre.y + radius * sin(angle) - dot.point.y,
                )
            }
        }
        return offsets
    }

    /** Up to this many share a ring. */
    private const val ringLimit = 8
    private val goldenAngle = PI * (3 - sqrt(5.0))

    private data class SpreadCell(val x: Int, val y: Int)

    /** A dot a touch may mean: where its centre is drawn, and how far from it a touch still means it. */
    data class TouchableDot(val id: String, val centre: ScreenPoint, val reach: Double)

    /** The dot a touch means, and how far from its centre the touch is. */
    data class TouchedDot(val id: String, val distance: Double)

    /**
     * The dot a touch means: the one whose drawn centre is nearest, among those the touch is within reach of.
     * Dots are far smaller than a finger.
     */
    fun nearestDot(to: ScreenPoint, among: List<TouchableDot>): TouchedDot? {
        var nearest: TouchedDot? = null
        for (dot in among) {
            val distance = hypot(dot.centre.x - to.x, dot.centre.y - to.y)
            if (!(distance <= dot.reach)) continue
            val current = nearest
            if (current != null && (current.distance < distance || (current.distance == distance && current.id < dot.id))) {
                continue
            }
            nearest = TouchedDot(dot.id, distance)
        }
        return nearest
    }

    /** Where a pill sits on one side of its dot: its top left corner, from the centre of the dot. */
    fun pillOrigin(side: ScooterPillSide, width: Double, reach: Double): ScreenPoint {
        val beside = reach + 2
        val over = reach + 5
        val corner = reach - 2
        val nearCorner = reach + 1
        return when (side) {
            ScooterPillSide.Right -> ScreenPoint(beside, -pillHeight / 2)
            ScooterPillSide.Left -> ScreenPoint(-beside - width, -pillHeight / 2)
            ScooterPillSide.Above -> ScreenPoint(-width / 2, -over - pillHeight)
            ScooterPillSide.Below -> ScreenPoint(-width / 2, over)
            ScooterPillSide.AboveRight -> ScreenPoint(corner, -nearCorner - pillHeight)
            ScooterPillSide.AboveLeft -> ScreenPoint(-corner - width, -nearCorner - pillHeight)
            ScooterPillSide.BelowRight -> ScreenPoint(corner, nearCorner)
            ScooterPillSide.BelowLeft -> ScreenPoint(-corner - width, nearCorner)
        }
    }

    private class PillOption(val side: ScooterPillSide, val box: ScreenRect?, val cost: Double)

    /**
     * Puts each pill, in the order given, on the first of the eight sides of its dot where it covers no pill
     * already placed, no named dot and no obstacle, and stays inside what is visible; where no side is free, on
     * the one that covers least. Dots without a name count for a quarter: better over one of them than over a
     * name. A pill placed early may stand in the only room a later one had, so those that cover something look
     * once more among all the others.
     */
    fun placePills(
        requests: List<ScooterPillRequest>,
        avoiding: List<ScreenRect> = emptyList(),
        sparing: List<ScreenRect> = emptyList(),
        inside: ScreenRect? = null,
    ): List<ScooterPillPlacement> {
        val fixed = requests.map { request ->
            ScreenRect(request.anchor.x, request.anchor.y, 0.0, 0.0).insetBy(1 - request.reach, 1 - request.reach)
        } + avoiding
        val sides = requests.map { it.preferred }.toMutableList()
        val boxes = MutableList<ScreenRect?>(requests.size) { null }

        fun box(index: Int, side: ScooterPillSide): ScreenRect? {
            val request = requests[index]
            val origin = pillOrigin(side, request.width, request.reach)
            return ScreenRect(request.anchor.x + origin.x, request.anchor.y + origin.y, request.width, pillHeight)
                .insetBy(-3.0, -3.0)
        }

        fun cost(index: Int, box: ScreenRect?): Double {
            var cost = fixed.fold(0.0) { sum, rect -> sum + area(common(rect, box)) }
            for ((other, otherBox) in boxes.withIndex()) {
                if (other == index) continue
                cost += if (otherBox != null) area(common(otherBox, box)) else 0.0
            }
            cost += sparing.fold(0.0) { sum, rect -> sum + area(common(rect, box)) } / 4
            if (inside != null) {
                cost += area(box) - area(common(inside, box))
            }
            return cost
        }

        fun settle(index: Int) {
            val order = ScooterPillSide.entries.toMutableList()
            // The side it is on comes first; the others keep their order behind it.
            val placed = sides[index]
            if (placed != null) {
                val position = order.indexOf(placed)
                if (position >= 0) order.add(0, order.removeAt(position))
            }
            var best: PillOption? = null
            var current: PillOption? = null
            for (side in order) {
                val candidate = box(index, side)
                val candidateCost = cost(index, candidate)
                if (side == sides[index]) {
                    current = PillOption(side, candidate, candidateCost)
                }
                if (best == null || candidateCost < best.cost) {
                    best = PillOption(side, candidate, candidateCost)
                }
                if (candidateCost <= 0) break
            }
            // Among sides that all cover something, a name does not hop for a small gain while the map moves
            // under it.
            val found = best!!
            if (current != null && found.cost > 0 && current.cost - found.cost < area(current.box) / 10) {
                best = current
            }
            sides[index] = best.side
            boxes[index] = best.box
        }

        for (index in requests.indices) {
            settle(index)
        }
        for (round in 1..2) {
            var moved = false
            for (index in requests.indices) {
                val side = sides[index] ?: continue
                val place = boxes[index] ?: continue
                if (!(cost(index, place) > 0)) continue
                settle(index)
                moved = moved || sides[index] != side
            }
            if (!moved) break
        }

        return requests.indices.map { index ->
            val request = requests[index]
            val side = sides[index]!!
            ScooterPillPlacement(request.id, side, pillOrigin(side, request.width, request.reach))
        }
    }

    /** Whether a pill shows enough of itself: at least two thirds inside what is visible and clear of what floats over the map. */
    fun pillCanBeRead(frame: ScreenRect, inside: ScreenRect, under: List<ScreenRect>): Boolean {
        val hidden = area(frame) - area(inside.intersection(frame)) +
            under.fold(0.0) { sum, chrome -> sum + area(common(chrome.intersection(inside), frame)) }
        return hidden * 3 <= area(frame)
    }

    /**
     * The names to leave out of those placed, the first of them counting most: one cut by the edge of the map
     * or by what floats over it, and one lying on a name that stays. Where there is no room, a name less is
     * better than two that cannot be read.
     */
    fun unreadablePills(pills: List<Pair<String, ScreenRect>>, inside: ScreenRect, under: List<ScreenRect>): Set<String> {
        val unreadable = LinkedHashSet<String>()
        val shown = mutableListOf<ScreenRect>()
        for ((id, frame) in pills) {
            val covered = shown.fold(0.0) { sum, rect -> sum + area(rect.intersection(frame)) }
            if (pillCanBeRead(frame, inside, under) && covered * 10 <= area(frame)) {
                shown += frame
            } else {
                unreadable += id
            }
        }
        return unreadable
    }

    private fun common(first: ScreenRect?, second: ScreenRect?): ScreenRect? =
        if (first == null || second == null) null else first.intersection(second)

    private fun area(rect: ScreenRect?): Double =
        if (rect == null || rect.isEmpty) 0.0 else abs(rect.width) * abs(rect.height)

    // Colours

    /** The lab's ground under the dots, for the ring that parts a dot from its neighbours. */
    const val darkGround: Long = 0xFF0B0E14
    const val selectionRing: Long = 0xFF0A84FF
    private const val nearBlackInk: Long = 0xFF10131A
    private const val nearBlackOnDark: Long = 0xFFF2F2F7
    private val nearBlack: Set<ScooterProvider> = setOf(ScooterProvider.Bird, ScooterProvider.Swing)

    /** The system's grey, the same on a light and on a dark map. */
    const val systemGray: Long = 0xFF8E8E93
    const val white: Long = 0xFFFFFFFF

    /**
     * The provider's colour. Bird's and Swing's near black cannot be seen on a dark map or on a satellite
     * picture: there it is drawn almost white.
     */
    fun dotColor(provider: ScooterProvider?, isDark: Boolean): Long {
        if (provider == null) return systemGray
        return if (provider in nearBlack && isDark) nearBlackOnDark else provider.color
    }

    /**
     * The colour of what is written on the provider's colour: the initials on a dot or on the card's tile, and
     * the name on a filled pill. White, as on the badge of an app; dark only on Bird's and Swing's near white of
     * a dark map.
     */
    fun ink(on: ScooterProvider?, isDark: Boolean): Long =
        if (on != null && on in nearBlack && isDark) nearBlackInk else white

    fun contrastRatio(between: Long, and: Long): Double {
        val firstLuminance = relativeLuminance(between)
        val secondLuminance = relativeLuminance(and)
        return (max(firstLuminance, secondLuminance) + 0.05) / (min(firstLuminance, secondLuminance) + 0.05)
    }

    private fun relativeLuminance(color: Long): Double {
        fun linearized(component: Long): Double {
            val value = component / 255.0
            return if (value <= 0.04045) value / 12.92 else ((value + 0.055) / 1.055).pow(2.4)
        }

        return 0.2126 * linearized(color shr 16 and 0xFF) +
            0.7152 * linearized(color shr 8 and 0xFF) +
            0.0722 * linearized(color and 0xFF)
    }
}

/** The name where there is little room, on a pill beside a dot or in the dock's lead: "PubliBike", not "PubliBike / Velospot". */
val ScooterProvider.briefName: String get() = displayName.split(" / ").first()

/** The head of the dock while the rider or the searched place is on the map: the nearest scooter the map shows. */
data class ScooterDockLead(val scooter: Scooter, val metres: Double) {
    val minutes: Int get() = ScooterMapLook.walkingMinutes(metres)
    val distance: String get() = distance(ScooterLanguage.current.locale)
    val providerName: String get() = scooter.providerInfo?.displayName ?: scooter.provider.capitalized
    val briefProviderName: String get() = scooter.providerInfo?.briefName ?: scooter.provider.capitalized

    /** "Voi, 1 min on foot". */
    val detail: String
        get() = stringFormat(localized("%1\$@, %2\$lld min on foot"), briefProviderName, minutes.toLong())

    val accessibilityLabel: String get() = accessibilityLabel(ScooterLanguage.current.locale)

    /** "62 m" where the region measures in metres, "200 ft" where it measures in miles. */
    fun distance(locale: Locale): String = Scooter.formattedLength(metres, locale)

    fun accessibilityLabel(locale: Locale): String = stringFormat(
        localized("Nearest scooter: %1\$@, %2\$@ away, %3\$lld min on foot. Show details."),
        providerName,
        distance(locale),
        minutes.toLong(),
    )

    companion object {
        /**
         * The nearest of the scooters in view, the ones the count and the chips are of: one just off the map
         * may be nearer, but the dock speaks of what it shows. None while the place walked from is off the map,
         * nor while scooters are counted in groups; the dock then counts them.
         */
        fun nearest(of: List<Scooter>, from: GeoPoint?, viewport: GeoBounds, grouped: Boolean): ScooterDockLead? {
            if (from == null || grouped || !viewport.contains(from)) return null
            var nearest: ScooterDockLead? = null
            for (scooter in of) {
                if (!viewport.contains(scooter.latitude, scooter.longitude)) continue
                val metres = scooter.distance(from)
                if (!metres.isFinite()) continue
                val current = nearest
                if (current != null &&
                    (current.metres < metres || (current.metres == metres && current.scooter.id < scooter.id))
                ) {
                    continue
                }
                nearest = ScooterDockLead(scooter, metres)
            }
            return nearest
        }
    }
}

/** One of the three figures of the scooter card: "1 min" over "on foot". */
data class ScooterCardFigure(
    val kind: Kind,
    val value: String,
    val unit: String?,
    val label: String,
) {
    enum class Kind {
        Walk,
        Distance,
        Price,
        Battery,
        Range,
    }

    val id: Kind get() = kind
}

/** What the scooter card says under its name: up to three figures, the facts the figures leave out, and how the price is made up. */
data class ScooterCardContent private constructor(
    val figures: List<ScooterCardFigure>,
    /** "80% battery, 50 km range": what is known and not among the figures. */
    val facts: String?,
    /** "CHF 1.00 to unlock, then CHF 0.42 a minute", and "+ tax" where tax is added. */
    val note: String,
    /** "Night ban in Oslo: you can rent it from 05:00", while the ban holds. */
    val curfew: String?,
) {
    companion object {
        /**
         * With an origin the figures are the walk, the distance and the price of a ride; without a price the
         * battery takes its cell, or else the range. Without an origin they are what is known of battery, range
         * and price. Lengths are written as the locale's region measures them.
         */
        operator fun invoke(
            scooter: Scooter,
            metres: Double?,
            placeTitle: String? = null,
            quote: RidePriceQuote?,
            curfew: RentalCurfew.Active? = null,
            locale: Locale = ScooterLanguage.current.locale,
        ): ScooterCardContent {
            val curfewLine = curfew?.let {
                stringFormat(
                    localized("Night ban in %1\$@: you can rent it from %2\$@"),
                    it.city,
                    ScooterDockStatus.clockTime(it.until, it.timeZone),
                )
            }
            val providerName = scooter.providerInfo?.displayName ?: scooter.provider.capitalized
            val price = quote?.let {
                ScooterCardFigure(
                    kind = ScooterCardFigure.Kind.Price,
                    value = RidePriceFormatter.amount(it.totalMinorUnits, it.currency),
                    unit = null,
                    label = stringFormat(localized("%1\$@, %2\$lld min"), it.currency.uppercase(), it.durationMinutes.toLong()),
                )
            }
            val battery = scooter.battery?.let {
                ScooterCardFigure(ScooterCardFigure.Kind.Battery, value = "$it", unit = "%", label = localized("battery"))
            }
            val range = scooter.rangeMeters?.let {
                val (value, unit) = Scooter.lengthParts(it.toDouble(), locale)
                ScooterCardFigure(ScooterCardFigure.Kind.Range, value, unit, label = localized("range"))
            }

            val figures = if (metres != null && metres.isFinite()) {
                val (value, unit) = Scooter.lengthParts(metres, locale)
                listOfNotNull(
                    ScooterCardFigure(
                        ScooterCardFigure.Kind.Walk,
                        value = "${ScooterMapLook.walkingMinutes(metres)}",
                        unit = localized("min"),
                        label = placeTitle?.let { stringFormat(localized("from %@"), it.isolated) } ?: localized("on foot"),
                    ),
                    ScooterCardFigure(ScooterCardFigure.Kind.Distance, value, unit, label = localized("away")),
                    price ?: battery ?: range,
                )
            } else {
                listOfNotNull(battery, range, price)
            }

            val shown = figures.map { it.kind }.toSet()
            val leftBattery = if (ScooterCardFigure.Kind.Battery in shown) null else scooter.battery
            val leftRange = if (ScooterCardFigure.Kind.Range in shown) {
                null
            } else {
                scooter.rangeMeters?.let { Scooter.formattedLength(it.toDouble(), locale) }
            }
            val facts = when {
                leftBattery != null && leftRange != null ->
                    stringFormat(localized("%1\$lld%% battery, %2\$@ range"), leftBattery.toLong(), leftRange)
                leftBattery != null -> stringFormat(localized("%lld%% battery"), leftBattery.toLong())
                leftRange != null -> stringFormat(localized("%@ range"), leftRange)
                else -> null
            }

            val pricing = scooter.pricing
                ?: return ScooterCardContent(figures, facts, stringFormat(localized("Price shown in the %@ app"), providerName), curfewLine)
            val minute = RidePriceFormatter.string(pricing.minuteFeeMinorUnits, pricing.currency)
            // Where the operator gives a range a minute, its lowest, "from".
            val tariff = pricing.listed(
                pricing.taxed(
                    if (pricing.unlockFeeMinorUnits > 0) {
                        stringFormat(
                            if (pricing.minuteFeeFrom) {
                                localized("%1\$@ to unlock, then from %2\$@ a minute")
                            } else {
                                localized("%1\$@ to unlock, then %2\$@ a minute")
                            },
                            RidePriceFormatter.string(pricing.unlockFeeMinorUnits, pricing.currency),
                            minute,
                        )
                    } else {
                        stringFormat(
                            if (pricing.minuteFeeFrom) localized("No unlock fee, from %@ a minute") else localized("No unlock fee, %@ a minute"),
                            minute,
                        )
                    },
                ),
            )
            val note = if (quote?.passApplied == true) {
                stringFormat(localized("%1\$@ · %2\$@"), tariff, localized("Pass applied"))
            } else {
                tariff
            }
            return ScooterCardContent(figures, facts, note, curfewLine)
        }
    }
}
