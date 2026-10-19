/**
 * The TreeMapper watch protocol, version 1.
 *
 * This mirrors PROTOCOL.md in Plant-for-the-Planet-org/treemapper-garmin, and
 * the Kotlin reference in that repo's `android-demo/.../Protocol.kt`. Keep the
 * three in step. The watch app is already published, so this side moves to
 * match it, never the other way round.
 *
 * Everything here is pure: no React, no native module, no clock. That is what
 * lets the mock transport and the eventual native one share one parser.
 *
 * A note on vocabulary, because the mix is deliberate: this file says "watch"
 * wherever PROTOCOL.md does, so the two can be read side by side, and the wire
 * value `src: "watch"` is spelled that way because the published Connect IQ
 * app sends it. Connect IQ also runs on handhelds such as the GPSMAP, which is
 * what field teams actually carry, so everything the user reads says "device"
 * or "your Garmin" instead. Do not reconcile the two by renaming the wire.
 */

/** Must match `id` in the watch project's manifest.xml. */
export const WATCH_APP_ID = 'a7f3c81e6b2d4f9ea05c73819d4e6b21'

export const PROTOCOL_VERSION = 1

/**
 * `Position.Quality`, the only accuracy signal Connect IQ gives. There is no
 * metric accuracy on the watch, unlike Android which reports metres, so this
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
 * The bar for "ask the device for a point now". Below it the modal keeps
 * waiting, but it never blocks: under canopy 2 may be the best available all
 * day, so the user can take the point anyway and is told what they took.
 */
export const USABLE_QUALITY = GarminQuality.USABLE

// ---- phone to watch ---------------------------------------------------

export type GarminCommand =
  | { c: 'hello' }
  | { c: 'ping' }
  | { c: 'fix'; r: number }

export const hello = (): GarminCommand => ({ c: 'hello' })
export const ping = (): GarminCommand => ({ c: 'ping' })
export const requestFix = (requestId: number): GarminCommand => ({
  c: 'fix',
  r: requestId,
})

// ---- watch to phone ---------------------------------------------------

export interface GarminReady {
  t: 'ready'
  version: number
  quality: GarminQuality
  /** True when the GNSS receiver is actually running on the watch. */
  gpsRunning: boolean
  /** True when this device gave a multi-band (L1 + L5) solution. */
  multiBand: boolean
  /** Always 0. The watch holds nothing; kept for wire compatibility. */
  buffered: number
}

export interface GarminPoint {
  t: 'pt'
  /** Counts from 1 each time the watch app opens. Not stable across restarts. */
  seq: number
  /** The request id this answers, or null when the watch button started it. */
  requestId: number | null
  /**
   * Who started this point. `watch` is the wire value for "the device's own
   * button", and it stays spelled that way because PROTOCOL.md says so -- the
   * published Connect IQ app sends it. Only the words shown to the user say
   * "device".
   */
  source: 'phone' | 'watch' | 'unknown'
  latitude: number
  longitude: number
  /** Metres above mean sea level, or null. */
  altitude: number | null
  quality: GarminQuality
  /** GPS epoch seconds of the fix, not the watch clock. */
  timestamp: number
  /** Metres per second, or null. Useful for spotting a moving user. */
  speed: number | null
}

export interface GarminError {
  t: 'err'
  requestId: number | null
  /** `no_position` is the only code the current watch sends. */
  code: string
}

export interface GarminUnknown {
  t: 'unknown'
  raw: Record<string, unknown>
}

export type GarminMessage =
  | GarminReady
  | GarminPoint
  | GarminError
  | GarminUnknown

// ---- lenient number reading -------------------------------------------
//
// Never cast a wire value directly. The Connect IQ SDK's boxing is not
// guaranteed across versions, and the watch may send coordinates as text
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
 * than swallowing: it usually means the watch and the phone disagree about the
 * protocol.
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
        quality: qualityOf(payload.q),
        gpsRunning: (intOf(payload.gps) ?? 0) === 1,
        multiBand: (intOf(payload.mb) ?? 0) === 1,
        buffered: intOf(payload.buf) ?? 0,
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
      const source = payload.src
      return {
        t: 'pt',
        seq: intOf(payload.n) ?? 0,
        requestId: intOf(payload.r),
        source:
          source === 'phone' || source === 'watch' ? source : 'unknown',
        latitude,
        longitude,
        altitude: numberOf(payload.alt),
        quality: qualityOf(payload.q),
        timestamp: intOf(payload.ts) ?? 0,
        speed: numberOf(payload.spd),
      }
    }

    case 'err':
      return {
        t: 'err',
        requestId: intOf(payload.r),
        code: typeof payload.code === 'string' ? payload.code : 'unknown',
      }

    default:
      return { t: 'unknown', raw: payload }
  }
}

/**
 * What the user reads, which is not the same as what Connect IQ calls it.
 *
 * The enum names below are Garmin's (`QUALITY_USABLE`, `QUALITY_GOOD`) and
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

/** The device sends exactly one error code today. */
export const errorText = (code: string): string => {
  if (code === 'no_position') {
    return 'Your Garmin has not found a position yet. Give it a moment in open sky, then try again.'
  }
  return `Your Garmin could not send a point (${code}).`
}
