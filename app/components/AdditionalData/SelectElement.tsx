import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { addForm } from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { elementsType } from '../../utils/additionalDataConstants';
import { Header } from '../Common';

type RootStackParamList = {
  SelectElement: { formId: string; formOrder: number };
};

type SelectElementScreenRouteProp = RouteProp<RootStackParamList, 'SelectElement'>;

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
  const [formId, setFormId] = useState<string>('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const navigation = useNavigation();
  const route: SelectElementScreenRouteProp = useRoute();

  useEffect(() => {
    if (route.params?.formId) {
      setFormId(route.params.formId);
    }
    if (route.params?.formOrder) {
      setFormOrder(route.params.formOrder);
    }
  }, [route.params]);

  const handleElementPress = (elementType: string) => {
    console.log('elementType', elementType);
    if (elementType === elementsType.PAGE) {
      addForm({ order: formOrder + 1 });
      navigation.goBack();
    } else {
      navigation.navigate('AddField', { elementType, formId });
    }
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
