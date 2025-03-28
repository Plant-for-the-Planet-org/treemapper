import { ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FormElement, MainForm } from 'src/types/interface/form.interface'
import FormTextInputElement from './FormTextInputElement'
import FormInfoElement from './FormInfoElement'
import FormSwitchElement from './FormSwitchElement'
import CustomButton from '../common/CustomButton'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import FormTextAreaElement from './FormTextAreaElement'
import { useToast } from 'react-native-toast-notifications'
import { IAdditionalDetailsForm } from 'src/types/interface/app.interface'
import GapElement from './GapElement'
import HeadingElement from './HeadingElement'
import YeNoFormElement from './YeNoFormElement'
import DropDownFormElement from './DropDownElement'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { v4 as uuid } from 'uuid'
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput'
import { Colors } from 'src/utils/constants'

interface Props {
  formData: MainForm | IAdditionalDetailsForm
  completeLocalForm?: (d: FormElement[], page: string) => void
  page?: string
  interventionID: string
  isEditForm?: (d: FormElement[]) => void
}

const MainFormSection = (props: Props) => {

  useEffect(() => {
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, [])


  const { formData, completeLocalForm, page, interventionID, isEditForm } = props

  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<{ [key: string]: any } | null>(
    null,
  )
  const toast = useToast();
  const { updateInterventionLastScreen, updateDynamicFormDetails } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  useEffect(() => {
    setFormKeyValues()
  }, [formData])



  const setFormKeyValues = () => {
    const finalObj = {}
    formData.elements.forEach(el => {
      finalObj[el.key] = {
        ...el
      }
    })
    setFormValues(finalObj)
    if (Object.keys(finalObj).length === 0) {
      return null
    }
    setShowForm(true)
  }


  const updateFormValues = (key: string, value: string) => {
    setFormValues(prevState => {
      const updatedState = { ...prevState }
      updatedState[key] = { ...formValues[key], value: value }
      return updatedState
    })
  }

  const checkForNonEmptyForm = (type: any) => {
    return type === 'INPUT' || type === 'DROPDOWN' || type === 'YES_NO' || type === 'SWITCH'
  };

  const showToast = (message) => {
    toast.show(message, {
      type: "normal",
      placement: "bottom",
      duration: 2000,
      animationType: "slide-in",
    });
  };

  const validateField = (key, formValues) => {
    if (formValues[key].value.length > 0 && formValues[key].validation.length > 0) {
      const regex = new RegExp(formValues[key].validation);
      if (!regex.test(formValues[key].value)) {
        showToast(`Please ${formValues[key].type === 'DROPDOWN' ? 'select' : 'provide'} valid ${formValues[key].label}`);
        return false;
      }
    }
    return true;
  };

  const checkRequiredField = (key, formValues) => {
    if (checkForNonEmptyForm(formValues[key].type) && formValues[key].required && formValues[key].value.length === 0) {
      showToast(`${formValues[key].label} cannot be empty`);
      return false;
    }
    return true;
  };

  const prepareFinalData = (formValues) => {
    const finalData = [];
    for (const [key] of Object.entries(formValues)) {
      if (!validateField(key, formValues) || !checkRequiredField(key, formValues)) {
        return null;
      }
      if (formValues[key].value.length !== 0) {
        finalData.push({ ...formValues[key], element_id: uuid(), intervention: [] });
      }
    }
    return finalData;
  };

  const submitHandler = async () => {
    const finalData = prepareFinalData(formValues);
    if (!finalData) return;

    if (completeLocalForm) {
      completeLocalForm(finalData, page);
      return;
    }
    if (isEditForm) {
      isEditForm(finalData);
      return;
    }
    await updateInterventionLastScreen(interventionID, 'DYNAMIC_FORM');
    await updateDynamicFormDetails(interventionID, finalData);
    navigation.dispatch(
      CommonActions.reset({
        index: 1, // index of the active route
        routes: [
          { name: 'Home' },
          { name: 'InterventionPreview', params: { id: 'review', intervention: '', interventionId: interventionID } },
        ],
      })
    );
  };
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
      <ScrollView>
        <AvoidSoftInputView
          avoidOffset={20}
          showAnimationDuration={200}
          style={styles.mainContainer}>
          {renderElement(formData.elements)}
        </AvoidSoftInputView>
      </ScrollView>
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
    height: 80,
    position: 'absolute',
    bottom: 10,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    height: '100%',
    width: '100%'
  },
})
