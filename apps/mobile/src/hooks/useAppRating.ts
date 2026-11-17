import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePostHog } from 'posthog-react-native'
import { RootState } from 'src/store'
import {
  registerRatingEvent,
  markRatingAsked,
  markRated,
  setRatingDontAskAgain,
} from 'src/store/slice/appStateSlice'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'
import {
  shouldShowRatingPrompt,
  requestNativeReview,
  openStoreListing,
  defaultRatingState,
} from 'src/utils/helpers/appHelper/appRating'

// 'prompt' is the automatic "Enjoying TreeMapper?" pre-prompt; 'menu' is the
// manual "Rate the app" sidebar entry.
export type RatingSource = 'prompt' | 'menu'

/**
 * One place for the whole store-rating flow: when to ask, what each answer
 * does, and the manual entry. Linking and native review live in appRating.ts;
 * this hook only records intent and reports whether the prompt may show.
 */
const useAppRating = () => {
  const dispatch = useDispatch()
  const posthog = usePostHog()
  // Installs that persisted appState before this field existed rehydrate
  // without it, so fall back to the default.
  const rating = useSelector(
    (state: RootState) => state.appState.rating ?? defaultRatingState,
  )

  const shouldPrompt = shouldShowRatingPrompt(rating)

  // Call at a genuine "happy moment" (e.g. an intervention was created).
  const registerPositiveEvent = useCallback(() => {
    dispatch(registerRatingEvent())
  }, [dispatch])

  // The person wants to rate. From the prompt, try the native in-app sheet
  // first and only open the store listing if it could not appear. From the
  // menu, go straight to the store listing (they asked for it explicitly).
  const acceptRating = useCallback(
    async (source: RatingSource): Promise<boolean> => {
      if (source === 'prompt') dispatch(markRatingAsked())
      const opened =
        source === 'menu'
          ? await openStoreListing()
          : (await requestNativeReview()) || (await openStoreListing())
      // Only retire the prompt once they actually reached a rating surface.
      // Marking first meant one dead tap switched the prompt off for good.
      if (opened) dispatch(markRated())
      captureAnalyticsEvent(posthog, AnalyticsEvents.APP_RATING_PROMPT, {
        action: 'rate',
        source,
        // Separates "we sent them to the store" from "nothing could open".
        // The latter is silent otherwise, and is the normal state on a build
        // that was not installed from the store.
        opened,
      })
      return opened
    },
    [dispatch, posthog],
  )

  // The person is not enjoying it: record, stop asking, and let the caller
  // route them to the feedback form instead of the store.
  const declineRating = useCallback(() => {
    dispatch(markRatingAsked())
    dispatch(setRatingDontAskAgain())
    captureAnalyticsEvent(posthog, AnalyticsEvents.APP_RATING_PROMPT, {
      action: 'feedback',
      source: 'prompt',
    })
  }, [dispatch, posthog])

  // The prompt was closed without choosing. Ask again after the interval.
  const dismissPrompt = useCallback(() => {
    dispatch(markRatingAsked())
    captureAnalyticsEvent(posthog, AnalyticsEvents.APP_RATING_PROMPT, {
      action: 'dismiss',
      source: 'prompt',
    })
  }, [dispatch, posthog])

  // The manual "Rate the app" sidebar entry.
  const rateFromMenu = useCallback(() => acceptRating('menu'), [acceptRating])

  return {
    rating,
    shouldPrompt,
    registerPositiveEvent,
    acceptRating,
    declineRating,
    dismissPrompt,
    rateFromMenu,
  }
}

export default useAppRating
