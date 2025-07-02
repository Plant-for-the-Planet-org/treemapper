import * as XLSX from 'xlsx';

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
      'PLANTATION START DATE': '03/04/2024',
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
      'PLANTATION START DATE': '05/04/2024',
      'PLANTATION END DATE': '06/04/2024',
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
      'PLANTATION START DATE': '03/18/2024',
      'PLANTATION END DATE': '03/20/2024',
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
      'PLANTATION START DATE': '03/23/2024',
      'PLANTATION END DATE': '03/23/2024',
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

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert sample data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 10 }, // TYPE
    { wch: 18 }, // PLANTATION START DATE
    { wch: 18 }, // PLANTATION END DATE
    { wch: 12 }, // LATITUDE
    { wch: 12 }, // LONGITUDE
    { wch: 10 }, // ELEVATION
    { wch: 18 }, // AVERAGE PLANT HEIGHT
    { wch: 20 }, // AVERAGE PLANT DIAMETER
    { wch: 15 }, // TREES PLANTED
    { wch: 20 }, // NUMBER OF PEOPLE INVOLVED
    { wch: 35 }, // SPECIES
    { wch: 15 }, // TAG
    { wch: 25 }, // LOCATION NAME
    { wch: 18 }, // PERSON NAME
    { wch: 10 }, // ID
    { wch: 20 }, // DESIGNATION
    { wch: 40 }  // COMMENT
  ];
  
  worksheet['!cols'] = columnWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TreeMapper Template');

  // Generate the Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    compression: true 
  });
  
  const data = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'TreeMapper_Bulk_Upload_Template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};