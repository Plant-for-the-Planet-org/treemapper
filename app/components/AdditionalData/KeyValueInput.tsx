import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../styles';

interface IKeyValueInputProps {
  fieldKey: string;
  fieldValue: string;
  onPress: any;
}

const KeyValueInput = ({ fieldKey, fieldValue, onPress }: IKeyValueInputProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.inputContainer}>
      <Text style={[styles.fieldKey, !fieldKey ? styles.placeholderColor : {}]}>
        {fieldKey ? fieldKey : i18next.t('label.additional_data_field_key_placeholder')}
      </Text>
      <Text style={[styles.fieldValue, !fieldValue ? styles.placeholderColor : {}]}>
        {fieldValue || i18next.t('label.additional_data_field_value_placeholder')}
      </Text>
    </TouchableOpacity>
  );
};

export default KeyValueInput;

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: Colors.GRAY_LIGHT,
    borderRadius: 6,
    padding: 8,
    paddingTop: 4,
    flex: 1,
  },
  fieldKey: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    paddingVertical: 4,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: Colors.WHITE,
  },
  placeholderColor: {
    color: '#9a9a9a',
  },
});
