import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AvatarIcon from '../AvatarIcon';
import { Colors, Typography } from '_styles';
import i18next from '../../../languages/languages';

const MainScreenHeader = ({
  onPressLogin,
  isUserLogin,
  accessibilityLabel,
  testID,
  photo,
  name,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPressLogin}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessible={true}>
        {isUserLogin ? (
          photo ? (
            <Image style={{ width: 40, height: 40, borderRadius: 20 }} source={{ uri: photo }} />
          ) : (
            <AvatarIcon name={name} />
          )
        ) : (
          <Text style={styles.loginText}>{i18next.t('label.login')}</Text>
        )}
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
  },
});
