import { useCallback, useEffect, useRef } from 'react'
import { AnalyticsEvents, trackEvent } from 'src/utils/analytics'

/**
 * Slow loading screens (section 8).
 *
 * React Native has no general "this screen finished loading" signal, so a
 * screen has to say when it is ready. This hook gives it one call to make.
 *
 * Only slow loads are reported, not every load. A row per screen open would
 * be a lot of volume to answer a question that is really "which screens are
 * bad", and PostHog charges per event.
 *
 * Usage:
 *
 *   const { loadFinished } = useScreenLoadTiming('Interventions')
 *   ...
 *   const load = async () => {
 *     const data = await fetchThings()
 *     setItems(data)
 *     loadFinished({ item_count: data.length })
 *   }
 *
 * @param screenName  stable screen key, matching the navigator route name so
 *                    it lines up with the $screen events.
 * @param thresholdMs anything at or under this is a normal load.
 */
export const useScreenLoadTiming = (screenName: string, thresholdMs = 2000) => {
  const startedAt = useRef(Date.now())
  const reported = useRef(false)

  // A screen reused by the navigator (going back to it) starts its clock
  // again, so the second visit is not measured from the first mount.
  useEffect(() => {
    startedAt.current = Date.now()
    reported.current = false
  }, [screenName])

  const loadFinished = useCallback(
    (properties?: Record<string, unknown>) => {
      if (reported.current) {
        return
      }
      reported.current = true
      const durationMs = Date.now() - startedAt.current
      if (durationMs <= thresholdMs) {
        return
      }
      trackEvent(AnalyticsEvents.SCREEN_LOAD_SLOW, {
        screen_name: screenName,
        duration_ms: durationMs,
        threshold_ms: thresholdMs,
        ...properties,
      })
    },
    [screenName, thresholdMs],
  )

  /** Call when a reload starts, so the next loadFinished times that reload. */
  const loadStarted = useCallback(() => {
    startedAt.current = Date.now()
    reported.current = false
  }, [])

  return { loadStarted, loadFinished }
}

export default useScreenLoadTiming
