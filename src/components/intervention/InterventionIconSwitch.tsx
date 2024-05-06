import { StyleSheet } from 'react-native'
import React from 'react'
import FireBreakIcon from 'assets/images/svg/FireBreakIcon.svg'
import GrassRemoval from 'assets/images/svg/GrassRemovalIcon.svg'
import SpeciesRemoval from 'assets/images/svg/SpeciesRemovalIcon.svg'
import SoilRemoval from 'assets/images/svg/SoilRemovalIcon.svg'
import SingleTreePlantation from 'assets/images/svg/SingleTreeInterventionIcon.svg'
import MultiTreePlantaion from 'assets/images/svg/MultiTreeInterventionIcon.svg'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SCALE_40, SCALE_50 } from 'src/utils/constants/spacing'


interface Props {
  icon: INTERVENTION_TYPE
  dimension?: number

}

const InterventionIconSwitch = (props: Props) => {
  const { icon,dimension } = props
  const scale = dimension || SCALE_40
  switch (icon) {
    case 'fire-suppression':
      return <FireBreakIcon style={styles.iconWrapper} width={scale} height={scale} />
    case 'direct-seeding':
      return <GrassRemoval style={styles.iconWrapper} width={scale} height={scale} />
    case 'grass-suppression':
      return <GrassRemoval style={styles.iconWrapper} width={scale} height={scale} />
    case 'removal-invasive-species':
      return (
        <SpeciesRemoval style={styles.iconWrapper} width={scale} height={scale} />
      )
    case 'liberating-regenerant':
      return (
        <SpeciesRemoval style={styles.iconWrapper} width={scale} height={scale} />
      )
    case 'multi-tree-registration':
      return (
        <MultiTreePlantaion style={styles.iconWrapper} width={scale} height={scale} />
      )
    case 'stop-tree-harvesting':
      return (
        <MultiTreePlantaion style={styles.iconWrapper} width={scale} height={scale} />
      )
    case 'assisting-seed-rain':
      return (
        <MultiTreePlantaion style={styles.iconWrapper} width={scale} height={scale} />
      )
    case 'enrichement-planting':
      return (
        <MultiTreePlantaion style={styles.iconWrapper} width={scale} height={scale} />
      )
    case 'single-tree-registration':
      return (
        <SingleTreePlantation
          style={styles.iconWrapper}
          width={scale}
          height={scale}
        />
      )
    case 'marking-regenerant':
      return (
        <SingleTreePlantation
          style={styles.iconWrapper}
          width={scale}
          height={scale}
        />
      )

    case 'soil-improvement':
      return <SoilRemoval style={styles.iconWrapper} width={scale} height={scale} />
    case 'maintenance':
      return <SoilRemoval style={styles.iconWrapper} width={scale} height={scale} />
    case 'other-intervention':
      return <SoilRemoval style={styles.iconWrapper} width={scale} height={scale} />
    default:
      return <FireBreakIcon style={styles.iconWrapper} width={scale} height={scale} />
  }
}

export default InterventionIconSwitch

const styles = StyleSheet.create({
  iconWrapper: {
    borderRadius: 10,
    width: SCALE_50,
    height: SCALE_50,
    justifyContent: "center",
    alignItems: 'center'
  },
})
