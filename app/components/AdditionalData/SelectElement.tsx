import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography } from '../../styles';
import { elementsType } from '../../utils/additionalDataConstants';
import { Header } from '../Common';

interface Props {}

const containerWidth = (Dimensions.get('window').width - 75) / 2;
const elements = [
  {
    icon: 'input',
    iconType: 'icon',
    name: 'input',
    type: elementsType.INPUT,
  },
  {
    icon: 'yesNo',
    iconType: 'icon',
    name: 'yes_no',
    type: elementsType.YES_NO,
  },
  {
    icon: 'gap',
    iconType: 'icon',
    name: 'gap',
    type: elementsType.GAP,
  },
  {
    icon: 'dropdown',
    iconType: 'icon',
    name: 'dropdown',
    type: elementsType.DROPDOWN,
  },
  {
    icon: 'formula',
    iconType: 'icon',
    name: 'formula',
    type: elementsType.FORMULA,
  },
  {
    icon: 'heading',
    iconType: 'icon',
    name: 'heading',
    type: elementsType.HEADING,
  },
  {
    icon: 'page',
    iconType: 'icon',
    name: 'page',
    type: elementsType.PAGE,
  },
];

const SelectElement = () => {
  const navigation = useNavigation();

  const handleElementPress = (elementType: string) => {
    navigation.navigate('AddField', { elementType, formId: '123' });
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header closeIcon headingText={i18next.t('label.select_element')} />
        <View style={styles.elementParent}>
          {elements.map((element: any, index: number) => (
            <TouchableOpacity
              onPress={() => handleElementPress(element.type)}
              key={`Element-${index}`}>
              <View style={styles.elementContainer}>
                <Text style={styles.name}>{i18next.t(`label.${element.name}`)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectElement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  elementContainer: {
    padding: 20,
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
    height: 120,
    width: containerWidth,
    marginTop: 25,
    alignItems: 'center',
  },
  elementParent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
  },
});
