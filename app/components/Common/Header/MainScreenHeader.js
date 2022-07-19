import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Colors, Typography} from '_styles';
import i18next from '../../../languages/languages';

const MainScreenHeader = ({onPressLogin, isUserLogin, accessibilityLabel, testID}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPressLogin}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessible={true}>
        {!isUserLogin ? <Text style={styles.loginText}>{i18next.t('label.login')}</Text> : []}
      </TouchableOpacity>
    </View>
  );
};
export default MainScreenHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
  },
  loginText: {
    color: Colors.PRIMARY,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
});
