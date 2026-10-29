package com.plhery.scootradar.app

import android.app.Application
import com.plhery.scootradar.core.model.ScooterCatalog
import kotlin.concurrent.thread

/**
 * The app: it makes the [AppContainer] and sets :core's hooks before any screen shows, and reads the catalog's
 * megabyte meanwhile, which the first screen would otherwise read on the main thread.
 */
class ScooterApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        thread(name = "Catalog") { ScooterCatalog.Generated.load() }
        container = AppContainer(this)
        container.setHooks()
    }
}
