import {StyleSheet, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import {FormElement, MainForm} from 'src/types/interface/form.interface'
import FormTextInputElement from './FormTextInputElement'
import FormInfoElement from './FormInfoElement'
import FormSwitchElement from './FormSwitchElement'
import {scaleSize} from 'src/utils/constants/mixins'
import CustomButton from '../common/CustomButton'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'

interface Props {
  formData: MainForm
}

const MainFormSection = (props: Props) => {
  const {formData} = props
  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<{[key: string]: string} | null>(
    null,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    setFormKeyValues()
  }, [])

  const setFormKeyValues = () => {
    const finalObj = {}
    formData.elements.forEach(el => {
      finalObj[el.key] = el.default
    })
    setFormValues(finalObj)
    setShowForm(true)
  }

  const updateFormValues = (key: string, value: string) => {
    setFormValues(prevState => {
      const updatedState = {...prevState}
      updatedState[key] = value
      return updatedState
    })
  }

  const submitHandler = () => {
    navigation.navigate('InterventionPreview',{id:'review'})
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
