import { StyleSheet, Text } from 'react-native'
import React from 'react'

import { InterventionData } from 'src/types/interface/slice.interface'
import { Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'

interface Props {
  item: InterventionData
}

const InterventionMetaInfo = (props: Props) => {
  const { item } = props


  switch (item.intervention_type) {
    case 'fire-patrol':
      return <Text style={styles.label}></Text>
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
        <Text style={styles.label}></Text>
      )
    default:
      return <Text style={styles.label}></Text>
  }
}

export default InterventionMetaInfo

const styles = StyleSheet.create({
  label: {
    fontSize: scaleFont(12),
    marginHorizontal: 3,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
})
