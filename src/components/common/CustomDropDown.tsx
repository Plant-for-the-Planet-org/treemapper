import React, {useState} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Dropdown} from 'react-native-element-dropdown'
import {Colors} from 'src/utils/constants'
import SelectIcon from 'assets/images/svg/SelectIcon.svg'

interface DropDownData {
  label: string
  value: string
  index: number
}

interface Props {
  label: string
  data: DropDownData[]
  onSelect: (data: {label: string; value: string; index: number}) => void
  selectedValue: DropDownData
}

const DropdownComponent = (props: Props) => {
  const {label, data, onSelect, selectedValue} = props
  const [isFocus, setIsFocus] = useState(false)

  const renderLabel = () => {
    if (selectedValue) {
      return (
        <Text style={[styles.label, isFocus && {color: Colors.PRIMARY}]}>
          {label}
        </Text>
      )
    }
    return null
  }

  const handleSelect = (item: DropDownData) => {
    setIsFocus(false)
    onSelect(item)
  }
  return (
    <View style={styles.container}>
      {renderLabel()}
      <Dropdown
        style={[styles.dropdown, isFocus && {borderColor: Colors.PRIMARY}]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        autoScroll
        maxHeight={300}
        minHeight={100}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? props.label : '...'}
        value={selectedValue}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={handleSelect}
        renderRightIcon={() => <SelectIcon />}
      />
    </View>
  )
}

export default DropdownComponent

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: Colors.WHITE,
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
})
