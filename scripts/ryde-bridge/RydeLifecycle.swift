import AppKit
import CoreGraphics
// Deliberately restricted: no arbitrary app, AppleScript, accessibility or input events.
let args = CommandLine.arguments
let bundleID = "com.ryde.NewRyde"
let apps = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
if args.count == 2 && args[1] == "status" {
    let session = CGSessionCopyCurrentDictionary() as? [String: Any]
    let status: [String: Any] = ["locked": session?["CGSSessionScreenIsLocked"] as? Bool ?? false,
        "pids": apps.map { Int($0.processIdentifier) }, "hidden": apps.map { $0.isHidden }]
    let data = try! JSONSerialization.data(withJSONObject: status, options: [.sortedKeys])
    print(String(data: data, encoding: .utf8)!)
} else if args.count == 2 && args[1] == "quit" {
    for app in apps { _ = app.terminate() }
    let deadline = Date().addingTimeInterval(10)
    while apps.contains(where: { !$0.isTerminated }) && Date() < deadline {
        RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    }
    if apps.contains(where: { !$0.isTerminated }) { exit(1) }
} else if args.count == 3 && args[1] == "open" {
    let url = URL(fileURLWithPath: args[2])
    guard let bundle = Bundle(url: url), bundle.bundleIdentifier == bundleID else { exit(2) }
    let config = NSWorkspace.OpenConfiguration()
    config.activates = false
    config.hides = true
    NSWorkspace.shared.openApplication(at: url, configuration: config) { app, error in
        exit(error == nil ? 0 : 1)
    }
    RunLoop.main.run()
} else { exit(2) }
