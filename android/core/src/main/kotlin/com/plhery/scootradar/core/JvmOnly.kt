package com.plhery.scootradar.core

/**
 * Code that runs on the JVM only, in :core's tests: it calls Java APIs Android lacks, so the API check
 * against Android 12 (animal sniffer, core/build.gradle.kts) leaves it out. Each is a default the app
 * replaces with Android's own as it starts, before anything reads it.
 */
@Retention(AnnotationRetention.BINARY)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS, AnnotationTarget.CONSTRUCTOR)
annotation class JvmOnly
