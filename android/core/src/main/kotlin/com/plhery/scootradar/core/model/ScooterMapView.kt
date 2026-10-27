package com.plhery.scootradar.core.model

import java.util.Locale

// ScooterMapScalePolicy from ios/ScootRadar/Views/ScooterMapView.swift; the rest of that file is the map view.

object ScooterMapScalePolicy {
    fun showsScale(locale: Locale): Boolean = locale.measurementSystem != ScooterMeasurementSystem.Metric
}
