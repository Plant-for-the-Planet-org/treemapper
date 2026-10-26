import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createGarminTransport,
  DEFAULT_INTERVAL_MS,
  GarminBlocker,
  GarminLinkEvent,
  GarminPoint,
  GarminQuality,
  GarminTransport,
  hello,
  parseMessage,
  ping,
  setRate,
  unwrap,
} from 'src/garmin'

/**
 * Drives one streaming session with the Garmin device.
 *
 * The shape of this is a platform limit, not a preference.
 * `Position.enableLocationEvents()` is restricted to device apps and widgets,
 * so a Connect IQ background service cannot turn the receiver on. The device
 * app has to be in the foreground to produce a fresh fix. The phone can launch
 * it remotely, but that costs the whole cold acquisition, which runs to tens
 * of seconds under canopy.
 *
 * So there are two waits worth designing for, and both are states here: the
 * device app is closed (`waking`), and the receiver is running but has not
 * converged (`acquiring`). Showing the live quality through both is what makes
 * a long wait legible instead of looking frozen.
 *
 * **Version 2 of the protocol made this a stream.** Once `hello` has gone out
 * the device posts its position every second, unasked, until the user pauses
 * it on the device or closes its app. Three things follow from that, and they
 * are the whole reason this file is not the request/response hook it replaced:
 *
 *  1. **Nothing is requested and nothing is acknowledged.** A point that does
 *     not make it is gone; by the time a retry went out there would already be
 *     a fresher point waiting. What replaces the delivery guarantee is
 *     liveness, which is why `sinceLastPoint` and `healthy` exist and are the
 *     numbers the screen leans on.
 *  2. **The phone stops pinging once points flow.** The device can transmit
 *     one parcel per tick, so a ping that provokes a `ready` costs a point.
 *     Points carry the quality anyway, so there is nothing to ask for.
 *  3. **The user decides what to keep.** The hook never hands a point
 *     anywhere by itself. It keeps the latest one on `state.point` and the
 *     screen records it when the person says so.
 */

export type GarminPhase =
  /** Starting the SDK and finding the device. */
  | 'connecting'
  /** Listening, greeting sent, waiting to hear back. */
  | 'greeting'
  /** The device app was not answering. Launching it and waiting. */
  | 'waking'
  /** Receiver running, no usable position arriving yet. */
  | 'acquiring'
  /** Points are landing. The normal state. */
  | 'streaming'
  /** The user paused the stream on the device. Only they can resume it. */
  | 'paused'
  /** A dead end that needs the user to fix something. */
  | 'blocked'
  /** Something failed but trying again is reasonable. */
  | 'failed'

export interface GarminStreamState {
  phase: GarminPhase
  quality: GarminQuality
  gpsRunning: boolean
  multiBand: boolean
  deviceName: string | null
  blocker: GarminBlocker | null
  /** One line for the user. Always set for `blocked` and `failed`. */
  message: string
  /** The most recent position. Replaced every interval, never queued. */
  point: GarminPoint | null
  /** Milliseconds since a point last landed, or null if none ever has. */
  sinceLastPoint: number | null
  /** True while points are arriving on time. The liveness signal. */
  healthy: boolean
  /** Points this phone actually received. */
  received: number
  /**
   * Points the device sent that never arrived, counted from gaps in its
   * sequence number. Distinct from `dropped`, which is what the device itself
   * could not hand to the radio.
   */
  missed: number
  /** The device's own drop counter, from `ready`. See PROTOCOL.md. */
  dropped: number
  /** The interval the device is actually streaming at. */
  intervalMs: number
  /** Seconds since this session started, for the waiting counter. */
  elapsed: number
}

/** How long silence after the greeting means "the device app is closed". */
const GREETING_SILENCE_MS = 2500

/** A cold multi-band fix can take this long under canopy. */
const ACQUIRE_LIMIT_MS = 90_000

const PING_INTERVAL_MS = 2500

/** How often the screen re-reads the clock, for the liveness counter. */
const TICK_MS = 500

/**
 * How late a point can be before the stream counts as unhealthy.
 *
 * Three intervals, with a floor, because one missed parcel is ordinary on a
 * Bluetooth link relayed through Garmin Connect and should not flash a warning
 * at somebody holding a phone over a seedling.
 */
const staleAfter = (intervalMs: number) => Math.max(3 * intervalMs, 3000)

const initialState: GarminStreamState = {
  phase: 'connecting',
  quality: GarminQuality.NOT_AVAILABLE,
  gpsRunning: false,
  multiBand: false,
  deviceName: null,
  blocker: null,
  message: '',
  point: null,
  sinceLastPoint: null,
  healthy: false,
  received: 0,
  missed: 0,
  dropped: 0,
  intervalMs: DEFAULT_INTERVAL_MS,
  elapsed: 0,
}

const blockerMessage = (reason: GarminBlocker): string => {
  switch (reason) {
    case 'no_garmin_connect':
      return 'TreeMapper reaches your Garmin through Garmin Connect. Install it, sign in, and pair your device there first.'
    case 'no_device':
      return 'No Garmin device is paired. Open Garmin Connect and pair one, then try again.'
    case 'needs_device':
      // iPhone only, and once per install. The words avoid "pair": the device
      // is already paired with the phone, and the question is only which of
      // them TreeMapper may read.
      return 'Choose which Garmin TreeMapper may use. Garmin Connect will open so you can pick it, then bring you back.'
    case 'device_offline':
      return 'Your Garmin is paired but not connected. Bring it closer and check Bluetooth is on.'
    case 'app_missing':
      return 'TreeMapper GPS is not installed on your Garmin yet.'
    case 'unsupported':
      return 'Connecting to a Garmin is not available on this phone.'
    default:
      return 'Your Garmin cannot be reached.'
  }
}

interface Options {
  /** Where the user is, as [lng, lat]. Used by the development mock only. */
  origin?: [number, number] | null
}

export const useGarminStream = ({ origin }: Options = {}) => {
  const [active, setActive] = useState(false)
  const [state, setState] = useState<GarminStreamState>(initialState)

  const transportRef = useRef<GarminTransport | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<GarminPhase>('connecting')

  // Dedupe and gap detection, kept as refs because they are written from the
  // transport callback, which runs outside React. A Set of every key seen
  // would grow by 3,600 entries an hour; the stream is monotonic within a
  // session, so the last sequence number is all that is needed.
  const sessionRef = useRef<number | null>(null)
  const lastSeqRef = useRef(0)
  const greetedRef = useRef(false)
  const lastPointAtRef = useRef<number | null>(null)
  const intervalRef = useRef(DEFAULT_INTERVAL_MS)
  const startedAtRef = useRef<number | null>(null)

  const originRef = useRef(origin)
  useEffect(() => {
    originRef.current = origin
  }, [origin])

  const patch = useCallback((next: Partial<GarminStreamState>) => {
    // The ref is written here, not inside the updater: React may invoke an
    // updater more than once, and the listener reads this ref to decide what
    // to do next.
    if (next.phase) {
      phaseRef.current = next.phase
    }
    setState(prev => ({ ...prev, ...next }))
  }, [])

  const stopPinging = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current)
      pingRef.current = null
    }
  }, [])

  const startPinging = useCallback(() => {
    if (pingRef.current) {
      return
    }
    pingRef.current = setInterval(() => {
      transportRef.current?.send(ping())
    }, PING_INTERVAL_MS)
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    stopPinging()
  }, [stopPinging])

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id)
      fn()
    }, ms)
    timersRef.current.push(id)
  }, [])

  const stop = useCallback(() => {
    clearTimers()
    transportRef.current?.stop()
    transportRef.current = null
    sessionRef.current = null
    lastSeqRef.current = 0
    greetedRef.current = false
    lastPointAtRef.current = null
    startedAtRef.current = null
    setActive(false)
  }, [clearTimers])

  /**
   * Launch the device app and keep asking until the receiver is up.
   *
   * Two different things lead here and both have to, which is why it is one
   * function rather than inline in the greeting timer: the device says nothing
   * at all (its app is closed), or it answers with `gps: 0` (its app is open
   * but the receiver is off).
   */
  const beginWaking = useCallback(() => {
    // Guarded on the phase, not on whether a ping is running. Those are not
    // the same question, and conflating them was a bug: arriving here from
    // `acquiring` or `paused` -- both of which ping -- skipped the launch and
    // the timeout alike, and the screen sat on "Starting TreeMapper GPS"
    // forever having neither started it nor given up.
    if (phaseRef.current === 'waking') {
      startPinging()
      return
    }
    patch({ phase: 'waking' })
    transportRef.current?.openWatchApp()
    startPinging()
    after(ACQUIRE_LIMIT_MS, () => {
      if (phaseRef.current === 'waking') {
        patch({
          phase: 'failed',
          message:
            'TreeMapper GPS did not start. Open it on your Garmin, then try again.',
        })
      }
    })
  }, [after, patch, startPinging])

  const acceptPoint = useCallback(
    (point: GarminPoint) => {
      const sameSession = sessionRef.current === point.sessionId
      if (sameSession && point.seq <= lastSeqRef.current) {
        // A duplicate. The Android SDK is reported to fire both SUCCESS and
        // FAILURE_UNKNOWN for one send on the tethered transport, and nothing
        // downstream should see the same position twice.
        return
      }

      // A gap in the sequence means the device handed a point to the radio and
      // it never arrived. That is worth counting: it and the device's own
      // `drop` should roughly agree, and together they say whether this
      // interval is too fast for this link.
      const gap =
        sameSession && lastSeqRef.current > 0
          ? point.seq - lastSeqRef.current - 1
          : 0

      sessionRef.current = point.sessionId
      lastSeqRef.current = point.seq
      lastPointAtRef.current = Date.now()

      // Points are the heartbeat. Pinging on top of them would cost one: the
      // device can transmit a single parcel per tick, so every `ready` it
      // sends to answer us is a position it did not send.
      stopPinging()

      setState(prev => ({
        ...prev,
        phase: 'streaming',
        point,
        quality: point.quality,
        gpsRunning: true,
        received: prev.received + 1,
        missed: prev.missed + Math.max(0, gap),
        sinceLastPoint: 0,
        healthy: true,
        blocker: null,
        message: '',
      }))
      phaseRef.current = 'streaming'
    },
    [stopPinging],
  )

  const handleEvent = useCallback(
    (event: GarminLinkEvent) => {
      switch (event.type) {
        case 'log':
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('[garmin]', event.line)
          }
          return

        case 'sdk':
          return

        case 'device':
          patch({ deviceName: event.name })
          if (!event.name || !event.connected || greetedRef.current) {
            return
          }
          // Greet on the first connected device, whatever state the screen
          // was in. The case that matters is the user who opened this out of
          // range, saw "paired but not connected", and then walked closer:
          // gating the greeting on `connecting` left them stuck looking at a
          // blocker that had already cleared itself.
          greetedRef.current = true
          patch({ phase: 'greeting', blocker: null, message: '' })
          // This is what opens the tap. The device holds everything until the
          // companion app has spoken first, so until this lands it shows
          // "Open TreeMapper on phone" and sends nothing.
          transportRef.current?.send(hello())
          // Silence here means the device app is closed. It is the normal
          // case, not an error: launch it and settle in for the wait.
          after(GREETING_SILENCE_MS, () => {
            if (phaseRef.current === 'greeting') {
              beginWaking()
            }
          })
          return

        case 'app':
          return

        case 'blocked':
          // Losing the device mid-session is a different thing from never
          // having found one. If a position is already on screen it stays
          // there, marked stale by the liveness line, rather than being
          // replaced by an error page: that coordinate is still the best the
          // user has. Either way the greeting is armed again, so walking back
          // into range picks the stream up with nothing to press.
          if (event.reason === 'device_offline') {
            greetedRef.current = false
            stopPinging()
            if (lastPointAtRef.current !== null) {
              patch({
                blocker: 'device_offline',
                message: blockerMessage('device_offline'),
              })
              return
            }
          }
          clearTimers()
          patch({
            phase: 'blocked',
            blocker: event.reason,
            message: blockerMessage(event.reason),
          })
          return

        case 'message': {
          const payload = unwrap(event.payload)
          if (!payload) {
            return
          }
          const message = parseMessage(payload)

          if (message.t === 'ready') {
            intervalRef.current = message.intervalMs
            patch({
              quality: message.quality,
              gpsRunning: message.gpsRunning,
              multiBand: message.multiBand,
              intervalMs: message.intervalMs,
              dropped: message.dropped,
            })

            if (message.state === 'paused') {
              // The phone cannot undo this. Say who can, and keep the ping
              // going so the screen notices the moment they resume.
              patch({ phase: 'paused', message: '' })
              startPinging()
              return
            }

            if (!message.gpsRunning) {
              beginWaking()
              return
            }

            // Points outrank `ready`. A heartbeat arriving between two points
            // must not drag a working stream back to "acquiring". The clock
            // check and not just the phase, because resuming from `paused`
            // arrives as a `ready` while positions are already landing again.
            const last = lastPointAtRef.current
            const flowing =
              last !== null && Date.now() - last < staleAfter(intervalRef.current)
            if (phaseRef.current === 'streaming' || flowing) {
              return
            }

            patch({ phase: 'acquiring' })
            startPinging()
            return
          }

          if (message.t === 'pt') {
            acceptPoint(message)
          }
          return
        }

        default:
          return
      }
    },
    [acceptPoint, after, beginWaking, clearTimers, patch, startPinging, stopPinging],
  )

  const start = useCallback(() => {
    stop()
    setState({ ...initialState })
    phaseRef.current = 'connecting'
    intervalRef.current = DEFAULT_INTERVAL_MS
    startedAtRef.current = Date.now()
    greetedRef.current = false

    const transport = createGarminTransport({ origin: originRef.current })
    if (!transport) {
      patch({
        phase: 'blocked',
        blocker: 'unsupported',
        message: blockerMessage('unsupported'),
      })
      setActive(true)
      return
    }
    transportRef.current = transport
    setActive(true)
    transport.start(handleEvent)
  }, [handleEvent, patch, stop])

  const retry = useCallback(() => {
    start()
  }, [start])

  const installWatchApp = useCallback(() => {
    transportRef.current?.openStore()
  }, [])

  /**
   * Send the user to Garmin Connect to pick a device. iPhone only.
   *
   * It backgrounds TreeMapper, so nothing may be queued behind it and no timer
   * started here would be trustworthy. The answer comes back into the native
   * module, which binds the device and emits an ordinary `device` event, so
   * this session simply carries on from the greeting as though the device had
   * walked into range.
   */
  const chooseDevice = useCallback(() => {
    transportRef.current?.chooseDevice()
  }, [])

  /**
   * Ask the device to stream slower, or faster.
   *
   * The device clamps to 500..60000 ms and confirms what it adopted in its
   * next `ready`, so never assume the request was honoured. This exists
   * because the right interval is a property of the link, not of the app: if
   * `dropped` climbs steadily against a healthy `received`, 1 Hz is too fast
   * for this phone and this device, and the fix is a message rather than a new
   * build of either side.
   */
  const retune = useCallback((intervalMs: number) => {
    transportRef.current?.send(setRate(intervalMs))
  }, [])

  /**
   * The liveness clock.
   *
   * It ticks locally rather than off the messages, because the whole point is
   * to notice when messages stop. A screen driven only by arrivals looks
   * perfectly healthy at the moment the link dies.
   */
  useEffect(() => {
    if (!active) {
      return
    }
    const id = setInterval(() => {
      const now = Date.now()
      const last = lastPointAtRef.current
      const since = last === null ? null : now - last
      const healthy = since !== null && since < staleAfter(intervalRef.current)
      const startedAt = startedAtRef.current
      const elapsed = startedAt === null ? 0 : Math.floor((now - startedAt) / 1000)

      // A stream that has gone quiet needs the ping back on: `ready` is the
      // only thing that can tell us whether the device paused, lost its fix,
      // or walked out of range. Done here and not inside the updater below,
      // because React may run an updater more than once.
      if (!healthy && phaseRef.current === 'streaming' && since !== null) {
        startPinging()
      }

      setState(prev => ({ ...prev, sinceLastPoint: since, healthy, elapsed }))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [active, startPinging])

  useEffect(() => stop, [stop])

  return {
    active,
    state,
    start,
    stop,
    retry,
    retune,
    installWatchApp,
    chooseDevice,
  }
}

export default useGarminStream
