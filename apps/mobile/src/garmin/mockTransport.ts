import {
  GarminCommand,
  GarminQuality,
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
 * This exists so the whole modal -- every state, every dead end, the timing of
 * the waits -- can be built and reviewed before the native Connect IQ module
 * is written. It speaks the real protocol, in the real order, at roughly real
 * Bluetooth speeds, and it is never reachable in a release build (see
 * `createGarminTransport`).
 *
 * It imitates the SDK's awkward parts on purpose, because those are what the
 * UI has to survive: nothing answers before the SDK is ready, the first
 * `ready` arrives on a timer rather than immediately, and a sleeping device
 * simply says nothing at all until `openWatchApp` wakes it.
 */

export type MockScenario =
  /** Device app already open, receiver warm. The common case in the field. */
  | 'happy'
  /** Device app closed. Needs openApplication, then a cold acquire. */
  | 'asleep'
  /** Under canopy. Quality climbs to 2 and stops there. */
  | 'poor'
  /** Nothing paired in Garmin Connect. */
  | 'no_device'
  /** Garmin Connect Mobile missing or signed out. */
  | 'no_garmin_connect'
  /** Paired device, but the TreeMapper device app is not installed. */
  | 'app_missing'
  /** Device answers the fix request with `no_position`. */
  | 'no_position'

let scenario: MockScenario = 'happy'

/**
 * The device the simulation claims to be, shown in the modal subtitle.
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

export const createMockTransport = (
  options: GarminTransportOptions = {},
): GarminTransport => {
  let listener: GarminLinkListener | null = null
  let timers: ReturnType<typeof setTimeout>[] = []
  let quality: GarminQuality = GarminQuality.NOT_AVAILABLE
  let gpsRunning = false
  let seq = 0
  let stopped = false

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

  const sendReady = () =>
    emit({
      type: 'message',
      payload: {
        t: 'ready',
        v: PROTOCOL_VERSION,
        q: quality,
        gps: gpsRunning ? 1 : 0,
        mb: 1,
        buf: 0,
      },
    })

  /**
   * Walk the quality up the way a real receiver converges.
   *
   * This only moves the number. It deliberately does NOT send anything: the
   * real device answers `hello` and `ping` and is otherwise silent, so a mock
   * that broadcasts its own updates would let a phone bug through -- a modal
   * that stops polling would still look alive here and freeze in the field.
   */
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

  const sendPoint = (requestId: number | null, source: 'phone' | 'watch') => {
    seq += 1
    const payload: Record<string, unknown> = {
      t: 'pt',
      n: seq,
      src: source,
      // Seven decimal places is about a centimetre. Sent as a number here;
      // the parser takes text too, because the device may send either.
      lat: Number((origin[1] + jitter(8)).toFixed(7)),
      lon: Number((origin[0] + jitter(8)).toFixed(7)),
      alt: Number((812 + Math.random() * 4).toFixed(1)),
      q: quality,
      ts: Math.floor(Date.now() / 1000),
      spd: 0.1,
    }
    // Optional fields are absent, not null. Matching that here is what keeps
    // the parser honest: a mock that always sends every key would hide a
    // missing-key bug until a real device found it.
    if (requestId !== null) {
      payload.r = requestId
    }
    emit({ type: 'message', payload })
  }

  return {
    name: `mock (${scenario})`,

    start(next) {
      listener = next
      stopped = false
      quality = GarminQuality.NOT_AVAILABLE
      gpsRunning = false
      seq = 0
      log(`starting, scenario "${scenario}"`)

      // A device whose app is open has kept its receiver warm, which is the
      // premise of the whole design: the fix is already converged before the
      // phone asks. So it must be warm BEFORE the first `ready` goes out --
      // warming it on a timer afterwards made the greeting answer "No fix"
      // and flashed that at the user for a moment. Only `asleep` starts cold,
      // because that is what it is for.
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

            // A device that is already open answers the greeting. A sleeping
            // one says nothing at all, and the modal has to notice the
            // silence itself. That silence is the whole point of this branch.
            if (scenario !== 'asleep') {
              later(600, () => climb(ceilingQuality(), 900))
            }
          })
        })
      })
    },

    send(command: GarminCommand) {
      log(`-> ${command.c}`)
      if (command.c === 'hello' || command.c === 'ping') {
        if (gpsRunning || scenario !== 'asleep') {
          later(250, sendReady)
        }
        return
      }
      later(500, () => {
        if (scenario === 'no_position' || quality === GarminQuality.NOT_AVAILABLE) {
          emit({
            type: 'message',
            payload: { t: 'err', r: command.r, code: 'no_position' },
          })
          return
        }
        sendPoint(command.r, 'phone')
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
        // The one unsolicited message the real device sends: `ready` on app
        // start. Everything after this is an answer to a ping.
        sendReady()
        climb(ceilingQuality(), 1400)
      })
    },

    openStore() {
      log('-> openStore (does nothing in the mock)')
    },

    stop() {
      stopped = true
      timers.forEach(clearTimeout)
      timers = []
      listener = null
    },
  }
}
