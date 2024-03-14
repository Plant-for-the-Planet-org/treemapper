import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from 'src/utils/constants';

interface Props {
  buttonType?: 'element' | 'field';
  handleButtonPress: any;
  style?: any;
}

export default function AdditionalDataButton({
  buttonType = 'element',
  handleButtonPress,
  style = {},
}: Props): JSX.Element {
  return (
    <TouchableOpacity onPress={handleButtonPress} style={[styles.button, style]}>
      <Text style={styles.buttonText}>
        {buttonType == 'element' ? i18next.t('label.add_element') : i18next.t('label.add_field')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 30,
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
    alignSelf: 'flex-start',
    backgroundColor: Colors.WHITE,
    elevation: 5,
  },
  buttonText: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
});
