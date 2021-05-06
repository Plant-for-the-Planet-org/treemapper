import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../styles';

interface Props {
  buttonType?: string;
  handleButtonPress: any;
}

export default function AdditionalDataButton({
  buttonType = 'form',
  handleButtonPress,
}: Props): JSX.Element {
  return (
    <TouchableOpacity onPress={handleButtonPress} style={[styles.button]}>
      <Text style={styles.buttonText}>
        {buttonType == 'form' ? i18next.t('label.add_element') : i18next.t('label.add_field')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    marginTop: 30,
    elevation: 5,
    backgroundColor: Colors.WHITE,
    borderRadius: 6,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
  },
  buttonText: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
});
