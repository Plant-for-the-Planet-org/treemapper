import {StyleSheet, View} from 'react-native'
import React, {useEffect} from 'react'
import CustomButton from '../common/CustomButton'
import {User, useAuth0} from 'react-native-auth0'
import {UserInterface} from 'src/types/interface/slice.interface'
import {useDispatch} from 'react-redux'
import {updateUserDetails} from 'src/store/slice/userStateSlice'
import {updateUserLogin} from 'src/store/slice/appStateSlice'

const LoginButton = () => {
  const {authorize, user, isLoading, error} = useAuth0()
  const dispatch = useDispatch()
  const hadleLogin = async () => {
    await authorize(
      {},
      {
        customScheme: process.env.EXPO_PUBLIC_APP_SCHEMA,
      },
    )
  }
  useEffect(() => {
    if (user) {
      loginAndUpdateDetails(user)
    }
  }, [user, isLoading, error])

  const loginAndUpdateDetails = async (details: User) => {
    const finalDetails: UserInterface = {
      accessToken: '',
      idToken: '',
      email: details.email || '',
      firstName: details.givenName || '',
      lastName: details.familyName || '',
      image: details.picture || '',
      country: details.locale || '',
      idLogEnabled: false,
      userId: '',
      type: '',
      lastUpdatedAt: details.updatedAt,
    }
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
