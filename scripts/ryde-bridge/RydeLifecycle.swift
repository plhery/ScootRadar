import AppKit
import CoreGraphics
// Deliberately restricted: no arbitrary app, AppleScript, accessibility or input events.
let args = CommandLine.arguments
let bundleID = "com.ryde.NewRyde"
// Why a command failed, for the worker's log and status: the exit code alone hid launchd's refusal
// of 17 November 2026 ("Operation already in progress"), found only in the unified log.
func fail(_ code: Int32, _ why: String) -> Never {
    FileHandle.standardError.write((why + "\n").data(using: .utf8)!)
    exit(code)
}
func describe(_ error: Error) -> String {
    var parts: [String] = []
    var current: NSError? = error as NSError
    while let e = current, parts.count < 4 {
        parts.append("\(e.domain) \(e.code): \(e.localizedFailureReason ?? e.localizedDescription)")
        current = e.userInfo[NSUnderlyingErrorKey] as? NSError
    }
    return parts.joined(separator: " <- ")
}
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
    let wakeAt = Date().addingTimeInterval(0.5)
    var woke = false
    while apps.contains(where: { !$0.isTerminated }) && Date() < deadline {
        if !woke && Date() >= wakeAt {
            // A hidden iPhone-on-Mac process can be suspended and ignore quit.
            // Unhide without activation to let its queued termination run.
            for app in apps where !app.isTerminated { _ = app.unhide() }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
            for app in apps where !app.isTerminated { _ = app.terminate() }
            woke = true
        }
        RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    }
    if apps.contains(where: { !$0.isTerminated }) { fail(1, "Ryde did not quit within 10 seconds") }
} else if args.count == 2 && args[1] == "force-quit" {
    // Worker only uses this after graceful quit fails and the scoped proxy
    // acknowledges no live native map or unresolved key renewal.
    for app in apps { _ = app.forceTerminate() }
    let deadline = Date().addingTimeInterval(3)
    while apps.contains(where: { !$0.isTerminated }) && Date() < deadline {
        RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    }
    if apps.contains(where: { !$0.isTerminated }) { fail(1, "Ryde did not stop within 3 seconds of a forced quit") }
} else if args.count == 3 && args[1] == "open" {
    let url = URL(fileURLWithPath: args[2])
    guard let bundle = Bundle(url: url), bundle.bundleIdentifier == bundleID else { fail(2, "Not the Ryde app: \(url.path)") }
    let config = NSWorkspace.OpenConfiguration()
    config.activates = false
    config.hides = true
    NSWorkspace.shared.openApplication(at: url, configuration: config) { app, error in
        if let error = error { fail(1, describe(error)) }
        exit(0)
    }
    RunLoop.main.run()
} else { exit(2) }
