import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography } from '_styles';
import i18next from '../../../languages/languages';

const MainScreenHeader = ({ onPressLogin, isUserLogin, accessibilityLabel, testID, photo }) => {
  const navigation = useNavigation();
  const onPressLegals = () => {
    navigation.navigate('Legals');
  };

  return (
    <View style={styles.container}>
      {!isUserLogin ? (<View>
        <Text onPress={onPressLegals} style={styles.legalText}>
          {i18next.t('label.legal_docs')}
        </Text>
        </View>) : <View/> }
      <TouchableOpacity
        onPress={onPressLogin}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessible={true}>
        {isUserLogin ? (
          <Image
            style={{ width: 40, height: 40, borderRadius: 20 }}
            source={{
              uri: photo
                ? photo
                : 'https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png',
            }}
          />
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
    justifyContent: 'space-between',
    flex: 1,
  },
  legalText: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  loginText: {
    color: Colors.PRIMARY,
    fontSize: Typography.FONT_SIZE_14,
  },
});
