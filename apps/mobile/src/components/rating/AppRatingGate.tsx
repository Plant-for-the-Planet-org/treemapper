import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import useAppRating from 'src/hooks/useAppRating'
import AppRatingModal from './AppRatingModal'
import FeedbackModal from '../sidebar/FeedbackModal'

/**
 * Shows the "Enjoying TreeMapper?" pre-prompt once the person has hit enough
 * happy moments (see appRating.ts), and routes the two answers:
 *
 * - enjoying it     -> the native in-app review sheet (or the store listing)
 * - not enjoying it -> the feedback form, so complaints reach us and not the
 *                      public store rating
 *
 * Mount at the app root, inside the Redux provider and PostHogProvider, next to
 * AnalyticsConsentGate. Kept out of any one screen so the prompt can surface
 * from wherever the person happens to be after a happy moment.
 */
const AppRatingGate = () => {
  const { shouldPrompt, acceptRating, declineRating, dismissPrompt } = useAppRating()
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)

  const [visible, setVisible] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  // Only lift the prompt into view once per session; closing it must not let it
  // pop straight back up while `shouldPrompt` is still true this render.
  const [handled, setHandled] = useState(false)

  useEffect(() => {
    if (shouldPrompt && !handled) {
      setVisible(true)
      setHandled(true)
    }
  }, [shouldPrompt, handled])

  const onEnjoying = () => {
    setVisible(false)
    acceptRating('prompt')
  }

  const onNotEnjoying = () => {
    setVisible(false)
    declineRating()
    // The feedback form needs a signed-in account to submit; if they are not
    // signed in, recording the opt-out above is all we can do.
    if (isLoggedIn) setShowFeedback(true)
  }

  const onDismiss = () => {
    setVisible(false)
    dismissPrompt()
  }

  return (
    <>
      <AppRatingModal
        isVisible={visible}
        onEnjoying={onEnjoying}
        onNotEnjoying={onNotEnjoying}
        onDismiss={onDismiss}
      />
      <FeedbackModal isVisible={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  )
}

export default AppRatingGate
