import { getAllInventoryFromServer } from '../actions/inventory';
import { addInventoryToDB, addSampleTree, getInventoryByStatus } from '../repositories/inventory';

export const addInventoryFromServer = async () => {
  let exceptSampleTrees;
  let allSampleTrees;
  let allInventoryFromServer = await getAllInventoryFromServer();
  exceptSampleTrees = allInventoryFromServer[0];
  allSampleTrees = allInventoryFromServer[1];
  getInventoryByStatus('all')
    .then((allInventory) => {
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
};
