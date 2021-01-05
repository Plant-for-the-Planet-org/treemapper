import { APIConfig } from './Config';
import axios from 'axios';
import {
  getAllPendingInventory,
  statusToComplete,
} from './';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
} from './Schemas';
import Realm from 'realm';
import Geolocation from '@react-native-community/geolocation';
import RNFS from 'react-native-fs';
import getSessionData from '../Utils/sessionId';
import i18next from 'i18next';

const { protocol, url } = APIConfig;

const uploadInventory = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const User = realm.objectForPrimaryKey('User', 'id0001');
          let userToken = User.accessToken;
          try {
            Geolocation.getCurrentPosition(
              (position) => {
                let currentCoords = position.coords;
                getAllPendingInventory()
                  .then(async (allPendingInventory) => {
                    let coordinates = [];
                    let species = [];
                    allPendingInventory = Object.values(allPendingInventory);
                    for (let i = 0; i < allPendingInventory.length; i++) {
                      const oneInventory = allPendingInventory[i];
                      let polygons = Object.values(oneInventory.polygons);
                      const onePolygon = polygons[0];
                      let coords = Object.values(onePolygon.coordinates);
                      coordinates = coords.map((x) => [x.longitude, x.latitude]);
                      if (oneInventory.tree_type == 'single') {
                        species = [
                          { otherSpecies: String(oneInventory.specei_name), treeCount: 1 },
                        ];
                      } else {
                        species = Object.values(oneInventory.species).map((x) => ({
                          otherSpecies: x.nameOfTree,
                          treeCount: Number(x.treeCount),
                        }));
                      }
                      let body = {
                        captureMode: oneInventory.locate_tree,
                        deviceLocation: {
                          coordinates: [currentCoords.longitude, currentCoords.latitude],
                          type: i18next.t('label.tree_inventory_point'),
                        },
                        geometry: {
                          type: coordinates.length > 1 ? i18next.t('label.tree_inventory_polygon') : i18next.t('label.tree_inventory_point'),
                          coordinates: coordinates.length > 1 ? [coordinates] : coordinates[0],
                        },
                        plantDate: new Date().toISOString(),
                        plantProject: null,
                        plantedSpecies: species,
                      };
                      getSessionData().then( async (sessionData) => {
                        await axios({
                          method: 'POST',
                          url: `${protocol}://${url}/treemapper/plantLocations`,
                          data: body,
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `OAuth ${userToken}`,
                            'x-session-id': sessionData,
                          },
                        })
                          .then((data) => {
                            let response = data.data;
                            if (oneInventory.locate_tree == 'off-site') {
                              statusToComplete({ inventory_id: oneInventory.inventory_id });
                              if (allPendingInventory.length - 1 == i) {
                                resolve();
                              }
                            } else {
                              uploadImage(oneInventory, response, userToken, sessionData).then(() => {
                                statusToComplete({ inventory_id: oneInventory.inventory_id });
                                if (allPendingInventory.length - 1 == i) {
                                  resolve();
                                }
                              });
                            }
                          })
                          .catch((err) => {
                            console.log('EEORR =', err);
                            alert('There is something wrong');
                            reject();
                          });
                      });
                    }
                  })
                  .catch((err) => {});
              },
              (err) => alert(err.message),
            );
          } catch (err) {
            reject();
            alert('Unable to retrive location');
          }
        });
      })
      .catch((err) => {});
  });
};

const uploadImage = (oneInventory, response, userToken, sessionId) => {
  return new Promise(async (resolve, reject) => {
    let locationId = response.id;
    let coordinatesList = Object.values(oneInventory.polygons[0].coordinates);
    let responseCoords = response.coordinates;
    for (let i = 0; i < responseCoords.length; i++) {
      const oneResponseCoords = responseCoords[i];
      let inventoryObject = coordinatesList[oneResponseCoords.coordinateIndex];
      await RNFS.readFile(inventoryObject.imageUrl, 'base64').then(async (base64) => {
        let body = {
          imageFile: `data:image/png;base64,${base64}`,
        };
        let headers = {
          'Content-Type': 'application/json',
          Authorization: `OAuth ${userToken}`,
          'x-session-id': sessionId,
        };

        await axios({
          method: 'PUT',
          url: `${protocol}://${url}/treemapper/plantLocations/${locationId}/coordinates/${oneResponseCoords.id}`,
          data: body,
          headers: headers,
        })
          .then((res) => {
            resolve();
          })
          .catch((err) => {
            reject();
          });
      });
    }
  });
};

const createSpecies = (image, scientificSpecies, aliases) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const createSpeciesUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = createSpeciesUser.accessToken;
        console.log(userToken, 'token');
        await RNFS.readFile(image, 'base64').then(async (base64) => {
          let body = {
            imageFile: `data:image/jpeg;base64,${base64}`,
            scientificSpecies,
            aliases
          };
          await axios({
            method: 'POST',
            url: `${protocol}://${url}/treemapper/species`,
            data: body,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `OAuth ${userToken}`,
            },
          })
            .then((res) => {
              const { status, data } = res;
              console.log(res, 'data');
              if (status === 200) {
                console.log(res, 'res');
                // updateStatusForUserSpecies({ id: speciesId });
                resolve(data);
              }
            })
            .catch((err) => {
              console.log(err, 'create error');
              reject(err);
            });
        });
      });
    });
  });
};
const UpdateSpecies = (aliases, speciesId) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const UpdateSpeciesUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = UpdateSpeciesUser.accessToken;
        console.log(userToken, speciesId);
        // await RNFS.readFile(image, 'base64').then(async (base64) => {
        let body = {
          // imageFile: `data:image/jpeg;base64,${base64}`,
          aliases,
        };
        await axios({
          method: 'PUT',
          url: `${protocol}://${url}/treemapper/species/${speciesId}`,
          data: body,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `OAuth ${userToken}`,
          },
        })
          .then((res) => {
            const { status } = res;
            //console.log(res, 'data');
            if (status === 200) {
              console.log(res, 'res');
              // updateStatusForUserSpecies({ id: speciesId });
              resolve(true);
            }
          })
          .catch((err) => {
            console.log(err, 'create error');
            reject(err);
          });
        // });
      });
    });
  });
};
const UpdateSpeciesImage = (image, speciesId) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const UpdateSpeciesImageUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = UpdateSpeciesImageUser.accessToken;
        await RNFS.readFile(image, 'base64').then(async (base64) => {
          let body = {
            imageFile: `data:image/jpeg;base64,${base64}`,
          };
          await axios({
            method: 'PUT',
            url: `${protocol}://${url}/treemapper/species/${speciesId}`,
            data: body,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `OAuth ${userToken}`,
            },
          })
            .then((res) => {
              const { status, data } = res;
              console.log(res, data);
              if (status === 200) {
                console.log(res, 'res');
                // updateStatusForUserSpecies({ id: speciesId });
                resolve(true);
              }
            })
            .catch((err) => {
              console.log(err, 'create error');
              reject(err);
            });
        });
      });
    });
  });
};

const SpeciesListData = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const SpeciesListDataUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = SpeciesListDataUser.accessToken;
        console.log(userToken, 'list');
        axios({
          method: 'GET',
          url: `${protocol}://${url}/treemapper/species`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `OAuth ${userToken}`,
          }
        })
          .then((res) => {
            const {
              data,
              status
            } = res;
            // console.log(res, 'res');
            if (status === 200) {
            // console.log(data, 'search');
              resolve(data);
            }
          }).catch((err) => {
            reject(err);
            console.log(err, 'error');
          });
      });
    });
  });
};

export { uploadInventory, createSpecies, UpdateSpecies, UpdateSpeciesImage, SpeciesListData };
