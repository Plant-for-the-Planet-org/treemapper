export function createProjectTitle(name) {
  // Capitalize the first letter and make the rest lowercase
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `${formattedName}'s personal project`;
}


// Simple function to remove duplicates based on scientificSpeciesId
export function removeDuplicatesByScientificSpeciesId(array: any[]) {
  const seen = new Set();
  const uniqueRecords: any[] = [];
  const duplicates: { index: number; record: any; scientificSpeciesId: any; reason: string }[] = [];

  array.forEach((record, index) => {
    const scientificSpeciesId = record.scientificSpecies;

    if (seen.has(scientificSpeciesId)) {
      duplicates.push({
        index,
        record,
        scientificSpeciesId,
        reason: `Duplicate scientificSpeciesId: ${scientificSpeciesId}`
      });
    } else {
      seen.add(scientificSpeciesId);
      uniqueRecords.push(record);
    }
  });

  console.log(`Original: ${array.length}, Unique: ${uniqueRecords.length}, Duplicates removed: ${duplicates.length}`);

  return uniqueRecords;
}

// If you want to see what duplicates were removed:
function removeDuplicatesWithDetails(array) {
  const seen = new Set();
  const uniqueRecords: any[] = [];
  const duplicates: { index: number; scientificSpeciesId: any; aliases: any; originalId: any }[] = [];

  array.forEach((record, index) => {
    const scientificSpeciesId = record.scientificSpeciesId;

    if (seen.has(scientificSpeciesId)) {
      duplicates.push({
        index,
        scientificSpeciesId,
        aliases: record.aliases,
        originalId: record.metadata?.originalId
      });
    } else {
      seen.add(scientificSpeciesId);
      uniqueRecords.push(record);
    }
  });

  console.log(`Removed ${duplicates.length} duplicates:`);
  duplicates.forEach(dup => {
    console.log(`- Index ${dup.index}: ${dup.aliases} (${dup.scientificSpeciesId})`);
  });

  return { uniqueRecords, duplicates };
}