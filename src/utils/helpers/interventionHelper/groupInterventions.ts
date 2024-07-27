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
  finalObject[i18next.t('label.all')] = {
    count: data.length,
    id: 'all',
  };
  finalObject[i18next.t('label.incomplete')] = {
    count: 0,
    id: 'incomplete',
  };
  finalObject['Unsynced'] = {
    count: 0,
    id: 'unsync',
  };

  const key = i18next.t('label.incomplete');
  if (finalObject[key]) {
    finalObject[key].count += 1;
  }

  for (const item of data) {
    if (!item.is_complete) {
      finalObject[i18next.t('label.incomplete')] = {
        count: finalObject[key]?.count ?? 0,
        ...finalObject[i18next.t('label.incomplete')],
      };
    }
    if (finalObject['Unsynced']) {
      finalObject['Unsynced'].count += 1;
    } else {
      finalObject['Unsynced'] = { count: 1 }; // Initialize if not exists
    }
    if (item.status !== 'SYNCED' && item.is_complete) {
      finalObject['Unsynced'] = {
        count:  finalObject['Unsynced'].count,
        ...finalObject['Unsynced'],
      };
    }
    if (finalObject[item.intervention_title]) {
      finalObject[item.intervention_title].count += 1;
      finalObject[item.intervention_title] = {
        ...finalObject[item.intervention_title],
        count: finalObject[item.intervention_title].count,
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
