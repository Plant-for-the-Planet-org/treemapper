import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Colors, Typography} from '_styles';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Header = ({
  hideBackIcon,
  closeIcon,
  headingText,
  subHeadingText,
  onBackPress,
  textAlignStyle,
  style,
}) => {
  const navigation = useNavigation();
  const onPressBack = () => (onBackPress ? onBackPress() : navigation.goBack());
  return (
    <View style={style}>
      <View style={styles.arrowContainer}>
        {!hideBackIcon && (
          <TouchableOpacity
            onPress={onPressBack}
            style={styles.paddingVertical}>
            <Ionicons
              name={closeIcon ? 'md-close' : 'md-arrow-back'}
              size={30}
              color={Colors.TEXT_COLOR}
            />
          </TouchableOpacity>
        )}
        <View />
      </View>
      {headingText ? (
        <View style={{marginVertical: 0}}>
          <Text style={[styles.headerText, textAlignStyle]}>{headingText}</Text>
        </View>
      ) : null}
      {subHeadingText && (
        <View style={{marginVertical: 10}}>
          <Text style={[styles.subHeadingText, textAlignStyle]}>
            {subHeadingText}
          </Text>
        </View>
      )}
    </View>
  );
};
export default Header;

const styles = StyleSheet.create({
  headerText: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
  },
  backArrow: {},
  arrowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paddingVertical: {
    paddingVertical: 15,
  },
});
