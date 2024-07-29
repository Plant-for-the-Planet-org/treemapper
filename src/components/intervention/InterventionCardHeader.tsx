import { StyleSheet, Text } from 'react-native'
import React from 'react'

import { SCALE_50 } from 'src/utils/constants/spacing'
import { InterventionData } from 'src/types/interface/slice.interface'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import i18next from 'src/locales/index'

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
      return <Text style={styles.label}>{i18next.t("label.fire_suppression_team")}</Text>
    case 'fire-patrol':
      return <Text style={styles.label}>{i18next.t("label.fire_patrol")}</Text>
    case 'firebreaks':
      return <Text style={styles.label}>{i18next.t("label.fire_breaks")}</Text>
    case 'grass-suppression':
      return <Text style={styles.label}>{i18next.t("label.grass_suppression")}</Text>
    case 'fencing':
      return <Text style={styles.label}>{i18next.t("label.fencing")}</Text>
    case 'removal-invasive-species':
      return <Text style={styles.label}>{i18next.t("label.removal_of_invasive_species")}</Text>
    case 'direct-seeding':
      return <Text style={styles.label}>{i18next.t("label.direct_seeding")}</Text>
    case 'multi-tree-registration':
      return <Text style={styles.label}>{totalTressCount()} {i18next.t("label.trees_planted")}</Text>
    case 'enrichment-planting':
      return <Text style={styles.label}>{totalTressCount()} {i18next.t("label.trees_planted")}</Text>
    case 'single-tree-registration':
      return <Text style={styles.label}>{i18next.t("label.single_tree_planted")}</Text>
    case 'assisting-seed-rain':
      return <Text style={styles.label}>{i18next.t("label.assisting_seed_rain")}</Text>
    case 'liberating-regenerant':
      return <Text style={styles.label}>{i18next.t("label.liberating_regenerant")}</Text>
    case 'marking-regenerant':
      return <Text style={styles.label}>{i18next.t("label.marking_regenerant")}</Text>
    case 'stop-tree-harvesting':
      return <Text style={styles.label}>{i18next.t("label.stop_harvesting")}</Text>
    case 'maintenance':
      return <Text style={styles.label}>{i18next.t("label.maintenance")}</Text>
    case 'other-intervention':
      return <Text style={styles.label}>{i18next.t("label.other_intervention")}</Text>
    case 'soil-improvement':
      return (
        <Text style={styles.label}>{i18next.t("label.soil_improvement")}</Text>
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
