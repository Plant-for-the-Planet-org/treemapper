import { View, StyleSheet, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import AdditionalDataFormNote from './AdditionalDataFormNote'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import AddDataElement from './AddDataElement'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import useAdditionalForm from 'src/hooks/realm/useAdditionalForm'
import { v4 as uuid } from 'uuid'
import { FormElement } from 'src/types/interface/form.interface'


const AdditionalDataForm = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [allFormData, setAllFormData] = useState<any>([])
  const { addNewForm } = useAdditionalForm()
  const formData = useQuery<any>(
    RealmSchema.AdditionalDetailsForm,
    data => {
      return data
    },
  )

  useEffect(() => {
    setAllFormData(formData)
  }, [formData])


  const openMediaElementView = (id: string) => {
    navigation.navigate("SelectElement", { form_id: id, element_order: 0 })
  }
  const createNewForm = async () => {
    const id = uuid()
    await addNewForm(id, 0)
    navigation.navigate("SelectElement", { form_id: id, element_order: 0 })
  }


  const elementHandler = (data: FormElement, form_id: string) => {
    navigation.navigate('AdditionDataElement', { element: data.type, form_id, element_order: data.index, edit: true, element_id: data.element_id })
  }

  return (
    <View style={styles.container}>
      <FlatList data={allFormData} 
      keyExtractor={({ form_id }) => form_id}
      renderItem={({ item, index }) => (<AddDataElement data={item} pressHandler={elementHandler} pageNo={index} openHandler={openMediaElementView} />)} ListEmptyComponent={<AdditionalDataFormNote newForm={createNewForm} />} />
    </View>
  )
}

export default AdditionalDataForm

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10
  },
  footerWrapper: {
    width: '100%',
    height: 50,
    marginTop: 20
  },
  footerButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
    width: 100,
    marginLeft: 20

  },
  footerLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR
  },
})