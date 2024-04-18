import {
  FlatList,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native'
import React from 'react'
import {Text} from 'react-native'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors} from 'src/utils/constants'
import {InterventionData} from 'src/types/interface/slice.interface'
import {groupIntervention} from 'src/utils/helpers/interventionHelper/groupInterventions'

interface Props {
  data: InterventionData[]
  selectedLabel: string
  setSlectedLabel: (t: string) => void
}

const InterventionHeaderList = (props: Props) => {
  const {data, selectedLabel, setSlectedLabel} = props
  const FinalData = groupIntervention(data)
  const headerChip = (item: any) => {
    const isSelected = item.key === selectedLabel
    const selectedStyle: TextStyle = {
      color: isSelected ? Colors.WHITE : Colors.TEXT_COLOR,
      backgroundColor: isSelected ? Colors.NEW_PRIMARY : Colors.WHITE,
    }
    const handlePress = () => {
      setSlectedLabel(item.key)
    }
    return (
      <TouchableOpacity key={item.key} onPress={handlePress}>
        <Text
          style={[
            styles.label,
            selectedStyle,
          ]}>{`${item.label} (${item.count})`}</Text>
      </TouchableOpacity>
    )
  }
  return (
    <View>
      <FlatList
        data={FinalData}
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
    borderWidth: 0.5,
    borderColor: Colors.GRAY_BORDER,
    marginHorizontal: 5,
  },
})
