import { useRoute } from '@react-navigation/core';
import { CommonActions, RouteProp, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import { v4 } from 'uuid';
import { addElement } from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { elementsType } from '../../utils/additionalDataConstants';
import { Header, PrimaryButton } from '../Common';
import AddElementSwitcher from './AddElementSwitcher';
import TypeSelection from './TypeSelection';

interface Props {}

type RootStackParamList = {
  AddField: { elementType: string; formId: string };
};

type AddFieldScreenRouteProp = RouteProp<RootStackParamList, 'AddField'>;

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

  const [headingText, setHeadingText] = useState<string>(i18next.t('label.add_element'));
  const [isAdvanceModeEnabled, setIsAdvanceModeEnabled] = useState<boolean>(false);
  const [inputType, setInputType] = useState<string>('');
  const [regexValidation, setRegexValidation] = useState<string>('');

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

  return (
    <SafeAreaView style={styles.container}>
      <Header
        headingText={headingText}
        TopRightComponent={() => (
          <AdvanceModeSwitcher
            isAdvanceModeEnabled={isAdvanceModeEnabled}
            setIsAdvanceModeEnabled={setIsAdvanceModeEnabled}
          />
        )}
      />
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
      <PrimaryButton
        btnText={i18next.t('label.add_element')}
        onPress={handleAddElement}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

interface IAdvanceModeSwitcherProps {
  isAdvanceModeEnabled: boolean;
  setIsAdvanceModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdvanceModeSwitcher = ({
  isAdvanceModeEnabled,
  setIsAdvanceModeEnabled,
}: IAdvanceModeSwitcherProps) => {
  return (
    <View style={styles.switchContainer}>
      <Text style={styles.switchText}>{i18next.t('label.advance_mode')}</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#d4e7b1' }}
        thumbColor={isAdvanceModeEnabled ? Colors.PRIMARY : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => setIsAdvanceModeEnabled(!isAdvanceModeEnabled)}
        value={isAdvanceModeEnabled}
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
});
