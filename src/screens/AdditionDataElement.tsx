import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomTextInput from 'src/components/common/CustomTextInput'
import CustomDropDown from 'src/components/common/CustomDropDown'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import DropDownFieldElement from 'src/components/additionalData/DropDownFieldElement'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useAdditionalForm from 'src/hooks/realm/useAdditionalForm'
import { FormElement } from 'src/types/interface/form.interface'
import {
  DropdownData,
  IAdditionalDetailsForm,
} from 'src/types/interface/app.interface'
import { v4 as uuid } from 'uuid'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRealm } from '@realm/react'
import { StackNavigationProp } from '@react-navigation/stack'
import { useToast } from 'react-native-toast-notifications'
import { FORM_TYPE } from 'src/types/type/app.type'
import i18next from 'src/locales/index'

const fieldType: Array<{
  label: string
  value: string
  index: number
}> = [
    {
      label: 'Text',
      value: 'string',
      index: 0,
    },
    {
      label: 'Number',
      value: 'number',
      index: 0,
    },
  ]

const AdditionDataElement = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AdditionDataElement'>>()
  const elementType = route.params?.element ?? 'INPUT'
  const form_id = route.params?.form_id ?? ''
  const element_order = route.params?.element_order ?? 0
  const element_id = route.params?.element_id ?? ''
  const edit = route.params?.edit ?? false

  const [inputKey, setInputKey] = useState('')
  const [dataType, setDataType] = useState<DropdownData>(fieldType[0])
  const [isPublic, setIsPublic] = useState(true)
  const [advanceMode, setAdvanceMode] = useState(false)
  const [fieldKey, setFieldKey] = useState(`Element-${Date.now()}`)
  const [isRequired, setIsRequired] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const realm = useRealm()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [dropDownElement, setDropDownElement] = useState<
    Array<{ key: string; value: string; id: string }>
  >([])
  const [selectedDropDown, setSelectedDropDown] = useState<{
    key: string
    value: string
    id: string
  }>({ key: '', value: '', id: '' })

  const toast = useToast()

  useEffect(() => {
    if (edit && element_id) {
      preFillData()
    }
  }, [edit])

  const preFillData = () => {
    const data = realm.objectForPrimaryKey<IAdditionalDetailsForm>(
      RealmSchema.AdditionalDetailsForm,
      form_id,
    )
    if (data) {
      const elementDetails = data.elements.filter(
        el => el.element_id === element_id,
      )
      const myElement = elementDetails[0]
      setInputKey(myElement.label)
      setDataType(() => {
        return {
          label: myElement.data_type === 'number' ? 'Number' : 'Text',
          value: myElement.data_type === 'number' ? 'number' : 'string',
          index: 0,
        }
      })
      setIsPublic(myElement.visibility === 'public')
      setIsRequired(myElement.required)
      setFieldKey(myElement.key)
      if (elementType === 'DROPDOWN') {
        setDropDownElement(JSON.parse(myElement.dropDownData))
      }
    }
  }

  const handleInputName = (t: string) => {
    if (t.length > 30) {
      return
    }
    setInputKey(t)
    setFieldKey(`${convertToSlug(t)}-${Date.now().toString().slice(0, 5)}`)
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  // variables
  const { addNewElementInForm, deleteElementInForm, updateElementInForm } =
    useAdditionalForm()
  useEffect(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const renderHeaderRight = () => {
    return (
      <View style={styles.switchHeaderContainer}>
        <Text style={styles.switchText}>{i18next.t('label.advance_mode')}</Text>
        <Switch
          value={advanceMode}
          trackColor={{ true: Colors.NEW_PRIMARY }}
          onValueChange={() => {
            setAdvanceMode(!advanceMode)
          }}
          disabled={false}
        />
      </View>
    )
  }

  function convertToSlug(text) {
    return text.toLowerCase().replace(/\s+/g, '-')
  }

  const toggleOptionModal = () => {
    setShowOptionModal(!showOptionModal)
  }

  const handleDropdownSelection = (d: {
    key: string
    value: string
    id: string
  }) => {
    setDropDownElement([...dropDownElement, d])
  }

  const updateDropDownElement = (d: {
    key: string
    value: string
    id: string
  }) => {
    const allElements = [...dropDownElement]
    const index = allElements.findIndex(el => el.id === d.id)
    allElements[index] = { ...d }
    setDropDownElement(allElements)
    setSelectedDropDown({
      key: '',
      value: '',
      id: '',
    })
  }

  const deleteElement = (d: { key: string; value: string; id: string }) => {
    const allElements = dropDownElement.filter(el => el.id !== d.id)
    setDropDownElement(allElements)
    setSelectedDropDown({
      key: '',
      value: '',
      id: '',
    })
    setShowOptionModal(false)
  }
  const selectDataType = (el: DropdownData) => {
    setDataType(el)
  }

  const renderTitle = () => {
    switch (elementType) {
      case 'INPUT':
        return i18next.t('label.input')
      case 'DROPDOWN':
        return i18next.t('label.dropdown')
      case 'GAP':
        return i18next.t('label.gap')
      case 'HEADING':
        return i18next.t('label.heading')
      case 'YES_NO':
        return i18next.t('label.yes_no')
      default:
        return i18next.t('label.input')
    }
  }

  const addNewElement = async () => {
    if (!validationInput()) {
      return
    }
    const noValidationRequired: FORM_TYPE[] = ['HEADING', 'GAP', 'PAGE']
    const details: FormElement = {
      element_id: uuid(),
      index: element_order,
      key: fieldKey,
      value: elementType === 'YES_NO' ? 'false' : '',
      label: inputKey,
      default: '',
      type: elementType,
      placeholder: inputKey,
      unit: '',
      visibility: isPublic ? 'public' : 'private',
      data_type: dataType.value === 'string' ? 'string' : 'number',
      keyboard_type: dataType.value === 'number' ? 'numeric' : 'default',
      editable: false,
      required: isRequired,
      validation: noValidationRequired.includes(elementType) ? '' : '.+',
      intervention: [],
      dropDownData: JSON.stringify(dropDownElement),
    }
    await addNewElementInForm(details, form_id)
    navigation.goBack()
  }

  const updateElement = async () => {
    if (!validationInput()) {
      return
    }
    const data = realm.objectForPrimaryKey<IAdditionalDetailsForm>(
      RealmSchema.AdditionalDetailsForm,
      form_id,
    )
    const allElements = [...JSON.parse(JSON.stringify(data.elements))]
    const index = allElements.findIndex(el => el.element_id === element_id)
    const myElement = allElements[index]
    myElement.index = element_order
    myElement.key = fieldKey
    myElement.label = inputKey
    myElement.visibility = isPublic ? 'public' : 'private'
    myElement.data_type = dataType.value === 'string' ? 'string' : 'number'
    myElement.keyboard_type =
      dataType.value === 'number' ? 'numeric' : 'default'
    myElement.required = isRequired
    myElement.dropDownData = JSON.stringify(dropDownElement)
    await updateElementInForm(element_id, form_id, myElement)
    navigation.goBack()
  }

  const validationInput = () => {
    if (inputKey.length === 0 && elementType !== 'GAP') {
      toast.show('Field name is required')
      return false
    }
    if (fieldKey.length === 0) {
      toast.show('Advance field  is required')
      return false
    }
    if (elementType === 'DROPDOWN' && dropDownElement.length < 2) {
      toast.show('Please add at least 2 options')
      return false
    }
    return true
  }

  const deleteHandler = async () => {
    const data = realm.objectForPrimaryKey<IAdditionalDetailsForm>(
      RealmSchema.AdditionalDetailsForm,
      form_id,
    )
    if (data) {
      await deleteElementInForm(element_id, form_id)
      navigation.goBack()
    }
  }

  const handleOptionEdit = (d: { key: string; value: string; id: string }) => {
    setSelectedDropDown(d)
    setShowOptionModal(true)
  }

  const renderOptionDD = () => {
    return dropDownElement.map(el => {
      return (
        <TouchableOpacity
          key={el.id}
          style={styles.wrapper}
          onPress={() => {
            handleOptionEdit(el)
          }}>
          <View style={styles.sectionWrapper}>
            <Text style={styles.keyLabel}>{el.key}</Text>
            <Text style={styles.keyValue}>{el.value}</Text>
          </View>
        </TouchableOpacity>
      )
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <DropDownFieldElement
          isVisible={showOptionModal}
          toggleModal={toggleOptionModal}
          addOption={handleDropdownSelection}
          selectedElement={selectedDropDown}
          updateElement={updateDropDownElement}
          deleteElement={deleteElement}
        />
        <Header label="" rightComponent={renderHeaderRight()} />
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.header}>Add {renderTitle()}</Text>
          {edit && (
            <TouchableOpacity
              style={styles.deleteWrapper}
              onPress={deleteHandler}>
              <Text style={styles.deletable}>
                {i18next.t('label.save_areas_delete')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {elementType !== 'GAP' && (
          <CustomTextInput
            label="Field name"
            onChangeHandler={handleInputName}
            value={inputKey}
          />
        )}
        {elementType === 'INPUT' && (
          <CustomDropDown
            label={'Field Type'}
            data={fieldType}
            onSelect={el => {
              selectDataType(el)
            }}
            whiteBG
            selectedValue={dataType}
          />
        )}
        {advanceMode && (
          <CustomTextInput
            label="Field key"
            onChangeHandler={(e) => {
              if (e.length > 30) {
                return
              }
              setFieldKey(e)
            }}
            value={fieldKey}
          />
        )}
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {i18next.t('label.required_field')}
          </Text>
          <Switch
            value={isRequired}
            onValueChange={() => {
              setIsRequired(!isRequired)
            }}
            disabled={false}
            trackColor={{ true: Colors.NEW_PRIMARY }}
          />
        </View>
        {elementType !== 'GAP' && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {i18next.t('label.make_this_public')}
            </Text>
            <Switch
              value={isPublic}
              onValueChange={() => {
                setIsPublic(!isPublic)
              }}
              trackColor={{ true: Colors.NEW_PRIMARY }}
              disabled={false}
            />
          </View>
        )}
        {elementType === 'DROPDOWN' && (
          <>
            <Text style={styles.dropDownOption}>
              {i18next.t('label.dropdown_options')}
            </Text>
            {renderOptionDD()}
            <Text style={styles.addDropDown} onPress={toggleOptionModal}>
              {i18next.t('label.add_dropdown_option')}
            </Text>
            <View style={styles.btnWrapper}></View>
            <View style={styles.footer} />
          </>
        )}
      </ScrollView>
      <CustomButton
        label={edit ? 'Update Element' : 'Add Element'}
        containerStyle={styles.btnContainer}
        pressHandler={edit ? updateElement : addNewElement}
      />
    </SafeAreaView>
  )
}

export default AdditionDataElement

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    fontSize: 22,
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    color: Colors.DARK_TEXT_COLOR,
    marginLeft: 20,
    marginVertical: 10,
  },
  headerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeHolder: {
    fontSize: 22,
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    color: Colors.DARK_TEXT_COLOR,
    marginLeft: 20,
    marginVertical: 10,
  },
  switchContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  switchHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    marginRight: 10,
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    marginRight: 16,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 20,
  },
  btnWrapper: {
    width: '100%',
    flex: 1,
    alignItems: 'flex-end',
  },
  footer: {
    width: '100%',
    height: 100,
  },
  dropDownOption: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
    marginTop: 20,
  },
  addDropDown: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.NEW_PRIMARY,
    marginLeft: 20,
    marginVertical: 10,
  },
  deleteWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'tomato',
    borderStyle: 'dashed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 20,
  },
  deletable: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: 'tomato',
    marginHorizontal: 10,
  },
  wrapper: {
    width: '90%',
    paddingVertical: 10,
    marginLeft: '5%',
  },
  sectionWrapper: {
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    paddingBottom: 20,
    paddingLeft: 10,
    borderRadius: 8,
  },
  keyLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginVertical: 10,
  },
  keyValue: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    width: '90%',
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
})
