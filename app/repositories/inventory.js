import Realm from 'realm';
import { Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies } from './schema';
import { bugsnag } from '../utils';
import { updateCount, setInventoryId } from '../actions/inventory';
import { INCOMPLETE_INVENTORY } from '../utils/inventoryStatuses';

export const updateSpecieDiameter = ({ inventory_id, speciesDiameter }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.species_diameter = Math.round(speciesDiameter * 100) / 100;
        });
        resolve();
      })
      .catch(bugsnag.notify);
  });
};

export const updateSpecieHeight = ({ inventory_id, speciesHeight }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.species_height = Math.round(speciesHeight * 100) / 100;
          resolve(console.log('updated', inventory));
        });
      })
      .catch(bugsnag.notify);
  });
};

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

export const initiateInventory = ({ treeType }, dispatch) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventoryID = `${new Date().getTime()}`;
          const inventoryData = {
            inventory_id: inventoryID,
            tree_type: treeType,
            status: INCOMPLETE_INVENTORY,
            plantation_date: `${new Date().getTime()}`,
            last_screen: treeType === 'single' ? 'RegisterSingleTree' : 'LocateTree',
          };
          realm.create('Inventory', inventoryData);
          setInventoryId(inventoryID)(dispatch);
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
            updateCount({ type: 'pending', count: 'decrement' })(dispatch);
            updateCount({ type: 'upload', count: 'decrement' })(dispatch);
          } else if (status === 'pending') {
            updateCount({ type: 'pending', count: 'increment' })(dispatch);
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
            updateCount({ type: 'pending', count: 'decrement' })(dispatch);
            updateCount({ type: 'upload', count: 'decrement' })(dispatch);
          } else if (status === 'pending') {
            updateCount({ type: 'pending', count: 'increment' })(dispatch);
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
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.specei_name = speciesText;
        });
        resolve();
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const deleteInventory = ({ inventory_id }, dispatch) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          realm.delete(inventory);
        });
        if (dispatch) {
          updateCount({ type: 'pending', count: 'decrement' })(dispatch);
        }
        resolve(true);
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const updatePlantingDate = ({ inventory_id, plantation_date }) => {
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
              plantation_date,
            },
            'modified',
          );
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const updateLastScreen = ({ last_screen, inventory_id }) => {
  console.log('updateLastScreen =>', last_screen, inventory_id);
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
              last_screen: last_screen,
            },
            'modified',
          );
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const clearAllIncompleteInventory = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let allInventory = realm
            .objects('Inventory')
            .filtered(`status == "${INCOMPLETE_INVENTORY}"`);
          realm.delete(allInventory);
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const clearAllUploadedInventory = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let allInventory = realm.objects('Inventory').filtered('status == "complete"');
          realm.delete(allInventory);
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const updateSpecieAndSpecieDiameter = ({ inventory_id, specie_name, diameter, height }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.species_diameter = Number(diameter);
          inventory.species_height = Number(height);
          inventory.specei_name = specie_name;
        });
        resolve();
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const removeLastCoord = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          let polygons = Object.values(JSON.parse(JSON.stringify(inventory.polygons)));
          let coords = Object.values(polygons[polygons.length - 1].coordinates);
          coords = coords.slice(0, coords.length - 1);
          polygons[polygons.length - 1].coordinates = coords;
          inventory.polygons = polygons;
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const getCoordByIndex = ({ inventory_id, index }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          let polygons = Object.values(JSON.parse(JSON.stringify(inventory.polygons)));
          let coords = Object.values(polygons[0].coordinates);
          let coordsLength = coords.length;
          resolve({ coordsLength, coord: coords[index] });
        });
      })
      .catch(bugsnag.notify);
  });
};

export const insertImageAtIndexCoordinate = ({ inventory_id, imageUrl, index }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          let polygons = Object.values(JSON.parse(JSON.stringify(inventory.polygons)));
          let polygonsTemp = [];
          let coordinatesTemp = [];

          polygonsTemp = polygons.map((onePolygon, i) => {
            let coords = Object.values(onePolygon.coordinates);
            coords[index].imageUrl = imageUrl;
            return { isPolygonComplete: onePolygon.isPolygonComplete, coordinates: coords };
          });
          inventory.polygons = polygonsTemp;

          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const addCoordinates = ({ inventory_id, geoJSON, currentCoords }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let polygons = [];
          geoJSON.features.map((onePolygon) => {
            let onePolygonTemp = {};
            onePolygonTemp.isPolygonComplete = onePolygon.properties.isPolygonComplete || false;
            let coordinates = [];
            onePolygon.geometry.coordinates.map((oneLatlong) => {
              coordinates.push({
                longitude: oneLatlong[0],
                latitude: oneLatlong[1],
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
          resolve();
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
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
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
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
            },
          ];
          inventory.species_diameter = 10;
          if (locateTree) {
            inventory.locate_tree = locateTree;
          }
          inventory.plantation_date = `${Date.now()}`;
          resolve();
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const insertImageSingleRegisterTree = ({ inventory_id, imageUrl }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', inventory_id);
          inventory.polygons[0].coordinates[0].imageUrl = imageUrl;
          resolve();
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const addSpeciesAction = ({ inventory_id, species, plantation_date }) => {
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
              species,
              plantation_date,
            },
            'modified',
          );
          resolve();
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const addLocateTree = ({ locate_tree, inventory_id }) => {
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
              locate_tree: locate_tree,
            },
            'modified',
          );
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const polygonUpdate = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.polygons[0].isPolygonComplete = true;
          resolve();
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const completePolygon = ({ inventory_id }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`);
          inventory.polygons[0].isPolygonComplete = true;
          inventory.polygons[0].coordinates.push(inventory.polygons[0].coordinates[0]);
          resolve();
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};
