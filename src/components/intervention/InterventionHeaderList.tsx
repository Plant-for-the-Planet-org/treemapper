import {
  FlatList,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  Text
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { groupIntervention } from 'src/utils/helpers/interventionHelper/groupInterventions'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

interface Props {
  selectedLabel: string
  setSelectedLabel: (t: string) => void
}

const InterventionHeaderList = (props: Props) => {
  const { selectedLabel, setSelectedLabel: setSelectedLabel } = props
  const [headerData, setHeaderData] = useState([])
  const { lastServerInterventionpage, intervention_updated } = useSelector((state: RootState) => state.appState)


  const realm = useRealm()
  useEffect(() => {
    const objects = realm
      .objects(RealmSchema.Intervention)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    const FinalData = groupIntervention(objects)
    setHeaderData(FinalData)
  }, [lastServerInterventionpage, intervention_updated])


  const headerChip = (item: any) => {
    if (item.count === 0) {
      return null
    }
    const isSelected = item.key === selectedLabel
    const selectedStyle: TextStyle = {
      color: isSelected ? Colors.WHITE : Colors.DARK_TEXT,
      backgroundColor: isSelected ? Colors.NEW_PRIMARY : Colors.WHITE,
      fontFamily: isSelected ? Typography.FONT_FAMILY_BOLD : Typography.FONT_FAMILY_REGULAR
    }
    const handlePress = () => {
      setSelectedLabel(item.key)
    }
    return (
      <TouchableOpacity key={item.key} onPress={handlePress} style={[styles.labelWrapper, selectedStyle]}>
        <Text
          style={[
            styles.label,
            { color: selectedStyle.color, fontFamily: selectedStyle.fontFamily },
          ]}>{item.key === 'all' ? `${item.label}  ${item.count}` : `${item.count}  ${item.label}`}</Text>
      </TouchableOpacity>
    )
  }
  return (
    <View>
      <FlatList
        data={headerData}
        renderItem={({ item }) => headerChip(item)}
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
    paddingVertical: 10,
    borderRadius: 20,
  },
  labelWrapper: {
    borderColor: Colors.GRAY_LIGHT,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 0.5,
  }
})
