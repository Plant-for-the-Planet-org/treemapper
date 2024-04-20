import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SingleTeePlantation } from './interventionJSON/singleTreePlantation'
import { MultiTreePlantation } from './interventionJSON/multiTreePlantation'
import { MarkingRegenrant } from './interventionJSON/markingRegenerant'
import { AssistingSeedRain } from './interventionJSON/assistingSeedRain'
import { DirectSeeding } from './interventionJSON/directSeeding'
import { EnrichmentPlannting } from './interventionJSON/enrichmentPlanting'
import { Fencing } from './interventionJSON/fencing'
import { FireBreaks } from './interventionJSON/firebreaks'
import { FirePatrol } from './interventionJSON/firePatrol'
import { FireSupresionTeam } from './interventionJSON/fireSupressionTeam'
import { GrassSupression } from './interventionJSON/grassSupression'
import { LiebratingRegenrant } from './interventionJSON/liberatingRegenrant'
import { Maintenance } from './interventionJSON/maintenance'
import { OtherIntervention } from './interventionJSON/otherInterventaion'
import { StopTreeHarvesting } from './interventionJSON/stopTreeHarvesting'
import { SoilImprovements } from './interventionJSON/soilImprovements'
import { RemovalOfInvasiveSpecies } from './interventionJSON/removalOfInvasiveSpecies'

import { initialState } from 'src/store/slice/registerFormSlice'

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
      return FireSupresionTeam
    case 'fire-patrol':
      return FirePatrol
    case 'firebreaks':
      return FireBreaks
    case 'fencing':
      return Fencing
    case 'marking-regenerant':
      return MarkingRegenrant
    case 'liberating-regenerant':
      return LiebratingRegenrant
    case 'grass-suppression':
      return GrassSupression
    case 'soil-improvement':
      return SoilImprovements
    case 'stop-tree-harvesting':
      return StopTreeHarvesting
    case 'direct-seeding':
      return DirectSeeding
    case 'enrichement-planting':
      return EnrichmentPlannting
    case 'maintenance':
      return Maintenance
    case 'other-intervention':
      return OtherIntervention
    default:
      return initialState
  }
}
