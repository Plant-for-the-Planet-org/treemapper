import {INTERVENTION_TYPE} from 'src/types/type/app.type'
import {SingleTreeFormData} from './singleTreeIntervention'
import {initialState} from 'src/store/slice/registerFormSlice'

export const setUpIntervention = (type: INTERVENTION_TYPE) => {
  switch (type) {
    case 'SINGLE_TREE':
      return SingleTreeFormData
    default:
      return initialState
  }
}
