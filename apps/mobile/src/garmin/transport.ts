import { GarminCommand } from './protocol'

/**
 * The seam between the modal and whatever is actually talking to the watch.
 *
 * There are two implementations: `mockTransport`, which fakes a watch in
 * development, and the native one, which does not exist yet. The interface is
 * shaped after the Connect IQ Mobile SDK's own callbacks (see `WatchLink.kt`
 * in the watch repo) so the native module can satisfy it without the UI
 * changing at all:
 *
 *   start()        -> ConnectIQ.initialize() + device discovery + listeners
 *   send()         -> ConnectIQ.sendMessage()
 *   openWatchApp() -> ConnectIQ.openApplication()
 *   openStore()    -> ConnectIQ.openStore()
 *   stop()         -> unregister + ConnectIQ.shutdown()
 *
 * Three rules the SDK enforces the hard way, which any implementation has to
 * honour and which the mock therefore imitates:
 *
 *  1. Nothing may be called before the SDK reports ready.
 *  2. Callbacks arrive on a background thread. Hop to the main thread before
 *     emitting, so this layer never has to think about it.
 *  3. Register the message listener before sending anything. The watch
 *     retries into a socket nobody reads otherwise.
 */

/** Why the link cannot be used at all. Each one needs different words. */
export type GarminBlocker =
  /** Garmin Connect Mobile is missing, signed out, or not running. */
  | 'no_garmin_connect'
  /** No Garmin device is paired in Garmin Connect. */
  | 'no_device'
  /** A device is paired but not currently connected over Bluetooth. */
  | 'device_offline'
  /** The TreeMapper watch app is not installed on the watch. */
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
  /** Whether the watch app is installed. null means "could not tell". */
  | { type: 'app'; installed: boolean | null; detail: string }
  /** A raw payload from the watch, straight off the wire and unparsed. */
  | { type: 'message'; payload: Record<string, unknown> }
  /** A dead end. The modal stops and explains. */
  | { type: 'blocked'; reason: GarminBlocker; detail: string }

export type GarminLinkListener = (event: GarminLinkEvent) => void

export interface GarminTransport {
  /** For the log line that says which transport answered. */
  readonly name: string
  /** Begin. Safe to call once per open modal; `stop` must follow. */
  start(listener: GarminLinkListener): void
  /** Tear down. Must be safe to call twice, and after a failed start. */
  stop(): void
  send(command: GarminCommand): void
  /** Launch the watch app remotely. This is what makes the modal flow work. */
  openWatchApp(): void
  /** Open the Connect IQ store listing so the user can install the watch app. */
  openStore(): void
}

export interface GarminTransportOptions {
  /**
   * Where to pretend the user is standing, as [lng, lat].
   *
   * The mock only. A faked point has to land near the map the user is looking
   * at or the screen just jumps to the Atlantic, which tells you nothing about
   * whether the flow works. The native transport ignores this: a real watch
   * reports where it actually is.
   */
  origin?: [number, number] | null
}
