import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { DropdownData } from 'src/types/interface/app.interface';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
interface Props {
  onSelect: (data: string) => void
  selectedValue: DropdownData
  data: DropdownData[]
}






const InterventionDropDown = (props: Props) => {

  const { onSelect, selectedValue, data } = props


  const renderSection = (el, index) => {
    return (<TouchableOpacity style={[styles.tileWrapper, { borderBottomWidth: index < data.length - 1 ? 1 : 0 }]} key={el.value} onPress={() => {
      onSelect(el.value)
    }}>
      <Text style={styles.tileLabel}>{el.extra}</Text>
      <View style={styles.divider} />
      {selectedValue.value === el.value && <BouncyCheckbox
        size={20}
        fillColor={Colors.NEW_PRIMARY}
        unFillColor={Colors.WHITE}
        onPress={()=>{}}
        style={{ width: 30 }}
        isChecked={true}
        disabled
      />}
    </TouchableOpacity>)
  }
  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={data} renderItem={({ item, index }) => renderSection(item, index)} />
    </View>
  )
}

export default InterventionDropDown

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_PRIMARY,
    borderRadius: 10,
    marginBottom: 10,
    top: -1
  },
  tileWrapper: {
    width: "100%",
    height: 60,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.WHITE,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    paddingLeft: 20
  },
  divider: {
    flex: 1
  }
})