import {
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native'
import React from 'react'
import {useSelector} from 'react-redux'
import {RootState} from 'src/store'
import Header from 'src/components/common/Header'
import MainFormSection from 'src/components/formBuilder/MainFormSection'

const DynamiFormView = () => {
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const MainFormDetails = formFlowData.form_details
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header label={MainFormDetails[0].title} />
      <MainFormSection formData={MainFormDetails[0]} />
    </ScrollView>
  )
}

export default DynamiFormView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
})
