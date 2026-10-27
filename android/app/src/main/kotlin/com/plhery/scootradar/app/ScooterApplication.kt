package com.plhery.scootradar.app

import android.app.Application

/** The app: it makes the [AppContainer] and sets :core's hooks before any screen shows. */
class ScooterApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        container.setHooks()
    }
}
