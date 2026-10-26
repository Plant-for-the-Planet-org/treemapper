import {
  DEFAULT_INTERVAL_MS,
  GarminCommand,
  GarminQuality,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  PROTOCOL_VERSION,
} from './protocol'
import {
  GarminLinkListener,
  GarminTransport,
  GarminTransportOptions,
} from './transport'

/**
 * A Garmin that is not there.
 *
 * It exists so the whole capture flow -- every state, every dead end, the
 * timing of the waits -- can be built and reviewed without a device on the
 * desk. It speaks the real protocol, in the real order, at roughly real
 * Bluetooth speeds, and it is never reachable in a release build (see
 * `createGarminTransport`).
 *
 * It imitates the SDK's awkward parts on purpose, because those are what the
 * UI has to survive: nothing answers before the SDK is ready, a sleeping
 * device says nothing at all until `openWatchApp` wakes it, and -- the one
 * that matters most in version 2 -- **the stream does not start until the
 * phone says hello**. A real device holds everything until the companion app
 * has spoken first, so a mock that volunteered points would hide a phone bug
 * that freezes the screen in the field.
 */

export type MockScenario =
  /** Device app already open, receiver warm. The common case in the field. */
  | 'happy'
  /** Device app closed. Needs openApplication, then a cold acquire. */
  | 'asleep'
  /** Under canopy. Quality climbs to 2 and stops there. */
  | 'poor'
  /** The user paused the stream on the device. Only they can resume it. */
  | 'paused'
  /** The link cannot keep up: points go missing and `drop` climbs. */
  | 'flaky'
  /** Nothing paired in Garmin Connect. */
  | 'no_device'
  /** iOS: the user has not yet chosen which device to share with this app. */
  | 'needs_device'
  /** Garmin Connect Mobile missing or signed out. */
  | 'no_garmin_connect'
  /** Paired device, but the TreeMapper device app is not installed. */
  | 'app_missing'

let scenario: MockScenario = 'happy'

/**
 * The device the simulation claims to be, shown in the subtitle.
 *
 * Defaults to Garmin's current flagship handheld, because that is the class of
 * hardware field teams carry -- Connect IQ runs on handhelds as well as
 * watches. Change it with `setMockDevice` to match whatever is in the room for
 * a demo.
 */
let deviceName = 'GPSMAP H1i Plus'

export const setMockDevice = (name: string) => {
  deviceName = name
}

export const getMockDevice = (): string => deviceName

/**
 * Pick which device the mock pretends to be. Call it from a dev screen or a
 * breakpoint; there is deliberately no UI for it, because this is scaffolding
 * and not a feature.
 */
export const setMockScenario = (next: MockScenario) => {
  scenario = next
}

export const getMockScenario = (): MockScenario => scenario

/**
 * Where a simulated receiver starts and tops out.
 *
 * Everything but the `poor` scenario opens at usable and settles at the best
 * the enum goes to, so a demo or a walkthrough never flashes "Poor" on its way
 * up. Only `poor` -- which exists to rehearse the under-canopy warning -- ever
 * reports below usable, and it has to be asked for by name.
 */
const startingQuality = (): GarminQuality =>
  scenario === 'poor' ? GarminQuality.POOR : GarminQuality.USABLE

const ceilingQuality = (): GarminQuality =>
  scenario === 'poor' ? GarminQuality.POOR : GarminQuality.GOOD

/** Roughly a metre per 1e-5 degrees, which is close enough to look real. */
const jitter = (metres: number) => (Math.random() - 0.5) * 2 * metres * 1e-5

const DEFAULT_ORIGIN: [number, number] = [77.5946, 12.9716]

/** Matches HEARTBEAT_MS in the device's SessionState.mc. */
const HEARTBEAT_MS = 5000

export const createMockTransport = (
  options: GarminTransportOptions = {},
): GarminTransport => {
  let listener: GarminLinkListener | null = null
  let timers: ReturnType<typeof setTimeout>[] = []
  let streamTimer: ReturnType<typeof setInterval> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let quality: GarminQuality = GarminQuality.NOT_AVAILABLE
  let gpsRunning = false
  let seq = 0
  let dropped = 0
  let intervalMs = DEFAULT_INTERVAL_MS
  let greeted = false
  let stopped = false
  /** `needs_device` only: set once the user has been through the picker. */
  let deviceChosen = false

  // Epoch seconds at "app start", exactly as the device derives its session
  // id. It is what the phone dedupes on, so the mock has to have one.
  const sessionId = Math.floor(Date.now() / 1000)

  const origin = options.origin ?? DEFAULT_ORIGIN

  const emit = (event: Parameters<GarminLinkListener>[0]) => {
    if (!stopped && listener) {
      listener(event)
    }
  }

  const log = (line: string) => emit({ type: 'log', line: `[mock] ${line}` })

  const later = (ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers = timers.filter(t => t !== id)
      if (!stopped) {
        fn()
      }
    }, ms)
    timers.push(id)
    return id
  }

  const isPaused = () => scenario === 'paused'

  const sendReady = () =>
    emit({
      type: 'message',
      payload: {
        t: 'ready',
        v: PROTOCOL_VERSION,
        sid: sessionId,
        q: quality,
        gps: gpsRunning ? 1 : 0,
        mb: 1,
        st: isPaused() ? 'paused' : 'live',
        ms: intervalMs,
        n: seq,
        drop: dropped,
      },
    })

  const sendPoint = () => {
    // A flaky link loses roughly one point in five. The device counts it and
    // moves on -- nothing is retried -- so `n` keeps climbing and the gap is
    // what tells the phone a point went missing.
    seq += 1
    if (scenario === 'flaky' && Math.random() < 0.2) {
      dropped += 1
      return
    }

    const payload: Record<string, unknown> = {
      t: 'pt',
      sid: sessionId,
      n: seq,
      // Seven decimal places is about a centimetre. Sent as text here because
      // that is what the device does: SAFE_COORDS in GpsService.mc formats
      // them with "%.7f" to keep 64-bit Doubles off the link. A mock that
      // sent numbers would hide the one parsing bug that matters.
      lat: (origin[1] + jitter(4)).toFixed(7),
      lon: (origin[0] + jitter(4)).toFixed(7),
      alt: Number((812 + Math.random() * 4).toFixed(1)),
      q: quality,
      ts: Math.floor(Date.now() / 1000),
      spd: 0.1,
    }
    emit({ type: 'message', payload })
  }

  const stopTimers = () => {
    if (streamTimer) {
      clearInterval(streamTimer)
      streamTimer = null
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  /**
   * Run the cadence the device runs.
   *
   * One parcel per tick and never two, same as the device: while points are
   * flowing they *are* the heartbeat and `ready` goes quiet, and `ready` only
   * comes back when there is nothing to send -- paused, or no fix yet.
   */
  const runStream = () => {
    stopTimers()
    if (!greeted) {
      return
    }

    streamTimer = setInterval(() => {
      if (stopped) {
        return
      }
      if (isPaused() || !gpsRunning || quality === GarminQuality.NOT_AVAILABLE) {
        return
      }
      sendPoint()
    }, intervalMs)

    heartbeatTimer = setInterval(() => {
      if (stopped) {
        return
      }
      if (isPaused() || !gpsRunning || quality === GarminQuality.NOT_AVAILABLE) {
        sendReady()
      }
    }, HEARTBEAT_MS)
  }

  /** Walk the quality up the way a real receiver converges. */
  const climb = (ceiling: GarminQuality, step: number) => {
    gpsRunning = true
    const tick = () => {
      if (quality < ceiling) {
        quality = (quality + 1) as GarminQuality
        later(step, tick)
      }
    }
    later(step, tick)
  }

  /**
   * The device is here: say so, check the app, and let the fix converge.
   *
   * Split out because two paths reach it. `start` does, and so does
   * `chooseDevice` when the user comes back from the Garmin Connect picker
   * that only exists on iOS.
   */
  const announceDevice = () => {
    emit({ type: 'device', name: deviceName, connected: true })

    later(400, () => {
      if (scenario === 'app_missing') {
        emit({ type: 'app', installed: false, detail: 'not installed' })
        emit({
          type: 'blocked',
          reason: 'app_missing',
          detail: 'device app not installed',
        })
        return
      }

      emit({ type: 'app', installed: true, detail: 'installed v1' })

      if (scenario !== 'asleep') {
        later(600, () => climb(ceilingQuality(), 900))
      }
    })
  }

  return {
    name: `mock (${scenario})`,

    start(next) {
      listener = next
      stopped = false
      quality = GarminQuality.NOT_AVAILABLE
      gpsRunning = false
      seq = 0
      dropped = 0
      greeted = false
      intervalMs = DEFAULT_INTERVAL_MS
      log(`starting, scenario "${scenario}"`)

      // A device whose app is open has kept its receiver warm, which is the
      // premise of the whole design: the fix is already converged before the
      // phone arrives. So it must be warm BEFORE the first `ready` goes out.
      // Only `asleep` starts cold, because that is what it is for.
      if (scenario !== 'asleep') {
        quality = startingQuality()
        gpsRunning = true
      }

      later(700, () => {
        if (scenario === 'no_garmin_connect') {
          emit({ type: 'sdk', ready: false, detail: 'SERVICE_UNAVAILABLE' })
          emit({
            type: 'blocked',
            reason: 'no_garmin_connect',
            detail: 'Garmin Connect is not installed or is signed out',
          })
          return
        }

        emit({ type: 'sdk', ready: true, detail: 'ready' })

        later(500, () => {
          if (scenario === 'no_device') {
            emit({ type: 'device', name: null, connected: false })
            emit({
              type: 'blocked',
              reason: 'no_device',
              detail: 'no paired device',
            })
            return
          }

          // The iOS dead end, and the only one the user clears from inside
          // this screen: nothing is wrong, the app has simply never been told
          // which device it may talk to. `chooseDevice` is what answers it.
          if (scenario === 'needs_device' && !deviceChosen) {
            emit({ type: 'device', name: null, connected: false })
            emit({
              type: 'blocked',
              reason: 'needs_device',
              detail: 'no device shared with this app yet',
            })
            return
          }

          announceDevice()
        })
      })
    },

    send(command: GarminCommand) {
      log(`-> ${command.c}`)

      if (command.c === 'rate') {
        intervalMs = Math.min(
          MAX_INTERVAL_MS,
          Math.max(MIN_INTERVAL_MS, command.ms),
        )
        later(250, () => {
          sendReady()
          runStream()
        })
        return
      }

      // hello and ping both answer with state. hello is also what opens the
      // tap: before it, a real device sends nothing at all.
      if (scenario === 'asleep' && !gpsRunning) {
        return
      }
      const first = !greeted
      greeted = true
      later(250, () => {
        sendReady()
        if (first) {
          runStream()
        }
      })
    },

    openWatchApp() {
      log('-> openApplication')
      // A cold start on a real device runs to tens of seconds. Four is enough
      // to make the waiting state visible without making it tedious to test.
      later(4000, () => {
        gpsRunning = true
        // A device that has just woken reports usable, not stale. The cold
        // wait is the realistic part of this path; making the user watch a bad
        // number afterwards only teaches them to distrust the readout.
        quality = startingQuality()
        greeted = true
        sendReady()
        climb(ceilingQuality(), 1400)
        runStream()
      })
    },

    openStore() {
      log('-> openStore (does nothing in the mock)')
    },

    chooseDevice() {
      // On a real iPhone this leaves TreeMapper entirely: Garmin Connect comes
      // up, the user ticks a device, and the answer arrives later as a URL.
      // The wait is what the screen has to survive, so the mock takes its time
      // rather than answering instantly.
      log('-> showConnectIQDeviceSelection')
      later(1500, () => {
        deviceChosen = true
        announceDevice()
      })
    },

    stop() {
      stopped = true
      stopTimers()
      timers.forEach(clearTimeout)
      timers = []
      listener = null
    },
  }
}
