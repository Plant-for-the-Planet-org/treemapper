import {StyleSheet} from 'react-native'
import React from 'react'
import FireBreakIcon from 'assets/images/svg/FireBreakIcon.svg'
import GrassRemoval from 'assets/images/svg/GrassRemovalIcon.svg'
import SpeciesRemoval from 'assets/images/svg/SpeciesRemovalIcon.svg'
import SoilRemoval from 'assets/images/svg/SoilRemovalIcon.svg'
import SingleTreePlantation from 'assets/images/svg/SingleTreeIcon.svg'
import MultiTreePlantaion from 'assets/images/svg/MultiTreeIcon.svg'

type InterventionCardType =
  | 'SoilRemoval'
  | 'SingleTreePlantaion'
  | 'MultiTreePlantation'
  | 'FireBreak'
  | 'Invasive Species Removal'
  | 'Invasive Grass Removal'

interface Props {
  icon: InterventionCardType
}

const InterventionIconSwitch = (props: Props) => {
  const {icon} = props

  switch (icon) {
    case 'FireBreak':
      return <FireBreakIcon style={styles.iconWrapper} width={50} height={50} />
    case 'Invasive Grass Removal':
      return <GrassRemoval style={styles.iconWrapper} width={50} height={50} />
    case 'Invasive Species Removal':
      return (
        <SpeciesRemoval style={styles.iconWrapper} width={50} height={50} />
      )
    case 'MultiTreePlantation':
      return (
        <MultiTreePlantaion style={styles.iconWrapper} width={50} height={50} />
      )
    case 'SingleTreePlantaion':
      return (
        <SingleTreePlantation
          style={styles.iconWrapper}
          width={50}
          height={50}
        />
      )
    case 'SoilRemoval':
      return <SoilRemoval style={styles.iconWrapper} width={50} height={50} />
    default:
      return <FireBreakIcon style={styles.iconWrapper} width={50} height={50} />
  }
}

export default InterventionIconSwitch

const styles = StyleSheet.create({
  iconWrapper: {
    borderRadius: 10,
    marginLeft: 10,
  },
})
