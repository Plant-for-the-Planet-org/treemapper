import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createGarminTransport,
  errorText,
  GarminBlocker,
  GarminLinkEvent,
  GarminPoint,
  GarminQuality,
  GarminTransport,
  hello,
  parseMessage,
  ping,
  requestFix,
  unwrap,
  USABLE_QUALITY,
} from 'src/garmin'

/**
 * Drives one "get a point from the Garmin" session.
 *
 * The order of operations is PROTOCOL.md's suggested phone flow, and the
 * reason it is shaped this way is a platform limit, not a preference:
 * `Position.enableLocationEvents()` is restricted to device apps and widgets,
 * so a Connect IQ background service cannot turn the receiver on. The device
 * app has to be in the foreground to produce a fresh fix. The phone can launch
 * it remotely, but that costs the whole cold acquisition, which runs to tens
 * of seconds under canopy.
 *
 * So there are two waits worth designing for, and both are states here:
 * the device app is closed (`waking`), and the receiver is running but has not
 * converged (`acquiring`). Showing the live quality through both is what makes
 * a long wait legible instead of looking frozen.
 */

export type GarminPhase =
  /** Starting the SDK and finding the device. */
  | 'connecting'
  /** Listening, greeting sent, waiting to hear back. */
  | 'greeting'
  /** The device app was not answering. Launching it and waiting. */
  | 'waking'
  /** Receiver running, still converging. */
  | 'acquiring'
  /** Good enough to ask for a point. */
  | 'ready'
  /** Point requested, waiting for it to arrive. */
  | 'requesting'
  /** A point is in hand. */
  | 'received'
  /** A dead end that needs the user to fix something. */
  | 'blocked'
  /** Something failed but trying again is reasonable. */
  | 'failed'

export interface GarminFixState {
  phase: GarminPhase
  quality: GarminQuality
  gpsRunning: boolean
  multiBand: boolean
  deviceName: string | null
  blocker: GarminBlocker | null
  /** One line for the user. Always set for `blocked` and `failed`. */
  message: string
  point: GarminPoint | null
  /** Seconds since this session started, for the waiting counter. */
  elapsed: number
  /** True once the SDK is up and a point can be asked for at all. */
  canRequest: boolean
}

/** How long silence after the greeting means "the device app is closed". */
const GREETING_SILENCE_MS = 2500

/** A cold multi-band fix can take this long under canopy. */
const ACQUIRE_LIMIT_MS = 90_000

/** Long enough for a slow link, short enough to not look hung. */
const FIX_TIMEOUT_MS = 20_000

const PING_INTERVAL_MS = 2500

const initialState: GarminFixState = {
  phase: 'connecting',
  quality: GarminQuality.NOT_AVAILABLE,
  gpsRunning: false,
  multiBand: false,
  deviceName: null,
  blocker: null,
  message: '',
  point: null,
  elapsed: 0,
  canRequest: false,
}

const blockerMessage = (reason: GarminBlocker): string => {
  switch (reason) {
    case 'no_garmin_connect':
      return 'TreeMapper reaches your Garmin through Garmin Connect. Install it, sign in, and pair your device there first.'
    case 'no_device':
      return 'No Garmin device is paired. Open Garmin Connect and pair one, then try again.'
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
  /** Called once, with the point the device sent. */
  onPoint: (point: GarminPoint) => void
}

export const useGarminFix = ({ origin, onPoint }: Options) => {
  const [active, setActive] = useState(false)
  const [state, setState] = useState<GarminFixState>(initialState)

  const transportRef = useRef<GarminTransport | null>(null)
  const requestIdRef = useRef(0)
  const pendingRequestRef = useRef<number | null>(null)
  const seenSeqRef = useRef<Set<number>>(new Set())
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<GarminPhase>('connecting')

  // The transport fires from outside React, so the handler must not close over
  // a stale callback. Everything the listener needs goes through a ref.
  const onPointRef = useRef(onPoint)
  useEffect(() => {
    onPointRef.current = onPoint
  }, [onPoint])

  const originRef = useRef(origin)
  useEffect(() => {
    originRef.current = origin
  }, [origin])

  const patch = useCallback((next: Partial<GarminFixState>) => {
    // The ref is written here, not inside the updater: React may invoke an
    // updater more than once, and the listener reads this ref to decide what
    // to do next.
    if (next.phase) {
      phaseRef.current = next.phase
    }
    setState(prev => ({ ...prev, ...next }))
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (pingRef.current) {
      clearInterval(pingRef.current)
      pingRef.current = null
    }
  }, [])

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
    pendingRequestRef.current = null
    seenSeqRef.current = new Set()
    setActive(false)
  }, [clearTimers])

  /**
   * Launch the device app and keep asking until the receiver is up.
   *
   * Two different things lead here and both have to, which is why it is one
   * function rather than inline in the greeting timer: the device says nothing
   * at all (its app is closed), or it answers with `gps: 0` (its app is open
   * but the receiver is off). Only the first was handled before, so the second
   * sat in `waking` with nothing pinging it and no way out.
   */
  const beginWaking = useCallback(() => {
    patch({ phase: 'waking' })
    if (pingRef.current) {
      return
    }
    transportRef.current?.openWatchApp()
    pingRef.current = setInterval(() => {
      transportRef.current?.send(ping())
    }, PING_INTERVAL_MS)
    after(ACQUIRE_LIMIT_MS, () => {
      if (phaseRef.current === 'waking') {
        patch({
          phase: 'failed',
          message:
            'TreeMapper GPS did not start. Open it on your Garmin, then try again.',
        })
      }
    })
  }, [after, patch])

  /** Ask for a point now. Allowed below usable quality: the user decides. */
  const askForPoint = useCallback(() => {
    const transport = transportRef.current
    if (!transport) {
      return
    }
    requestIdRef.current += 1
    const id = requestIdRef.current
    pendingRequestRef.current = id
    patch({ phase: 'requesting', message: '' })
    transport.send(requestFix(id))
    after(FIX_TIMEOUT_MS, () => {
      if (pendingRequestRef.current === id) {
        pendingRequestRef.current = null
        patch({
          phase: 'failed',
          message:
            'Your Garmin did not answer. Check it is still in range and try again.',
        })
      }
    })
  }, [after, patch])

  const acceptPoint = useCallback(
    (point: GarminPoint) => {
      // `n` restarts at 1 whenever the device app opens, so it is not a durable
      // id. Within one modal session it is enough to catch the duplicate the
      // protocol warns about: a lost acknowledgement followed by a retry.
      if (seenSeqRef.current.has(point.seq)) {
        return
      }
      seenSeqRef.current.add(point.seq)
      pendingRequestRef.current = null
      clearTimers()
      patch({ phase: 'received', point, quality: point.quality })
      onPointRef.current(point)
    },
    [clearTimers, patch],
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
          if (event.ready) {
            patch({ canRequest: true })
          }
          return

        case 'device':
          patch({ deviceName: event.name })
          if (event.name && event.connected && phaseRef.current === 'connecting') {
            patch({ phase: 'greeting' })
            transportRef.current?.send(hello())
            // Silence here means the device app is closed. It is the normal
            // case, not an error: launch it and settle in for the wait.
            after(GREETING_SILENCE_MS, () => {
              if (phaseRef.current === 'greeting') {
                beginWaking()
              }
            })
          }
          return

        case 'app':
          return

        case 'blocked':
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
            patch({
              quality: message.quality,
              gpsRunning: message.gpsRunning,
              multiBand: message.multiBand,
            })
            // A fix request that is already in flight owns the phase; a ready
            // arriving mid-request must not drag the UI backwards.
            if (
              phaseRef.current === 'requesting' ||
              phaseRef.current === 'received'
            ) {
              return
            }
            if (!message.gpsRunning) {
              beginWaking()
              return
            }
            // Keep the ping running. The device sends `ready` only in answer
            // to `hello` or `ping`, never on its own, so stopping here would
            // freeze the quality readout at whatever arrived first. It stops
            // when the session does, in clearTimers.
            if (!pingRef.current) {
              pingRef.current = setInterval(() => {
                transportRef.current?.send(ping())
              }, PING_INTERVAL_MS)
            }
            patch({
              phase:
                message.quality >= USABLE_QUALITY ? 'ready' : 'acquiring',
            })
            return
          }

          if (message.t === 'pt') {
            // A point with no request id came from the device's own button.
            // Take it: the user pressed START over there, which is the same
            // intent as pressing it here.
            const answersUs =
              message.requestId === null ||
              message.requestId === pendingRequestRef.current
            if (answersUs) {
              acceptPoint(message)
            }
            return
          }

          if (message.t === 'err') {
            pendingRequestRef.current = null
            patch({ phase: 'failed', message: errorText(message.code) })
          }
          return
        }

        default:
          return
      }
    },
    [acceptPoint, after, beginWaking, clearTimers, patch],
  )

  const start = useCallback(() => {
    stop()
    setState({ ...initialState })
    phaseRef.current = 'connecting'
    requestIdRef.current = 0

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

  // The elapsed counter ticks locally. Quality only moves when a message
  // lands, which on a cold start can be seconds apart, and a frozen counter
  // reads as a stall even when the link is fine.
  useEffect(() => {
    if (!active || state.phase === 'received') {
      return
    }
    const id = setInterval(() => {
      setState(prev => ({ ...prev, elapsed: prev.elapsed + 1 }))
    }, 1000)
    return () => clearInterval(id)
  }, [active, state.phase])

  useEffect(() => stop, [stop])

  return {
    active,
    state,
    start,
    stop,
    retry,
    askForPoint,
    installWatchApp,
  }
}

export default useGarminFix
