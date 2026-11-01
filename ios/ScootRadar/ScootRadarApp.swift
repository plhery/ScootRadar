import SwiftUI

@main
struct ScootRadarApp: App {
    init() {
        // Earlier versions asked for scooters through the shared session, whose
        // cache kept the map bounds of each request on disk. Nothing uses it now.
        URLCache.shared.removeAllCachedResponses()
        // The cities' zones built in are read from a file in the app when first drawn: read them now, aside,
        // so that zooming in soon after launch doesn't wait on them.
        Task.detached(priority: .utility) { _ = CityRuleZone.onMap }
    }

    var body: some Scene {
        WindowGroup {
            ScooterMapScreen()
                .tint(.blue)
        }
        .commands { ScooterCommands() }
    }
}
