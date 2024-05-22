import {
  StyleSheet,
  ScrollView,
} from 'react-native'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Header from 'src/components/common/Header'
import MainFormSection from 'src/components/formBuilder/MainFormSection'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'

const DynamiFormView = () => {
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const MainFormDetails = formFlowData.form_details
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updateInterventionLastScreen } = useInterventionManagement()

  useEffect(() => {
    handleAdditionalData()
  }, [])

  const handleAdditionalData = async () => {
    if (formFlowData && formFlowData.form_details.length === 0) {
      await updateInterventionLastScreen(formFlowData.form_id, 'dynamicForm')
      navigation.dispatch(
        CommonActions.reset({
          index: 1, // index of the active route
          routes: [
            { name: 'Home' },
            { name: 'InterventionPreview', params: { id: 'review', intervention: '' } },
          ],
        })
      )
    }
  }

  if (formFlowData && formFlowData.form_details.length === 0) {
    return null
  }


  return (
    <SafeAreaView style={styles.container}>
      <Header label={MainFormDetails[0].title} />
      <ScrollView contentContainerStyle={styles.container}>
        <MainFormSection formData={MainFormDetails[0]} interventionID={formFlowData.form_id}/>
      </ScrollView>
    </SafeAreaView>
  )
}

export default DynamiFormView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
