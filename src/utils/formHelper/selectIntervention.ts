import {INTERVENTION_TYPE} from 'src/types/type/app.type'
import {SingleTreeFormData} from './singleTreeIntervention'
import { MultiTreeFormData } from './multiTreeIntervention'
import { assistingSeedRainData } from './assistingSeedRain'
import { removalOfInvasiveSpeciesData } from './removalOfInvasiveSpecies'
import { fireSupressionFormData } from './fireSupression'
import {initialState} from 'src/store/slice/registerFormSlice'

export const setUpIntervention = (type: INTERVENTION_TYPE) => {
  switch (type) {
    case 'SINGLE_TREE':
      return SingleTreeFormData
    case 'MULTI_TREE':
      return MultiTreeFormData
    case 'SEED_RAIN':
      return assistingSeedRainData
    case 'REMOVAL_INVASIVE_SPEICES':
      return removalOfInvasiveSpeciesData
      case 'FIRESUPRESSION_TEAM':
        return fireSupressionFormData
    default:
      return initialState
  }
}
