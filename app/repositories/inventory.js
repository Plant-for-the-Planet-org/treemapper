import Realm from 'realm';
import { setInventoryId, updateCount } from '../actions/inventory';
import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import { INCOMPLETE, INCOMPLETE_SAMPLE_TREE, ON_SITE, SINGLE } from '../utils/inventoryConstants';
import { getSchema } from './default';
import dbLog from './logs';

export const updateSpecieDiameter = ({ inventory_id, speciesDiameter }) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.specieDiameter = Math.round(speciesDiameter * 100) / 100;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Updated species diameter for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating species diameter for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const updateSpecieHeight = ({ inventory_id, speciesHeight }) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.specieHeight = Math.round(speciesHeight * 100) / 100;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Updated species height for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating species height for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const updateTreeTag = ({ inventoryId, tagId }) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventoryId}`);
          inventory.tagId = tagId;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Updated tree tag for inventory_id: ${inventoryId}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating tree tag for inventory_id: ${inventoryId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getInventoryByStatus = (status) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        let inventory = realm.objects('Inventory');
        if (status !== 'all') {
          inventory = inventory.filtered(`status == "${status}"`);
        }
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Fetched inventories from DB having status ${status}`,
        });
        resolve(inventory);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while fetching inventories from DB having status ${status}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const initiateInventory = ({ treeType }, dispatch) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventoryID = `${new Date().getTime()}`;
          const inventoryData = {
            inventory_id: inventoryID,
            treeType,
            status: INCOMPLETE,
            plantation_date: new Date(),
            lastScreen: treeType === SINGLE ? 'RegisterSingleTree' : 'LocateTree',
          };
          realm.create('Inventory', inventoryData);
          setInventoryId(inventoryID)(dispatch);
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Inventory initiated for tree type ${treeType} with inventory_id: ${inventoryID}`,
          });
          resolve(inventoryData);
        });
      })
      .catch((err) => {
        console.error(`Error at /repositories/initiateInventory -> ${JSON.stringify(err)}`);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while initiating inventory for tree type ${treeType}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getInventory = ({ inventoryID }) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        let inventory = realm.objectForPrimaryKey('Inventory', inventoryID);
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Fetched inventory with inventory_id: ${inventoryID}`,
        });
        if (inventory) {
          // by doing stringify and parsing of inventory result it removes the
          // reference of realm type Inventory from the result this helps to
          // avoid any conflicts when data is modified outside the realm scope
          resolve(JSON.parse(JSON.stringify(inventory)));
        } else {
          resolve(inventory);
        }
      })
      .catch((err) => {
        console.log(`Error while fetching inventory with inventory_id: ${inventoryID}`);
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while fetching inventory with inventory_id: ${inventoryID}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const changeInventoryStatusAndLocationId = (
  { inventory_id, status, locationId },
  dispatch,
) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              status,
              locationId,
            },
            'modified',
          );

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated status and locationId for inventory_id: ${inventory_id} to ${status}`,
          });

          if (status === 'complete') {
            updateCount({ type: 'pending', count: 'decrement' })(dispatch);
            updateCount({ type: 'upload', count: 'decrement' })(dispatch);
          } else if (status === 'pending') {
            updateCount({ type: 'pending', count: 'increment' })(dispatch);
          }
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating status and locationId for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const changeInventoryStatus = ({ inventory_id, status }, dispatch) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        let inventoryObject = {
          inventory_id: `${inventory_id}`,
          status,
        };
        // adds registration date if the status is pending
        if (status === 'pending') {
          inventoryObject.registrationDate = new Date();
        }
        realm.write(() => {
          realm.create('Inventory', inventoryObject, 'modified');

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated status for inventory_id: ${inventory_id} to ${status}`,
          });

          if (status === 'complete') {
            updateCount({ type: 'pending', count: 'decrement' })(dispatch);
            updateCount({ type: 'upload', count: 'decrement' })(dispatch);
          } else if (status === 'pending') {
            updateCount({ type: 'pending', count: 'increment' })(dispatch);
          }
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating status for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const updateSingleTreeSpecie = ({ inventory_id, species }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.species = species;
        });
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully updated specie name for inventory_id: ${inventory_id}`,
        });
        resolve();
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating specie name for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
        resolve(false);
      });
  });
};

export const deleteInventory = ({ inventory_id }, dispatch) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
        const isPending = inventory.status === 'pending';
        realm.write(() => {
          realm.delete(inventory);
          setInventoryId('')(dispatch);
        });

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully deleted inventory with inventory_id: ${inventory_id}`,
        });

        if (dispatch && isPending) {
          updateCount({ type: 'pending', count: 'decrement' })(dispatch);
        }
        resolve(true);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while deleting inventory with inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const updatePlantingDate = ({ inventory_id, plantation_date }) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              plantation_date,
            },
            'modified',
          );

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated plantation date for inventory_id: ${inventory_id}`,
          });

          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating plantation date for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const updateLastScreen = ({ lastScreen, inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              lastScreen,
            },
            'modified',
          );

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated last screen for inventory_id: ${inventory_id} to ${lastScreen}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating last screen for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const clearAllIncompleteInventory = () => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let allInventory = realm
            .objects('Inventory')
            .filtered(`status == "${INCOMPLETE}" || status == "${INCOMPLETE_SAMPLE_TREE}"`);

          realm.delete(allInventory);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: 'Successfully deleted all incomplete inventories',
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: 'Error while deleting all incomplete inventories',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const clearAllUploadedInventory = () => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let allInventory = realm.objects('Inventory').filtered('status == "complete"');
          realm.delete(allInventory);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: 'Successfully deleted all uploaded inventories',
          });

          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: 'Error while deleting all uploaded inventories',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const updateSpecieAndMeasurements = ({ inventoryId, species, diameter, height, tagId }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventoryId}`);
          inventory.specieDiameter = Number(diameter);
          inventory.specieHeight = Number(height);
          inventory.species = species;
          inventory.tagId = tagId;
        });
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully updated specie name, height and diameter for inventory_id: ${inventoryId}`,
        });
        resolve();
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating specie name, height and diameter for inventory_id: ${inventoryId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const removeLastCoord = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          let polygons = inventory.polygons;
          let coords = polygons[polygons.length - 1].coordinates;
          coords = coords.slice(0, coords.length - 1);
          polygons[polygons.length - 1].coordinates = coords;
          inventory.polygons = polygons;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully removed last coordinate for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while removing last coordinate for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const getCoordByIndex = ({ inventory_id, index }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
        let polygons = inventory.polygons;
        let coords = polygons[0].coordinates;
        let coordsLength = coords.length;
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully fetched coordinate for inventory_id: ${inventory_id} with coordinate index: ${index}`,
        });
        resolve({ coordsLength, coord: coords[index] });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while fetching coordinate for inventory_id: ${inventory_id} with coordinate index: ${index}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const insertImageAtIndexCoordinate = ({ inventory_id, imageUrl, index }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          let polygons = inventory.polygons;
          let polygonsTemp = [];

          polygonsTemp = polygons.map((onePolygon) => {
            let coords = onePolygon.coordinates;
            coords[index].imageUrl = imageUrl;
            return { isPolygonComplete: onePolygon.isPolygonComplete, coordinates: coords };
          });
          inventory.polygons = polygonsTemp;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated image url for inventory_id: ${inventory_id} with coordinate index: ${index}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating image url for inventory_id: ${inventory_id} with coordinate index: ${index}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const addCoordinates = ({ inventory_id, geoJSON, currentCoords }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let polygons = [];
          geoJSON.features.map((onePolygon) => {
            let onePolygonTemp = {};
            onePolygonTemp.isPolygonComplete = onePolygon.properties.isPolygonComplete || false;
            let coordinates = [];
            onePolygon.geometry.coordinates.map((coordinate) => {
              coordinates.push({
                longitude: coordinate[0],
                latitude: coordinate[1],
                currentloclat: currentCoords.latitude ? currentCoords.latitude : 0,
                currentloclong: currentCoords.longitude ? currentCoords.longitude : 0,
                isImageUploaded: false,
              });
            });
            onePolygonTemp.coordinates = coordinates;
            polygons.push(onePolygonTemp);
          });
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              polygons: polygons,
            },
            'modified',
          );
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully added coordinates for inventory_id: ${inventory_id}`,
            logStack: JSON.stringify({
              geoJSON,
              currentCoords,
            }),
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while adding coordinates for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const addCoordinateSingleRegisterTree = ({
  inventory_id,
  markedCoords,
  currentCoords,
  locateTree,
}) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', inventory_id);
          inventory.polygons = [
            {
              coordinates: [
                {
                  latitude: markedCoords[1],
                  longitude: markedCoords[0],
                  currentloclat: currentCoords.latitude,
                  currentloclong: currentCoords.longitude,
                  isImageUploaded: false,
                },
              ],
              isPolygonComplete: true
            },
          ];
          if (locateTree) {
            inventory.locateTree = locateTree;
          }
          inventory.plantation_date = new Date();
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully added coordinates for single tree with inventory_id: ${inventory_id}`,
            logStack: JSON.stringify({
              markedCoords,
              currentCoords,
              locateTree,
            }),
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while adding coordinates for single tree with inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const insertImageSingleRegisterTree = ({ inventory_id, imageUrl }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', inventory_id);
          inventory.polygons[0].coordinates[0].imageUrl = imageUrl;
          resolve();
        });
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Successfully updated image url for single tree with inventory_id: ${inventory_id}`,
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating image url for single tree with inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const addSpeciesAction = ({ inventory_id, species, plantation_date }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              species,
              plantation_date,
            },
            'modified',
          );
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated species and plantation date for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating species and plantation date for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const addLocateTree = ({ locateTree, inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Inventory',
            {
              inventory_id: `${inventory_id}`,
              locateTree,
            },
            'modified',
          );
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated locate tree for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating locate tree for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const polygonUpdate = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.polygons[0].isPolygonComplete = true;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated polygon completion for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating polygon completion for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const completePolygon = ({ inventory_id, locateTree }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.polygons[0].isPolygonComplete = true;
          inventory.polygons[0].coordinates.push(inventory.polygons[0].coordinates[0]);
          if (locateTree === ON_SITE) {
            inventory.status = INCOMPLETE_SAMPLE_TREE;
          }
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated polygon completion and last coordinate for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating polygon completion and last coordinate for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

/**
 * updates the inventory with the data provided using the inventory id
 * @param {object} - takes [inventory_id] and [inventoryData] as properties
 *                   to update the inventory
 */
export const updateInventory = ({ inventory_id, inventoryData }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);

          let newInventory = {
            ...JSON.parse(JSON.stringify(inventory)),
            ...inventoryData,
          };
          realm.create('Inventory', newInventory, 'modified');
          resolve();
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while updating inventory with inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};
