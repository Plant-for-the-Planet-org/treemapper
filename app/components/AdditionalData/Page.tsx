import { useNavigation } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../styles';
import AdditionalDataButton from './AdditionalDataButton';
import FeatherIcon from 'react-native-vector-icons/Feather';
import i18next from 'i18next';
import ElementSwitcher from './ElementSwitcher';

interface IPageProps {
  step: number;
  elements: any;
  formId: string;
  handleDeletePress: any;
  formOrder: number;
}

export default function Page({ step, elements, formId, handleDeletePress, formOrder }: IPageProps) {
  const navigation = useNavigation();

  const handleButtonPress = () => {
    navigation.navigate('SelectElement', { formId, formOrder });
  };

  return (
    <View style={[styles.pageContainer, step > 1 ? styles.newPage : {}]}>
      <View style={styles.formHeading}>
        <Text style={styles.formHeadingText}>{i18next.t('label.form_step', { step })}</Text>
        <TouchableOpacity style={styles.deleteIcon} onPress={handleDeletePress}>
          <FeatherIcon name="trash-2" size={20} color={Colors.ALERT} />
        </TouchableOpacity>
      </View>
      {elements.map((element: any) => (
        <ElementSwitcher {...element} />
      ))}
      <AdditionalDataButton handleButtonPress={handleButtonPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    paddingHorizontal: 25,
    marginBottom: 80,
  },
  newPage: {
    borderTopWidth: 2,
    borderTopColor: Colors.LIGHT_BORDER_COLOR,
    borderStyle: 'dashed',
    paddingTop: 40,
  },
  formHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formHeadingText: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
    marginRight: 24,
  },
  deleteIcon: {
    padding: 10,
  },
});
