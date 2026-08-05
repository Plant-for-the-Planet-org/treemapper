import { useCallback, useEffect, useRef } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import {
  AnalyticsEvent,
  AnalyticsEvents,
  AnalyticsProperties,
  AnalyticsTerm,
  incrementSessionCounter,
  recordScrollDepth,
  resetScrollDepth,
  trackEvent,
  trackTermEvent,
} from 'src/utils/analytics'

/**
 * The everyday way to send an event from a component.
 *
 * Nothing here needs usePostHog(): the client is a module singleton, so a
 * component can track without threading an instance through props. The older
 * captureAnalyticsEvent(posthog, ...) form still works and is what the first
 * six events use.
 */
export const useAnalytics = () => {
  const track = useCallback(
    (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
      trackEvent(event, properties)
    },
    [],
  )

  /** Section 9. Use for tooltips, help links and info icons next to a term. */
  const trackTerm = useCallback(
    (
      event: AnalyticsEvent,
      term: AnalyticsTerm,
      properties?: AnalyticsProperties,
    ) => {
      trackTermEvent(event, term, properties)
    },
    [],
  )

  return { track, trackTerm }
}

/**
 * Search usage (section 6), debounced.
 *
 * Firing on every keystroke would say more about typing speed than about
 * search, so the event goes out once the user stops typing. The result count
 * is the useful half: searches that return nothing are the ones worth
 * reading.
 */
export const useSearchAnalytics = (searchContext: string, delayMs = 800) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    },
    [],
  )

  return useCallback(
    (query: string, resultCount?: number) => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
      const trimmed = query.trim()
      if (!trimmed) {
        return
      }
      timer.current = setTimeout(() => {
        incrementSessionCounter('searches')
        trackEvent(AnalyticsEvents.SEARCH_USED, {
          search_context: searchContext,
          // The term itself is not sent. Species names are fine but a free
          // text box is a place users type anything, so only the shape of
          // the query travels.
          query_length: trimmed.length,
          result_count: resultCount,
          has_results: resultCount === undefined ? undefined : resultCount > 0,
        })
      }, delayMs)
    },
    [searchContext, delayMs],
  )
}

/**
 * Scroll depth (section 7) for one list. Returns an onScroll handler to spread
 * onto a ScrollView, FlatList or FlashList.
 */
export const useScrollDepthTracking = (listName: string) => {
  useEffect(() => {
    resetScrollDepth(listName)
    return () => resetScrollDepth(listName)
  }, [listName])

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
      recordScrollDepth(
        listName,
        contentOffset.y,
        contentSize.height,
        layoutMeasurement.height,
      )
    },
    [listName],
  )
}

export default useAnalytics
