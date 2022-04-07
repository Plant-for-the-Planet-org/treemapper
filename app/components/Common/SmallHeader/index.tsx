import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { Colors, Typography } from '../../../styles';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import RotatingView from '../../Common/RotatingView';
import IconSwitcher from '../../Common/IconSwitcher';

interface ISmallHeaderProps {
  leftText: string;
  rightText?: string;
  rightTheme?: string;
  icon?: string;
  iconType?: 'MCIcon' | 'FA5Icon' | 'FAIcon';
  onPressRight?: any;
  style?: any;
  sync?: any;
  leftTextStyle?: TextStyle;
}

const SmallHeader = ({
  leftText,
  rightText,
  rightTheme,
  icon,
  iconType,
  onPressRight,
  style,
  sync,
  leftTextStyle = {},
}: ISmallHeaderProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...style,
      }}>
      <Text style={[styles.subHeadingText, leftTextStyle]}>{leftText}</Text>
      <View>
        <TouchableOpacity
          onPress={onPressRight ? onPressRight : null}
          style={{ flexDirection: 'row', flex: 1, marginLeft: 8 }}
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
              color={rightTheme == 'red' ? Colors.ALERT : Colors.TEXT_COLOR}
              iconType={iconType || 'FAIcon'}
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
    flex: 2,
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
