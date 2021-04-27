import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, CommonStyles } from '_styles';

const Input = ({ label, value, editable, placeholder, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onPressLabel = () => {
    setTimeout(() => setIsOpen(!isOpen), 0);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        disabled={editable == false}
        onPress={onPressLabel}
        style={styles.valueContainer}
        accessible={true}
        accessibilityLabel="Input Button"
        testID="input_btn">
        <Text style={CommonStyles.bottomInputText}>{value ? value : placeholder}</Text>
      </TouchableOpacity>
    </View>
  );
};
export default Input;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    flex: 1,
  },
  label: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  valueContainer: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.TEXT_COLOR,
  },
});
