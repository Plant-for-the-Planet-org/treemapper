import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { Colors, Typography } from 'src/utils/constants'
import SelectIcon from 'assets/images/svg/SelectIcon.svg'
import { scaleSize } from 'src/utils/constants/mixins'
import { DropdownData } from 'src/types/interface/app.interface'

interface Props {
  label: string
  data: DropdownData[]
  onSelect: (data: DropdownData) => void
  selectedValue: DropdownData
  whiteBG?: boolean
}

const CustomDropdownComponent = (props: Props) => {
  const { label, data, onSelect, selectedValue, whiteBG = false } = props
  const [isFocus, setIsFocus] = useState(false)
  const [value, setSelectedValue] = useState(selectedValue)

  useEffect(() => {
    setSelectedValue(selectedValue)
  }, [selectedValue])

  const renderLabel = () => {
    return (
      <Text style={[styles.label, { backgroundColor: whiteBG ? Colors.WHITE : Colors.BACKDROP_COLOR }, isFocus && { color: Colors.PRIMARY }]}>
        {label}
      </Text>
    )
  }

  const handleSelect = (item: DropdownData) => {
    setIsFocus(false)
    onSelect(item)
  }
  return (
    <View style={styles.container}>
      {renderLabel()}
      <Dropdown
        style={[styles.dropdown,]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        iconStyle={styles.iconStyle}
        data={data}
        autoScroll
        maxHeight={250}
        minHeight={100}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? props.label : '...'}
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={handleSelect}
        renderRightIcon={() => <SelectIcon />}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        containerStyle={styles.listContainer}
        itemTextStyle={styles.itemTextStyle}
      />
    </View>
  )
}

export default CustomDropdownComponent

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%'
  },
  dropdown: {
    height: scaleSize(55),
    borderColor: Colors.GRAY_BORDER,
    borderWidth: 0.5,
    borderRadius: 5,
    width: '100%',
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    left: 22,
    top: 8,
    zIndex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  placeholderStyle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    paddingHorizontal: 3,
    color: Colors.TEXT_COLOR
  },
  selectedTextStyle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  itemTextStyle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    borderRadius: 12,
    elevation: 5, // This adds a shadow on Android
    shadowColor: 'black', // This adds a shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
})
