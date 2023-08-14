import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors, Typography } from '../../../styles';
import LinearGradient from 'react-native-linear-gradient';
import GradientText from '../GradientText/GradientText';

interface IPrimaryButtonProps {
  btnText: string;
  theme?: any;
  halfWidth?: any;
  style?: any;
  onPress: any;
  disabled?: any;
  textStyle?: any;
  testID?: string;
  accessibilityLabel?: string;
}

const PrimaryButton = ({
  btnText,
  theme,
  halfWidth,
  style,
  onPress,
  disabled,
  textStyle,
  testID,
  accessibilityLabel,
}: IPrimaryButtonProps) => {
  const isWhiteTheme = theme == 'white';
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      accessible={true}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        isWhiteTheme && !disabled && styles.whiteTheme,
        halfWidth && styles.halfWidth,
        disabled && styles.disabledCont,
        style,
      ]}>
      <LinearGradient
        useAngle={true}
        angle={135}
        angleCenter={{ x: 0.5, y: 0.5 }}
        colors={
          isWhiteTheme && !disabled
            ? ['transparent', 'transparent']
            : [Colors.PRIMARY, Colors.PRIMARY_DARK]
        }
        style={[styles.linearGradient, isWhiteTheme && !disabled && { paddingVertical: 16 }]}>
        {isWhiteTheme && !disabled ? (
          <GradientText style={[styles.gradientBtnText, textStyle]}>{btnText}</GradientText>
        ) : (
          <Text style={[styles.btnText, textStyle]}>{btnText}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};
export default PrimaryButton;

const styles = StyleSheet.create({
  linearGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.PRIMARY,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteTheme: {
    backgroundColor: Colors.WHITE,
    borderColor: Colors.PRIMARY,
    borderWidth: 2,
  },
  primaryText: {
    color: Colors.PRIMARY,
  },
  btnText: {
    color: Colors.WHITE,
    fontSize: Typography.FONT_SIZE_18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  gradientBtnText: {
    fontSize: Typography.FONT_SIZE_18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  halfWidth: {
    width: '47%',
  },
  disabledCont: {
    backgroundColor: Colors.DISABLE,
  },
});
