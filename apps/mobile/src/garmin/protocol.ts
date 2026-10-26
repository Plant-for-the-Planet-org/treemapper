/**
 * The TreeMapper device protocol, version 2.
 *
 * This mirrors PROTOCOL.md in Plant-for-the-Planet-org/treemapper-garmin, and
 * the Kotlin reference in that repo's `android-demo/.../Protocol.kt`. Keep the
 * three in step. The device app is the one that ships to users through the
 * Connect IQ store, so this side moves to match it, never the other way round.
 *
 * **Version 2 replaced request/response with a stream.** The device no longer
 * waits to be asked: once the phone has said `hello` it posts its position
 * every interval, one second by default, for as long as its app is open and
 * not paused. So `fix` and `err` are gone, `rate` is new, and a point now
 * carries a session id instead of a request id.
 *
 * Everything here is pure: no React, no native module, no clock. That is what
 * lets the mock transport and the native one share one parser.
 *
 * A note on vocabulary, because the mix is deliberate: this file says "watch"
 * wherever PROTOCOL.md does, so the two can be read side by side. Connect IQ
 * also runs on handhelds such as the GPSMAP, which is what field teams
 * actually carry, so everything the user reads says "device" or "your Garmin"
 * instead. Do not reconcile the two by renaming the wire.
 */

/** Must match `id` in the watch project's manifest.xml. */
export const WATCH_APP_ID = 'a7f3c81e6b2d4f9ea05c73819d4e6b21'

export const PROTOCOL_VERSION = 2

/** What the device streams at unless the phone asks for something else. */
export const DEFAULT_INTERVAL_MS = 1000

/** The device clamps anything outside this range. */
export const MIN_INTERVAL_MS = 500
export const MAX_INTERVAL_MS = 60000

/**
 * `Position.Quality`, the only accuracy signal Connect IQ gives. There is no
 * metric accuracy on the device, unlike Android which reports metres, so this
 * enum is all the phone has to judge a fix by.
 */
export enum GarminQuality {
  NOT_AVAILABLE = 0,
  LAST_KNOWN = 1,
  POOR = 2,
  USABLE = 3,
  GOOD = 4,
}

/**
 * The bar for "this position is worth recording without a warning". Below it
 * the screen warns, but it never blocks: under canopy 2 may be the best
 * available all day, so the user can take the point anyway and is told what
 * they took.
 */
export const USABLE_QUALITY = GarminQuality.USABLE

// ---- phone to watch ---------------------------------------------------

export type GarminCommand =
  | { c: 'hello' }
  | { c: 'ping' }
  | { c: 'rate'; ms: number }

/**
 * Identify, and start the stream.
 *
 * The device never speaks first: it holds everything until the companion app
 * has sent it at least one message. So this is not a formality, it is the
 * thing that opens the tap.
 */
export const hello = (): GarminCommand => ({ c: 'hello' })

export const ping = (): GarminCommand => ({ c: 'ping' })

/** Retune the stream interval. The device clamps and confirms in `ready`. */
export const setRate = (intervalMs: number): GarminCommand => ({
  c: 'rate',
  ms: Math.round(
    Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, intervalMs)),
  ),
})

// ---- watch to phone ---------------------------------------------------

/** `live` or `paused`. Only the device can change it; see `GarminReady`. */
export type GarminStreamState = 'live' | 'paused'

export interface GarminReady {
  t: 'ready'
  version: number
  /** Epoch seconds at device app start. Changes on every restart. */
  sessionId: number
  quality: GarminQuality
  /** True when the GNSS receiver is actually running on the device. */
  gpsRunning: boolean
  /** True when this device gave a multi-band (L1 + L5) solution. */
  multiBand: boolean
  /**
   * Whether the stream is flowing. Pausing is the user's choice on the
   * device and the phone cannot undo it, so when this reads `paused` the only
   * useful thing the phone can do is say who can resume it.
   */
  state: GarminStreamState
  /** The interval the device actually adopted, in milliseconds. */
  intervalMs: number
  /** Points handed to the radio so far this session. */
  seq: number
  /**
   * Points lost **while the link was up**. It deliberately does not count
   * time with no phone in range, so it keeps meaning one thing: this interval
   * is too fast for this link. Climbing steadily is the cue to send `rate`.
   */
  dropped: number
}

export interface GarminPoint {
  t: 'pt'
  /** Same value on every point of one device-app session. */
  sessionId: number
  /**
   * Sequence within the session, from 1. It counts points handed to the
   * radio, so a gap means one was lost in transit, not that the device
   * skipped it.
   */
  seq: number
  latitude: number
  longitude: number
  /** Metres above mean sea level, or null. */
  altitude: number | null
  quality: GarminQuality
  /** GPS epoch seconds of the fix, not the device clock. */
  timestamp: number
  /** Metres per second, or null. Useful for spotting a moving user. */
  speed: number | null
}

export interface GarminUnknown {
  t: 'unknown'
  raw: Record<string, unknown>
}

export type GarminMessage = GarminReady | GarminPoint | GarminUnknown

/** Key a point on this. See "Deduplication and session identity" in PROTOCOL.md. */
export const pointKey = (point: GarminPoint): string =>
  `${point.sessionId}:${point.seq}`

// ---- lenient number reading -------------------------------------------
//
// Never cast a wire value directly. The Connect IQ SDK's boxing is not
// guaranteed across versions, and the device sends coordinates as text
// (SAFE_COORDS in GpsService.mc) to keep 64-bit Doubles off the link.
//
// A latitude arriving as a 32-bit float instead of a double is the classic
// silent bug here: ~7 significant digits is not enough for 12.3456789, so the
// value stays plausible and is wrong by metres. JavaScript numbers are already
// 64-bit, so the only job on this side is to parse text without losing digits,
// which Number() does exactly.

const numberOf = (v: unknown): number | null => {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : null
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const intOf = (v: unknown): number | null => {
  const n = numberOf(v)
  return n === null ? null : Math.trunc(n)
}

const qualityOf = (v: unknown): GarminQuality => {
  const n = intOf(v) ?? 0
  if (n < 0) return GarminQuality.NOT_AVAILABLE
  if (n > 4) return GarminQuality.GOOD
  return n as GarminQuality
}

/**
 * Pull the payload out of whatever the SDK handed us.
 *
 * The Connect IQ SDK carries a list: a Monkey C Dictionary arrives as a map
 * and an Array as a list, so a message is one map inside a single-element
 * list. It has been seen delivered both bare and wrapped depending on version,
 * so unwrap defensively rather than assuming either.
 *
 * Returns null for a shape we do not understand, which is worth logging rather
 * than swallowing: it usually means the device and the phone disagree about
 * the protocol.
 */
export const unwrap = (data: unknown): Record<string, unknown> | null => {
  if (data === null || data === undefined) {
    return null
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = unwrap(item)
      if (found) {
        return found
      }
    }
    return null
  }
  if (typeof data === 'object') {
    return data as Record<string, unknown>
  }
  return null
}

export const parseMessage = (
  payload: Record<string, unknown>,
): GarminMessage => {
  switch (payload.t) {
    case 'ready':
      return {
        t: 'ready',
        version: intOf(payload.v) ?? 0,
        sessionId: intOf(payload.sid) ?? 0,
        quality: qualityOf(payload.q),
        gpsRunning: (intOf(payload.gps) ?? 0) === 1,
        multiBand: (intOf(payload.mb) ?? 0) === 1,
        state: payload.st === 'paused' ? 'paused' : 'live',
        intervalMs: intOf(payload.ms) ?? DEFAULT_INTERVAL_MS,
        seq: intOf(payload.n) ?? 0,
        dropped: intOf(payload.drop) ?? 0,
      }

    case 'pt': {
      const latitude = numberOf(payload.lat)
      const longitude = numberOf(payload.lon)
      // A point without a usable coordinate is not a point. Reporting it as
      // unknown keeps 0,0 -- which is a real place in the Atlantic -- off the
      // map.
      if (latitude === null || longitude === null) {
        return { t: 'unknown', raw: payload }
      }
      return {
        t: 'pt',
        sessionId: intOf(payload.sid) ?? 0,
        seq: intOf(payload.n) ?? 0,
        latitude,
        longitude,
        altitude: numberOf(payload.alt),
        quality: qualityOf(payload.q),
        timestamp: intOf(payload.ts) ?? 0,
        speed: numberOf(payload.spd),
      }
    }

    default:
      return { t: 'unknown', raw: payload }
  }
}

/**
 * What the user reads, which is not the same as what Connect IQ calls it.
 *
 * The enum names above are Garmin's (`QUALITY_USABLE`, `QUALITY_GOOD`) and
 * they stay as the wire meaning. The words here are the ladder a field user
 * needs: 3 and 4 are both fine to record on -- 3 is the bar this app already
 * treats as ready -- so they read as Good and Excellent rather than as a
 * lukewarm "Usable" that invites second-guessing a fix that is fine.
 */
export const qualityLabel = (q: GarminQuality): string => {
  switch (q) {
    case GarminQuality.GOOD:
      return 'Excellent'
    case GarminQuality.USABLE:
      return 'Good'
    case GarminQuality.POOR:
      return 'Poor'
    case GarminQuality.LAST_KNOWN:
      return 'Stale'
    default:
      return 'No fix'
  }
}

/**
 * The quality as a fraction, for the places a word alone is not enough.
 *
 * Connect IQ gives no accuracy in metres, unlike the phone's own GPS, so there
 * is no number to show and nothing to compare against a phone fix. What there
 * is, is a five-step ladder. Printing the step beside the word keeps the
 * reading honest in both directions: "Good" does not get mistaken for the top
 * of the scale, and "Poor" does not get mistaken for broken.
 */
export const qualityScore = (q: GarminQuality): string =>
  `${q} of ${GarminQuality.GOOD}`

/**
 * Label and score together, as one string: "Excellent (4 of 4)".
 *
 * This is the form that is written into an intervention's metadata, so what a
 * reviewer reads months later is the same phrase the person saw on screen when
 * they pressed the button.
 */
export const qualityDescription = (q: GarminQuality): string =>
  `${qualityLabel(q)} (${qualityScore(q)})`

/** One short line a field user can act on. */
export const qualityHint = (q: GarminQuality): string => {
  switch (q) {
    case GarminQuality.GOOD:
      return 'Strong signal and good precision.'
    case GarminQuality.USABLE:
      return 'Good enough to record this tree.'
    case GarminQuality.POOR:
      return 'Weak signal. Move away from cover if you can.'
    case GarminQuality.LAST_KNOWN:
      return 'An old position, not a live one.'
    default:
      return 'The device has no position yet.'
  }
}

/** "every 1.0 s", for the line that says how fast the stream is running. */
export const intervalLabel = (ms: number): string =>
  ms >= 1000 ? `every ${(ms / 1000).toFixed(1)} s` : `every ${ms} ms`
