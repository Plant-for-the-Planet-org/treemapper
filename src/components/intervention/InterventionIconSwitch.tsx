import {StyleSheet} from 'react-native'
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
}

const InterventionIconSwitch = (props: Props) => {
  const {icon} = props

  switch (icon) {
    case 'FIRESUPRESSION_TEAM':
      return <FireBreakIcon style={styles.iconWrapper} width={SCALE_40} height={SCALE_40} />
    case 'SEED_RAIN':
      return <GrassRemoval style={styles.iconWrapper} width={SCALE_40} height={SCALE_40} />
    case 'SEPCIES_REMOVAL':
      return (
        <SpeciesRemoval style={styles.iconWrapper} width={SCALE_40} height={SCALE_40} />
      )
    case 'MULTI_TREE':
      return (
        <MultiTreePlantaion style={styles.iconWrapper} width={SCALE_40} height={SCALE_40} />
      )
    case 'SINGLE_TREE':
      return (
        <SingleTreePlantation
          style={styles.iconWrapper}
          width={SCALE_40}
          height={SCALE_40}
        />
      )
    case 'SOIL_REMOVAL':
      return <SoilRemoval style={styles.iconWrapper} width={SCALE_40} height={SCALE_40} />
    default:
      return <FireBreakIcon style={styles.iconWrapper} width={SCALE_40} height={SCALE_40} />
  }
}

export default InterventionIconSwitch

const styles = StyleSheet.create({
  iconWrapper: {
    borderRadius: 10,
    marginLeft: 10,
    width:SCALE_50,
    height:SCALE_50,
    justifyContent:"center",
    alignItems:'center'
  },
})
