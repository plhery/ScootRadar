package com.plhery.scootradar.core.model

// ScooterDockLead from ios/ScootRadar/Models/ScooterMapLook.swift, as the dock's summary holds it; the rest of
// that file is not here yet.

/** The nearest scooter in view, and how far it is in metres. */
data class ScooterDockLead(val scooter: Scooter, val metres: Double)
