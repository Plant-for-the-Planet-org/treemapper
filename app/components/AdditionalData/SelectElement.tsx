import i18next from 'i18next';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../styles';
import { Header } from '../Common';

interface Props {}

const containerWidth = (Dimensions.get('window').width - 75) / 2;

const SelectElement = (props: Props) => {
  const elements = [
    {
      icon: 'input',
      iconType: 'icon',
      name: 'input',
      type: 'input',
    },
    {
      icon: 'yesNo',
      iconType: 'icon',
      name: 'yes_no',
      type: 'yesNo',
    },
    {
      icon: 'gap',
      iconType: 'icon',
      name: 'gap',
      type: 'gap',
    },
    {
      icon: 'dropdown',
      iconType: 'icon',
      name: 'dropdown',
      type: 'dropdown',
    },
    {
      icon: 'formula',
      iconType: 'icon',
      name: 'formula',
      type: 'formula',
    },
    {
      icon: 'heading',
      iconType: 'icon',
      name: 'heading',
      type: 'heading',
    },
    {
      icon: 'page',
      iconType: 'icon',
      name: 'page',
      type: 'page',
    },
  ];
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header closeIcon headingText={i18next.t('label.select_element')} />
        <View style={styles.elementParent}>
          {elements.map((element: any) => (
            <View style={styles.elementContainer}>
              <Text style={styles.name}>{i18next.t(`label.${element.name}`)}</Text>
            </View>
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
