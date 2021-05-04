import { getAllInventoryFromServer } from '../actions/inventory';
import { getInventoryByStatus, addInventoryToDB, addSampleTree } from '../repositories/inventory';

export const addInventoryFromServer = () => {
  let exceptSampleTrees;
  let allSampleTrees;
  getAllInventoryFromServer().then((allInventoryFromServer) => {
    console.log(
      allInventoryFromServer[0].length,
      'allInventoryFromServer',
      allInventoryFromServer[1].length,
      'allSampleTreesFromServer',
    );
    exceptSampleTrees = allInventoryFromServer[0];
    allSampleTrees = allInventoryFromServer[1];
    getInventoryByStatus('complete')
      .then((allInventory) => {
        console.log(allInventory.length, 'allInventory');

        for (const inventoryFromServer of exceptSampleTrees) {
          if (allInventory.length === 0) {
            addInventoryToDB(inventoryFromServer);
          }
          for (const inventory of allInventory) {
            if (inventoryFromServer.id === inventory.locationId) {
              break;
            } else if (inventory.locationId === allInventory[allInventory.length - 1].locationId) {
              addInventoryToDB(inventoryFromServer);
            }
          }
        }
      })
      .then(() => {
        for (const sampleTreeFromServer of allSampleTrees) {
          addSampleTree(sampleTreeFromServer);
        }
      });
  });
};
