import {INTERVENTION_TYPE} from 'src/types/type/app.type'
import {SingleTreeFormData} from './singleTreeIntervention'
import { MultiTreeFormData } from './multiTreeIntervention'
import {initialState} from 'src/store/slice/registerFormSlice'

export const setUpIntervention = (type: INTERVENTION_TYPE) => {
  switch (type) {
    case 'SINGLE_TREE':
      return SingleTreeFormData
    case 'MULTI_TREE':
      return MultiTreeFormData
    default:
      return initialState
  }
}
