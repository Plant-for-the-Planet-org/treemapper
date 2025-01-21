import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

import { InterventionData } from 'src/types/interface/slice.interface'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import DividerDot from '../common/DividerDot'
import i18next from 'src/locales/index'

interface Props {
  item: InterventionData
}

const InterventionMetaInfo = (props: Props) => {
  const { item } = props


  const renderLabel = () => {
    switch (item.intervention_type) {
      case 'direct-seeding':
        return <Text style={styles.label}>{item.planted_species.length} {i18next.t('label.species')}</Text>
      case 'multi-tree-registration':
        return <Text style={styles.label}>{item.planted_species.length} {i18next.t('label.species')}</Text>
      case 'removal-invasive-species':
        return <Text style={styles.label}>{item.planted_species.length} {i18next.t('label.species')}</Text>
      case 'enrichment-planting':
        return <Text style={styles.label}>{item.planted_species.length} {i18next.t('label.species')}</Text>
      case 'stop-tree-harvesting':
        return null
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
