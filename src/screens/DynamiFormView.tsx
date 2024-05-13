import {
  StyleSheet,
  ScrollView,
} from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Header from 'src/components/common/Header'
import MainFormSection from 'src/components/formBuilder/MainFormSection'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const DynamiFormView = () => {
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const MainFormDetails = formFlowData.form_details
  return (
    <SafeAreaView style={styles.container}>
      <Header label={MainFormDetails[0].title} />
      <ScrollView contentContainerStyle={styles.container}>
        <MainFormSection formData={MainFormDetails[0]}/>
      </ScrollView>
    </SafeAreaView>
  )
}

export default DynamiFormView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:Colors.WHITE
  },
})
