import { getAllInventoryFromServer } from '../actions/inventory';
import { getInventoryByStatus, addInventoryToDB, addSampleTree } from '../repositories/inventory';

export const addInventoryFromServer = () => {
  getAllInventoryFromServer().then((allInventoryFromServer) => {
    console.log(allInventoryFromServer.length, 'allInventoryFromServer');
    getInventoryByStatus('complete').then((allInventory) => {
      console.log(allInventory.length, 'allInventory');
      for (const inventoryFromServer of allInventoryFromServer) {
        for (const inventory of allInventory) {
          if (inventoryFromServer.id === inventory.locationId) {
            // console.log(inventoryFromServer.id, 'Already Exists');
            break;
          } else if (inventory.locationId === allInventory[allInventory.length - 1].locationId) {
            console.log(inventoryFromServer.id, 'Adding');
            addInventoryToDB(inventoryFromServer).then(() => {
              if (inventoryFromServer.type === 'sample') {
                addSampleTree(inventoryFromServer);
              }
            });
          } else {
            continue;
          }
        }
      }
    });
  });
};
