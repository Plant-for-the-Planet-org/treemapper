import { getAllInventoryFromServer } from '../actions/inventory';
import { getInventoryByStatus, addInventoryToDB, addSampleTree } from '../repositories/inventory';

export const addInventoryFromServer = () => {
  getAllInventoryFromServer('exceptSample')
    .then((allInventoryFromServer) => {
      console.log(allInventoryFromServer.length, 'allInventoryFromServer');
      getInventoryByStatus('complete').then((allInventory) => {
        console.log(allInventory.length, 'allInventory');

        for (const inventoryFromServer of allInventoryFromServer) {
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
      });
    })
    .then(() => {
      getAllInventoryFromServer('sample').then((allSampleTreesFromServer) => {
        for (const sampleTreeFromServer of allSampleTreesFromServer) {
          addSampleTree(sampleTreeFromServer);
        }
      });
    });
};
