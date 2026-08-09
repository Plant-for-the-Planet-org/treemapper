import Papa from 'papaparse';

export const downloadTreeMapperTemplate = () => {
  // Define the corrected column headers
  const headers = [
    'TYPE',
    'PLANTATION START DATE',
    'PLANTATION END DATE',
    'LATITUDE',
    'LONGITUDE', // Fixed spelling
    'ELEVATION',
    'AVERAGE PLANT HEIGHT',
    'AVERAGE PLANT DIAMETER', // Fixed spelling
    'TREES PLANTED',
    'NUMBER OF PEOPLE INVOLVED',
    'SPECIES',
    'TAG',
    'LOCATION NAME',
    'PERSON NAME',
    'ID',
    'DESIGNATION',
    'COMMENT'
  ];

  // Sample data with realistic tree planting information
  const sampleData = [
    // Single type plantation example
    {
      'TYPE': 'Single',
      'PLANTATION START DATE': '04/03/2024',
      'PLANTATION END DATE': '04/04/2024',
      'LATITUDE': 40.7128,
      'LONGITUDE': -74.0060,
      'ELEVATION': 125,
      'AVERAGE PLANT HEIGHT': 2.5,
      'AVERAGE PLANT DIAMETER': 0.8,
      'TREES PLANTED': 50,
      'NUMBER OF PEOPLE INVOLVED': 8,
      'SPECIES': 'Oak (Quercus robur)',
      'TAG': 'OAK2024001',
      'LOCATION NAME': 'Central Park East',
      'PERSON NAME': 'John Smith',
      'ID': 'JS001',
      'DESIGNATION': 'Forest Officer',
      'COMMENT': 'Spring plantation drive with local community volunteers'
    },
    // Multi type plantation example 1
    {
      'TYPE': 'Multi',
      'PLANTATION START DATE': '04/05/2024',
      'PLANTATION END DATE': '04/06/2024',
      'LATITUDE': 34.0522,
      'LONGITUDE': -118.2437,
      'ELEVATION': 280,
      'AVERAGE PLANT HEIGHT': 1.8,
      'AVERAGE PLANT DIAMETER': 0.6,
      'TREES PLANTED': 120,
      'NUMBER OF PEOPLE INVOLVED': 15,
      'SPECIES': 'Pine (Pinus sylvestris), Maple (Acer platanoides)',
      'TAG': 'MIX2024002',
      'LOCATION NAME': 'Riverside Conservation Area',
      'PERSON NAME': 'Maria Garcia',
      'ID': 'MG002',
      'DESIGNATION': 'Environmental Coordinator',
      'COMMENT': 'Mixed species planting for biodiversity enhancement'
    },
    // Multi type plantation example 2
    {
      'TYPE': 'Multi',
      'PLANTATION START DATE': '18/03/2024',
      'PLANTATION END DATE': '20/03/2024',
      'LATITUDE': 51.5074,
      'LONGITUDE': -0.1278,
      'ELEVATION': 45,
      'AVERAGE PLANT HEIGHT': 3.2,
      'AVERAGE PLANT DIAMETER': 1.2,
      'TREES PLANTED': 85,
      'NUMBER OF PEOPLE INVOLVED': 12,
      'SPECIES': 'Birch (Betula pendula), Willow (Salix alba), Hazel (Corylus avellana)',
      'TAG': 'MIX2024003',
      'LOCATION NAME': 'Thames Valley Wetlands',
      'PERSON NAME': 'David Wilson',
      'ID': 'DW003',
      'DESIGNATION': 'Senior Botanist',
      'COMMENT': 'Wetland restoration project with native species'
    },
    // Single type plantation example 2
    {
      'TYPE': 'Single',
      'PLANTATION START DATE': '23/03/2024',
      'PLANTATION END DATE': '23/03/2024',
      'LATITUDE': -33.8688,
      'LONGITUDE': 151.2093,
      'ELEVATION': 180,
      'AVERAGE PLANT HEIGHT': 2.1,
      'AVERAGE PLANT DIAMETER': 0.7,
      'TREES PLANTED': 75,
      'NUMBER OF PEOPLE INVOLVED': 10,
      'SPECIES': 'Eucalyptus (Eucalyptus globulus)',
      'TAG': 'EUC2024004',
      'LOCATION NAME': 'Blue Mountains Reserve',
      'PERSON NAME': 'Sarah Johnson',
      'ID': 'SJ004',
      'DESIGNATION': 'Conservation Manager',
      'COMMENT': 'Native eucalyptus restoration in fire-affected area'
    }
  ];

  // Build the CSV. `fields` pins the column order so it does not depend on
  // object key order. Values containing commas (for example multi species
  // rows) are quoted by papaparse.
  const csv = Papa.unparse({
    fields: headers,
    data: sampleData,
  });

  // Lead with a BOM so Excel reads the file as UTF-8 and does not mangle
  // accented species or place names.
  const data = new Blob(['\ufeff', csv], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'TreeMapper_Bulk_Upload_Template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};