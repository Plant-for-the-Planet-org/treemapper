import {StyleSheet, Text} from 'react-native'
import React from 'react'

import {SCALE_50} from 'src/utils/constants/spacing'
import {InterventionData} from 'src/types/interface/slice.interface'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont} from 'src/utils/constants/mixins'

interface Props {
  item: InterventionData
}

const InterventionCardHeader = (props: Props) => {
  const {item} = props

  const totalTressCount = () => {
    let count = 0
    item.sample_trees.forEach(element => {
      count += element.count
    })
    return count
  }

  switch (item.intervention_type) {
    case 'FIRE_BREAK':
      return <Text style={styles.label}>8 Trees Planted</Text>
    case 'GRASS_REMOVAL':
      return <Text style={styles.label}>8 Trees Planted</Text>
    case 'SEPCIES_REMOVAL':
      return <Text style={styles.label}>8 Trees Planted</Text>
    case 'MULTI_TREE':
      return <Text style={styles.label}>{totalTressCount()} Trees Planted</Text>
    case 'SINGLE_TREE':
      return <Text style={styles.label}>Single Tree Planted</Text>
    case 'SOIL_REMOVAL':
      return (
        <Text style={styles.label}>
          Single Tree Planted({item.sample_trees[0].specie_name})
        </Text>
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
