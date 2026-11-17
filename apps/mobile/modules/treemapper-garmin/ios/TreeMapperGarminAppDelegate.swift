import ExpoModulesCore

/**
 Two things the Connect IQ SDK can only get from the app delegate.

 **It must be initialised at launch.** Garmin's guide puts
 `initializeWithUrlScheme:` in `didFinishLaunching`, and that is a requirement
 rather than a convention: Garmin Connect answers a device selection by opening
 our URL scheme, and iOS can cold start this app to deliver it. An SDK that
 only wakes up when the capture screen opens would miss its own answer.

 **The answer arrives as a URL.** `application(_:open:options:)` is the only
 place it lands, so it is routed into the link here.

 Expo autolinking registers this class from `expo-module.config.json`, so
 nothing in the generated `ios/` project refers to it and nothing is lost to
 the next `expo prebuild`. The callbacks below are additive: every subscriber
 is asked in turn, which is why the URL handler must answer false for a URL
 that is not Garmin's, leaving the app's own deep links alone.
 */
public class TreeMapperGarminAppDelegate: ExpoAppDelegateSubscriber {

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    GarminLink.shared.configure()
    return true
  }

  public func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return GarminLink.shared.handleOpen(
      url: url,
      sourceApplication: options[.sourceApplication] as? String
    )
  }
}
