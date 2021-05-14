import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../styles';

interface IKeyValueInputProps {
  fieldKey: string;
  fieldValue: string;
  editText: (toEdit: 'key' | 'value') => void;
}

const KeyValueInput = ({ fieldKey, fieldValue, editText }: IKeyValueInputProps) => {
  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity onPress={() => editText('key')}>
        <Text style={[styles.fieldKey, !fieldKey ? styles.placeholderColor : {}]}>
          {fieldKey ? fieldKey : i18next.t('label.filed_key_placeholder')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => editText('value')}>
        <Text style={[styles.fieldValue, !fieldValue ? styles.placeholderColor : {}]}>
          {fieldValue || i18next.t('label.filed_value_placeholder')}
        </Text>
      </TouchableOpacity>
    </View>
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
