import { useCallback, useEffect, useRef } from 'react'
import {
  AnalyticsEvents,
  AnalyticsProperties,
  incrementSessionCounter,
  trackEvent,
} from 'src/utils/analytics'

/**
 * Mapping sessions (section 2, and "active mapping sessions" in section 10).
 *
 * Mapping is the part of the app where a user is physically walking a
 * boundary, so it is both the most valuable thing they do and the easiest to
 * give up on. What matters is not that they opened the map but that they
 * placed a point, and then whether a shape ever came out of it.
 *
 * The session starts at the first point, not on mount: opening the map and
 * backing out is not an abandoned mapping session, it is a look.
 *
 * @param mode  'polygon' | 'point' | 'plot' - which kind of shape.
 */
export const useMappingAnalytics = (
  mode: string,
  baseProperties?: AnalyticsProperties,
) => {
  const started = useRef(false)
  const finished = useRef(false)
  const startedAt = useRef(0)
  const pointCount = useRef(0)
  const invalidPointCount = useRef(0)
  const basePropsRef = useRef(baseProperties)
  basePropsRef.current = baseProperties

  const pointPlaced = useCallback(
    (isValid: boolean) => {
      if (!isValid) {
        // Points rejected for being too close together. A high count means
        // the accuracy guidance is not landing.
        invalidPointCount.current += 1
        return
      }
      pointCount.current += 1
      if (started.current) {
        return
      }
      started.current = true
      startedAt.current = Date.now()
      incrementSessionCounter('mapping_started')
      trackEvent(AnalyticsEvents.MAPPING_STARTED, {
        mode,
        ...basePropsRef.current,
      })
    },
    [mode],
  )

  const completed = useCallback(
    (properties?: AnalyticsProperties) => {
      if (finished.current) {
        return
      }
      finished.current = true
      incrementSessionCounter('mapping_completed')
      trackEvent(AnalyticsEvents.MAPPING_COMPLETED, {
        mode,
        point_count: pointCount.current,
        rejected_point_count: invalidPointCount.current,
        duration_ms: startedAt.current ? Date.now() - startedAt.current : 0,
        ...basePropsRef.current,
        ...properties,
      })
    },
    [mode],
  )

  useEffect(
    () => () => {
      // Points placed but no shape saved: the user walked part of a boundary
      // and left. This is the number the brief's "mapping started" is really
      // asking about.
      if (started.current && !finished.current) {
        trackEvent(AnalyticsEvents.MAPPING_ABANDONED, {
          mode,
          point_count: pointCount.current,
          rejected_point_count: invalidPointCount.current,
          duration_ms: Date.now() - startedAt.current,
          ...basePropsRef.current,
        })
      }
    },
    [mode],
  )

  return { pointPlaced, completed }
}

export default useMappingAnalytics
