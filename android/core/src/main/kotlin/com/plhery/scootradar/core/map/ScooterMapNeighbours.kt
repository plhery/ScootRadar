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
 * one seen within [radius] of the scooter followed, live or faded, in any answer, is remembered where it last stood,
 * and a scooter standing as near to one of those places as to where the scooter followed stood is that neighbour.
 */
internal class ScooterNeighbours {
    /** The ids the scooter followed has had: never a neighbour's, as when it stands faded under an earlier one. */
    private val followedIDs = mutableSetOf<String>()

    /** Where each neighbour was seen last, by id. */
    private val positions = mutableMapOf<String, GeoPoint>()

    /** The card closed, or another scooter was chosen. */
    fun forget() {
        followedIDs.clear()
        positions.clear()
    }

    /**
     * Notes where the scooters of [followed]'s app among [seen], other than it, stand: those within [radius] of it,
     * and wherever they are those already remembered. The [capacity] nearest to it are kept.
     */
    fun note(followed: Scooter, seen: List<Scooter>) {
        followedIDs += followed.id
        positions -= followed.id
        val point = followed.coordinate
        for (scooter in seen) {
            if (scooter.provider != followed.provider || scooter.id in followedIDs) continue
            if (scooter.id in positions || scooter.distance(from = point) <= radius) positions[scooter.id] = scooter.coordinate
        }
        if (positions.size <= capacity) return
        val farthest = positions.entries.sortedBy { it.value.distance(to = point) }.drop(capacity).map { it.key }
        positions -= farthest.toSet()
    }

    /**
     * [candidate], under an id the answer before didn't list, may be [followed] under a new one: it stands nearer to
     * where [followed] stood than to where any neighbour was seen.
     */
    fun mayBe(followed: Scooter, candidate: Scooter): Boolean {
        val distance = candidate.distance(from = followed.coordinate)
        return positions.values.all { candidate.distance(from = it) > distance }
    }

    companion object {
        /** The scooters of its app within this of the scooter followed, in metres, are its neighbours. */
        const val radius = 30.0

        /** The neighbours remembered at most, the nearest. */
        const val capacity = 50
    }
}
