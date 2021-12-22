import { FIX_NEEDED, getIncompleteStatus, MULTI, SINGLE } from '../inventoryConstants';

/**
 * checks the inventory data and marks the items that are corrupted (i.e. missing data)
 */
export const checkAndMarkMissingData = (
  oldRealm: Realm,
  newRealm: Realm,
  schemaVersion: number,
) => {
  if (oldRealm.schemaVersion < schemaVersion) {
    const oldInventoryObject = oldRealm.objects('Inventory');
    const newInventoryObject = newRealm.objects('Inventory');

    for (const index in oldInventoryObject) {
      const {
        status,
        treeType,
        locateTree,
        species,
        polygons,
        specieDiameter,
        specieHeight,
        registrationDate,
        sampleTrees,
        locationId,
        hid,
        plantation_date,
      }: any = oldInventoryObject[index];

      // checks for missing data if status is not incomplete
      if (!getIncompleteStatus().includes(status)) {
        // checks for single tree and if there's any data missing then marks
        // the status as needs to be fixed
        if (
          treeType === SINGLE &&
          (isNull(specieDiameter) ||
            isNull(specieHeight) ||
            !(
              species &&
              Array.isArray(species) &&
              species.length === 0 &&
              species[0].aliases &&
              species[0].treeCount > 0
            ) ||
            isNull(plantation_date))
        ) {
          newInventoryObject[index].status = FIX_NEEDED;
        }
        // checks missing data for multiple trees
        else if (treeType === MULTI) {
          let isFixNeeded = false;
          // checks if plantataion_date is missing then marks as FIX_NEEDED
          if (isNull(plantation_date)) {
            isFixNeeded = true;
          } else {
            // loops through species array and check if aliases or treeCount is missing
            // and marks as FIX_NEEDED if anyone of them is absent
            for (const singleSpecies of species) {
              if (isNull(singleSpecies.aliases) || singleSpecies.treeCount < 1) {
                isFixNeeded = true;
                break;
              }
            }
          }

          if (isFixNeeded) {
            newInventoryObject[index].status = FIX_NEEDED;
          }

          // loops through sample trees and checks for missing data
          for (const sampleTreeIndex in sampleTrees) {
            const sampleTree = sampleTrees[sampleTreeIndex];
            const areCoordinatesNull =
              isNull(sampleTree.latitude) ||
              isNull(sampleTree.latitude) ||
              isNull(sampleTree.deviceLatitude) ||
              isNull(sampleTree.deviceLongitude);

            const isSpeciesNull = isNull(sampleTree.specieName) || isNull(sampleTree.specieId);
            const areMeasurementNull =
              isNull(sampleTree.specieDiameter) || isNull(sampleTree.specieHeight);
            const isPlantationDateNull = isNull(sampleTree.plantationDate);

            if (areCoordinatesNull || isSpeciesNull || areMeasurementNull || isPlantationDateNull) {
              newInventoryObject[index].sampleTrees[sampleTreeIndex].status = FIX_NEEDED;
            }
          }
        }

        // sets the registration date to current date if it's null
        if (isNull(registrationDate)) {
          newInventoryObject[index].registrationDate = new Date();
        }
      }
    }
  }
};

const isNull = (value: any) => {
  return value === null || value === undefined || value === '';
};
