import { GarminCommand } from './protocol'

/**
 * The seam between the capture screen and whatever is actually talking to the
 * device.
 *
 * There are two implementations: `nativeTransport`, which drives the Connect
 * IQ companion SDK through the local Expo module in
 * `modules/treemapper-garmin/`, and `mockTransport`, which fakes a device in
 * development. The interface is shaped after the SDK's own callbacks so the
 * two are interchangeable:
 *
 *   start()        -> ConnectIQ.initialize() + device discovery + listeners
 *   send()         -> ConnectIQ.sendMessage()
 *   openWatchApp() -> ConnectIQ.openApplication()
 *   openStore()    -> ConnectIQ.openStore()
 *   chooseDevice() -> ConnectIQ.showConnectIQDeviceSelection()
 *   stop()         -> unregister + ConnectIQ.shutdown()
 *
 * The names are the Android SDK's, because that is the half that was built
 * first. iOS reaches the same six behind different calls: see `GarminLink.swift`
 * in the native module, which carries the differences that matter.
 *
 * Three rules the SDK enforces the hard way, which any implementation has to
 * honour and which the mock therefore imitates:
 *
 *  1. Nothing may be called before the SDK reports ready.
 *  2. Callbacks arrive on a background thread. Hop to the main thread before
 *     emitting, so this layer never has to think about it.
 *  3. Register the message listener before sending anything. The device
 *     transmits into a socket nobody reads otherwise, and on some SDK versions
 *     that takes the reader thread down with it.
 */

/** Why the link cannot be used at all. Each one needs different words. */
export type GarminBlocker =
  /** Garmin Connect Mobile is missing, signed out, or not running. */
  | 'no_garmin_connect'
  /** No Garmin device is paired in Garmin Connect. */
  | 'no_device'
  /**
   * iOS only: the user has not yet said which of their devices this app may
   * talk to.
   *
   * It is not a missing pairing and not an error. The iOS SDK has no way to
   * read the paired list; the only route is a trip to Garmin Connect, which
   * backgrounds TreeMapper and answers by opening its URL scheme. So this is
   * the one blocker whose fix is a button rather than something the user has
   * to go and do elsewhere, and the answer is remembered: it is asked once per
   * install, not once per capture.
   */
  | 'needs_device'
  /** A device is paired but not currently connected over Bluetooth. */
  | 'device_offline'
  /** The TreeMapper device app is not installed on the device. */
  | 'app_missing'
  /** There is no native link on this build or platform. */
  | 'unsupported'

export type GarminLinkEvent =
  /** A line for the developer log. Never shown to the user. */
  | { type: 'log'; line: string }
  /** The SDK finished initialising, or failed to. */
  | { type: 'sdk'; ready: boolean; detail: string }
  /** The chosen device changed, or went away. */
  | { type: 'device'; name: string | null; connected: boolean }
  /** Whether the device app is installed. null means "could not tell". */
  | { type: 'app'; installed: boolean | null; detail: string }
  /** A raw payload from the device, straight off the wire and unparsed. */
  | { type: 'message'; payload: Record<string, unknown> }
  /** A dead end. The screen stops and explains. */
  | { type: 'blocked'; reason: GarminBlocker; detail: string }

export type GarminLinkListener = (event: GarminLinkEvent) => void

export interface GarminTransport {
  /** For the log line that says which transport answered. */
  readonly name: string
  /** Begin. Safe to call once per open session; `stop` must follow. */
  start(listener: GarminLinkListener): void
  /** Tear down. Must be safe to call twice, and after a failed start. */
  stop(): void
  send(command: GarminCommand): void
  /** Launch the device app remotely. This is what makes the flow work. */
  openWatchApp(): void
  /** Open the Connect IQ store listing so the user can install the device app. */
  openStore(): void
  /**
   * Ask the user which devices this app may talk to.
   *
   * iOS only in effect. It launches Garmin Connect, which means this app goes
   * to the background and may be suspended before the answer arrives, so
   * nothing may be queued behind it. On Android the SDK reads the paired list
   * itself and this does nothing, which is why the screen can call it without
   * branching on platform.
   */
  chooseDevice(): void
}

export interface GarminTransportOptions {
  /**
   * Where to pretend the user is standing, as [lng, lat].
   *
   * The mock only. A faked point has to land near the map the user is looking
   * at or the screen just jumps to the Atlantic, which tells you nothing about
   * whether the flow works. The native transport ignores this: a real device
   * reports where it actually is.
   */
  origin?: [number, number] | null
}
