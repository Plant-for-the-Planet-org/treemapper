import Realm from 'realm';
import { setInventoryId, updateCount, updateProgressCount } from '../actions/inventory';
import { bugsnag } from '../utils';
import {
  appAdditionalDataForAPI,
  getFormattedAdditionalDetails,
} from '../utils/additionalData/functions';
import { LogTypes } from '../utils/constants';
import {
  DATA_UPLOAD_START,
  INCOMPLETE,
  INCOMPLETE_SAMPLE_TREE,
  MULTI,
  OFF_SITE,
  ON_SITE,
  PENDING_DATA_UPLOAD,
  SAMPLE,
  SINGLE,
  SYNCED,
  getPendingStatus,
  getIncompleteStatus,
  TOTAL_COUNT,
  PENDING_UPLOAD_COUNT,
  INCOMPLETE_COUNT,
} from '../utils/inventoryConstants';
import {
  checkAndMarkMissingData,
  updateSingleInventoryMissingStatus,
} from '../utils/registrations/markCorruptedData';
import { getSchema } from './default';
import dbLog from './logs';

export const updateSpecieDiameter = ({ inventory_id, speciesDiameter }) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.specieDiameter = Math.round(speciesDiameter * 1000) / 1000;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Updated species diameter for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch(err => {
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
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.specieHeight = Math.round(speciesHeight * 1000) / 1000;
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Updated species height for inventory_id: ${inventory_id}`,
          });
          resolve();
        });
      })
      .catch(err => {
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
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
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
      .catch(err => {
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

export const getInventoryByStatus = status => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        let inventory = realm.objects('Inventory').filtered('status != null');
        if (status.length !== 0) {
          var query = 'status == ';
          for (var i = 0; i < status.length; i++) {
            query += `'${status[i]}'`;
            if (i + 1 < status.length) {
              query += ' || status == ';
            }
          }
          inventory = inventory.filtered(query);
        }
        let sortedInventory = inventory.sorted('registrationDate', true);
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Fetched inventories from DB having status ${
            status.length == 0 ? 'all' : status.join()
          }`,
        });
        resolve(sortedInventory);
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while fetching inventories from DB having status ${
            status.length == 0 ? 'all' : status.join
          }`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const initiateInventory = ({ treeType }, dispatch) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
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
      .catch(err => {
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
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
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
      .catch(err => {
        console.error(`Error while fetching inventory with inventory_id: ${inventoryID}`);
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
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
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

          if (status === SYNCED) {
            updateCount({ type: PENDING_DATA_UPLOAD, count: 'decrement' })(dispatch);
            updateCount({ type: 'upload', count: 'decrement' })(dispatch);
            updateProgressCount({ count: 'decrement' })(dispatch);
          } else if (status === PENDING_DATA_UPLOAD) {
            updateCount({ type: PENDING_DATA_UPLOAD, count: 'increment' })(dispatch);
          }
          resolve(true);
        });
      })
      .catch(err => {
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

export const changeInventoryStatus = ({ inventory_id, status, count }, dispatch) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        let inventoryObject = {
          inventory_id: `${inventory_id}`,
          status,
        };
        // adds registration date if the status is pending
        if (status === PENDING_DATA_UPLOAD) {
          inventoryObject.registrationDate = new Date();
        }
        realm.write(() => {
          realm.create('Inventory', inventoryObject, 'modified');

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Successfully updated status for inventory_id: ${inventory_id} to ${status}`,
          });

          if (status === SYNCED) {
            updateCount({ type: PENDING_DATA_UPLOAD, count: 'decrement' })(dispatch);
            updateCount({ type: 'upload', count: 'decrement' })(dispatch);
            updateProgressCount({ count: 'decrement' })(dispatch);
          } else if (status === PENDING_DATA_UPLOAD) {
            if (count) {
              updateProgressCount({ count: count })(dispatch);
            } else {
              updateCount({ type: PENDING_DATA_UPLOAD, count: 'increment' })(dispatch);
            }
          } else if (status === DATA_UPLOAD_START) {
            updateProgressCount({ count: count })(dispatch);
          }
          resolve();
        });
      })
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
        let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
        const isPending = inventory.status === PENDING_DATA_UPLOAD;
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
          updateCount({ type: PENDING_DATA_UPLOAD, count: 'decrement' })(dispatch);
        }
        resolve(true);
      })
      .catch(err => {
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
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let allInventory = realm.objects('Inventory').filtered('status == "SYNCED"');
          realm.delete(allInventory);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: 'Successfully deleted all uploaded inventories',
          });

          resolve();
        });
      })
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          let polygons = inventory.polygons;
          let polygonsTemp = [];

          polygonsTemp = polygons.map(onePolygon => {
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
      .catch(err => {
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
      .then(realm => {
        realm.write(() => {
          let polygons = [];
          geoJSON.features.map(onePolygon => {
            let onePolygonTemp = {};
            onePolygonTemp.isPolygonComplete = onePolygon.properties.isPolygonComplete || false;
            let coordinates = [];
            onePolygon.geometry.coordinates.map(coordinate => {
              coordinates.push({
                longitude: coordinate[0],
                latitude: coordinate[1],
                currentloclat: currentCoords?.latitude || 0,
                currentloclong: currentCoords?.longitude || 0,
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
      .catch(err => {
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
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', inventory_id);
          inventory.polygons = [
            {
              coordinates: [
                {
                  latitude: markedCoords[1],
                  longitude: markedCoords[0],
                  currentloclat: locateTree === OFF_SITE ? markedCoords[1] : currentCoords.latitude,
                  currentloclong:
                    locateTree === OFF_SITE ? markedCoords[0] : currentCoords.longitude,
                  isImageUploaded: false,
                },
              ],
              isPolygonComplete: true,
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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
      .then(realm => {
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
      .catch(err => {
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

export const addInventoryToDB = inventoryFromServer => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let species = [];
          let coordinates = [];
          const samplePlantLocations = [];

          if (!inventoryFromServer.id) {
            resolve(false);
            return;
          }

          //for single tree
          if (inventoryFromServer.type === 'single') {
            if (inventoryFromServer.scientificSpecies) {
              let specie = realm.objectForPrimaryKey(
                'ScientificSpecies',
                `${inventoryFromServer.scientificSpecies}`,
              );
              let aliases = specie.aliases || specie.scientificName;
              let treeCount = parseInt(1);
              let id = inventoryFromServer.scientificSpecies;
              species.push({ aliases, treeCount, id });
            } else {
              species.push({ aliases: 'Unknown', treeCount: parseInt(1), id: 'unknown' });
            }
          }
          //for multiple trees
          else if (inventoryFromServer.type == 'multi') {
            for (const plantedSpecie of inventoryFromServer.plantedSpecies) {
              let id;
              let specie;
              let aliases;
              let treeCount = plantedSpecie.treeCount;
              if (plantedSpecie.scientificSpecies && !plantedSpecie.otherSpecies) {
                id = plantedSpecie.scientificSpecies;
                specie = realm.objectForPrimaryKey('ScientificSpecies', `${id}`);
                aliases = specie.aliases || specie.scientificName;
              } else {
                id = 'unknown';
                aliases = 'Unknown';
              }
              species.push({ aliases, treeCount, id });
            }

            for (const sample of inventoryFromServer.samplePlantLocations) {
              samplePlantLocations.push(getFormattedSampleData(sample));
            }
          } else {
            dbLog.warn({
              logType: LogTypes.INVENTORY,
              message: 'Tree type does not match with single or multi',
            });
            resolve(false);
            return;
          }

          // if registration is SINGLE or geometry type is Point then [numberOfIterations = 1] else length of coordinates
          const numberOfIterations =
            inventoryFromServer.type === MULTI && inventoryFromServer.geometry.type === 'Polygon'
              ? inventoryFromServer.geometry.coordinates[0].length
              : 1;

          for (let index = 0; index < numberOfIterations; index++) {
            let coordinate;
            if (
              inventoryFromServer.type === MULTI &&
              inventoryFromServer.geometry.type === 'Polygon'
            ) {
              coordinate = inventoryFromServer.geometry.coordinates[0][index];
            } else {
              coordinate = inventoryFromServer.geometry.coordinates;
            }
            const latitude = coordinate[1];
            const longitude = coordinate[0];
            const currentloclat = inventoryFromServer.deviceLocation.coordinates[1];
            const currentloclong = inventoryFromServer.deviceLocation.coordinates[0];
            const cdnImageUrl =
              inventoryFromServer.geometry.coordinates[0].length - 1
                ? inventoryFromServer.coordinates[0].image
                : inventoryFromServer.coordinates[index].image;

            coordinates.push({
              latitude,
              longitude,
              currentloclat,
              currentloclong,
              cdnImageUrl,
              isImageUploaded: true,
            });
          }

          const additionalDetails = getFormattedAdditionalDetails(inventoryFromServer.metadata);
          let appMetadata;
          if (inventoryFromServer?.metadata?.app) {
            appMetadata = JSON.stringify(inventoryFromServer.metadata.app);
          }

          let originalGeometry = '';

          if (
            (inventoryFromServer?.originalGeometry &&
              Array.isArray(inventoryFromServer?.originalGeometry?.coordinates) &&
              inventoryFromServer?.originalGeometry?.type === 'Point' &&
              inventoryFromServer?.originalGeometry?.coordinates.length === 2) ||
            (inventoryFromServer?.originalGeometry?.type === 'Polygon' &&
              inventoryFromServer?.originalGeometry?.coordinates.length > 0)
          ) {
            originalGeometry = JSON.stringify(inventoryFromServer.originalGeometry);
          }

          let inventoryID = `${new Date().getTime()}`;
          const inventoryData = {
            inventory_id: inventoryID,
            plantation_date: new Date(inventoryFromServer.plantDate.split(' ')[0]),
            treeType: inventoryFromServer.type,
            status: SYNCED,
            projectId: inventoryFromServer.plantProject,
            locateTree: inventoryFromServer.captureMode,
            lastScreen:
              inventoryFromServer.type === SINGLE ? 'SingleTreeOverview' : 'InventoryOverview',
            species: species,
            polygons: [{ isPolygonComplete: true, coordinates }],
            specieDiameter:
              inventoryFromServer.type === SINGLE || inventoryFromServer.type === SAMPLE
                ? inventoryFromServer.measurements.height
                : null,
            specieHeight:
              inventoryFromServer.type === SINGLE || inventoryFromServer.type === SAMPLE
                ? inventoryFromServer.measurements.width
                : null,
            tagId: inventoryFromServer.tag,
            registrationDate: new Date(inventoryFromServer.registrationDate.split(' ')[0]),
            sampleTreesCount: samplePlantLocations.length,
            sampleTrees: samplePlantLocations,
            completedSampleTreesCount: samplePlantLocations.length,
            uploadedSampleTreesCount: samplePlantLocations.length,
            locationId: inventoryFromServer.id,
            additionalDetails,
            appMetadata,
            hid: inventoryFromServer.hid,
            originalGeometry,
          };
          realm.create('Inventory', inventoryData);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.INVENTORY,
            message: `Inventory added with location id: ${inventoryFromServer.id}`,
          });
          resolve(inventoryData);
        });
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while adding inventory with location id: ${inventoryFromServer.id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

const getFormattedSampleData = sample => {
  let appMetadata;
  if (sample?.metadata?.app) {
    appMetadata = JSON.stringify(sample.metadata.app);
  }

  const sampleTreeData = {
    latitude: sample.geometry.coordinates[1],
    longitude: sample.geometry.coordinates[0],
    deviceLatitude: sample.deviceLocation.coordinates[1],
    deviceLongitude: sample.deviceLocation.coordinates[0],
    cdnImageUrl: sample.coordinates[0].image,
    specieId: sample.scientificSpecies || 'unknown',
    specieName: sample.scientificName || 'Unknown',
    specieDiameter: sample.measurements.width,
    specieHeight: sample.measurements.height,
    hid: sample.hid,
    tagId: sample.tag,
    status: SYNCED,
    plantationDate: new Date(sample.plantDate.split(' ')[0]),
    locationId: sample.id,
    treeType: SAMPLE,
    additionalDetails: getFormattedAdditionalDetails(sample.metadata),
    appMetadata,
  };
  return sampleTreeData;
};

export const addCdnUrl = ({
  inventoryID,
  coordinateIndex,
  cdnImageUrl,
  locationId,
  isSampleTree,
}) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventoryID}`);
          if (!isSampleTree) {
            inventory.polygons[0].coordinates[coordinateIndex].cdnImageUrl = cdnImageUrl;
            inventory.polygons[0].coordinates[coordinateIndex].isImageUploaded = true;
          }
          resolve();
        });
      })
      .catch(err => {
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while adding app CDN image url for inventory_id: ${inventoryID}, locationId: ${locationId} & coordinate index: ${coordinateIndex}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const removeImageUrl = ({ inventoryId, coordinateIndex, sampleTreeId, sampleTreeIndex }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema()).then(realm => {
      realm.write(async () => {
        let inventory = realm.objectForPrimaryKey('Inventory', `${inventoryId}`);
        if (!sampleTreeId && inventory.polygons[0].coordinates[coordinateIndex].imageUrl) {
          inventory.polygons[0].coordinates[coordinateIndex].imageUrl = '';
        } else if (sampleTreeId) {
          inventory.sampleTrees[sampleTreeIndex].imageUrl = '';
        }
        resolve();
      });
    });
  });
};

export const addAppMetadata = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then(realm => {
        let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
        appAdditionalDataForAPI({
          data: inventory,
        }).then(appAdditionalDetails => {
          realm.write(() => {
            inventory.appMetadata = JSON.stringify(appAdditionalDetails);

            dbLog.info({
              logType: LogTypes.INVENTORY,
              message: `Successfully added app metadata in additional details for inventory_id: ${inventory_id}`,
            });
            resolve();
          });
        });
        // logging the success in to the db
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while adding app metadata in additional details for inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        reject(err);
      });
  });
};

export const changeSampleTreesStatusToPendingUpload = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          if (inventory?.sampleTrees) {
            for (const sampleTreeIndex in inventory.sampleTrees) {
              inventory.sampleTrees[sampleTreeIndex].status = PENDING_DATA_UPLOAD;
            }
            // logging the success in to the db
            dbLog.info({
              logType: LogTypes.INVENTORY,
              message: `Successfully changed sample trees status to PENDING_DATA_UPLOAD inventory_id: ${inventory_id}`,
              referenceId: inventory_id,
            });
          }
          resolve();
        });
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while changing sample trees status to PENDING_DATA_UPLOAD inventory_id: ${inventory_id}`,
          logStack: JSON.stringify(err),
          referenceId: inventory_id,
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const deleteSyncedAndMigrate = (oldRealm, newRealm, schemaVersion) => {
  if (oldRealm.schemaVersion < schemaVersion) {
    const oldInventoryObject = oldRealm.objects('Inventory');
    const newInventoryObject = newRealm.objects('Inventory');

    const syncedInventoriesIndexToDelete = [];

    for (const index in oldInventoryObject) {
      if (oldInventoryObject[index].status === SYNCED) {
        syncedInventoriesIndexToDelete.push(index);
      }
    }

    // delete all the synced inventory objects;
    for (let i = syncedInventoriesIndexToDelete.length - 1; i >= 0; i--) {
      newRealm.delete(newInventoryObject[syncedInventoriesIndexToDelete[i]]);
    }
  }
};

export const getInventoryCount = (countOf = TOTAL_COUNT) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        let inventory = realm.objects('Inventory').filtered('status != null');

        let status = [];
        if (countOf === PENDING_UPLOAD_COUNT) {
          status = getPendingStatus();
        } else if (countOf === INCOMPLETE_COUNT) {
          status = getIncompleteStatus();
        }
        if (status.length !== 0) {
          var query = 'status == ';
          for (var i = 0; i < status.length; i++) {
            query += `'${status[i]}'`;
            if (i + 1 < status.length) {
              query += ' || status == ';
            }
          }
          inventory = inventory.filtered(query);
        }
        const inventoryCount = inventory.length;
        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.INVENTORY,
          message: `Fetched inventory count for ${countOf} from DB`,
        });
        resolve(inventoryCount);
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: `Error while fetching inventory count for ${countOf} from DB`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
      });
  });
};

export const updateMissingDataStatus = () => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema()).then(realm => {
      realm.write(async () => {
        checkAndMarkMissingData({ oldRealm: realm });
        resolve();
      });
    });
  });
};

export const updateMissingStatusOfSingleInventory = inventoryId => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema()).then(realm => {
      realm.write(async () => {
        const inventory = realm.objectForPrimaryKey('Inventory', `${inventoryId}`);
        if (inventory) {
          const result = await updateSingleInventoryMissingStatus(inventory, inventory);
          resolve(result);
        } else {
          resolve();
        }
      });
    });
  });
};
