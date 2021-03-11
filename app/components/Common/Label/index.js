import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';

const Label = ({ leftText, rightText, onPressRightText, leftTextStyle, rightTextStyle, style }) => {
  return (
    <View>
      <View style={[styles.container, style]}>
        <View>
          <Text style={[styles.leftText, leftTextStyle]}>{leftText}</Text>
        </View>
        <TouchableOpacity onPress={onPressRightText}>
          <Text
            style={[styles.rightText, rightTextStyle]}
            accessibilityLabel="Label Button"
            accessible={true}
            testID="label_btn">
            {rightText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default Label;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  headerText: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    color: Colors.TEXT_COLOR,
  },
  leftText: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.TEXT_COLOR,
  },
  rightText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.PRIMARY,
  },
  backArrow: {},
});
