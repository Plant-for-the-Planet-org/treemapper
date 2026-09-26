import { Linking, Platform } from 'react-native'
import * as StoreReview from 'expo-store-review'
import { AppRatingState } from 'src/types/interface/slice.interface'

// ── Store identifiers ────────────────────────────────────────────────────────
// Android reads the applicationId. iOS needs the numeric App Store id, which is
// only known once the app has a listing. Fill IOS_APP_STORE_ID in before the
// manual "Rate the app" deep link can open the iOS write-review page. Until
// then iOS falls back to the native in-app review sheet, which needs no id.
export const ANDROID_PACKAGE = 'org.pftp.treemapper'
export const IOS_APP_STORE_ID = '' // TODO: set the numeric App Store id, e.g. '1493974345'

// ── When to ask ──────────────────────────────────────────────────────────────
// Two happy moments before the first ask, and at least ~45 days between asks so
// someone who taps "Not now" is never nagged.
export const MIN_POSITIVE_EVENTS = 2
export const REPROMPT_INTERVAL_MS = 45 * 24 * 60 * 60 * 1000

export const defaultRatingState: AppRatingState = {
  eventCount: 0,
  lastAskedAt: 0,
  hasRated: false,
  dontAskAgain: false,
}

/**
 * Decides whether the "Are you enjoying TreeMapper?" pre-prompt may show.
 * Pure so it can be unit-tested; `now` is passed in rather than read here.
 */
export function shouldShowRatingPrompt(
  rating: AppRatingState | undefined,
  now: number = Date.now(),
): boolean {
  const r = { ...defaultRatingState, ...(rating ?? {}) }
  if (r.hasRated || r.dontAskAgain) return false
  if (r.eventCount < MIN_POSITIVE_EVENTS) return false
  if (r.lastAskedAt !== 0 && now - r.lastAskedAt < REPROMPT_INTERVAL_MS) return false
  return true
}

/**
 * Fires the OS in-app review flow (SKStoreReviewController on iOS, Play In-App
 * Review on Android). The OS decides whether it actually appears and returns
 * nothing, so this is best-effort. Resolves true only when the native call was
 * made, letting callers fall back to the store listing when it was not.
 */
export async function requestNativeReview(): Promise<boolean> {
  try {
    const available = await StoreReview.isAvailableAsync()
    const hasAction = await StoreReview.hasAction()
    if (available && hasAction) {
      await StoreReview.requestReview()
      return true
    }
  } catch {
    // A review prompt must never affect the app.
  }
  return false
}

/**
 * Opens the store listing on the write-review screen. Used by the manual
 * "Rate the app" entry, where the person explicitly asked to rate and a
 * deterministic jump to the store beats the throttled native sheet. Falls back
 * to the native sheet when no deep link can be built (e.g. iOS before the App
 * Store id is filled in).
 */
export async function openStoreListing(): Promise<void> {
  try {
    const url =
      Platform.OS === 'ios'
        ? IOS_APP_STORE_ID
          ? `itms-apps://itunes.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`
          : ''
        : `market://details?id=${ANDROID_PACKAGE}`
    if (url && (await Linking.canOpenURL(url))) {
      await Linking.openURL(url)
      return
    }
  } catch {
    // Fall through to the native sheet below.
  }
  await requestNativeReview()
}
