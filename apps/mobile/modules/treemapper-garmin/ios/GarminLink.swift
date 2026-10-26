import ConnectIQ
import Foundation

/**
 Everything that talks to the Garmin device on iOS.

 It is the counterpart of `GarminLink.kt` and emits exactly the same events,
 because the phone above it is one state machine for both platforms. What it is
 not is a port: the two SDKs disagree about who owns the Bluetooth link, and
 three differences drive the whole shape of this file.

  1. **The iOS SDK talks to the device itself.** Android routes every call
     through Garmin Connect Mobile; here GCM is only needed to discover devices
     and to reach the store. So there is no `ServiceUnavailableException` to
     translate, and no `shutdown()` either: `initialize` happens once per
     process, in the app delegate, and lasts until the app dies.

  2. **There is no device list to ask for.** Android has `connectedDevices` and
     `knownDevices`. Here the only way to learn about a device is to send the
     user to GCM with `showConnectIQDeviceSelection`, which backgrounds this app
     and answers by opening our URL scheme. That is a user-visible trip, so the
     result has to be cached: this class persists what came back and reuses it
     on every later launch. `needs_device` is the blocker that asks for the
     trip, and it is the one event Android never sends.

  3. **This object outlives a capture session.** The SDK is initialised during
     `didFinishLaunching` and GCM may answer long after the capture screen has
     gone, so the link is a singleton holding the devices, with `emit` attached
     and detached by `start`/`stop`. Android can afford an instance per session;
     here that would throw away the device list at the worst moment.

 Nothing here parses a message. Payloads go up raw and `src/garmin/protocol.ts`
 interprets them, shared with Android and with the development mock, so a wire
 format change has exactly one place to be understood.
 */
final class GarminLink: NSObject {

  typealias Emit = ([String: Any]) -> Void

  static let shared = GarminLink()

  /// Must match `id` in the watch project's manifest.xml, in UUID form.
  static let watchAppUuid = "a7f3c81e-6b2d-4f9e-a05c-73819d4e6b21"

  /// The Connect IQ store listing. Not the app id; it is what opens the page.
  static let storeUuid = "160a091a-1637-4a79-9b30-defec431b462"

  /// Written into Info.plist by the config plugin, so one value defines it.
  private static let urlSchemeKey = "TreeMapperGarminUrlScheme"

  private static let devicesDefaultsKey = "org.pftp.treemapper.garmin.devices"

  private static let watchdogInterval: TimeInterval = 2

  private var emit: Emit?
  private var urlScheme: String?
  private var configured = false

  private var devices: [IQDevice] = []
  private var device: IQDevice?
  private var app: IQApp?
  private var listening = false
  private var lastConnected = false
  private var watchdog: Timer?

  private override init() {
    super.init()
  }

  // ---- events ----------------------------------------------------------
  //
  // One shape per case of the GarminLinkEvent union in transport.ts. They are
  // built by hand rather than from a model because that file is the contract
  // and a typo here should read as a typo there.

  private func log(_ line: String) {
    send(event: ["type": "log", "line": line])
  }

  private func emitSdk(ready: Bool, detail: String) {
    send(event: ["type": "sdk", "ready": ready, "detail": detail])
  }

  private func emitDevice(name: String?, connected: Bool) {
    // NSNull, not a nil Optional: the bridge turns NSNull into JavaScript null
    // and quietly drops a key whose value is a wrapped nil, and `name: null`
    // is how the phone says "no device" as opposed to "unchanged".
    send(event: [
      "type": "device",
      "name": name.map { $0 as Any } ?? NSNull(),
      "connected": connected,
    ])
  }

  private func emitApp(installed: Bool?, detail: String) {
    send(event: [
      "type": "app",
      "installed": installed.map { $0 as Any } ?? NSNull(),
      "detail": detail,
    ])
  }

  private func emitBlocked(_ reason: String, _ detail: String) {
    send(event: ["type": "blocked", "reason": reason, "detail": detail])
  }

  private func emitMessage(_ payload: [String: Any]) {
    send(event: ["type": "message", "payload": payload])
  }

  /// Every event leaves on the main thread. The SDK's callbacks do not promise
  /// one, and the JavaScript side should never have to think about it.
  private func send(event: [String: Any]) {
    // Already on the main thread by the time anything calls this, because
    // every way into this class goes through `onMain`. Kept honest rather
    // than assumed: an SDK delegate is free to arrive anywhere.
    onMain { [weak self] in self?.emit?(event) }
  }

  /**
   Hop to the main thread.

   Every entry point goes through this, and it is the counterpart of
   `main.post` in `GarminLink.kt`. Expo's synchronous `Function` does no queue
   hop of its own, so a call from JavaScript arrives on the JavaScript thread,
   and two separate things break there:

    - The Connect IQ SDK drives Core Bluetooth and expects the main thread.
    - `Timer.scheduledTimer` attaches to the run loop of whichever thread made
      it. Scheduled off the main thread the watchdog never fires, and the only
      thing left watching the connection is `deviceStatusChanged`, which
      reports transitions and so misses every change that happens while this
      app is suspended behind Garmin Connect. That is the `chooseDevice` path.

   With this in place everything the class holds is read and written on the
   main thread alone, which is also what makes the state here safe without a
   lock.
   */
  private func onMain(_ work: @escaping () -> Void) {
    if Thread.isMainThread {
      work()
    } else {
      DispatchQueue.main.async(execute: work)
    }
  }

  // ---- lifetime --------------------------------------------------------

  /**
   Initialise the SDK. Called once, from the app delegate subscriber.

   Garmin's guide puts this in `didFinishLaunching` and that is not advice: the
   SDK has to be holding the URL scheme before GCM can answer with a device
   list, and the answer can arrive at launch when iOS cold starts this app to
   deliver it.
   */
  func configure() {
    guard !configured else { return }

    guard let scheme = Bundle.main.object(forInfoDictionaryKey: Self.urlSchemeKey) as? String,
          !scheme.isEmpty else {
      // Without a scheme the device picker can never come back, so there is no
      // honest half-working mode to offer. The transport reports `unsupported`
      // and the Garmin button stays hidden.
      NSLog("[garmin] no \(Self.urlSchemeKey) in Info.plist; the Connect IQ link is off")
      return
    }

    urlScheme = scheme
    configured = true
    ConnectIQ.sharedInstance().initialize(withUrlScheme: scheme, uiOverrideDelegate: self)
    devices = restoreDevices()
    NSLog("[garmin] SDK initialised on \(scheme), \(devices.count) remembered device(s)")
  }

  func start(emit: @escaping Emit) {
    onMain { [weak self] in self?.startOnMain(emit) }
  }

  private func startOnMain(_ emit: @escaping Emit) {
    // Attach first, so the reasons below are not emitted into nothing.
    self.emit = emit

    guard configured else {
      emitBlocked("unsupported", "SDK not initialised")
      return
    }

    // There is no asynchronous readiness on iOS. Saying so immediately keeps
    // the phone's state machine identical across the two platforms.
    emitSdk(ready: true, detail: "ready")

    if devices.isEmpty {
      devices = restoreDevices()
    }

    guard let first = devices.first else {
      // Not an error and not a missing pairing: iOS simply has not been told
      // which device may be shared with this app. The fix is a trip to GCM,
      // which only the user can authorise, so the phone asks.
      emitDevice(name: nil, connected: false)
      emitBlocked("needs_device", "no device shared with this app yet")
      return
    }

    bind(to: first)
  }

  func stop() {
    onMain { [weak self] in self?.stopOnMain() }
  }

  private func stopOnMain() {
    stopWatchdog()

    if listening {
      ConnectIQ.sharedInstance().unregister(forAllAppMessages: self)
      ConnectIQ.sharedInstance().unregister(forAllDeviceEvents: self)
      listening = false
    }

    device = nil
    app = nil
    lastConnected = false
    emit = nil

    // Deliberately no shutdown. `initialize` is once per process on iOS, and
    // the device list has to survive a closed capture screen: the next session
    // must not send the user back to Garmin Connect for a device it already
    // knows about.
  }

  // ---- devices ---------------------------------------------------------

  /// Launch Garmin Connect so the user can say which devices to share.
  func chooseDevice() {
    onMain { [weak self] in self?.chooseDeviceOnMain() }
  }

  private func chooseDeviceOnMain() {
    guard configured else {
      emitBlocked("unsupported", "SDK not initialised")
      return
    }
    log("-> showConnectIQDeviceSelection")
    // This backgrounds TreeMapper and may suspend it. The answer comes back
    // through `handleOpen`, possibly after a cold start.
    ConnectIQ.sharedInstance().showConnectIQDeviceSelection()
  }

  /**
   The answer from Garmin Connect, routed in by the app delegate subscriber.

   `sourceApplication` is checked when iOS supplies it. It can be nil depending
   on how the app was resumed, and refusing the URL in that case would strand
   the user on a picker that appears to do nothing, so a nil source is parsed
   and the parse itself is what decides.
   */
  @discardableResult
  func handleOpen(url: URL, sourceApplication: String?) -> Bool {
    // No `onMain` here, and it is not an oversight: this answers the app
    // delegate with a Bool it needs now, and the app delegate is the main
    // thread by definition.
    guard configured, let scheme = urlScheme, url.scheme == scheme else {
      return false
    }
    if let source = sourceApplication, source != IQGCMBundle {
      return false
    }

    guard let parsed = ConnectIQ.sharedInstance().parseDeviceSelectionResponse(from: url) else {
      log("device selection returned nothing to parse")
      return false
    }

    let chosen = parsed.compactMap { $0 as? IQDevice }
    log("device selection returned \(chosen.count) device(s)")

    // Replace rather than merge. Garmin's guide is explicit: the latest list is
    // the whole authorisation, so a device the user has just revoked must not
    // survive in a cache.
    devices = chosen
    saveDevices(chosen)

    guard let first = chosen.first else {
      emitDevice(name: nil, connected: false)
      emitBlocked("needs_device", "no device was shared")
      return true
    }

    // Only rebind if a capture session is open. If the user picked a device
    // with the screen closed, the list is saved and the next `start` uses it.
    if emit != nil {
      bind(to: first)
    }
    return true
  }

  private func bind(to chosen: IQDevice) {
    // A second bind is ordinary rather than exceptional: `start` takes the
    // remembered device, and a later trip to Garmin Connect can come back with
    // a different one. Drop the old registrations before taking new ones.
    // Leaving them attached means `deviceStatusChanged` keeps firing for a
    // device nobody selected, which reaches the screen as the wrong device
    // name and a blocker about a device that is not in use.
    if listening {
      ConnectIQ.sharedInstance().unregister(forAllAppMessages: self)
      ConnectIQ.sharedInstance().unregister(forAllDeviceEvents: self)
      listening = false
    }

    device = chosen
    let app = IQApp(
      uuid: UUID(uuidString: Self.watchAppUuid),
      storeUuid: UUID(uuidString: Self.storeUuid),
      device: chosen
    )
    self.app = app

    // Register before anything else, exactly as on Android. A device event
    // registration is also what the SDK requires before any call that operates
    // on that device, including getAppStatus and sendMessage.
    ConnectIQ.sharedInstance().register(forDeviceEvents: chosen, delegate: self)
    if let app = app {
      ConnectIQ.sharedInstance().register(forAppMessages: app, delegate: self)
    }
    listening = true

    let status = ConnectIQ.sharedInstance().getDeviceStatus(chosen)
    let connected = status == .connected
    lastConnected = connected
    log("device: \(chosen.friendlyName) (\(label(for: status)))")
    emitDevice(name: chosen.friendlyName, connected: connected)

    if !connected {
      // Paired and remembered, but not reachable this second. Keep the
      // registrations and the watchdog: walking back into range picks the
      // stream up with nothing to press.
      emitBlocked("device_offline", label(for: status))
    }

    startWatchdog()
    checkApp()
  }

  private func label(for status: IQDeviceStatus) -> String {
    switch status {
    case .invalidDevice: return "INVALID_DEVICE"
    case .bluetoothNotReady: return "BLUETOOTH_NOT_READY"
    case .notFound: return "NOT_FOUND"
    case .notConnected: return "NOT_CONNECTED"
    case .connected: return "CONNECTED"
    @unknown default: return "UNKNOWN"
    }
  }

  /**
   Poll the connection state.

   `deviceStatusChanged` does fire on iOS, unlike the tethered Android
   transport, but it is not a substitute for this: the delegate only reports
   transitions, and the state can change while this app is suspended behind
   Garmin Connect. Polling is what notices that nothing is different any more.
   */
  private func startWatchdog() {
    stopWatchdog()
    watchdog = Timer.scheduledTimer(
      withTimeInterval: Self.watchdogInterval,
      repeats: true
    ) { [weak self] _ in
      self?.pollDeviceStatus()
    }
  }

  private func stopWatchdog() {
    watchdog?.invalidate()
    watchdog = nil
  }

  private func pollDeviceStatus() {
    guard let device = device else { return }
    let connected = ConnectIQ.sharedInstance().getDeviceStatus(device) == .connected
    guard connected != lastConnected else { return }
    lastConnected = connected
    if connected {
      log("device attached")
      emitDevice(name: device.friendlyName, connected: true)
      checkApp()
    } else {
      log("device detached")
      emitDevice(name: device.friendlyName, connected: false)
      // Say why rather than leaving the phone to infer it from silence. The
      // last position stays on screen, marked stale, which is the honest
      // picture: there is a coordinate, it is just not being refreshed.
      emitBlocked("device_offline", "went out of range")
    }
  }

  // ---- the device app --------------------------------------------------

  private func checkApp() {
    guard let app = app else { return }
    ConnectIQ.sharedInstance().getAppStatus(app) { [weak self] status in
      guard let self = self else { return }
      self.onMain {
        guard let status = status else {
          // nil means the device did not answer: not connected, or the request
          // timed out. That is not evidence the app is missing, and saying so
          // would send the user to the store for nothing.
          self.log("app status unavailable (device silent)")
          self.emitApp(installed: nil, detail: "unknown")
          return
        }
        if status.isInstalled {
          self.log("device app installed, version \(status.version)")
          self.emitApp(installed: true, detail: "installed v\(status.version)")
        } else {
          self.log("device app not installed")
          self.emitApp(installed: false, detail: "not installed")
          self.emitBlocked("app_missing", "TreeMapper GPS not installed")
        }
      }
    }
  }

  /// Ask the device to open TreeMapper GPS. The user confirms on the device.
  func openWatchApp() {
    onMain { [weak self] in self?.openWatchAppOnMain() }
  }

  private func openWatchAppOnMain() {
    guard let app = app else {
      log("cannot open the device app: no device")
      return
    }
    log("-> openAppRequest")
    ConnectIQ.sharedInstance().openAppRequest(app) { [weak self] result in
      // Already running and prompt-not-displayed both mean the app is up,
      // which is the outcome this call wanted. Nothing to do but say so.
      self?.log("   openAppRequest: \(NSStringFromSendMessageResult(result))")
    }
  }

  /// The Connect IQ store page for TreeMapper GPS, inside Garmin Connect.
  func openStore() {
    onMain { [weak self] in self?.openStoreOnMain() }
  }

  private func openStoreOnMain() {
    guard let app = app else {
      log("cannot open the store: no device")
      return
    }
    log("-> showConnectIQStore")
    ConnectIQ.sharedInstance().showConnectIQStore(for: app)
  }

  // ---- messages --------------------------------------------------------

  /**
   Post one command to the device.

   Wrapped in a single-element array, the same as Android sends. The watch
   accepts both shapes (`PhoneLink.unwrap`), but keeping the two platforms
   identical on the wire means a capture that goes wrong can be compared
   against the other one.
   */
  func send(command: [String: Any]) {
    onMain { [weak self] in self?.sendOnMain(command) }
  }

  private func sendOnMain(_ command: [String: Any]) {
    let label = command["c"] as? String ?? "?"

    guard let app = app else {
      log("cannot send \(label): no device")
      return
    }
    guard listening else {
      // Parity with Android, and for the same reason: a device answering into
      // a link with nothing registered to hear it is worse than no send.
      log("refusing to send \(label): not registered for app messages yet")
      return
    }

    log("-> \(label) \(command)")
    ConnectIQ.sharedInstance().sendMessage(
      [command],
      to: app,
      progress: nil,
      completion: { [weak self] result in
        self?.log("   send \(label): \(NSStringFromSendMessageResult(result))")
      }
    )
  }

  // ---- persistence -----------------------------------------------------
  //
  // UserDefaults rather than a file in Application Support, which is what
  // Garmin's example uses. The payload is two or three archived IQDevice
  // objects, it has to survive reinstall-free app updates and nothing else,
  // and a file path is one more thing to get wrong in a sandbox.

  private func saveDevices(_ devices: [IQDevice]) {
    do {
      let data = try NSKeyedArchiver.archivedData(
        withRootObject: devices,
        requiringSecureCoding: true
      )
      UserDefaults.standard.set(data, forKey: Self.devicesDefaultsKey)
    } catch {
      log("could not remember the device list: \(error.localizedDescription)")
    }
  }

  private func restoreDevices() -> [IQDevice] {
    guard let data = UserDefaults.standard.data(forKey: Self.devicesDefaultsKey) else {
      return []
    }
    do {
      let restored = try NSKeyedUnarchiver.unarchivedArrayOfObjects(
        ofClass: IQDevice.self,
        from: data
      )
      return restored ?? []
    } catch {
      // A failed restore is not fatal: it costs one trip to Garmin Connect.
      NSLog("[garmin] could not restore remembered devices: \(error.localizedDescription)")
      return []
    }
  }

  // ---- inbound ---------------------------------------------------------

  /**
   Pull the payload dictionary out of whatever the SDK handed us.

   A Monkey C Dictionary arrives as a dictionary and an Array as an array, so a
   message is usually one dictionary inside a single-element array. It has been
   seen delivered both bare and wrapped, so unwrap defensively rather than
   assuming either.
   */
  private func unwrap(_ message: Any?) -> [String: Any]? {
    guard let message = message else { return nil }
    if let dictionary = message as? [String: Any] {
      return dictionary
    }
    if let list = message as? [Any] {
      for item in list {
        if let found = unwrap(item) {
          return found
        }
      }
    }
    return nil
  }
}

// ---- SDK delegates -------------------------------------------------------

extension GarminLink: IQUIOverrideDelegate {

  /// The SDK's way of saying Garmin Connect is missing. It is the only path on
  /// iOS that needs GCM, and the words for it live on the phone.
  func needsToInstallConnectMobile() {
    log("Garmin Connect Mobile is not installed")
    emitBlocked("no_garmin_connect", "GCM not installed")
  }
}

extension GarminLink: IQDeviceEventDelegate {

  func deviceStatusChanged(_ device: IQDevice, status: IQDeviceStatus) {
    onMain { [weak self] in
      guard let self = self else { return }
      // Only the device actually in use. A registration can outlive a rebind
      // by a moment, and a status for a device the user has just moved away
      // from must not be read as the current one.
      guard device.uuid == self.device?.uuid else { return }
      self.log("device status: \(self.label(for: status))")
      let connected = status == .connected
      self.lastConnected = connected
      self.emitDevice(name: device.friendlyName, connected: connected)
      if connected {
        self.checkApp()
      } else {
        self.emitBlocked("device_offline", self.label(for: status))
      }
    }
  }
}

extension GarminLink: IQAppMessageDelegate {

  func receivedMessage(_ message: Any, from app: IQApp) {
    onMain { [weak self] in
      guard let self = self else { return }
      guard let payload = self.unwrap(message) else {
        self.log("<- unparsable message: \(message)")
        return
      }
      self.emitMessage(payload)
    }
  }
}
