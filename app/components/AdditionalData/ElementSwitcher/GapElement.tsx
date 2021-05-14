import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../../styles';

const GapElement = () => {
  return <Text style={styles.text}>{i18next.t('label.gap_element')}</Text>;
};

export default GapElement;

const styles = StyleSheet.create({
  text: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    fontStyle: 'italic',
    fontWeight: 'bold',
    opacity: 0.5,
  },
});
