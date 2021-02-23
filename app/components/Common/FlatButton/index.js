import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';

const FlatButton = ({ text, style, primary, onPress }) => {
  return (
    <Text onPress={onPress} style={[styles.flatBtn, primary && styles.primaryColor, style]}>
      {text}
    </Text>
  );
};

const styles = StyleSheet.create({
  flatBtn: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
  },
  primaryColor: { color: Colors.PRIMARY },
});

export default FlatButton;
