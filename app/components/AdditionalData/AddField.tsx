import { useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { v4 } from 'uuid';
import { addField } from '../../repositories/additionalData';
import { Colors } from '../../styles';
import { elementsType } from '../../utils/additionalDataConstants';
import { Header, PrimaryButton } from '../Common';
import TypeSelection from './TypeSelection';

interface Props {}

type RootStackParamList = {
  AddField: { elementType: string; formId: string };
};

type AddFieldScreenRouteProp = RouteProp<RootStackParamList, 'AddField'>;

export default function AddField() {
  const [selectedTreeType, setSelectedTreeType] = useState([]);
  const [selectedRegistrationType, setSelectedRegistrationType] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [elementType, setElementType] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [defaultValue, setDefaultValue] = useState<string>('');
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [headingText, setHeadingText] = useState<string>(i18next.t('label.add_element'));

  const route: AddFieldScreenRouteProp = useRoute();

  useEffect(() => {
    setElementType(route.params?.elementType || '');
    setName(route.params?.elementType === elementsType.GAP ? i18next.t('label.gap_element') : '');
    if (
      route.params?.elementType === elementsType.GAP ||
      route.params?.elementType === elementsType.HEADING ||
      route.params?.elementType === elementsType.FORMULA
    ) {
      setKey(`${route.params?.elementType}-${v4}`);
    }
  }, [route.params]);

  const handleAddField = () => {
    addField({
      fieldData: {
        key,
        name,
        type: elementType,
        defaultValue,
        isRequired,
        treeType: selectedTreeType,
        registrationType: selectedRegistrationType,
        dropdownOptions,
      },
      formId: route.params.formId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header headingText={headingText} />
      <FieldSwitcher elementType={elementType} />
      <TypeSelection
        setSelectedTreeType={setSelectedTreeType}
        setSelectedRegistrationType={setSelectedRegistrationType}
      />
      <PrimaryButton
        btnText={i18next.t('label.add_field')}
        onPress={handleAddField}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

interface IFieldSwitcherProps {
  elementType: any;
}
const FieldSwitcher = ({ elementType }: IFieldSwitcherProps) => {
  switch (elementType) {
    case elementType === elementsType.INPUT:
      return <Text>{elementType}</Text>;
    case elementType === elementsType.DROPDOWN:
      return <Text>{elementType}</Text>;
    case elementType === elementsType.HEADING:
      return <Text>{elementType}</Text>;
    case elementType === elementsType.PAGE:
      return <Text>{elementType}</Text>;
    case elementType === elementsType.GAP:
    default:
      return <Text>{elementType}</Text>;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  button: { marginTop: 10 },
});
