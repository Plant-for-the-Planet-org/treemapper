import React from 'react';
import i18next from 'i18next';
import { StyleSheet, Text, View } from 'react-native';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import DropDownPicker, { DropDownDirectionType } from 'react-native-dropdown-picker';

import { Colors, Typography } from '../../../styles';

type Props = {
  items: any;
  value: any;
  style?: any;
  open: boolean;
  zIndex?: number;
  iconColor?: any;
  textStyle?: any;
  zIndexInverse?: number;
  listItemLabelStyle?: any;
  pickerContainerStyle?: any;
  placeholder?: string;
  setValue: React.Dispatch<any>;
  dropDownDirection?: DropDownDirectionType;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const FloatingHeaderDropdown = ({
  items,
  open,
  setOpen,
  value,
  setValue,
  zIndex = 5000,
  zIndexInverse = 6000,
  style = {},
  placeholder,
  pickerContainerStyle = {},
  textStyle = {},
  listItemLabelStyle = {},
  iconColor = Colors.GRAY_LIGHTEST,
  dropDownDirection = 'DEFAULT',
  ...props
}: Props) => {
  return (
    <View style={[styles.pickerContainer, pickerContainerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={styles.placeholderText}>{placeholder}</Text>
      </View>

      <DropDownPicker
        placeholder={placeholder}
        language={i18next.language.toUpperCase()}
        items={items}
        open={open}
        setOpen={setOpen}
        value={value}
        setValue={setValue}
        style={{ ...styles.dropDown, ...style }}
        textStyle={{ ...styles.textStyle, ...textStyle }}
        selectedItemContainerStyle={styles.selectedItemContainerStyle}
        listItemContainerStyle={styles.listItemContainer}
        listItemLabelStyle={{ ...styles.listItemLabel, ...listItemLabelStyle }}
        dropDownContainerStyle={styles.dropDownContainerStyle}
        zIndex={zIndex}
        dropDownDirection={dropDownDirection}
        zIndexInverse={zIndexInverse}
        showTickIcon={false}
        itemSeparatorStyle={styles.itemSeparator}
        itemSeparator
        ArrowDownIconComponent={() => (
          <EntypoIcon name="chevron-down" color={iconColor} size={20} />
        )}
        ArrowUpIconComponent={() => <EntypoIcon name="chevron-up" color={iconColor} size={20} />}
        {...props}
      />
    </View>
  );
};

export default FloatingHeaderDropdown;

const styles = StyleSheet.create({
  pickerContainer: {
    borderRadius: 5,
    borderColor: '#4D5153',
    borderWidth: 1,
    marginBottom: 24,
  },
  placeholderText: {},
  labelContainer: {
    position: 'absolute',
    backgroundColor: '#efefef',
    top: -10,
    left: 12,
    zIndex: 1000,
    paddingHorizontal: 5,
  },
  dropDown: {
    borderWidth: 0,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.BLACK,
  },
  dropDownContainerStyle: {},
  listItemContainer: {},
  listItemLabel: {},
  itemSeparator: {
    backgroundColor: Colors.GRAY_LIGHT,
    height: 1,
  },
  selectedItemContainerStyle: {
    backgroundColor: Colors.GRAY_LIGHT,
    borderRadius: 7,
  },
});
