import { useRoute } from '@react-navigation/core';
import { CommonActions, RouteProp, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AdditionalDataContext } from '../../reducers/additionalData';
import { Colors, Typography } from '../../styles';
import { marginTop24, marginTop30 } from '../../styles/design';
import {
  accessTypes,
  elementsType,
  ElementType,
  inputOptions,
  inputTypes,
  nonInputElementsTypes,
  numberRegex,
} from '../../utils/additionalData/constants';
import { Header, PrimaryButton } from '../Common';
import SwipeDeleteRow from '../Common/SwipeDeleteRow';
import AddElementSwitcher from './AddElementSwitcher';
import AddDropdownOption from './AddElementSwitcher/AddDropdownOption';
import KeyValueInput from './KeyValueInput';
import TypeSelection from './TypeSelection';

type RootStackParamList = {
  AddEditElement: {
    elementType: ElementType;
    formId: string;
    isModification: boolean;
    elementData: any;
  };
};

type AddEditElementScreenRouteProp = RouteProp<RootStackParamList, 'AddEditElement'>;

export default function AddEditElement() {
  const [selectedTreeType, setSelectedTreeType] = useState<any>([]);
  const [treeTypeError, setTreeTypeError] = useState<string>('');
  const [selectedRegistrationType, setSelectedRegistrationType] = useState<any>([]);
  const [registrationTypeError, setRegistrationTypeError] = useState<string>('');
  const [shouldUpdateTypeSelection, setShouldUpdateTypeSelection] = useState<boolean>(false);

  const [elementType, setElementType] = useState<ElementType | ''>('');

  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [dropdownOptionsError, setDropdownOptionsError] = useState<string>('');
  const [fieldKey, setFieldKey] = useState<string>('');
  const [keyError, setKeyError] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [defaultValue, setDefaultValue] = useState<string>('');
  const [defaultValueError, setDefaultValueError] = useState<string>('');
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [headingText, setHeadingText] = useState<string>(i18next.t('label.add_element'));
  const [isAdvanceModeEnabled, setIsAdvanceModeEnabled] = useState<boolean>(false);
  const [inputType, setInputType] = useState<string>('');
  const [regexValidation, setRegexValidation] = useState<string>('');

  const [dropdownOptionKey, setDropdownOptionKey] = useState<string>('');
  const [dropdownOptionValue, setDropdownOptionValue] = useState<string>('');
  const [selectedDropdownOptionIndex, setSelectedDropdownOptionIndex] = useState<number | null>(
    null,
  );
  const [selectedInputDropdownOption, setSelectedInputDropdownOption] = useState<any>();
  const [showDropdownOptionForm, setShowDropdownOptionForm] = useState<boolean>(false);

  const [isModification, setIsModification] = useState<boolean>(false);
  const [modifyingElementData, setModifyingElementData] = useState<any>();

  const [elementId, setElementId] = useState<string>('');
  const [subElementId, setSubElementId] = useState<string>('');

  const { modifyElement } = useContext(AdditionalDataContext);

  const navigation = useNavigation();

  const route: AddEditElementScreenRouteProp = useRoute();

  useEffect(() => {
    if (route.params?.elementType) {
      setElementType(route.params?.elementType || '');
      setFieldKey(`${route.params?.elementType}-${new Date().getTime()}`);
      setIsModification(route.params?.isModification ?? false);
      setModifyingElementData(route.params?.elementData || null);

      switch (route.params.elementType) {
        case elementsType.INPUT:
          setHeadingText(
            i18next.t(route.params?.isModification ? 'label.edit_input' : 'label.add_input'),
          );
          setInputType(inputTypes.TEXT);
          break;
        case elementsType.DROPDOWN:
          setHeadingText(
            i18next.t(route.params?.isModification ? 'label.edit_dropdown' : 'label.add_dropdown'),
          );
          break;
        case elementsType.HEADING:
          setHeadingText(
            i18next.t(route.params?.isModification ? 'label.edit_heading' : 'label.add_heading'),
          );
          break;
        case elementsType.YES_NO:
          setHeadingText(
            i18next.t(route.params?.isModification ? 'label.edit_yes_no' : 'label.add_yes_no'),
          );
          break;
        case elementsType.GAP:
          setHeadingText(
            i18next.t(
              route.params?.isModification ? 'label.edit_gap_element' : 'label.add_gap_element',
            ),
          );
          setName(i18next.t('label.gap_element'));
          break;
        default:
          setHeadingText(
            i18next.t(route.params?.isModification ? 'label.update_element' : 'label.add_element'),
          );
          break;
      }
    }
  }, [route.params]);

  useEffect(() => {
    if (modifyingElementData && isModification) {
      if (modifyingElementData.type === elementsType.INPUT) {
        const option =
          modifyingElementData.inputType === inputTypes.TEXT ? inputOptions[0] : inputOptions[1];
        setSelectedInputDropdownOption(option);
      }
      setElementId(modifyingElementData.id);
      setFieldKey(modifyingElementData.key);
      setName(modifyingElementData.name);
      setElementType(modifyingElementData.type);
      setSelectedRegistrationType(modifyingElementData.registrationType);
      setSelectedTreeType(modifyingElementData.treeType);
      setIsPublic(modifyingElementData.accessType === accessTypes.PUBLIC);

      setSubElementId(modifyingElementData.subElementId || '');
      setDefaultValue(modifyingElementData.defaultValue || '');
      setIsRequired(modifyingElementData.isRequired ?? false);
      setDropdownOptions(modifyingElementData.dropdownOptions || []);
      setInputType(modifyingElementData.inputType || '');
      setRegexValidation(modifyingElementData.regexValidation || '');
      setShouldUpdateTypeSelection(true);
    }
  }, [modifyingElementData, isModification]);

  const areElementPropsValid = (): boolean => {
    let errorCount = 0;

    if (selectedTreeType.length === 0) {
      setTreeTypeError(i18next.t('label.atleast_1_tree_type_required'));
      errorCount += 1;
    } else {
      setTreeTypeError('');
    }

    if (selectedRegistrationType.length === 0) {
      setRegistrationTypeError(i18next.t('label.atleast_1_registration_type_required'));
      errorCount += 1;
    } else {
      setRegistrationTypeError('');
    }

    const allowedKeyCharacters = new RegExp(/^[a-zA-Z0-9 _-]+$/);

    if (!fieldKey) {
      setKeyError(i18next.t('label.field_key_required'));
      setIsAdvanceModeEnabled(true);
      errorCount += 1;
    } else if (!allowedKeyCharacters.test(fieldKey)) {
      setKeyError(i18next.t('label.invalid_key_error'));
      setIsAdvanceModeEnabled(true);
      errorCount += 1;
    } else {
      setKeyError('');
    }

    if (!name) {
      setNameError(i18next.t('label.field_name_required'));
      errorCount += 1;
    } else {
      setNameError('');
    }

    if (
      route.params?.elementType === elementsType.DROPDOWN &&
      (!Array.isArray(dropdownOptions) ||
        (Array.isArray(dropdownOptions) && dropdownOptions.length < 2))
    ) {
      setDropdownOptionsError(i18next.t('label.atleast_2_dropdown_option_required'));
      errorCount += 1;
    } else {
      setDropdownOptionsError('');
    }

    if (
      route.params?.elementType === elementsType.INPUT &&
      inputType === inputTypes.NUMBER &&
      !numberRegex.test(defaultValue) &&
      defaultValue
    ) {
      setDefaultValueError(i18next.t('label.default_value_only_number'));
      setIsAdvanceModeEnabled(true);
      errorCount += 1;
    } else {
      setDefaultValueError('');
    }

    return errorCount === 0;
  };

  const getElementData = () => {
    if (areElementPropsValid()) {
      const id = elementId || uuidv4();
      let typeProperties: any = {
        defaultValue,
        isRequired,
        id: isModification ? subElementId : uuidv4(),
        parentId: id,
      };

      if (elementType === elementsType.DROPDOWN) {
        typeProperties.dropdownOptions = dropdownOptions;
      } else if (elementType === elementsType.INPUT) {
        typeProperties.type = inputType;
        typeProperties.regexValidation = regexValidation;
      } else if (elementType === elementsType.YES_NO) {
        typeProperties.defaultValue = !!defaultValue;
      }

      const elementData = {
        elementProperties: {
          id: id,
          key: fieldKey,
          name,
          type: elementType,
          treeType: selectedTreeType,
          registrationType: selectedRegistrationType,
          accessType: isPublic ? accessTypes.PUBLIC : accessTypes.PRIVATE,
        },
        typeProperties,
        formId: route.params.formId,
        elementIndex: isModification ? modifyingElementData.index : null,
        isModification,
      };

      return elementData;
    }
    return null;
  };

  const handleAddEditElement = () => {
    const elementData = getElementData();
    if (elementData) {
      modifyElement(elementData);
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'MainScreen' }, { name: 'AdditionalData' }],
        }),
      );
    }
  };

  const handleAddDropdownOption = () => {
    setDropdownOptionKey('');
    setDropdownOptionValue('');
    setSelectedDropdownOptionIndex(null);
    setShowDropdownOptionForm(true);
  };

  const updateDropdownOption = (key: string, value: string, index: number | null) => {
    setDropdownOptionKey(key);
    setDropdownOptionValue(value);
    setSelectedDropdownOptionIndex(index);
    setShowDropdownOptionForm(true);
  };

  const onSwipe = (index: number) => {
    dropdownOptions.splice(index, 1);
    setDropdownOptions(dropdownOptions);
  };

  if (showDropdownOptionForm) {
    return (
      <AddDropdownOption
        fieldKey={dropdownOptionKey}
        fieldValue={dropdownOptionValue}
        dropdownIndex={selectedDropdownOptionIndex}
        setDropdownOptions={setDropdownOptions}
        closeForm={() => setShowDropdownOptionForm(false)}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header
          headingText={headingText}
          TopRightComponent={() => {
            if (!nonInputElementsTypes.includes(elementType)) {
              return (
                <Switcher
                  switchText={i18next.t('label.advance_mode')}
                  isEnabled={isAdvanceModeEnabled}
                  setIsEnabled={setIsAdvanceModeEnabled}
                />
              );
            }
            return <></>;
          }}
        />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <AddElementSwitcher
            elementType={elementType}
            isAdvanceModeEnabled={isAdvanceModeEnabled}
            name={name}
            setName={setName}
            nameError={nameError}
            fieldKey={fieldKey}
            setFieldKey={setFieldKey}
            keyError={keyError}
            defaultValue={defaultValue}
            setDefaultValue={setDefaultValue}
            defaultValueError={defaultValueError}
            dropdownOptions={dropdownOptions}
            setDropdownOptions={setDropdownOptions}
            inputType={inputType}
            setInputType={setInputType}
            selectedOption={selectedInputDropdownOption}
          />
          <TypeSelection
            selectedTreeType={selectedTreeType}
            setSelectedTreeType={setSelectedTreeType}
            treeTypeError={treeTypeError}
            selectedRegistrationType={selectedRegistrationType}
            setSelectedRegistrationType={setSelectedRegistrationType}
            registrationTypeError={registrationTypeError}
            shouldUpdateTypeSelection={shouldUpdateTypeSelection}
            setShouldUpdateTypeSelection={setShouldUpdateTypeSelection}
          />
          {!nonInputElementsTypes.includes(elementType) && (
            <>
              <View style={marginTop30}>
                <Switcher
                  switchText={i18next.t('label.required_field')}
                  isEnabled={isRequired}
                  setIsEnabled={setIsRequired}
                />
              </View>
              <View style={marginTop30}>
                <Switcher
                  switchText={i18next.t('label.make_this_public')}
                  isEnabled={isPublic}
                  setIsEnabled={setIsPublic}
                />
              </View>
            </>
          )}
          {elementType === elementsType.DROPDOWN && (
            <View style={styles.dropdownOptionsContainer}>
              <Text style={styles.dropdownOptionsHeading}>
                {i18next.t('label.dropdown_options')}
              </Text>
              {dropdownOptions &&
                dropdownOptions.length > 0 &&
                dropdownOptions.map((option: any, index: number) => (
                  <View style={styles.fieldWrapper} key={`dropdown-option-${index}`}>
                    <SwipeDeleteRow onSwipe={() => onSwipe(index)}>
                      <KeyValueInput
                        fieldKey={option.key}
                        fieldValue={option.value}
                        onPress={() => updateDropdownOption(option.key, option.value, index)}
                      />
                    </SwipeDeleteRow>
                  </View>
                ))}
              <TouchableOpacity onPress={handleAddDropdownOption}>
                <Text style={styles.addDropdownOptionButton}>
                  {i18next.t('label.add_dropdown_option')}
                </Text>
              </TouchableOpacity>
              {dropdownOptionsError ? (
                <Text style={styles.errorText}>{dropdownOptionsError}</Text>
              ) : (
                []
              )}
            </View>
          )}
        </ScrollView>

        <PrimaryButton
          btnText={i18next.t(isModification ? 'label.update_element' : 'label.add_element')}
          onPress={handleAddEditElement}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

interface ISwitcherProps {
  switchText: string;
  isEnabled: boolean;
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const Switcher = ({ switchText = '', isEnabled, setIsEnabled }: ISwitcherProps) => {
  return (
    <View style={styles.switchContainer}>
      <Text style={styles.switchText}>{switchText}</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#d4e7b1' }}
        thumbColor={isEnabled ? Colors.PRIMARY : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => setIsEnabled(!isEnabled)}
        value={isEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  button: { marginTop: 10 },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    marginRight: 10,
  },
  fieldWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
    ...marginTop24,
  },
  dropdownOptionsContainer: {
    marginTop: 30,
  },
  dropdownOptionsHeading: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_18,
  },
  addDropdownOptionButton: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.PRIMARY,
    fontSize: Typography.FONT_SIZE_14,
    paddingVertical: 8,
    marginVertical: 16,
  },
  errorText: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    marginTop: 6,
  },
});
