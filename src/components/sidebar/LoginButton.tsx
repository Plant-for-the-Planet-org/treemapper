import { StyleSheet, View } from 'react-native'
import React from 'react'
import CustomButton from '../common/CustomButton'
import { useDispatch, useSelector } from 'react-redux'
import { updateLoadingUser, updateUserDetails } from 'src/store/slice/userStateSlice'
import { updateUserLogin, updateUserToken } from 'src/store/slice/appStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import { getUserDetails } from 'src/api/api.fetch'
import { RootState } from 'src/store'

const LoginButton = () => {
  const { loading } = useSelector(
    (state: RootState) => state.userState)
  const { authorizeUser } = useAuthentication()
  const dispatch = useDispatch()

  const hadleLogin = async () => {
    try {
      dispatch(updateLoadingUser(true))
      const result = await authorizeUser()
      if (result.success) {
        setTimeout(async () => {
          dispatch(
            updateUserToken({
              idToken: result.credentials.idToken,
              accessToken: result.credentials.accessToken,
              expiringAt: result.credentials.expiresAt,
            }),
          )
          const userDetails = await getUserDetails()
          if (userDetails) {
            loginAndUpdateDetails(userDetails)
          }
        }, 2000);
      }else{
        dispatch(updateLoadingUser(false))
      }
    } catch (err) {
      dispatch(updateLoadingUser(false))
    }
  }

  const loginAndUpdateDetails = async data => {
    const finalDetails = { ...data }
    dispatch(updateUserDetails(finalDetails))
    dispatch(updateUserLogin(true))
    dispatch(updateLoadingUser(false))

  }

  return (
    <View style={styles.container}>
      <CustomButton
        label={'Login/Signup'}
        pressHandler={hadleLogin}
        containerStyle={styles.wrapper}
        disable={loading}
        hideFadein
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
