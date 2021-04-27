import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RotatingView from '../../Common/RotatingView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SmallHeader = ({ leftText, rightText, rightTheme, icon, onPressRight, style, sync }) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', ...style }}>
      <Text style={styles.subHeadingText}>{leftText}</Text>
      <View>
        <TouchableOpacity
          onPress={onPressRight ? onPressRight : null}
          style={{ flexDirection: 'row' }}
          accessibilityLabel="Small header"
          accessible={true}
          testID="small_header">
          <Text
            style={[
              styles.uploadNowBtn,
              styles.activeText,
              rightTheme == 'red' && styles.redTheme,
            ]}>
            {rightText}
          </Text>
          {icon ? (
            <MCIcons name={icon} size={22} style={styles.activeText} />
          ) : sync ? (
            <RotatingView isClockwise={false}>
              <Icon size={24} name="sync" color={Colors.PRIMARY} />
            </RotatingView>
          ) : (
            []
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default SmallHeader;

const styles = StyleSheet.create({
  headerText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_27,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
  },
  activeText: {
    color: Colors.PRIMARY,
  },
  uploadNowBtn: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    paddingHorizontal: 10,
  },
  redTheme: {
    color: 'red',
  },
});
