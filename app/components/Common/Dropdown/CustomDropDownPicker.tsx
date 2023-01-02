import i18next from 'i18next';
import React from 'react';
import { StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { Colors, Typography } from '../../../styles';

type Props = {
  items: any;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: any;
  setValue: React.Dispatch<any>;
  zIndex?: number;
  zIndexInverse?: number;
  style?: any;
  textStyle?: any;
  iconColor?: any;
  listItemLabelStyle?: any;
  dropDownDirection?: string;
};

const CustomDropDownPicker = ({
  items,
  open,
  setOpen,
  value,
  setValue,
  zIndex = 5000,
  zIndexInverse = 6000,
  style = {},
  textStyle = {},
  listItemLabelStyle = {},
  iconColor = Colors.GRAY_LIGHTEST,
  dropDownDirection = 'DEFAULT',
}: Props) => {
  return (
    <DropDownPicker
      language={i18next.language.toUpperCase()}
      items={items}
      open={open}
      setOpen={setOpen}
      value={value}
      setValue={setValue}
      style={{ ...styles.dropDown, ...style }}
      textStyle={{ ...styles.textStyle, ...textStyle }}
      selectedItemContainerStyle={{ backgroundColor: Colors.GRAY_LIGHT }}
      listItemContainerStyle={styles.listItemContainer}
      listItemLabelStyle={{ ...styles.listItemLabel, ...listItemLabelStyle }}
      dropDownContainerStyle={styles.dropDownContainerStyle}
      zIndex={zIndex}
      dropDownDirection={dropDownDirection}
      zIndexInverse={zIndexInverse}
      showTickIcon={false}
      itemSeparatorStyle={styles.itemSeparator}
      itemSeparator
      ArrowDownIconComponent={() => <EntypoIcon name="chevron-down" color={iconColor} size={20} />}
      ArrowUpIconComponent={() => <EntypoIcon name="chevron-up" color={iconColor} size={20} />}
    />
  );
};

export default CustomDropDownPicker;

const styles = StyleSheet.create({
  dropDown: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
  dropDownContainerStyle: {
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  listItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    height: 'auto',
  },
  listItemLabel: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  itemSeparator: {
    backgroundColor: Colors.GRAY_LIGHT,
    height: 1,
    marginHorizontal: 8,
  },
});
