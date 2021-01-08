import { APIConfig } from './Config';
import axios from 'axios';
import {
  getAllInventoryByStatus,
  changeInventoryStatus,
  changeInventoryStatusAndResponse,
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
import { LocalInventoryActions } from './Action';
import getSessionData from '../Utils/sessionId';

const { protocol, url } = APIConfig;

const uploadInventory = (dispatch) => {
  const changeStatusAndUpload = async (data, oneInventory, userToken, sessionData) => {
    return new Promise(async (resolve, reject) => {
      let response = data.data;
      if (oneInventory.locate_tree == 'off-site') {
        await changeInventoryStatus(
          { inventory_id: oneInventory.inventory_id, status: 'complete' },
          dispatch,
        );
        resolve();
      } else {
        const stringifiedResponse = JSON.stringify(response);
        await changeInventoryStatusAndResponse(
          {
            inventory_id: oneInventory.inventory_id,
            status: 'uploading',
            response: stringifiedResponse,
          },
          dispatch,
        )
          .then(() => {
            console.log('\n\n');
            console.log('============= Starting image upload =============');
            console.log('\n\n');
            uploadImage(oneInventory, response, userToken, sessionData, dispatch)
              .then(() => {
                console.log('\n\n');
                console.log('============= Image upload complete =============');
                console.log('\n\n');
                changeInventoryStatus(
                  {
                    inventory_id: oneInventory.inventory_id,
                    status: 'complete',
                  },
                  dispatch,
                )
                  .then(() => resolve())
                  .catch((err) => {
                    console.error(err);
                    reject();
                  });
              })
              .catch((err) => {
                reject();
                console.error('Error:', err);
              });
          })
          .catch((err) => {
            reject();
            console.error('Error:', err);
          });
      }
    });
  };
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
              async (position) => {
                let currentCoords = position.coords;
                const pendingInventory = await getAllInventoryByStatus('pending');
                const uploadingInventory = await getAllInventoryByStatus('uploading');
                let inventoryData = [...pendingInventory, ...uploadingInventory];
                let coordinates = [];
                let species = [];
                inventoryData = Object.values(inventoryData);
                dispatch(LocalInventoryActions.updateUploadCount('custom', inventoryData.length));
                dispatch(LocalInventoryActions.updateIsUploading(true));
                for (let i = 0; i < inventoryData.length; i++) {
                  const oneInventory = inventoryData[i];
                  let polygons = Object.values(oneInventory.polygons);
                  const onePolygon = polygons[0];
                  let coords = Object.values(onePolygon.coordinates);
                  coordinates = coords.map((x) => [x.longitude, x.latitude]);
                  if (oneInventory.tree_type == 'single') {
                    species = [{ otherSpecies: String(oneInventory.specei_name), treeCount: 1 }];
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
                      type: 'Point',
                    },
                    geometry: {
                      type: coordinates.length > 1 ? 'Polygon' : 'Point',
                      coordinates: coordinates.length > 1 ? [coordinates] : coordinates[0],
                    },
                    plantDate: new Date().toISOString(),
                    registrationDate: new Date().toISOString(),
                    plantProject: null,
                    plantedSpecies: species,
                  };
                  getSessionData().then(async (sessionData) => {
                    if (oneInventory.response !== null && oneInventory.status === 'uploading') {
                      await changeStatusAndUpload(
                        { data: JSON.parse(oneInventory.response) },
                        oneInventory,
                        userToken,
                        sessionData,
                      )
                        .then(() => {
                          if (inventoryData.length - 1 === i) {
                            dispatch(LocalInventoryActions.updateIsUploading(false));
                            resolve();
                          }
                        })
                        .catch((err) => {
                          console.error(err);
                        });
                    } else {
                      console.log('\n\n');
                      console.log('============= Starting data upload =============');
                      console.log('\n\n');
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
                        .then(async (data) => {
                          await changeStatusAndUpload(data, oneInventory, userToken, sessionData)
                            .then(() => {
                              if (inventoryData.length - 1 === i) {
                                dispatch(LocalInventoryActions.updateIsUploading(false));
                                resolve();
                              }
                            })
                            .catch((err) => {
                              console.error(err);
                            });
                        })
                        .catch((err) => {
                          console.error('error =>', err);
                          alert('There is something wrong');
                          reject();
                        });
                    }
                  });
                }
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

const uploadImage = (oneInventory, response, userToken, sessionId, dispatch) => {
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
            aliases,
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
          },
        })
          .then((res) => {
            const { data, status } = res;
            // console.log(res, 'res');
            if (status === 200) {
              // console.log(data, 'search');
              resolve(data);
            }
          })
          .catch((err) => {
            reject(err);
            console.log(err, 'error');
          });
      });
    });
  });
};

export { uploadInventory, createSpecies, UpdateSpecies, UpdateSpeciesImage, SpeciesListData };
