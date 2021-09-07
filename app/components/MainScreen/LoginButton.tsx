import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../styles';

interface ILoginButtonProps {
  onPressLogin: () => void;
  isUserLogin: boolean;
}

const LoginButton = ({ onPressLogin, isUserLogin }: ILoginButtonProps) => {
  if (!isUserLogin) {
    return (
      <TouchableOpacity
        onPress={onPressLogin}
        testID={'login-signup-button'}
        accessibilityLabel={'login-signup-button'}
        accessible={true}
        style={styles.loginButton}>
        <Text style={styles.loginText}>{i18next.t('label.login')}</Text>
      </TouchableOpacity>
    );
  } else {
    return <></>;
  }
};
export default LoginButton;

const styles = StyleSheet.create({
  loginButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.PRIMARY_DARK,
  },

  loginText: {
    color: Colors.WHITE,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
});
