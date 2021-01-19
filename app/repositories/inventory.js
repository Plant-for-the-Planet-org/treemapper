import Realm from 'realm';
import {
  Inventory,
  Species,
  Polygons,
  Coordinates,
  OfflineMaps,
  User,
  AddSpecies,
} from '../actions/Schemas';
import { bugsnag } from '../utils';
import { LocalInventoryActions } from '../actions/Action';

export const getInventoryByStatus = (status) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory;
          if (status === 'all') {
            inventory = realm.objects('Inventory');
          } else {
            inventory = realm.objects('Inventory').filtered(`status == "${status}"`);
          }
          resolve(JSON.parse(JSON.stringify(inventory)));
        });
        // realm.close();
      })
      .catch(bugsnag.notify);
  });
};

export const initiateInventory = ({ treeType }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventoryID = `${new Date().getTime()}`;
          console.log('inventory id', inventoryID);
          const inventoryData = {
            inventory_id: inventoryID,
            tree_type: treeType,
            status: 'incomplete',
            plantation_date: `${new Date().getTime()}`,
          };
          realm.create('Inventory', inventoryData);
          resolve(inventoryData);
        });
      })
      .catch((err) => {
        console.error(`Error at /repositories/initiateInventory -> ${JSON.stringify(err)}`);
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getInventory = ({ inventoryID }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', inventoryID);
          resolve(JSON.parse(JSON.stringify(inventory)));
        });
      })
      .catch((err) => {
        bugsnag.notify(err);
      });
  });
};

export const changeInventoryStatusAndResponse = ({ inventory_id, status, response }, dispatch) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              status,
              response,
            },
            'modified',
          );
          if (status === 'complete') {
            dispatch(LocalInventoryActions.updatePendingCount('decrement'));
            dispatch(LocalInventoryActions.updateUploadCount('decrement'));
          } else if (status === 'pending') {
            dispatch(LocalInventoryActions.updatePendingCount('increment'));
          }
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const changeInventoryStatus = ({ inventory_id, status }, dispatch) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              status,
            },
            'modified',
          );
          if (status === 'complete') {
            dispatch(LocalInventoryActions.updatePendingCount('decrement'));
            dispatch(LocalInventoryActions.updateUploadCount('decrement'));
          } else if (status === 'pending') {
            dispatch(LocalInventoryActions.updatePendingCount('increment'));
          }
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const updateSpecieName = ({ inventory_id, speciesText }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          console.log('inventory id', inventory_id);
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.specei_name = speciesText;
          console.log(inventory, 'actions');
        });
        resolve();
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const updateSpecieDiameter = ({ inventory_id, speciesDiameter }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.species_diameter = speciesDiameter;
        });
        resolve();
      })
      .catch(bugsnag.notify);
  });
};
