import { InterventionData } from 'src/types/interface/slice.interface';

interface FinalObject {
  [key: string]: {
    count: number;
    id?: string;
    key?: string;
  };
}

export const groupIntervention = (data: InterventionData[]) => {
  const finalObject: FinalObject = {
    All: { count: data.length, id: 'all' },
    Incomplete: { count: 0, id: 'incomplete' },
  };

  data.forEach(({ is_complete, intervention_title, intervention_key }) => {
    if (!is_complete) {
      finalObject['Incomplete'].count += 1;
    }
    if (finalObject[intervention_title]) {
      finalObject[intervention_title].count += 1;
    } else {
      finalObject[intervention_title] = { count: 1, id: intervention_key };
    }
  });

  return Object.entries(finalObject).map(([key, value]) => ({
    label: key,
    count: value.count,
    key: value.id,
  }));
};

export const groupInterventionList = (data: InterventionData[], type: string) => {
  if (type === 'incomplete') {
    return data.filter(({ is_complete }) => !is_complete);
  }
  if (type === 'all') {
    return data;
  }
  return data.filter(({ intervention_key }) => intervention_key === type);
};
