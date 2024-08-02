import { InterventionData } from 'src/types/interface/slice.interface'
import i18next from 'src/locales/index'


interface FinalObject {
  [key: string]: {
    count: number
    id?: string
    key?: string
  }
}

export const groupIntervention = (data: any[] | InterventionData[]) => {
  const finalObject: FinalObject = {};
  const incompleteKey = i18next.t('label.incomplete')
  finalObject[i18next.t('label.all')] = {
    count: data.length,
    id: 'all',
  };
  finalObject[incompleteKey] = {
    count: 0,
    id: 'incomplete',
  };
  finalObject['Unsynced'] = {
    count: 0,
    id: 'unsync',
  };

  for (const item of data) {
    const incrementedCount = finalObject[incompleteKey].count + 1
    if (!item.is_complete) {
      finalObject[incompleteKey] = {
        count: incrementedCount,
        ...finalObject[incompleteKey],
      };
    }
    if (item.status !== 'SYNCED' && item.is_complete) {
      finalObject['Unsynced'] = {
        count: incrementedCount,
        ...finalObject['Unsynced'],
      };
    }
    if (finalObject[item.intervention_title]) {
      finalObject[item.intervention_title] = {
        count: incrementedCount,
        ...finalObject[item.intervention_title],
      };
    } else {
      finalObject[item.intervention_title] = {
        count: 1,
        id: item.intervention_key,
      };
    }
  }

  const arrayData = Object.entries(finalObject).map(([key, value]) => ({
    label: key,
    count: value.count,
    key: value.id,
  }));

  return arrayData;
};

export const groupInterventionList = (
  data: InterventionData[],
  type: string,
) => {
  if (type === 'incomplete') {
    return data.filter(el => el.is_complete === false)
  }

  if (type === 'unsync') {
    return data.filter(el => el.status !== 'SYNCED')
  }

  if (type === 'all') {
    return data
  }
  return data.filter(el => el.intervention_key === type)
}
