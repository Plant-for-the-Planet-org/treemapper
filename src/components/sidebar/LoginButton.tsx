import {StyleSheet, View} from 'react-native'
import React from 'react'
import CustomButton from '../common/CustomButton'
import {useDispatch} from 'react-redux'
import {updateUserDetails} from 'src/store/slice/userStateSlice'
import {updateUserLogin, updateUserToken} from 'src/store/slice/appStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import {getUserDetails} from 'src/api/api.fetch'

const LoginButton = () => {
  const {authorizeUser} = useAuthentication()
  const dispatch = useDispatch()

  const hadleLogin = async () => {
    const result = await authorizeUser()
    if (result) {
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
    }
  }

  const loginAndUpdateDetails = async data => {
    const finalDetails = {...data}
    dispatch(updateUserLogin(true))
    dispatch(updateUserDetails(finalDetails))
  }

  return (
    <View style={styles.container}>
      <CustomButton
        label={'Login/Signup'}
        pressHandler={hadleLogin}
        containerStyle={styles.wrapper}
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
