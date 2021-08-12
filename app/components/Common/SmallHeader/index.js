import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '_styles';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import RotatingView from '../../Common/RotatingView';
import IconSwitcher from '../../Common/IconSwitcher';

const SmallHeader = ({ leftText, rightText, rightTheme, icon, iconType, onPressRight, style, sync }) => {
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
            <IconSwitcher
              name={icon}
              size={22}
              color={Colors.TEXT_COLOR}
              style={styles.activeText}
              iconType={iconType ? iconType : 'FAIcon'}
            />
          ) : sync ? (
            <RotatingView isClockwise={false}>
              <MCIcon size={24} name="sync" color={Colors.PRIMARY} />
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
