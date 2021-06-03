import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
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
  const [optionKey, setOptionKey] = useState<string>('');
  const menuRef = useRef<any>();

  const showMenu = () => {
    if (menuRef?.current?.show) {
      menuRef.current.show();
    }
  };

  const hideMenu = (key) => {
    if (menuRef?.current?.hide) {
      menuRef.current.hide();
      setOptionKey(key);
    }
  };

  return (
    <View style={[containerStyle]}>
      <Menu
        ref={menuRef}
        onHidden={() => {
          onOptionPress(optionKey);
        }}
        button={
          <TouchableOpacity onPress={showMenu} style={{ padding: 10 }}>
            <IconSwitcher
              iconType={'MCIIcon'}
              name={'dots-vertical'}
              size={24}
              color={Colors.TEXT_COLOR}
            />
          </TouchableOpacity>
        }>
        {options.map((option: OptionsType) => (
          <MenuItem
            key={option.key}
            disabled={option.disabled}
            style={styles.option}
            onPress={() => {
              hideMenu(option.key);
            }}>
            <IconSwitcher
              iconType={option.iconType}
              name={option.iconName}
              size={16}
              color={Colors.TEXT_COLOR}
              style={option.iconStyle || {}}
            />
            <View style={[{ height: 20, width: 16 }]} />
            <Text style={styles.optionText}>{i18next.t(option.text)}</Text>
          </MenuItem>
        ))}
      </Menu>
    </View>
  );
};

export default MenuOptions;

const styles = StyleSheet.create({
  option: {
    backgroundColor: Colors.WHITE,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
  },
  optionText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
});
