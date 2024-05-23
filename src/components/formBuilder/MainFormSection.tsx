import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FormElement, MainForm } from 'src/types/interface/form.interface'
import FormTextInputElement from './FormTextInputElement'
import FormInfoElement from './FormInfoElement'
import FormSwitchElement from './FormSwitchElement'
import { scaleSize } from 'src/utils/constants/mixins'
import CustomButton from '../common/CustomButton'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch } from 'react-redux'
import { updateAdditionalData } from 'src/store/slice/registerFormSlice'
import FormTextAreaElement from './FormTextAreaElement'
import { useToast } from 'react-native-toast-notifications'
import { IAdditonalDetailsForm } from 'src/types/interface/app.interface'
import GapElement from './GapElement'
import HeadingElement from './HeadingElement'
import YeNoFormElement from './YeNoFormElement'
import DropDownFormElement from './DropDownElement'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { v4 as uuid } from 'uuid'
interface Props {
  formData: MainForm | IAdditonalDetailsForm
  completeLocalForm?: (d: FormElement[], page: string) => void
  page?: string
  interventionID: string
}

const MainFormSection = (props: Props) => {
  const { formData, completeLocalForm, page, interventionID } = props

  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<{ [key: string]: any } | null>(
    null,
  )
  const toast = useToast();
  const { updateInterventionLastScreen, updateDynamicFormDetails } = useInterventionManagement()
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


  const updateFormValues = (key: string, value: string) => {
    setFormValues(prevState => {
      const updatedState = { ...prevState }
      updatedState[key] = { ...formValues[key], value: value }
      return updatedState
    })
  }

  const submitHandler = async () => {
    const finalData: FormElement[] = [];
    for (const [key] of Object.entries(formValues)) {
      if (formValues[key].value.length > 0 && formValues[key].validation.length > 0) {
        const regex = new RegExp(formValues[key].validation);
        if (!regex.test(formValues[key].value)) {
          toast.show(`Please ${formValues[key].type === 'DROPDOWN' ? 'select' : 'provide'} valid ${formValues[key].label}`, {
            type: "normal",
            placement: "bottom",
            duration: 2000,
            animationType: "slide-in",
          })
          return
        }
      }

      if (formValues[key].required && formValues[key].value.length === 0) {
        toast.show(`${formValues[key].label} cannot be empty`, {
          type: "normal",
          placement: "bottom",
          duration: 2000,
          animationType: "slide-in",
        })
        return
      }

      if (formValues[key].value.length !== 0) {
        finalData.push({ ...formValues[key], element_id: uuid(), intervention: [] })
      }

    }
    if (completeLocalForm) {
      completeLocalForm(finalData, page)
      return
    }
    await updateInterventionLastScreen(interventionID, 'dynamicForm')
    dispatch(updateAdditionalData(finalData))
    await updateDynamicFormDetails(interventionID, finalData)
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
        case 'TEXTAREA':
          return (
            <FormTextAreaElement
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
        case 'YES_NO':
          return (
            <YeNoFormElement
              data={element}
              key={element.key}
              formValues={formValues}
              changeHandler={updateFormValues}
            />
          )
        case 'GAP':
          return (
            <GapElement key={element.key} />
          )
        case 'HEADING':
          return (
            <HeadingElement
              data={element}
              key={element.key}
            />
          )
        case 'DROPDOWN':
          return (
            <DropDownFormElement
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
