import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { DropdownData } from 'src/types/interface/app.interface'

interface Props {
  onSelect: (data: string) => void
  selectedValue: DropdownData
}

const CustomDropdownComponent = (props: Props) => {
  const { onSelect, selectedValue } = props


  const data: DropdownData[] = [
    {
      label: 'Show interventions within 30 days',
      index: 0,
      value: 'days'
    },
    {
      label: 'Show interventions within 6 months',
      index: 1,
      value: 'months'
    },
    {
      label: 'Show interventions within 1 year',
      index: 2,
      value: 'year'

    },
    {
      label: 'Show all interventions',
      index: 3,
      value: 'always'
    },
    {
      label: `Don't show interventions`,
      index: 4,
      value: 'none'
    },
  ]


  const handleSelect = (item: DropdownData) => {
    onSelect(item.value)
  }
  return (
    <View style={[styles.container, {
      backgroundColor: selectedValue.value !== '' ? Colors.NEW_PRIMARY + '1A' : Colors.GRAY_LIGHT
    }]}>
      <Dropdown
        style={[styles.dropdown]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        data={data}
        autoScroll
        labelField="label"
        valueField="value"
        showsVerticalScrollIndicator={false}
        value={selectedValue}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        containerStyle={styles.listContainer}
        dropdownPosition={'top'}
        itemTextStyle={styles.itemTextStyle}
        confirmSelectItem
        onChange={(d) => { handleSelect(d) }} />
    </View >
  )
}

export default CustomDropdownComponent

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 10,
  },
  dropdown: {
    height: scaleSize(55),
    borderWidth: 0,
    borderRadius: 5,
    width: '100%',
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    left: 30,
    top: 8,
    zIndex: 1,
    paddingHorizontal: 6,
    fontSize: 14,
    color: Colors.BLACK,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  placeholderStyle: {
    fontSize: 15,
    marginHorizontal: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    letterSpacing: 1,
    paddingLeft: 10,
    textAlign: 'left',
    maxWidth: '80%'
  },
  selectedTextStyle: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    letterSpacing: 1,
    paddingLeft: 10,
    textAlign: 'left',
    maxWidth: '80%'
  },
  itemTextStyle: {
    fontSize: 14,
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
