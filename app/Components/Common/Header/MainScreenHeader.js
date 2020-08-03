import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Colors, Typography} from '_styles';

const MainScreenHeader = ({onPressLogin, isUserLogin}) => {
  return (
    <View style={styles.container}>
      <View />
      <TouchableOpacity
        onPress={onPressLogin}
        testID="main_header"
        accessibilityLabel="Main Header"
        accessible={true}>
        {isUserLogin ? (
          <Image
            style={{width: 40, height: 40}}
            source={{
              uri:
                'https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png',
            }}
          />
        ) : (
          <Text style={styles.loginText}>Login / Sign Up</Text>
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
    marginVertical: 15,
  },
  loginText: {
    color: Colors.PRIMARY,
    fontSize: Typography.FONT_SIZE_16,
  },
});
