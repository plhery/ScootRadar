import AppKit
import ApplicationServices
import CoreGraphics

// No arbitrary app, PID, coordinates, keys or UI actions. This helper only
// minimizes Ryde, briefly activates it while idle, and restores prior focus.
// It never synthesizes keyboard/mouse input or operates ride/payment controls.
let bundleID = "com.ryde.NewRyde"
let base = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".local/share/scootradar/ryde-bridge/producer")
let idleThreshold = 15.0
var finish: (() -> [String: Any])?
var replyID: String?
func output(_ value: [String: Any], code: Int32 = 0) -> Never {
    var result = value
    if let cleanup = finish { result.merge(cleanup(), uniquingKeysWith: { _, new in new }) }
    if let id = replyID {
        let directory = base.appendingPathComponent("map-control-results")
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
            let path = directory.appendingPathComponent(id + ".json")
            try JSONSerialization.data(withJSONObject: result).write(to: path, options: .atomic)
            try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: path.path)
        } catch { exit(5) }
    }
    print(String(data: try! JSONSerialization.data(withJSONObject: result, options: [.sortedKeys]), encoding: .utf8)!)
    exit(code)
}
func attribute(_ element: AXUIElement, _ name: String) -> CFTypeRef? {
    var result: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, name as CFString, &result) == .success else { return nil }
    return result
}
func text(_ element: AXUIElement, _ name: String) -> String { attribute(element, name) as? String ?? "" }
func findMap(_ root: AXUIElement) -> Bool {
    var pending = [root], budget = 100
    let until = Date().addingTimeInterval(0.8)
    while let element = pending.popLast(), budget > 0, Date() < until {
        budget -= 1
        if text(element, kAXRoleAttribute) == kAXImageRole && text(element, kAXDescriptionAttribute) == "Map" { return true }
        pending += attribute(element, kAXChildrenAttribute) as? [AXUIElement] ?? []
    }
    return false
}
func locked() -> Bool {
    let session = CGSessionCopyCurrentDictionary() as? [String: Any]
    return session == nil || session?["CGSSessionScreenIsLocked"] as? Bool == true
}
func idleSeconds() -> Double {
    CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: CGEventType(rawValue: UInt32.max)!)
}
func idle() -> Bool {
    let held = CGEventSource.flagsState(.combinedSessionState).intersection([.maskShift, .maskControl, .maskAlternate, .maskCommand, .maskSecondaryFn])
    return idleSeconds() >= idleThreshold && held.isEmpty &&
        !CGEventSource.buttonState(.combinedSessionState, button: .left) &&
        !CGEventSource.buttonState(.combinedSessionState, button: .right)
}
let args = Array(CommandLine.arguments.dropFirst())
let userLaunch = args.isEmpty || args.allSatisfy { $0.hasPrefix("-psn_") }
var action = userLaunch ? "pause" : args.first!
if action == "run" {
    // LaunchServices gives this signed app its own approved permission identity.
    // The nonce binds this launch to one short-lived, fixed-scope worker command.
    guard args.count == 2, args[1].range(of: "^[a-f0-9]{32}$", options: .regularExpression) != nil,
          let bytes = try? Data(contentsOf: base.appendingPathComponent("map-control-request.json")),
          let request = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any],
          Set(request.keys) == Set(["id", "action", "expiresAt"]), request["id"] as? String == args[1],
          let command = request["action"] as? String, ["status", "refresh", "prepare"].contains(command),
          let expires = request["expiresAt"] as? Double,
          expires > Date().timeIntervalSince1970, expires <= Date().timeIntervalSince1970 + 15 else {
        output(["error": "invalid-or-expired-command"], code: 2)
    }
    replyID = args[1]; action = command
    _ = NSApplication.shared
} else if !(userLaunch || args.count == 1) || !["status", "refresh", "prepare", "pause", "show", "request-access"].contains(action) {
    output(["error": "unsupported-command"], code: 2)
}
if action == "pause" {
    let path = base.appendingPathComponent("warm-control.json")
    var value = (try? Data(contentsOf: path)).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] } ?? [:]
    value["pausedUntil"] = Date().timeIntervalSince1970 + 300
    do {
        try JSONSerialization.data(withJSONObject: value).write(to: path, options: .atomic)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: path.path)
    } catch { output(["error": "pause-unavailable"], code: 4) }
    if userLaunch {
        _ = NSApplication.shared
        let alert = NSAlert()
        alert.messageText = "Fast Ryde refresh paused for 5 minutes"
        alert.informativeText = "The bridge will use normal background restarts. Fast refresh resumes automatically."
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
    output(["pausedSeconds": 300])
}
if action == "request-access" {
    // Operator only. The worker never requests or grants permissions.
    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
    output(["trusted": AXIsProcessTrustedWithOptions(options)])
}
let apps = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
let trusted = AXIsProcessTrusted()
if action == "status" {
    output(["trusted": trusted, "singleInstance": apps.count == 1, "locked": locked(),
            "idleEligible": idle(), "idleSeconds": idleSeconds(), "minimizedRefresh": true])
}
guard trusted else { output(["error": "permission-required"], code: 3) }
guard !locked(), apps.count == 1, let app = apps.first, !app.isTerminated else {
    output(["error": "app-unavailable"], code: 4)
}
if action == "refresh" && !idle() { output(["error": "desktop-busy"], code: 4) }
let application = AXUIElementCreateApplication(app.processIdentifier)
AXUIElementSetMessagingTimeout(application, 0.5)
let windows = attribute(application, kAXWindowsAttribute) as? [AXUIElement] ?? []
guard let window = windows.first(where: { text($0, kAXIdentifierAttribute) == "SceneWindow" }) else {
    output(["error": "window-unavailable"], code: 4)
}
if action == "show" {
    _ = AXUIElementSetAttributeValue(window, kAXMinimizedAttribute as CFString, kCFBooleanFalse)
    _ = app.unhide()
    _ = app.activate(options: [])
    output(["shown": true])
}
guard (attribute(window, "AXSheets") as? [AXUIElement] ?? []).isEmpty, findMap(window),
      AXUIElementSetAttributeValue(window, kAXMinimizedAttribute as CFString, kCFBooleanTrue) == .success else {
    output(["error": "home-map-or-minimize-unavailable"], code: 4)
}
let originalApp = NSWorkspace.shared.frontmostApplication
let originalPID = originalApp?.processIdentifier
let cursor = CGEvent(source: nil)?.location
finish = {
    // A user-selected new app wins over restoring our original app.
    if NSWorkspace.shared.frontmostApplication?.processIdentifier == app.processIdentifier && originalPID != app.processIdentifier {
        _ = originalApp?.activate(options: [])
        RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    }
    let minimized = attribute(window, kAXMinimizedAttribute) as? Bool == true
    if !minimized { _ = app.hide() }
    return ["focusRestored": NSWorkspace.shared.frontmostApplication?.processIdentifier == originalPID,
            "cursorPreserved": CGEvent(source: nil)?.location == cursor,
            "stayedMinimized": minimized, "userInterrupted": !idle()]
}
// Unhiding a minimized window wakes the scene without displaying its contents.
// Keeping it unhidden also avoids hard suspension after each completed read.
_ = app.unhide()
RunLoop.current.run(until: Date().addingTimeInterval(0.1))
guard attribute(window, kAXMinimizedAttribute) as? Bool == true else {
    output(["error": "unsafe-window"], code: 4)
}
if action == "prepare" { output(["prepared": true, "pid": app.processIdentifier]) }
guard idle(), originalPID != nil else { output(["error": "desktop-busy"], code: 4) }
let began = Date().timeIntervalSince1970
_ = app.activate(options: [])
RunLoop.current.run(until: Date().addingTimeInterval(0.1))
guard idle(), app.isActive, attribute(window, kAXMinimizedAttribute) as? Bool == true else {
    output(["error": "activation-unavailable-or-desktop-busy"], code: 4)
}
// Restore focus as soon as the proxy has a complete response, with a short cap.
// The worker still waits for the exact job result and owns restart fallback.
var resultPath: URL?
if let bytes = try? Data(contentsOf: base.appendingPathComponent("job.json")),
   let job = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any],
   let id = job["id"] as? String, id.range(of: "^[a-f0-9]{32}$", options: .regularExpression) != nil {
    resultPath = base.appendingPathComponent("results/" + id + ".json")
}
let until = Date().addingTimeInterval(2)
while Date() < until && idle() {
    if let path = resultPath, FileManager.default.fileExists(atPath: path.path) { break }
    RunLoop.current.run(until: Date().addingTimeInterval(0.05))
}
output(["dispatched": true, "trigger": "minimized-activation", "at": began, "pid": app.processIdentifier])
