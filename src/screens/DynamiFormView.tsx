import {
  StyleSheet,
  ScrollView,
} from 'react-native'
import React, { useEffect } from 'react'

import Header from 'src/components/common/Header'
import MainFormSection from 'src/components/formBuilder/MainFormSection'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { InterventionData } from 'src/types/interface/slice.interface'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRealm } from '@realm/react'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'

const DynamiFormView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const paramId = route.params ? route.params.id : ''
  const realm = useRealm()
  const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, paramId);
  const MainFormDetails = setUpIntervention(intervention.intervention_key).form_details
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { updateInterventionLastScreen } = useInterventionManagement()

  useEffect(() => {
    handleAdditionalData()
  }, [])

  const handleAdditionalData = async () => {
    if (MainFormDetails.length === 0) {
      await updateInterventionLastScreen(intervention.form_id, 'dynamicForm')
      navigation.dispatch(
        CommonActions.reset({
          index: 1, // index of the active route
          routes: [
            { name: 'Home' },
            { name: 'InterventionPreview', params: { id: 'review', intervention: '', interventionId: paramId } },
          ],
        })
      )
    }
  }

  if (MainFormDetails && MainFormDetails.length === 0) {
    return null
  }


  return (
    <SafeAreaView style={styles.container}>
      <Header label={MainFormDetails[0].title} />
      <ScrollView contentContainerStyle={styles.container}>
        <MainFormSection formData={MainFormDetails[0]} interventionID={intervention.form_id} />
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
