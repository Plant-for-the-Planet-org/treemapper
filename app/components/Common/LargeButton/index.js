import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';

const LargeButton = ({
  heading,
  subHeading,
  active,
  medium,
  rightIcon,
  onPress,
  disabled,
  style,
  notification,
  subHeadingStyle,
  accessibilityLabel,
  testID,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.container,
        active && styles.activeContainer,
        medium && styles.mediumCont,
        style,
      ]}>
      <View style={{ flex: 1 }}>
        <View style={styles.subContainer}>
          <Text style={[styles.heading, active && styles.activeText]}>{heading}</Text>
        </View>
        {subHeading && (
          <View style={styles.subContainer}>
            <Text style={[styles.subHeading, active && styles.blackTextColor, subHeadingStyle]}>
              {subHeading}
            </Text>
          </View>
        )}
      </View>
      {rightIcon && (
        <View style={styles.rightIconCont}>
          <Text>{rightIcon}</Text>
        </View>
      )}
      {notification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
export default LargeButton;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 15,
    justifyContent: 'center',
    paddingVertical: 10,
    flexDirection: 'row',
    borderColor: Colors.LIGHT_BORDER_COLOR,
  },
  notificationContainer: {
    position: 'absolute',
    width: 35,
    height: 35,
    backgroundColor: Colors.PRIMARY,
    right: 0,
    top: 0,
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: Colors.WHITE,
    fontSize: Typography.FONT_SIZE_14,
  },
  mediumCont: {
    paddingVertical: 5,
  },
  activeContainer: {
    borderColor: Colors.PRIMARY,
  },
  subContainer: {
    flexDirection: 'row',
    marginHorizontal: 25,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  activeText: {
    color: Colors.PRIMARY,
  },
  blackTextColor: {
    color: Colors.BLACK,
  },
  subHeading: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    lineHeight: Typography.LINE_HEIGHT_24,
  },
  rightIconCont: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
});
