import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native'
import React from 'react'
import {Text} from 'react-native'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors} from 'src/utils/constants'

const DummyData = [
  'All 15',
  '5 Incomplete',
  '4 unsynced',
  '3 Fire Breaks',
  '2 Inasive species Removal',
  '1 Planted Tree',
]

const InterventionHeaderList = () => {
  const headerChip = (label: string) => {
    return (
      <TouchableOpacity>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    )
  }
  return (
    <View>
      <FlatList
        data={DummyData}
        renderItem={({item}) => headerChip(item)}
        horizontal
        contentContainerStyle={styles.container}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

export default InterventionHeaderList

const styles = StyleSheet.create({
  container: {
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  label: {
    fontSize: scaleFont(15),
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    borderWidth: 0.5,
    borderColor: Colors.GRAY_BORDER,
    marginHorizontal: 5,
  },
})
