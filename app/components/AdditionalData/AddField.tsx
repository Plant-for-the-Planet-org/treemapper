import { useRoute } from '@react-navigation/core';
import { CommonActions, RouteProp, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { addElement } from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { marginTop24, marginTop30 } from '../../styles/design';
import { accessTypes, elementsType } from '../../utils/additionalDataConstants';
import { Header, InputModal, PrimaryButton } from '../Common';
import SwipeDeleteRow from '../Common/SwipeDeleteRow';
import AddElementSwitcher from './AddElementSwitcher';
import KeyValueInput from './KeyValueInput';
import TypeSelection from './TypeSelection';

type RootStackParamList = {
  AddField: { elementType: string; formId: string };
};

type AddFieldScreenRouteProp = RouteProp<RootStackParamList, 'AddField'>;

type toEditType = 'key' | 'value';

export default function AddField() {
  const [selectedTreeType, setSelectedTreeType] = useState<any>([]);
  const [treeTypeError, setTreeTypeError] = useState<string>('');

  const [selectedRegistrationType, setSelectedRegistrationType] = useState<any>([]);
  const [registrationTypeError, setRegistrationTypeError] = useState<string>('');

  const [elementType, setElementType] = useState<string>('');

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

  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [toEdit, setToEdit] = useState<toEditType>('key');
  const [placeholder, setPlaceholder] = useState<string>('');
  const [dropdownOptionKey, setDropdownOptionKey] = useState<string>('');
  const [dropdownOptionValue, setDropdownOptionValue] = useState<string>('');
  const [showTempField, setShowTempField] = useState<boolean>(false);
  const [selectedDropdownOptionIndex, setSelectedDropdownOptionIndex] = useState<number>();

  const navigation = useNavigation();

  const route: AddFieldScreenRouteProp = useRoute();

  useEffect(() => {
    if (route.params?.elementType) {
      setElementType(route.params?.elementType || '');
      setFieldKey(`${route.params?.elementType}-${new Date().getTime()}`);

      switch (route.params.elementType) {
        case elementsType.INPUT:
          setHeadingText(i18next.t('label.add_input'));
          break;
        case elementsType.DROPDOWN:
          setHeadingText(i18next.t('label.add_dropdown'));
          break;
        case elementsType.HEADING:
          setHeadingText(i18next.t('label.add_heading'));
          break;
        case elementsType.YES_NO:
          setHeadingText(i18next.t('label.add_yes_no'));
          break;
        case elementsType.GAP:
          setHeadingText(i18next.t('label.add_gap_element'));
          setName(i18next.t('label.gap_element'));
          break;
        default:
          setHeadingText(i18next.t('label.add_element'));
          break;
      }
    }
  }, [route.params]);

  const handleAddElement = () => {
    if (areElementPropsValid()) {
      let typeProperties: any = {
        defaultValue,
        isRequired,
      };

      if (elementType === elementsType.DROPDOWN) {
        typeProperties.dropdownOptions = dropdownOptions;
      } else if (elementType === elementsType.INPUT) {
        typeProperties.type = inputType;
        typeProperties.regexValidation = regexValidation;
      } else if (elementType === elementsType.YES_NO) {
        typeProperties.defaultValue = !!defaultValue;
      }

      addElement({
        elementProperties: {
          key: fieldKey,
          name,
          type: elementType,
          treeType: selectedTreeType,
          registrationType: selectedRegistrationType,
          accessType: isPublic ? accessTypes.PUBLIC : accessTypes.PRIVATE,
        },
        typeProperties,
        formId: route.params.formId,
      }).then(() => {
        // resets the navigation stack with MainScreen => TreeInventory => TotalTreesSpecies
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'MainScreen' }, { name: 'AdditionalData' }],
          }),
        );
      });
    }
  };

  const areElementPropsValid = (): boolean => {
    let isSelectedTreeTypeValid: boolean = false;
    let isSelectedRegistrationType: boolean = false;
    let isNameValid: boolean = checkIsNameValid();
    let isKeyValid = false;
    let isDropdownOptionsValid = true;

    if (selectedTreeType.length === 0) {
      setTreeTypeError(i18next.t('label.atleast_1_tree_type_required'));
    } else {
      setTreeTypeError('');
      isSelectedTreeTypeValid = true;
    }

    if (selectedRegistrationType.length === 0) {
      setRegistrationTypeError(i18next.t('label.atleast_1_registration_type_required'));
    } else {
      setRegistrationTypeError('');
      isSelectedRegistrationType = true;
    }

    const allowedKeyCharacters = new RegExp(/^[a-zA-Z0-9 _-]+$/);

    if (!fieldKey) {
      setKeyError(i18next.t('label.field_key_required'));
    } else if (!allowedKeyCharacters.test(fieldKey)) {
      setKeyError(i18next.t('label.invalid_key_error'));
    } else {
      setKeyError('');
      isKeyValid = true;
    }

    if (
      route.params?.elementType === elementsType.DROPDOWN &&
      (!Array.isArray(dropdownOptions) ||
        (Array.isArray(dropdownOptions) && dropdownOptions.length < 2))
    ) {
      setDropdownOptionsError(i18next.t('label.atleast_2_dropdown_option_required'));
      isDropdownOptionsValid = false;
    } else {
      setDropdownOptionsError('');
    }

    console.log(
      isSelectedTreeTypeValid,
      isSelectedRegistrationType,
      isNameValid,
      isKeyValid,
      isDropdownOptionsValid,
    );

    return (
      isSelectedTreeTypeValid &&
      isSelectedRegistrationType &&
      isNameValid &&
      isKeyValid &&
      isDropdownOptionsValid
    );
  };

  const checkIsNameValid = (): boolean => {
    if (!name) {
      setNameError(i18next.t('label.field_name_required'));
      return false;
    } else {
      setNameError('');
      return true;
    }
  };

  const validateAndModifyField = () => {
    if (dropdownOptionKey && dropdownOptionValue) {
      const fieldData = {
        key: dropdownOptionKey,
        value: dropdownOptionValue,
      };
      let updatedDropdownOptions: any;
      if (selectedDropdownOptionIndex != null) {
        updatedDropdownOptions = [...dropdownOptions];
        updatedDropdownOptions[selectedDropdownOptionIndex] = fieldData;
      } else {
        updatedDropdownOptions = [...dropdownOptions, fieldData];
      }
      setDropdownOptions(updatedDropdownOptions);
      setShowTempField(false);
      setDropdownOptionKey('');
      setDropdownOptionValue('');
    }
  };

  const handleAddDropdownOption = () => {
    setShowTempField(true);
    editText('key');
  };

  const onSwipe = (index: number | null = null) => {
    if (index == null && showTempField) {
      setShowTempField(false);
      setDropdownOptionKey('');
      setDropdownOptionValue('');
    } else {
      dropdownOptions.splice(index, 1);
      setDropdownOptions(dropdownOptions);
    }
  };

  const editText = (editType: toEditType, option: any = null) => {
    setToEdit(editType);

    setPlaceholder(
      editType === 'key'
        ? i18next.t('label.additional_data_field_key_placeholder')
        : i18next.t('label.additional_data_field_value_placeholder'),
    );
    if (option != null) {
      setDropdownOptionKey(option.key);
      setDropdownOptionValue(option.value);
      setSelectedDropdownOptionIndex(option.index);
    }
    setShowInputModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        headingText={headingText}
        TopRightComponent={() => {
          if (elementType !== elementsType.GAP && elementType !== elementsType.HEADING) {
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
      <ScrollView style={styles.scrollContainer}>
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
        />
        <TypeSelection
          selectedTreeType={selectedTreeType}
          setSelectedTreeType={setSelectedTreeType}
          treeTypeError={treeTypeError}
          selectedRegistrationType={selectedRegistrationType}
          setSelectedRegistrationType={setSelectedRegistrationType}
          registrationTypeError={registrationTypeError}
        />
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
        {elementType === elementsType.DROPDOWN && (
          <View style={styles.dropdownOptionsContainer}>
            <Text style={styles.dropdownOptionsHeading}>{i18next.t('label.dropdown_options')}</Text>
            {dropdownOptions &&
              dropdownOptions.length > 0 &&
              dropdownOptions.map((option: any, index) => (
                <View style={styles.fieldWrapper} key={`dropdown-option-${index}`}>
                  <SwipeDeleteRow onSwipe={() => onSwipe(index)}>
                    <KeyValueInput
                      fieldKey={option.key}
                      fieldValue={option.value}
                      editText={(editType: toEditType) => editText(editType, option)}
                    />
                  </SwipeDeleteRow>
                </View>
              ))}
            {showTempField && (
              <View style={marginTop24}>
                <SwipeDeleteRow onSwipe={() => onSwipe()}>
                  <KeyValueInput
                    fieldKey={dropdownOptionKey}
                    fieldValue={dropdownOptionValue}
                    editText={(editType: toEditType) => editText(editType)}
                  />
                </SwipeDeleteRow>
              </View>
            )}
            <TouchableOpacity onPress={handleAddDropdownOption}>
              <Text style={styles.addDropdownOptionButton}>
                {i18next.t('label.add_dropdown_option')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <PrimaryButton
        btnText={i18next.t('label.add_element')}
        onPress={handleAddElement}
        style={styles.button}
      />
      {showInputModal ? (
        <InputModal
          inputType="text"
          onSubmitInputField={validateAndModifyField}
          isOpenModal={showInputModal}
          setIsOpenModal={setShowInputModal}
          placeholder={placeholder}
          value={toEdit === 'key' ? dropdownOptionKey : dropdownOptionValue}
          setValue={toEdit === 'key' ? setDropdownOptionKey : setDropdownOptionValue}
          isRequired
          returnKeyType={'send'}
        />
      ) : (
        []
      )}
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
  scrollContainer: {
    flex: 1,
  },
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
  },
});
