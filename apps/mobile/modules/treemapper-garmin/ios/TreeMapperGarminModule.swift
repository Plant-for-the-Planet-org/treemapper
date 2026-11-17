import ExpoModulesCore

/**
 The JavaScript face of the Connect IQ link on iOS.

 The same contract the Kotlin module satisfies, written down in
 `src/garmin/transport.ts`:

   start(tethered?)  -> attach to the SDK and bind a device
   stop()
   send(command)
   openWatchApp()
   openStore()
   chooseDevice()

 plus one event, `GarminLinkEvent`, carrying the union in that same file.

 It is thin on purpose. Everything that knows about Garmin is in `GarminLink`,
 everything that knows about the TreeMapper protocol is in
 `src/garmin/protocol.ts`, and this class only owns the bridge.
 */
public class TreeMapperGarminModule: Module {

  /**
   One command for the device.

   `ms` crosses as an `Int` and is narrowed to `Int32` before it goes on the
   wire, because the watch checks `ms instanceof Number` and Monkey C's
   `Number` is a 32-bit integer. A JavaScript number arriving as a Double would
   be silently ignored over there and the rate would never change.
   */
  struct Command: Record {
    @Field var c: String = ""
    @Field var ms: Int?
  }

  public func definition() -> ModuleDefinition {
    Name("TreeMapperGarmin")

    Events(eventName)

    Function("start") { (tethered: Bool?) in
      // `tethered` is the Android development path: it speaks to the Connect
      // IQ simulator over ADB. There is no equivalent on iOS, where the SDK
      // owns the Bluetooth link itself, so the argument is accepted and
      // ignored rather than making the JavaScript side branch on platform.
      GarminLink.shared.start { [weak self] event in
        self?.sendEvent(eventName, event)
      }
    }

    Function("stop") {
      GarminLink.shared.stop()
    }

    Function("send") { (command: Command) in
      var payload: [String: Any] = ["c": command.c]
      if let ms = command.ms {
        payload["ms"] = NSNumber(value: Int32(clamping: ms))
      }
      GarminLink.shared.send(command: payload)
    }

    Function("openWatchApp") {
      GarminLink.shared.openWatchApp()
    }

    Function("openStore") {
      GarminLink.shared.openStore()
    }

    // iOS only in effect: it sends the user to Garmin Connect to say which
    // devices this app may talk to. Android answers it with a log line, so the
    // phone can call it without asking which platform it is on.
    Function("chooseDevice") {
      GarminLink.shared.chooseDevice()
    }

    // The capture screen is not the only way out of this module. The link
    // holds device event registrations and a polling timer, and both should go
    // when the module does.
    OnDestroy {
      GarminLink.shared.stop()
    }
  }
}

private let eventName = "GarminLinkEvent"
