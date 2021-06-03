import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../../styles';
import IconSwitcher from '../IconSwitcher';

export type OptionsType = {
  key: string;
  disabled?: boolean;
  iconType: string;
  iconName: string;
  text: string;
  iconStyle?: any;
};

interface IMenuOptionsProps {
  options: OptionsType[];
  onOptionPress?: any;
  containerStyle?: any;
}

const MenuOptions = ({ options, containerStyle, onOptionPress }: IMenuOptionsProps) => {
  return (
    <View style={[containerStyle, styles.optionContainer]}>
      {options.map((option: OptionsType) => (
          <TouchableOpacity style={styles.option} onPress={() => onOptionPress(option.key)}>
            <IconSwitcher
              iconType={option.iconType}
              name={option.iconName}
              size={16}
              color={Colors.TEXT_COLOR}
              style={option.iconStyle || {}}
            />
            <Text style={styles.optionText}>{i18next.t(option.text)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default MenuOptions;

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: 'row',
  },
  option: {
    alignItems: 'center',
  },
  optionText: {
    paddingLeft: 10,
    paddingRight: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
});
