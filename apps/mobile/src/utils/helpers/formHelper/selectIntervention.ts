import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SingleTeePlantation } from './interventionJSON/singleTreePlantation'
import { MultiTreePlantation } from './interventionJSON/multiTreePlantation'
import { MarkingRegenerant } from './interventionJSON/markingRegenerant'
import { AssistingSeedRain } from './interventionJSON/assistingSeedRain'
import { DirectSeeding } from './interventionJSON/directSeeding'
import { EnrichmentPlanting } from './interventionJSON/enrichmentPlanting'
import { Fencing } from './interventionJSON/fencing'
import { FireBreaks } from './interventionJSON/firebreaks'
import { FirePatrol } from './interventionJSON/firePatrol'
import { FireSuppressionTeam } from './interventionJSON/fireSuppressionTeam'
import { GrassSuppression } from './interventionJSON/grassSuppression'
import { LiberatingRegenerant } from './interventionJSON/liberatingRegenerant'
import { Maintenance } from './interventionJSON/maintenance'
import { OtherIntervention } from './interventionJSON/otherIntervention'
import { StopTreeHarvesting } from './interventionJSON/stopTreeHarvesting'
import { SoilImprovements } from './interventionJSON/soilImprovements'
import { RemovalOfInvasiveSpecies } from './interventionJSON/removalOfInvasiveSpecies'
import { initialInterventionState } from 'src/utils/constants/initialInterventionState'




export const setUpIntervention = (type: INTERVENTION_TYPE) => {
  switch (type) {
    case 'single-tree-registration':
      return SingleTeePlantation
    case 'multi-tree-registration':
      return MultiTreePlantation
    case 'assisting-seed-rain':
      return AssistingSeedRain
    case 'removal-invasive-species':
      return RemovalOfInvasiveSpecies
    case 'fire-suppression':
      return FireSuppressionTeam
    case 'fire-patrol':
      return FirePatrol
    case 'firebreaks':
      return FireBreaks
    case 'fencing':
      return Fencing
    case 'marking-regenerant':
      return MarkingRegenerant
    case 'liberating-regenerant':
      return LiberatingRegenerant
    case 'grass-suppression':
      return GrassSuppression
    case 'soil-improvement':
      return SoilImprovements
    case 'stop-tree-harvesting':
      return StopTreeHarvesting
    case 'direct-seeding':
      return DirectSeeding
    case 'enrichment-planting':
      return EnrichmentPlanting
    case 'maintenance':
      return Maintenance
    case 'other-intervention':
      return OtherIntervention
    default:
      return initialInterventionState
  }
}
