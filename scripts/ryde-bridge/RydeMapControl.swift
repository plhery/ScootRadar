import AppKit
import ApplicationServices
import CoreGraphics

// No arbitrary app, PID, coordinates, keys or UI actions. This helper only
// minimizes Ryde, briefly activates it while idle, and restores prior focus.
// It never synthesizes keyboard/mouse input or operates ride/payment controls.
let bundleID = "com.ryde.NewRyde"
let base = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".local/share/scootradar/ryde-bridge/producer")
let idleThreshold = 15.0
let workerCommands = ["status", "refresh", "prepare"]
// How long a minimize may take to show in the window's state: it is animated, slower on a loaded Mac, and a
// hidden app's window minimizes only once the app is shown. Until 27 November 2026 the state was read 0.1 s
// after asking, which failed after nearly every cold open (unsafe-window), and the failure's cleanup then
// hid Ryde mid-minimize, so the next read failed the same way: 79 of 114 answers in an hour.
let minimizeWait = 3.0

struct Reply {
    var value: [String: Any]
    var code: Int32 = 0
}
func attribute(_ element: AXUIElement, _ name: String) -> CFTypeRef? {
    var result: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, name as CFString, &result) == .success else { return nil }
    return result
}
func text(_ element: AXUIElement, _ name: String) -> String { attribute(element, name) as? String ?? "" }
func minimized(_ window: AXUIElement) -> Bool { attribute(window, kAXMinimizedAttribute) as? Bool == true }
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
func wait(_ seconds: Double, until condition: () -> Bool) -> Bool {
    let deadline = Date().addingTimeInterval(seconds)
    while !condition() {
        if Date() >= deadline { return false }
        RunLoop.current.run(until: Date().addingTimeInterval(0.05))
    }
    return true
}

func execute(_ action: String) -> Reply {
    let apps = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
    let trusted = AXIsProcessTrusted()
    if action == "status" {
        return Reply(value: ["trusted": trusted, "singleInstance": apps.count == 1, "locked": locked(),
                             "idleEligible": idle(), "idleSeconds": idleSeconds(), "minimizedRefresh": true])
    }
    guard trusted else { return Reply(value: ["error": "permission-required"], code: 3) }
    guard !locked(), apps.count == 1, let app = apps.first, !app.isTerminated else {
        return Reply(value: ["error": "app-unavailable"], code: 4)
    }
    if action == "refresh" && !idle() { return Reply(value: ["error": "desktop-busy"], code: 4) }
    let application = AXUIElementCreateApplication(app.processIdentifier)
    AXUIElementSetMessagingTimeout(application, 0.5)
    // Every other element (the window, its sheets, the map) waits this long, not the default 6 seconds, so a
    // busy Ryde cannot hold a command past the worker's wait for its answer (MAP_CONTROL_REPLY).
    AXUIElementSetMessagingTimeout(AXUIElementCreateSystemWide(), 1.0)
    let originalApp = NSWorkspace.shared.frontmostApplication
    let originalPID = originalApp?.processIdentifier
    let cursor = CGEvent(source: nil)?.location
    var found: AXUIElement?, listed = AXError.success, count = 0
    func lookUp(_ seconds: Double) -> Bool {
        wait(seconds) {
            var value: CFTypeRef?
            listed = AXUIElementCopyAttributeValue(application, kAXWindowsAttribute as CFString, &value)
            let windows = value as? [AXUIElement] ?? []
            count = windows.count
            found = windows.first(where: { text($0, kAXIdentifierAttribute) == "SceneWindow" })
            return found != nil
        }
    }
    // About a minute after each open macOS suspends Ryde a few seconds after a read gives focus back, and a
    // suspended Ryde answers no accessibility call (kAXErrorCannotComplete): on 27 November 2026 that sent a
    // warm read a minute back to a cold one. Activation, the refresh's own trigger, resumes it; its window is
    // still minimized from the last read, and finish restores focus as for any refresh.
    var woke = false
    if !lookUp(1.0) && action == "refresh" && listed == .cannotComplete && idle() && originalPID != nil &&
        originalPID != app.processIdentifier {
        woke = app.activate(options: [])
        if woke { _ = lookUp(1.5) }
    }
    func declined(_ value: [String: Any]) -> Reply {
        if woke && NSWorkspace.shared.frontmostApplication?.processIdentifier == app.processIdentifier {
            _ = originalApp?.activate(options: [])
        }
        return Reply(value: value.merging(woke ? ["woke": true] : [:], uniquingKeysWith: { old, _ in old }), code: 4)
    }
    guard let window = found else {
        return declined(["error": "window-unavailable", "windowsError": Int(listed.rawValue), "windows": count])
    }
    if action == "show" {
        _ = AXUIElementSetAttributeValue(window, kAXMinimizedAttribute as CFString, kCFBooleanFalse)
        _ = app.unhide()
        _ = app.activate(options: [])
        return Reply(value: ["shown": true])
    }
    guard (attribute(window, "AXSheets") as? [AXUIElement] ?? []).isEmpty, findMap(window) else {
        return declined(["error": "home-map-or-minimize-unavailable"])
    }
    // How the window came to be minimized, for the worker's journal.
    var minimizing: [String: Any] = ["minimizedBy": "already"]
    if woke { minimizing["woke"] = true }
    if !minimized(window) {
        let set = AXUIElementSetAttributeValue(window, kAXMinimizedAttribute as CFString, kCFBooleanTrue)
        guard set == .success else {
            return declined(["error": "home-map-or-minimize-unavailable", "minimizeSet": Int(set.rawValue)])
        }
        minimizing["minimizedBy"] = "attribute"
    }
    func finish(_ value: [String: Any], code: Int32 = 0) -> Reply {
        // A user-selected new app wins over restoring our original app.
        if NSWorkspace.shared.frontmostApplication?.processIdentifier == app.processIdentifier && originalPID != app.processIdentifier {
            _ = originalApp?.activate(options: [])
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        let stayed = minimized(window)
        if !stayed { _ = app.hide() }
        var result = value.merging(minimizing, uniquingKeysWith: { old, _ in old })
        result.merge(["focusRestored": NSWorkspace.shared.frontmostApplication?.processIdentifier == originalPID,
                      "cursorPreserved": CGEvent(source: nil)?.location == cursor,
                      "stayedMinimized": stayed, "userInterrupted": !idle()], uniquingKeysWith: { _, new in new })
        return Reply(value: result, code: code)
    }
    // Unhiding a minimized window wakes the scene without displaying its contents.
    // Keeping it unhidden also avoids hard suspension after each completed read.
    _ = app.unhide()
    // On 27 November 2026 the attribute left Ryde's window on screen after every cold open (unsafe-window), where
    // its minimize button, pressed, minimized it at once: the button is pressed when the attribute has not worked.
    if !wait(1.0, until: { minimized(window) && !app.isHidden }) && !minimized(window) {
        if let button = attribute(window, kAXMinimizeButtonAttribute), CFGetTypeID(button) == AXUIElementGetTypeID() {
            minimizing["minimizePress"] = Int(AXUIElementPerformAction(button as! AXUIElement, kAXPressAction as CFString).rawValue)
            minimizing["minimizedBy"] = "button"
        }
    }
    guard wait(minimizeWait, until: { minimized(window) && !app.isHidden }) else {
        minimizing.merge(["minimized": minimized(window), "hidden": app.isHidden], uniquingKeysWith: { _, new in new })
        return finish(["error": "unsafe-window"], code: 4)
    }
    RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    guard minimized(window) else { return finish(["error": "unsafe-window"], code: 4) }
    if action == "prepare" { return finish(["prepared": true, "pid": app.processIdentifier]) }
    guard idle(), originalPID != nil else { return finish(["error": "desktop-busy"], code: 4) }
    let began = Date().timeIntervalSince1970
    _ = app.activate(options: [])
    RunLoop.current.run(until: Date().addingTimeInterval(0.1))
    guard idle(), app.isActive, minimized(window) else {
        return finish(["error": "activation-unavailable-or-desktop-busy"], code: 4)
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
    return finish(["dispatched": true, "trigger": "minimized-activation", "at": began, "pid": app.processIdentifier])
}

func writePrivate(_ value: [String: Any], to path: URL) -> Bool {
    do {
        try FileManager.default.createDirectory(at: path.deletingLastPathComponent(), withIntermediateDirectories: true,
                                                attributes: [.posixPermissions: 0o700])
        try JSONSerialization.data(withJSONObject: value).write(to: path, options: .atomic)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: path.path)
        return true
    } catch { return false }
}
func reply(_ id: String, _ value: [String: Any]) -> Bool {
    writePrivate(value, to: base.appendingPathComponent("map-control-results/" + id + ".json"))
}
// The worker's private request: one command of the fixed set, named by a fresh nonce and valid for at most
// 15 seconds. A request with a nonce but anything else wrong is answered with an error, never run.
func readRequest() -> (id: String, action: String?)? {
    guard let bytes = try? Data(contentsOf: base.appendingPathComponent("map-control-request.json")),
          let request = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any],
          let id = request["id"] as? String, id.range(of: "^[a-f0-9]{32}$", options: .regularExpression) != nil else { return nil }
    let now = Date().timeIntervalSince1970
    guard Set(request.keys) == Set(["id", "action", "expiresAt"]),
          let command = request["action"] as? String, workerCommands.contains(command),
          let expires = request["expiresAt"] as? Double, expires > now, expires <= now + 15 else { return (id, nil) }
    return (id, command)
}
func pauseFastRefresh() -> Reply {
    let path = base.appendingPathComponent("warm-control.json")
    var value = (try? Data(contentsOf: path)).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] } ?? [:]
    value["pausedUntil"] = Date().timeIntervalSince1970 + 300
    guard writePrivate(value, to: path) else { return Reply(value: ["error": "pause-unavailable"], code: 4) }
    return Reply(value: ["pausedSeconds": 300])
}
func pauseAlert() {
    let alert = NSAlert()
    alert.messageText = "Fast Ryde refresh paused for 5 minutes"
    alert.informativeText = "The bridge will use normal background restarts. Fast refresh resumes automatically."
    alert.addButton(withTitle: "OK")
    alert.runModal()
}
func emit(_ result: Reply, replyTo id: String? = nil) -> Never {
    if let id = id, !reply(id, result.value) { exit(5) }
    print(String(data: try! JSONSerialization.data(withJSONObject: result.value, options: [.sortedKeys]), encoding: .utf8)!)
    exit(result.code)
}

// The worker's resident helper (serve). Until 27 November 2026 the worker launched this app for every command,
// up to 1,500 times an hour, and WindowServer kept a Mach port for each launch: on 26 November its port table
// filled and the kernel ended the user's session. One process now answers every command; the worker starts
// it through LaunchServices, so it keeps this app's own Accessibility permission.
final class Resident: NSObject, NSApplicationDelegate {
    var handled: String?
    var busy = false
    var timer: Timer?
    var activity: NSObjectProtocol?
    func applicationDidFinishLaunching(_ notification: Notification) {
        // App Nap would stretch the polling to seconds while the app sits in the background.
        activity = ProcessInfo.processInfo.beginActivity(options: [.userInitiatedAllowingIdleSystemSleep],
                                                         reason: "Answers the Ryde bridge worker")
        let timer = Timer(timeInterval: 0.1, repeats: true) { [weak self] _ in self?.poll() }
        timer.tolerance = 0.05
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }
    // Opening the app while it serves pauses fast activation, as opening it always has.
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if pauseFastRefresh().value["error"] == nil { pauseAlert() }
        // Opened, this app came to the front: give it back to the user's app.
        NSApp.hide(nil)
        return false
    }
    func poll() {
        // perform runs the run loop while it waits, which fires this timer again: one command at a time.
        guard !busy else { return }
        busy = true
        defer { busy = false }
        autoreleasepool {
            guard let (id, command) = readRequest(), id != handled else { return }
            handled = id
            let result = command.map { execute($0) } ?? Reply(value: ["error": "invalid-or-expired-command"], code: 2)
            _ = reply(id, result.value)
        }
    }
}
// One resident at a time: it holds this lock for its life, and the worker reads whether it is held.
func holdServeLock() -> Bool {
    let descriptor = open(base.appendingPathComponent("map-control.lock").path, O_RDWR | O_CREAT, 0o600)
    guard descriptor >= 0 else { return false }
    // The worker may be probing the lock (shared, at once released) as this starts.
    let deadline = Date().addingTimeInterval(3)
    while flock(descriptor, LOCK_EX | LOCK_NB) != 0 {
        if Date() >= deadline { close(descriptor); return false }
        usleep(50_000)
    }
    return true
}

let args = Array(CommandLine.arguments.dropFirst())
if args.isEmpty || args.allSatisfy({ $0.hasPrefix("-psn_") }) {
    let result = pauseFastRefresh()
    if result.value["error"] == nil {
        _ = NSApplication.shared
        pauseAlert()
    }
    emit(result)
}
switch (args[0], args.count) {
case ("serve", 1):
    guard holdServeLock() else { emit(Reply(value: ["error": "already-serving"], code: 6)) }
    // The worker stops a silent helper by this pid: one it could not find would keep the lock and every command.
    guard writePrivate(["pid": Int(getpid()), "startedAt": Date().timeIntervalSince1970],
                       to: base.appendingPathComponent("map-control-ready.json")) else {
        emit(Reply(value: ["error": "ready-unwritable"], code: 5))
    }
    let resident = Resident()
    // NSApplication holds its delegate weakly.
    withExtendedLifetime(resident) {
        NSApplication.shared.delegate = resident
        NSApplication.shared.run()
    }
    exit(0)
case ("run", 2):
    // One command for one launch, as before the resident helper; the nonce binds the launch to its request.
    guard let (id, command) = readRequest(), id == args[1], let action = command else {
        emit(Reply(value: ["error": "invalid-or-expired-command"], code: 2), replyTo: args[1].range(of: "^[a-f0-9]{32}$", options: .regularExpression) != nil ? args[1] : nil)
    }
    _ = NSApplication.shared
    emit(execute(action), replyTo: id)
case ("pause", 1):
    emit(pauseFastRefresh())
case ("request-access", 1):
    // Operator only. The worker never requests or grants permissions.
    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
    emit(Reply(value: ["trusted": AXIsProcessTrustedWithOptions(options)]))
case (let action, 1) where ["status", "refresh", "prepare", "show"].contains(action):
    emit(execute(action))
default:
    emit(Reply(value: ["error": "unsupported-command"], code: 2))
}
