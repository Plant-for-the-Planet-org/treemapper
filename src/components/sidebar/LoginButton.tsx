import { StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import CustomButton from '../common/CustomButton'
import { useDispatch, useSelector } from 'react-redux'
import { resetUserDetails, updateUserDetails } from 'src/store/slice/userStateSlice'
import { logoutAppUser, updateNewIntervention, updateUserLogin, updateUserToken } from 'src/store/slice/appStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import { getUserDetails } from 'src/api/api.fetch'
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

const LoginButton = () => {
  const webAuthLoading = useSelector(
    (state: RootState) => state.tempState.webAuthLoading)
  const { authorizeUser, user, getUserCredentials, logoutUser, error } = useAuthentication()
  const { addNewLog } = useLogManagement()
  const dispatch = useDispatch()
  const toast = useToast()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()



  useEffect(() => {
    if (error) {
      if (error.code === "unauthorized") {
        toast.show("Please confirm your email \nusing the link sent to your inbox.", {
          duration: 5000,
          textStyle: { textAlign: 'center' },
          placement: 'center'
        })
      }
    }
  }, [error])


  useEffect(() => {
    if (user) {
      getDetails()
    }
  }, [user])

  const getDetails = async () => {
    const credentials = await getUserCredentials()
    dispatch(
      updateUserToken({
        idToken: credentials.idToken,
        accessToken: credentials.accessToken,
        expiringAt: credentials.expiresAt,
        refreshToken: credentials.refreshToken
      }),
    )
    if (!credentials?.accessToken) {
      handleLogout()
      return
    }
    const {response, success} = await getUserDetails()
    if (success && response.signUpRequire) {
      navigation.navigate('SignUpPage', {
        email: user?.email,
        accessToken: credentials.accessToken
      })
      return
    }
    if (success && response) {
      loginAndUpdateDetails(response)
    } else {
      Bugsnag.notify("/app/profile failed to fetch user details")
      addNewLog({
        logType: 'USER',
        message: "User details api failed to fetch data",
        logLevel: 'error',
        statusCode: '',
      })
      handleLogout()
      dispatch(updateWebAuthLoading(false))
    }
  }


  const handleLogin = async () => {
    try {
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
      console.log("Error occurred while logout")
    }
  }


  const loginAndUpdateDetails = async data => {
    const finalDetails = { ...data }
    dispatch(updateUserDetails(finalDetails))
    dispatch(updateUserLogin(true))
    dispatch(updateWebAuthLoading(false))
  }

  return (
    <View style={styles.container}>
      <CustomButton
        label={'Login/SignUp'}
        pressHandler={handleLogin}
        containerStyle={styles.wrapper}
        disable={webAuthLoading}
        loading={webAuthLoading}
        hideFadeIn
      />
    </View>
  )
}

export default LoginButton

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  wrapper: {
    width: '90%',
  },
})
