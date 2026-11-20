package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.distance

/**
 * The scooters of its app seen beside the scooter a card or a walk follows, for as long as it follows it, as the
 * website and the iPhone keep them. A scooter followed that the data no longer lists may be listed under a new id:
 * the cache gives new ones after a gap or a restart, Bird, Spin and Pony on every read. One of its app standing where
 * it stood, under an id the answer before didn't list, is then that scooter. But a neighbour the answer before didn't
 * list either, as it stood faded, or the map showed groups or another place, or it too got a new id, is not: so each
 * one seen within [radius] of the scooter followed, live or faded, in any answer, is remembered where it last stood
 * within it, and a scooter standing as near to one of those places as to where the scooter followed stood is that
 * neighbour, unless their batteries tell them apart (Desk [373] S-2). One seen further away keeps the place it was
 * last seen at within it, as the iPhone's does (Desk [372]).
 */
internal class ScooterNeighbours {
    /** The ids the scooter followed has had: never a neighbour's, as when it stands faded under an earlier one. */
    private val followedIDs = mutableSetOf<String>()

    /** Where each neighbour was seen last, by id. */
    private val positions = mutableMapOf<String, GeoPoint>()

    /** Each neighbour's battery where it was seen last, by id, for those that report one. */
    private val batteries = mutableMapOf<String, Int>()

    /** The ids of the neighbours remembered, for tests. */
    internal val rememberedIDs: Set<String> get() = positions.keys.toSet()

    /** The batteries remembered, by id, for tests: always of neighbours whose place is. */
    internal val rememberedBatteries: Map<String, Int> get() = batteries.toMap()

    /** The card closed, or another scooter was chosen. */
    fun forget() {
        followedIDs.clear()
        positions.clear()
        batteries.clear()
    }

    /**
     * Notes where the scooters of [followed]'s app among [seen], other than it, stand within [radius] of it; one
     * remembered that stands further keeps where it stood within it. The [capacity] nearest to it are kept.
     */
    fun note(followed: Scooter, seen: List<Scooter>) {
        followedIDs += followed.id
        positions -= followed.id
        batteries -= followed.id
        val point = followed.coordinate
        for (scooter in seen) {
            if (scooter.provider != followed.provider || scooter.id in followedIDs) continue
            if (scooter.distance(from = point) > radius) continue
            positions[scooter.id] = scooter.coordinate
            val battery = scooter.battery
            if (battery != null) batteries[scooter.id] = battery else batteries -= scooter.id
        }
        if (positions.size <= capacity) return
        val farthest = positions.entries.sortedBy { it.value.distance(to = point) }.drop(capacity).map { it.key }.toSet()
        positions -= farthest
        batteries -= farthest
    }

    /**
     * [candidate], under an id the answer before didn't list, may be [followed] under a new one: it stands nearer to
     * where [followed] stood than to where any neighbour was seen. One as near a neighbour's place, or nearer, is that
     * neighbour renamed, unless the batteries tell them apart: the candidate's is [followed]'s as last seen, and that
     * neighbour's another. So of two scooters at the same spot, renamed on every read, as two Ponys in Liège, the one
     * followed is told from the other where their batteries differ, as on the website (47a39273) and the iPhone
     * (fd21126e). A battery unknown, the same, or moved a point between reads refuses it, as before. A neighbour under
     * its own id is that neighbour, wherever it stands: one 9 m on, standing faded 6 m nearer once the scooter followed
     * left the data, was 3 m from where it stood and taken for it, and kept the walk from ever saying it was taken, as
     * the website's matcher (mayBeRenamed) never did.
     */
    fun mayBe(followed: Scooter, candidate: Scooter): Boolean {
        if (candidate.id in positions) return false
        val distance = candidate.distance(from = followed.coordinate)
        val hasItsBattery = candidate.battery != null && candidate.battery == followed.battery
        return positions.all { (id, spot) ->
            val neighbourDistance = candidate.distance(from = spot)
            neighbourDistance > distance ||
                (distance - neighbourDistance <= 3.0 && hasItsBattery && batteries[id].let { it != null && it != candidate.battery })
        }
    }

    companion object {
        /** The scooters of its app within this of the scooter followed, in metres, are its neighbours. */
        const val radius = 30.0

        /** The neighbours remembered at most, the nearest. */
        const val capacity = 50
    }
}
