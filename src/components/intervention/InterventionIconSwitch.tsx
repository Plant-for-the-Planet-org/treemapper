import { StyleSheet } from 'react-native'
import React from 'react'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SCALE_40, SCALE_50 } from 'src/utils/constants/spacing'



import SinglTreePin from 'assets/images/intervention/SingleTreePin.svg';
import MultiTreePin from 'assets/images/intervention/MultiTreePin.svg';
import InvasiveSpeciesPin from 'assets/images/intervention/InvasiveSpeciesPin.svg';
import FireSupressionPin from 'assets/images/intervention/FireSupressionPin.svg';
import FirePatrolPin from 'assets/images/intervention/FirePatrolPin.svg';
import FencingPin from 'assets/images/intervention/FencingPin.svg';
import MarkingRegenerantPin from 'assets/images/intervention/MarkingRegenerantPin.svg';
import LiberatingRegenerantPin from 'assets/images/intervention/LiberatingRegenerantPin.svg';
import GrassSupressionPin from 'assets/images/intervention/GrassSupressionPin.svg';
import FireBreakPin from 'assets/images/intervention/FireBreakPin.svg';
import SeedRainPin from 'assets/images/intervention/SeedRainPin.svg';
import SoilImprovementPin from 'assets/images/intervention/SoilImprovementPin.svg';
import StopHarvestingPin from 'assets/images/intervention/StopHarvestingPin.svg';
import DirectSeedingPin from 'assets/images/intervention/DirectSeedingPin.svg';
import EnrichementPlantingPin from 'assets/images/intervention/EnrichementPlantingPin.svg';
import MaintenancePin from 'assets/images/intervention/MaintenancePin.svg';
import OtherInterventionPin from 'assets/images/intervention/OtherInterventionPin.svg';

interface Props {
  icon: INTERVENTION_TYPE
  dimension?: number

}

const InterventionIconSwitch = (props: Props) => {
  const { icon, dimension } = props
  const scale = dimension || SCALE_40
  switch (icon) {
    case 'single-tree-registration':
      return <SinglTreePin style={styles.iconWrapper} width={scale} height={scale} />
    case 'multi-tree-registration':
      return <MultiTreePin style={styles.iconWrapper} width={scale} height={scale} />
    case 'removal-invasive-species':
      return <InvasiveSpeciesPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'fire-suppression':
      return <FireSupressionPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'fire-patrol':
      return <FirePatrolPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'fencing':
      return <FencingPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'marking-regenerant':
      return <MarkingRegenerantPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'liberating-regenerant':
      return <LiberatingRegenerantPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'grass-suppression':
      return <GrassSupressionPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'firebreaks':
      return <FireBreakPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'assisting-seed-rain':
      return <SeedRainPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'soil-improvement':
      return <SoilImprovementPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'stop-tree-harvesting':
      return <StopHarvestingPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'direct-seeding':
      return <DirectSeedingPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'enrichement-planting':
      return <EnrichementPlantingPin style={styles.iconWrapper} width={scale} height={scale} />
    case 'maintenance':
      return <MaintenancePin style={styles.iconWrapper} width={scale} height={scale} />
    case 'other-intervention':
      return <OtherInterventionPin style={styles.iconWrapper} width={scale} height={scale} />
    default:
      return <SinglTreePin style={styles.iconWrapper} width={scale} height={scale} />
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
