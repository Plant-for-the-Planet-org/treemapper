import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FONT_FAMILY_BOLD } from 'src/utils/constants/typography'
import { RootState } from 'src/store'
import { useDispatch, useSelector } from 'react-redux'
import { TEXT_COLOR } from 'src/utils/constants/colors'
import { deleteAccount } from 'src/api/api.fetch'
import { useToast } from 'react-native-toast-notifications'
import useAuthentication from 'src/hooks/useAuthentication'
import { updateUserLogin, logoutAppUser, updateNewIntervention } from 'src/store/slice/appStateSlice'
import { resetProjectState } from 'src/store/slice/projectStateSlice'
import { resetUserDetails } from 'src/store/slice/userStateSlice'
import DeleteModal from 'src/components/common/DeleteModal'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import openWebView from 'src/utils/helpers/appHelper/openWebView'

const DeleteAccount = () => {
  const { email, name } = useSelector((state: RootState) => state.userState)
  const [timer, setTimer] = useState(10)
  const [loading, setLoading] = useState(false)
  const [subModal, setSubModal] = useState(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const toast = useToast()
  useEffect(() => {
    if (timer > 0) {
      setTimeout(() => {
        setTimer(prev => prev - 1)
      }, 1300);
    }
  }, [timer])
  
  const { logoutUser } = useAuthentication()
  const dispatch = useDispatch()

  const handleDelete = async () => {
    try {
      if (timer > 0) {
        toast.show("You can delete in " + timer + " seconds", { placement: 'center' })
        return;
      }
      if(loading){
        return
      }
      setLoading(true)
      const result = await deleteAccount()
      if(result && !result.success){
        setSubModal(true)
        return
      }
      if(result?.success){
        toast.show("Account Deleted")
        await logoutUser()
        dispatch(resetProjectState())
        dispatch(updateUserLogin(false))
        dispatch(resetUserDetails())
        dispatch(logoutAppUser())
        dispatch(updateNewIntervention())
        navigation.goBack()
      }else{
        setLoading(false)
        toast.show("Something went wrong")
      }
    } catch (error) {
      toast.show("Account was not deleted \nSomething went wrong")
      navigation.goBack()
    }
  }

  const openWeb=()=>{
    openWebView(`https://web.plant-for-the-planet.org/en/profile/delete-account`);
    navigation.goBack()
  }

  const closeSubModal=()=>{
    setSubModal(false)
    navigation.goBack()
  }


  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <Header label="Delete Account" />
      <View style={styles.container}>
        <Text style={styles.header}>To continue with deletion {'\n'}Press Delete now.{'\n'}</Text>
        <Text style={styles.section}>
          By clicking "Delete", I am requesting Plant-for-the-Planet to delete all data associated with my Plant-for-the-Planet account. Donation data may be kept for up to eight years. Trees I have registered will not be removed, however, will be anonymized and can't be claimed again.
        </Text>
        <Text style={[styles.section, { textDecorationStyle: 'solid', fontFamily: FONT_FAMILY_BOLD, }]}>
          Before proceeding, make sure you've cancelled all subscriptions.
        </Text>
        <Text>
          {'\n'}
        </Text>
        <Text style={[styles.section, { color: "tomato" }]}>I also understand that account deletion of <Text style={{ fontFamily: FONT_FAMILY_BOLD }}>{email || name}</Text> is irreversible.</Text>
      </View>
      <CustomButton
        label={timer > 0 ? <Text>
          You can Delete in {timer} seconds
        </Text> : "Delete Now"}
        containerStyle={styles.btnContainer}
        pressHandler={handleDelete}
        wrapperStyle={timer > 0 ? { backgroundColor: 'lightgray' } : { backgroundColor: 'tomato' }}
        loading={loading}
        disable={timer > 0}
      />
      <DeleteModal isVisible={subModal} toggleModal={()=>{setSubModal(prev=>!prev)}} removeFavSpecie={openWeb} headerLabel={'Further steps required'} noteLabel={'Your account cannot be deleted as there might be Projects linked or you have balance in your account. \nPlease press Continue to resolve this before Deleting account.'} primeLabel={'Continue'} secondaryLabel={'Close'}  secondaryHandler={closeSubModal}
      extra={undefined}/>
    </SafeAreaView>
  )
}

export default DeleteAccount

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  container: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
    width: '100%',
    paddingHorizontal: '5%'
  },
  header: {
    fontSize: 18,
    color: Colors.DARK_TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    marginBottom: 10,
    marginTop:20
  },
  section: {
    fontSize: 16,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginBottom: 10
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 30,
  },
  timerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    color: TEXT_COLOR,
    backgroundColor: "#fff",
    textAlignVertical: 'center',
    textAlign: 'center'
  },
  secondWrapper: {
    fontSize: scaleFont(16),
    color: Colors.WHITE,
    letterSpacing: 0.2,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  }
})
