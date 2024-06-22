import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

import { InterventionData } from 'src/types/interface/slice.interface'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import DividerDot from '../common/DividerDot'

interface Props {
  item: InterventionData
}

const InterventionMetaInfo = (props: Props) => {
  const { item } = props


  const renderLabel = () => {
    switch (item.intervention_type) {
      case 'fire-patrol':
        return null
      case 'assisting-seed-rain':
        return <Text style={styles.label}>8 Trees Planted</Text>
      case 'direct-seeding':
        return <Text style={styles.label}>{item.planted_species.length} Species</Text>
      case 'multi-tree-registration':
        return <Text style={styles.label}>{item.planted_species.length} Species</Text>
      case 'removal-invasive-species':
        return <Text style={styles.label}>{item.planted_species.length} Species</Text>
      case 'enrichement-planting':
        return <Text style={styles.label}>{item.planted_species.length} Species</Text>
      case 'stop-tree-harvesting':
        return null
      case 'soil-improvement':
        return (
          null
        )
      default:
        return null
    }
  }

  return <View style={styles.container}>
    {renderLabel()}
    {renderLabel() !== null && <DividerDot width={20} height={20} size={20} color={Colors.TEXT_COLOR} />}
  </View>
}

export default InterventionMetaInfo

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: 'center'
  },
  label: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
})
