import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import CustomButton from '../common/CustomButton'
import { useDispatch, useSelector } from 'react-redux'
import { resetUserDetails, updateName, updateUserDetails } from 'src/store/slice/userStateSlice'
import { logoutAppUser, updateNewIntervention, updateUserLogin, updateUserToken } from 'src/store/slice/appStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import { RootState } from 'src/store'
import Snackbar from 'react-native-snackbar'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { updateWebAuthLoading } from 'src/store/slice/tempStateSlice'
import { resetProjectState } from 'src/store/slice/projectStateSlice'
import Bugsnag from '@bugsnag/expo'
import { useToast } from 'react-native-toast-notifications'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import i18next from 'i18next'
import { getMobileUserDetails } from '../../api/api.fetch'
import EmailVerificationModal from '../common/EmailVerifcationModal'
import AlertModal from '../common/AlertModal'
import { UserInterface } from 'src/types/interface/slice.interface'
import { AnalyticsEvents, trackEvent } from 'src/utils/analytics'

const LoginButton = () => {
  const webAuthLoading = useSelector(
    (state: RootState) => state.tempState.webAuthLoading)
  const { authorizeUser, user, getUserCredentials, logoutUser, error } = useAuthentication()
  const { addNewLog } = useLogManagement()
  const dispatch = useDispatch()
  const toast = useToast()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [buttonMounted, setButtonMounted] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showFetchErrorModal, setShowFetchErrorModal] = useState(false)


  function getFirstAndLastName(fullName) {
    // Split the full name into an array based on spaces
    const nameParts = fullName.trim().split(' ');

    // Get the first word as first name
    const firstName = nameParts[0];

    // Get the last word as last name (ignore all the middle words)
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    return { firstName, lastName };
  }

  useEffect(() => {
    if (error) {
      trackEvent(AnalyticsEvents.LOGIN_FAILED, {
        stage: 'auth0_callback',
        error_code: error.code ?? 'unknown',
        // The most common real-world failure: the account exists but the
        // email was never confirmed. Worth splitting out of the rate.
        needs_email_confirmation:
          error.code === 'unauthorized' || error.code === 'access_denied',
      })
      if (error.code === "unauthorized" || error.code === 'access_denied') {
        setTimeout(() => {
          toast.show("Please confirm your email \nusing the link sent to your inbox.", {
            duration: 2000,
            textStyle: { textAlign: 'center' },
            placement: 'top'
          })
          setShowEmailModal(true)
        }, 3000);
      }
    }
  }, [error])

  useEffect(() => {
    if (user && buttonMounted) {
      getDetails()
    }
    setButtonMounted(true)
  }, [user])

  const getDetails = async () => {
    const credentials = await getUserCredentials()
    if (credentials) {
      const { firstName, lastName } = getFirstAndLastName(user.name)
      dispatch(
        updateUserToken({
          idToken: credentials.idToken,
          accessToken: credentials.accessToken,
          expiringAt: credentials.expiresAt,
          refreshToken: credentials.refreshToken
        }),
      )
      dispatch(updateName({ firstName, lastName }))
    }
    if (!credentials?.accessToken) {
      handleLogout()
      return
    }
    const { response, status } = await getMobileUserDetails()
    if (response && response.data) {
      loginAndUpdateDetails({ ...response.data, image: response.data.image || user.picture || user.profile || '' })
    } else {
      // Auth0 said yes but the profile fetch failed, so the user is stuck on
      // a retry modal. Counted apart from LOGIN_FAILED because the fix is on
      // our side, not theirs.
      trackEvent(AnalyticsEvents.PROFILE_FETCH_FAILED, {
        status_code: status ?? null,
      })
      Bugsnag.notify(new Error("Failed to fetch user details"))
      addNewLog({
        logType: 'USER',
        message: "Failed to fetch user details",
        logLevel: 'error',
        statusCode: status ? `${status}` : '',
      })
      dispatch(updateWebAuthLoading(false))
      // Let the user retry or clear their session instead of forcing a logout.
      setShowFetchErrorModal(true)
    }
  }


  const handleLogin = async () => {
    try {
      // Start of the login funnel. Success rate is
      // login_succeeded / login_started, so this has to fire before the
      // browser hands off to Auth0.
      trackEvent(AnalyticsEvents.LOGIN_STARTED)
      dispatch(updateWebAuthLoading(true))
      const result = await authorizeUser()
      if (!result.success) {
        dispatch(updateWebAuthLoading(false))
        Snackbar.show({
          text: "Failed to login",
          duration: Snackbar.LENGTH_SHORT,
          fontFamily: Typography.FONT_FAMILY_REGULAR,
          textColor: Colors.WHITE
        });
        addNewLog({
          logType: 'USER',
          message: "Logged in failed (Credentials not found)",
          logLevel: 'error',
          statusCode: '',
        })
        await handleLogout()
      }
    } catch (err) {
      dispatch(updateWebAuthLoading(false))
      trackEvent(AnalyticsEvents.LOGIN_FAILED, { stage: 'unexpected_error' })
      addNewLog({
        logType: 'USER',
        message: "Log in failed",
        logLevel: 'error',
        statusCode: '000',
      })
    }
  }


  const handleLogout = async () => {
    try {
      await logoutUser()
      dispatch(resetProjectState())
      dispatch(updateUserLogin(false))
      dispatch(resetUserDetails())
      dispatch(logoutAppUser())
      dispatch(updateNewIntervention())
    } catch (error) {
      console.error("Error occurred while logout")
    }
  }


  const loginAndUpdateDetails = async (data: UserInterface) => {
    const finalDetails = { ...data }
    // End of the login funnel: credentials accepted AND the profile loaded,
    // which is the point the user can actually do something.
    trackEvent(AnalyticsEvents.LOGIN_SUCCEEDED, {
      country: finalDetails.country || null,
      user_type: finalDetails.type || null,
    })
    dispatch(updateUserDetails(finalDetails))
    // identify() runs from AnalyticsProvider once this lands in Redux, so the
    // person profile is built from one place regardless of how the user got
    // logged in (fresh login, restored session, deep link).
    dispatch(updateUserLogin(true))
    dispatch(updateWebAuthLoading(false))
  }

  return (
    <View style={styles.container}>
      <CustomButton
        label={i18next.t("label.login_signup")}
        pressHandler={handleLogin}
        containerStyle={styles.wrapper}
        disable={webAuthLoading}
        loading={webAuthLoading}
        hideFadeIn
      />
      <EmailVerificationModal isVisible={showEmailModal} onClose={() => { setShowEmailModal(false) }} onResendEmail={() => { }} onOkay={() => {
        setShowEmailModal(false);
        handleLogin()
      }} />
      <AlertModal
        visible={showFetchErrorModal}
        heading="Failed to fetch user details"
        message="Please try again, or clear your session and log in."
        primaryBtnText="Try Again"
        onPressPrimaryBtn={() => {
          setShowFetchErrorModal(false)
          getDetails()
        }}
        secondaryBtnText="Clear Session"
        onPressSecondaryBtn={() => {
          setShowFetchErrorModal(false)
          handleLogout()
        }}
      />
    </View>
  )
}

export default LoginButton

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  wrapper: {
    width: '105%',
  },
})
