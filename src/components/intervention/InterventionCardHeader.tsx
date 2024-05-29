import { StyleSheet, Text } from 'react-native'
import React from 'react'

import { SCALE_50 } from 'src/utils/constants/spacing'
import { InterventionData } from 'src/types/interface/slice.interface'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'

interface Props {
  item: InterventionData
}

const InterventionCardHeader = (props: Props) => {
  const { item } = props

  const totalTressCount = () => {
    let finalCount = 0;
    item.planted_species.forEach(el => {
      finalCount += el.count
    })
    return finalCount
  }

  switch (item.intervention_type) {
    case 'fire-suppression':
      return <Text style={styles.label}>Fire Supression Team</Text>
    case 'fire-patrol':
      return <Text style={styles.label}>Fire Patrol</Text>
    case 'firebreaks':
      return <Text style={styles.label}>Fire Breaks</Text>
    case 'grass-suppression':
      return <Text style={styles.label}>Grass Supression</Text>
    case 'fencing':
      return <Text style={styles.label}>Fencing</Text>
    case 'removal-invasive-species':
      return <Text style={styles.label}>Removal of invasive species</Text>
    case 'direct-seeding':
      return <Text style={styles.label}>Direct Seeding</Text>
    case 'multi-tree-registration':
      return <Text style={styles.label}>{totalTressCount()} Trees Planted</Text>
    case 'enrichement-planting':
      return <Text style={styles.label}>{totalTressCount()} Trees Planted</Text>
    case 'single-tree-registration':
      return <Text style={styles.label}>Single Tree Planted</Text>
    case 'assisting-seed-rain':
      return <Text style={styles.label}>Assisting Seed Rain</Text>
    case 'liberating-regenerant':
      return <Text style={styles.label}>Liberating Regenerant</Text>
    case 'marking-regenerant':
      return <Text style={styles.label}>Marking Regenerant</Text>
    case 'stop-tree-harvesting':
      return <Text style={styles.label}>Stop Harvesting</Text>
    case 'maintenance':
      return <Text style={styles.label}>Maintenance</Text>
    case 'other-intervention':
      return <Text style={styles.label}>Other Intervention</Text>
    case 'soil-improvement':
      return (
        <Text style={styles.label}>Soil improvement</Text>
      )
    default:
      return <Text style={styles.label}></Text>
  }
}

export default InterventionCardHeader

const styles = StyleSheet.create({
  iconWrapper: {
    borderRadius: 10,
    marginLeft: 10,
    width: SCALE_50,
    height: SCALE_50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 5,
  },
})
