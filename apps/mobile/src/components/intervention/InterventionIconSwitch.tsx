import { StyleSheet, ViewStyle } from 'react-native'
import React from 'react'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SCALE_40, SCALE_50 } from 'src/utils/constants/spacing'



import SingleTreePin from 'assets/images/intervention/SingleTreePin.svg';
import MultiTreePin from 'assets/images/intervention/MultiTreePin.svg';
import InvasiveSpeciesPin from 'assets/images/intervention/InvasiveSpeciesPin.svg';
import FireSuppressionPin from 'assets/images/intervention/FireSuppressionPin.svg';
import FirePatrolPin from 'assets/images/intervention/FirePatrolPin.svg';
import FencingPin from 'assets/images/intervention/FencingPin.svg';
import MarkingRegenerantPin from 'assets/images/intervention/MarkingRegenerantPin.svg';
import LiberatingRegenerantPin from 'assets/images/intervention/LiberatingRegenerantPin.svg';
import GrassSuppressionPin from 'assets/images/intervention/GrassSuppressionPin.svg';
import FireBreakPin from 'assets/images/intervention/FireBreakPin.svg';
import SeedRainPin from 'assets/images/intervention/SeedRainPin.svg';
import SoilImprovementPin from 'assets/images/intervention/SoilImprovementPin.svg';
import StopHarvestingPin from 'assets/images/intervention/StopHarvestingPin.svg';
import DirectSeedingPin from 'assets/images/intervention/DirectSeedingPin.svg';
import EnrichmentPlantingPin from 'assets/images/intervention/EnrichmentPlantingPin.svg';
import MaintenancePin from 'assets/images/intervention/MaintenancePin.svg';
import OtherInterventionPin from 'assets/images/intervention/OtherInterventionPin.svg';

interface Props {
  icon: INTERVENTION_TYPE
  dimension?: boolean

}

const InterventionIconSwitch = (props: Props) => {
  const { icon, dimension } = props
  const scale = dimension ? '100%': SCALE_40
  const imageWrapper: ViewStyle = { ...styles.iconWrapper, width: '100%', height: '100%' }
  switch (icon) {
    case 'single-tree-registration':
      return <SingleTreePin style={imageWrapper} width={scale} height={scale} />
    case 'multi-tree-registration':
      return <MultiTreePin style={imageWrapper} width={scale} height={scale} />
    case 'removal-invasive-species':
      return <InvasiveSpeciesPin style={imageWrapper} width={scale} height={scale} />
    case 'fire-suppression':
      return <FireSuppressionPin style={imageWrapper} width={scale} height={scale} />
    case 'fire-patrol':
      return <FirePatrolPin style={imageWrapper} width={scale} height={scale} />
    case 'fencing':
      return <FencingPin style={imageWrapper} width={scale} height={scale} />
    case 'marking-regenerant':
      return <MarkingRegenerantPin style={imageWrapper} width={scale} height={scale} />
    case 'liberating-regenerant':
      return <LiberatingRegenerantPin style={imageWrapper} width={scale} height={scale} />
    case 'grass-suppression':
      return <GrassSuppressionPin style={imageWrapper} width={scale} height={scale} />
    case 'firebreaks':
      return <FireBreakPin style={imageWrapper} width={scale} height={scale} />
    case 'assisting-seed-rain':
      return <SeedRainPin style={imageWrapper} width={scale} height={scale} />
    case 'soil-improvement':
      return <SoilImprovementPin style={imageWrapper} width={scale} height={scale} />
    case 'stop-tree-harvesting':
      return <StopHarvestingPin style={imageWrapper} width={scale} height={scale} />
    case 'direct-seeding':
      return <DirectSeedingPin style={imageWrapper} width={scale} height={scale} />
    case 'enrichment-planting':
      return <EnrichmentPlantingPin style={imageWrapper} width={scale} height={scale} />
    case 'maintenance':
      return <MaintenancePin style={imageWrapper} width={scale} height={scale} />
    case 'other-intervention':
      return <OtherInterventionPin style={imageWrapper} width={scale} height={scale} />
    default:
      return <SingleTreePin style={imageWrapper} width={scale} height={scale} />
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
