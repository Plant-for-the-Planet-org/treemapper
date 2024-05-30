import {InterventionData} from 'src/types/interface/slice.interface'
import i18next from 'src/locales/index'


interface FinalObject {
  [key: string]: {
    count: number
    id?: string
    key?: string
  }
}

export const groupIntervention = (data: any[] | InterventionData[]) => {
  const finalObject: FinalObject = {}
  finalObject[i18next.t('label.all')] = {
    count: data.length,
    id: 'all',
  }
  finalObject[i18next.t('label.incomplete')] = {
    count: 0,
    id: 'incomplete',
  }
  for (let index = 0; index < data.length; index++) {
    if (!data[index].is_complete) {
      finalObject[i18next.t('label.incomplete')] = {
        count: (finalObject[i18next.t('label.incomplete')].count += 1),
        ...finalObject[i18next.t('label.incomplete')],
      }
    }
    if (finalObject[data[index].intervention_title]) {
      finalObject[data[index].intervention_title] = {
        count: (finalObject[data[index].intervention_title].count += 1),
        ...finalObject[data[index].intervention_title],
      }
    } else {
      finalObject[data[index].intervention_title] = {
        count: 1,
        id: data[index].intervention_key,
      }
    }
  }

  const arrayData = Object.entries(finalObject).map(([key, value]) => ({
    label: key,
    count: value.count,
    key: value.id,
  }))
  return arrayData
}

export const groupInterventionList = (
  data: InterventionData[],
  type: string,
) => {
  if (type === 'incomplete') {
    return data.filter(el => el.is_complete === false)
  }

  if (type === 'all') {
    return data
  }
  return data.filter(el => el.intervention_key === type)
}
