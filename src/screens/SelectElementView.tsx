import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import i18next from 'i18next';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography } from 'src/utils/constants';
import Header from 'src/components/common/Header';
import IconSwitcher from 'src/components/common/IconSwitcher';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { FORM_TYPE } from 'src/types/type/app.type';
import { v4 as uuid } from 'uuid'
import useAdditionalForm from 'src/hooks/realm/useAdditionalForm';


const containerWidth = (Dimensions.get('window').width - 75) / 2;
const elements = [
  {
    icon: 'form-textbox',
    iconType: 'MCIcon',
    name: 'input',
    type: 'INPUT',
  },
  {
    icon: 'toggle-on',
    iconType: 'FA5Icon',
    name: 'yes_no',
    type: 'YES_NO'
  },
  {
    icon: 'format-line-spacing',
    iconType: 'MCIcon',
    name: 'gap',
    type: 'GAP',
  },
  {
    icon: 'form-dropdown',
    iconType: 'MCIcon',
    name: 'dropdown',
    type: 'DROPDOWN'
  },
  {
    icon: 'heading',
    iconType: 'FA5Icon',
    name: 'heading',
    type: 'HEADING'
  },
  {
    icon: 'file-alt',
    iconType: 'FA5Icon',
    name: 'page',
    type: 'PAGE',
  },
];

const SelectElement = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'SelectElement'>>()
  const form_id = route.params && route.params.form_id ? route.params.form_id : ''
  const element_order = route.params && route.params.element_order ? route.params.element_order : 0
  const { addNewForm } = useAdditionalForm()

  const handleElementPress = (elementType: FORM_TYPE) => {
    if (elementType === 'PAGE') {
      createNewForm()
      return
    }
    navigation.navigate('AdditionDataElement', { element: elementType, form_id, element_order })
  };

  const createNewForm = async () => {
    const id = uuid()
    await addNewForm(id, 0)
    navigation.goBack()
  }


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header
          label={i18next.t('label.select_element')}
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
