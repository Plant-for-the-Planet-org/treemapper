import {INTERVENTION_TYPE} from 'src/types/type/app.type'
import {SingleTreeFormData} from './interventionJSON/singleTreeIntervention'
import { MultiTreeFormData } from './interventionJSON/multiTreeIntervention'
// import { assistingSeedRainData } from './interventionJSON/assistingSeedRain'
// import { removalOfInvasiveSpeciesData } from './interventionJSON/removalOfInvasiveSpecies'
// import { fireSupressionFormData } from './interventionJSON/fireSupression'
import {initialState} from 'src/store/slice/registerFormSlice'

export const setUpIntervention = (type: INTERVENTION_TYPE) => {
  switch (type) {
    case 'single-tree-registration':
      return SingleTreeFormData
    case 'multi-tree-registration':
      return MultiTreeFormData
    default:
      return initialState
  }
}
