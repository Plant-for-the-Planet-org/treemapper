import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { Colors, Typography } from '../../../styles';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import RotatingView from '../../Common/RotatingView';
import IconSwitcher from '../../Common/IconSwitcher';

interface ISmallHeaderProps {
  leftText: string;
  rightText?: string;
  icon?: string;
  iconType?: 'MCIcon' | 'FA5Icon' | 'FAIcon';
  onPressRight?: any;
  style?: any;
  sync?: any;
  leftTextStyle?: TextStyle;
  iconColor?: string;
  rightTextStyle?: TextStyle;
}

const SmallHeader = ({
  leftText,
  rightText,
  icon,
  iconType,
  onPressRight,
  style,
  sync,
  leftTextStyle = {},
  iconColor = Colors.TEXT_COLOR,
  rightTextStyle = {},
}: ISmallHeaderProps) => {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...style,
      }}>
      <Text style={[styles.subHeadingText, leftTextStyle]}>{leftText}</Text>
      <View style={{ flex: 1, marginHorizontal: 8 }}>
        <TouchableOpacity
          onPress={onPressRight ? onPressRight : null}
          style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
          accessibilityLabel="Small header"
          accessible={true}
          testID="small_header">
          <Text style={[styles.uploadNowBtn, styles.activeText, rightTextStyle]}>{rightText}</Text>
          {icon ? (
            <IconSwitcher name={icon} size={22} color={iconColor} iconType={iconType || 'FAIcon'} />
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
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_20,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    flex: 2,
  },
  activeText: {
    color: Colors.PRIMARY,
  },
  uploadNowBtn: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_20,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
    paddingRight: 10,
  },
  redTheme: {
    color: 'red',
  },
});
