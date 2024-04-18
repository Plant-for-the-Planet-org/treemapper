import {InterventionData} from 'src/types/interface/slice.interface'

interface FinalObject {
  [key: string]: {
    count: number
    id?: string
    key?: string
  }
}

export const groupIntervention = (data: InterventionData[]) => {
  const finalObject: FinalObject = {}
  finalObject['All'] = {
    count: data.length,
    id: 'all',
  }
  finalObject['Incomplete'] = {
    count: 0,
    id: 'incomplete',
  }
  for (let index = 0; index < data.length; index++) {
    if (!data[index].is_complete) {
      finalObject['Incomplete'] = {
        count: (finalObject['Incomplete'].count += 1),
        ...finalObject['Incomplete'],
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
