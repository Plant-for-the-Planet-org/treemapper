import React, { useRef, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../../styles';
import OutlinedInput from '../OutlinedInput';
import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';
import i18next from 'i18next';

interface IDropdownProps {
  label: string;
  defaultValue?: any;
  options?: any;
  onChange?: any;
  editable?: boolean;
  error?: string | boolean;
  style?: any;
}

const Dropdown = (props: IDropdownProps) => {
  const { defaultValue, editable, options, onChange } = props;
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<any>();

  const menuRef = useRef<any>();

  const showMenu = () => {
    if (menuRef?.current?.show) {
      menuRef.current.show();
      setShowOptions(true);
    }
  };

  const hideMenu = () => {
    if (menuRef?.current?.hide) {
      menuRef.current.hide();
      setShowOptions(false);
    }
  };

  return (
    <View style={styles.dropdownContainer}>
      {!editable ? (
        <OutlinedInput
          {...{
            ...props,
            isDropdown: true,
            showOptions,
            value: selectedOption ? selectedOption.value : defaultValue ? defaultValue.value : '',
          }}
        />
      ) : (
        <Menu
          ref={menuRef}
          button={
            <TouchableOpacity onPress={showMenu}>
              <OutlinedInput
                {...{
                  ...props,
                  isDropdown: true,
                  showOptions,
                  value: selectedOption
                    ? i18next.t(selectedOption.value)
                    : defaultValue
                    ? i18next.t(defaultValue.value)
                    : '',
                }}
              />
            </TouchableOpacity>
          }>
          {options.map((option: any) => (
            <MenuItem
              key={option.key}
              onPress={() => {
                setSelectedOption(option);
                onChange(option);
                hideMenu();
              }}>
              {i18next.t(option.value)}
            </MenuItem>
          ))}
        </Menu>
      )}
    </View>
  );
};

// onPress={() => {
//   setSelectedOption(item);
//   onChange(item);
//   setShowOptions(false);
// }
export default Dropdown;

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'relative',
    zIndex: 20000,
  },
  dropdownOptionsContainer: {
    left: 25,
    right: 25,
    top: 80,
    backgroundColor: Colors.WHITE,
    elevation: 10,
    borderRadius: 10,
  },
  option: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
});
