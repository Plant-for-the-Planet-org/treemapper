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
import { elementsType } from '../../utils/additionalData/constants';
import { Header } from '../Common';

import MCIIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import IconSwitcher from '../Common/IconSwitcher';

type RootStackParamList = {
  SelectElement: { formId: string; formOrder: number };
};

type SelectElementScreenRouteProp = RouteProp<RootStackParamList, 'SelectElement'>;

const containerWidth = (Dimensions.get('window').width - 75) / 2;
const elements = [
  {
    icon: 'form-textbox',
    iconType: 'MCIIcon',
    name: 'input',
    type: elementsType.INPUT,
  },
  {
    icon: 'toggle-on',
    iconType: 'FA5Icon',
    name: 'yes_no',
    type: elementsType.YES_NO,
  },
  {
    icon: 'format-line-spacing',
    iconType: 'MCIIcon',
    name: 'gap',
    type: elementsType.GAP,
  },
  {
    icon: 'form-dropdown',
    iconType: 'MCIIcon',
    name: 'dropdown',
    type: elementsType.DROPDOWN,
  },
  {
    icon: 'heading',
    iconType: 'FA5Icon',
    name: 'heading',
    type: elementsType.HEADING,
  },
  {
    icon: 'file-alt',
    iconType: 'FA5Icon',
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
    if (elementType === elementsType.PAGE) {
      addForm({ order: formOrder + 1 });
      navigation.goBack();
    } else {
      navigation.navigate('AddEditElement', { elementType, formId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header
          closeIcon
          headingText={i18next.t('label.select_element')}
          style={{ paddingHorizontal: 25 }}
        />
        <View style={styles.elementParent}>
          {elements.map((element: any, index: number) => (
            <TouchableOpacity
              onPress={() => handleElementPress(element.type)}
              key={`Element-${index}`}
              style={styles.elementShadowContainer}>
              <IconSwitcher
                name={element.icon}
                size={44}
                color={Colors.TEXT_COLOR}
                style={{ marginBottom: 20 }}
                iconType={element.iconType}
              />
              <Text style={styles.name}>{i18next.t(`label.${element.name}`)}</Text>
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
    backgroundColor: Colors.WHITE,
  },
  elementParent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 25,
  },
  elementShadowContainer: {
    borderRadius: 8,
    elevation: 5,
    marginTop: 25,
    height: 140,
    width: containerWidth,
    backgroundColor: Colors.WHITE,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  name: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
});
