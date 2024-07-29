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

const LoginButton = () => {
  const webAuthLoading = useSelector(
    (state: RootState) => state.tempState.webAuthLoading)
  const { authorizeUser, user, getUserCredentials, logoutUser } = useAuthentication()
  const { addNewLog } = useLogManagement()
  const dispatch = useDispatch()


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
    const userDetails = await getUserDetails()
    if (userDetails) {
      loginAndUpdateDetails(userDetails)
    } else {
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
          text: "Failed to login !",
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: '#e74c3c',
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
    await logoutUser()
    dispatch(resetProjectState())
    dispatch(updateUserLogin(false))
    dispatch(resetUserDetails())
    dispatch(logoutAppUser())
    dispatch(updateNewIntervention())
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
    marginBottom: 10,
  },
  wrapper: {
    width: '90%',
  },
})
