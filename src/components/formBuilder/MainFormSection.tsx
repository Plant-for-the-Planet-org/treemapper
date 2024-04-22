import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FormElement, MainForm } from 'src/types/interface/form.interface'
import FormTextInputElement from './FormTextInputElement'
import FormInfoElement from './FormInfoElement'
import FormSwitchElement from './FormSwitchElement'
import { scaleSize } from 'src/utils/constants/mixins'
import CustomButton from '../common/CustomButton'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch } from 'react-redux'
import { updateFormDataValue } from 'src/store/slice/registerFormSlice'

interface Props {
  formData: MainForm
  existingData: FormElement[]
}

const MainFormSection = (props: Props) => {
  const { formData } = props
  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<{ [key: string]: any } | null>(
    null,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  useEffect(() => {
    setFormKeyValues()
  }, [])



  const setFormKeyValues = () => {
    const finalObj = {}
    formData.elements.forEach(el => {
      finalObj[el.key] = {
        ...el
      }
    })
    setFormValues(finalObj)
    setShowForm(true)
  }

  // const addExistingData=()=>{

  // }

  const updateFormValues = (key: string, value: string) => {
    setFormValues(prevState => {
      const updatedState = { ...prevState }
      updatedState[key] = { ...formValues[key], value: value }
      return updatedState
    })
  }

  const submitHandler = () => {
    const finalData: FormElement[] = [];
    for (const [key] of Object.entries(formValues)) {
      finalData.push({...formValues[key]})
    }
    dispatch(updateFormDataValue(finalData))
    navigation.navigate('InterventionPreview', { id: 'review' })
  }

  const renderElement = (formElements: FormElement[]) => {
    return formElements.map(element => {
      switch (element.type) {
        case 'INPUT':
          return (
            <FormTextInputElement
              data={element}
              key={element.key}
              formValues={formValues}
              changeHandler={updateFormValues}
            />
          )
        case 'INFO':
          return <FormInfoElement data={element} key={element.key} />
        case 'SWITCH':
          return (
            <FormSwitchElement
              data={element}
              key={element.key}
              formValues={formValues}
              changeHandler={updateFormValues}
            />
          )
        default:
          return null
      }
    })
  }
  if (!showForm) {
    return null
  }
  return (
    <View style={styles.container}>
      {renderElement(formData.elements)}
      <CustomButton
        label="Continue"
        containerStyle={styles.btnContainer}
        pressHandler={submitHandler}
      />
    </View>
  )
}

export default MainFormSection

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 0,
  },
})
