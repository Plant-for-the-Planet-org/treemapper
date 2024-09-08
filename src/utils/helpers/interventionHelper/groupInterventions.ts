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
    Unsynced: {
      count: 0,
      id: 'unsync',
    }
  };

  


  data.forEach(({ is_complete, intervention_title, intervention_key, status }) => {
    if (!is_complete) {
      finalObject['Incomplete'].count += 1;
    }
    if (finalObject[intervention_title]) {
      finalObject[intervention_title].count += 1;
    } else {
      finalObject[intervention_title] = { count: 1, id: intervention_key };
    }
    if (status == 'PENDING_DATA_UPLOAD' && is_complete) {
        // Increment the count and store it in a variable
        const updatedCount = finalObject['Unsynced'].count + 1;
    
        // Update finalObject with the new count value
        finalObject['Unsynced'] = {
            count: updatedCount,
            ...finalObject['Unsynced'],
        };
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
