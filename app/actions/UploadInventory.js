import { APIConfig } from './Config';
import axios from 'axios';
import {
  getInventoryByStatus,
  changeInventoryStatusAndResponse,
  changeInventoryStatus,
} from '../repositories/inventory';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
} from '../repositories/schema';
import Realm from 'realm';
import Geolocation from '@react-native-community/geolocation';
import RNFS from 'react-native-fs';
import getSessionData from '../utils/sessionId';
import i18next from 'i18next';
import { updateCount, updateIsUploading } from './inventory';

const { protocol, url } = APIConfig;

export const changeStatusAndUpload = async (
  response,
  oneInventory,
  userToken,
  sessionData,
  dispatch,
) => {
  return new Promise((resolve, reject) => {
    try {
      if (oneInventory.locate_tree == 'off-site') {
        changeInventoryStatus(
          { inventory_id: oneInventory.inventory_id, status: 'complete' },
          dispatch,
        ).then(() => resolve());
      } else {
        const stringifiedResponse = JSON.stringify(response);
        changeInventoryStatusAndResponse(
          {
            inventory_id: oneInventory.inventory_id,
            status: 'uploading',
            response: stringifiedResponse,
          },
          dispatch,
        )
          .then(async () => {
            const result = await uploadImage(oneInventory, response, userToken, sessionData);
            if (result.allUploadCompleted) {
              changeInventoryStatus(
                {
                  inventory_id: oneInventory.inventory_id,
                  status: 'complete',
                },
                dispatch,
              )
                .then(() => resolve())
                .catch((err) => {
                  console.error(
                    `Error at: /action/upload/changeInventoryStatus, -> ${JSON.stringify(err)}`,
                  );
                  reject();
                });
            }
          })
          .catch((err) => {
            reject();
            console.error(
              `Error at: /action/upload/changeInventoryStatusAndResponse, -> ${JSON.stringify(
                err,
              )}`,
            );
          });
      }
    } catch (err) {
      reject();
      console.error(`Error at: /action/upload/changeStatusAndUpload, -> ${JSON.stringify(err)}`);
    }
  });
};
export const uploadInventory = (dispatch) => {
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
                const pendingInventory = await getInventoryByStatus('pending');
                const uploadingInventory = await getInventoryByStatus('uploading');
                let inventoryData = [...pendingInventory, ...uploadingInventory];
                let coordinates = [];
                let species = [];
                inventoryData = Object.values(inventoryData);
                updateCount({ type: 'upload', count: inventoryData.length })(dispatch);
                updateIsUploading(true)(dispatch);
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
                      type: i18next.t('label.tree_inventory_point'),
                    },
                    geometry: {
                      type:
                        coordinates.length > 1
                          ? i18next.t('label.tree_inventory_polygon')
                          : i18next.t('label.tree_inventory_point'),
                      coordinates: coordinates.length > 1 ? [coordinates] : coordinates[0],
                    },
                    plantDate: new Date().toISOString(),
                    registrationDate: new Date().toISOString(),
                    plantProject: null,
                    plantedSpecies: species,
                  };
                  await getSessionData()
                    .then(async (sessionData) => {
                      if (oneInventory.response !== null && oneInventory.status === 'uploading') {
                        const inventoryResponse = JSON.parse(oneInventory.response);
                        try {
                          const response = await getPlantLocationDetails(
                            inventoryResponse.id,
                            userToken,
                          );
                          await changeStatusAndUpload(
                            response,
                            oneInventory,
                            userToken,
                            sessionData,
                            dispatch,
                          );
                          if (inventoryData.length - 1 === i) {
                            updateIsUploading(false)(dispatch);
                            resolve();
                          }
                        } catch (err) {
                          if (inventoryData.length - 1 === i) {
                            updateIsUploading(false)(dispatch);
                            reject();
                          }
                          console.error(err);
                        }
                      } else {
                        try {
                          const data = await axios({
                            method: 'POST',
                            url: `${protocol}://${url}/treemapper/plantLocations`,
                            data: body,
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `OAuth ${userToken}`,
                              'x-session-id': sessionData,
                            },
                          });
                          if (data && data.data) {
                            await changeStatusAndUpload(
                              data.data,
                              oneInventory,
                              userToken,
                              sessionData,
                              dispatch,
                            )
                              .then(() => {
                                if (inventoryData.length - 1 === i) {
                                  updateIsUploading(false)(dispatch);
                                  resolve();
                                }
                              })
                              .catch((err) => {
                                if (inventoryData.length - 1 === i) {
                                  updateIsUploading(false)(dispatch);
                                  reject(err);
                                }
                                console.error(
                                  `Error at: /action/upload, changeStatusAndUpload -> ${JSON.stringify(
                                    err,
                                  )}`,
                                );
                              });
                          } else {
                            if (inventoryData.length - 1 === i) {
                              updateIsUploading(false)(dispatch);
                              reject(false);
                            }
                          }
                        } catch (err) {
                          if (inventoryData.length - 1 === i) {
                            updateIsUploading(false)(dispatch);
                            reject(err);
                          }
                          console.error(
                            `Error at: /action/upload, POST - /treemapper/plantLocations -> ${JSON.stringify(
                              err,
                            )}`,
                          );
                        }
                      }
                    })
                    .catch((err) => {
                      if (inventoryData.length - 1 === i) {
                        updateIsUploading(false)(dispatch);
                        reject(err);
                      }
                      console.error(
                        `Error at: /action/upload, getSessionData -> ${JSON.stringify(err)}`,
                      );
                    });
                }
              },
              (err) => alert(err.message),
            );
          } catch (err) {
            reject(err);
            alert('Unable to retrieve location');
          }
        });
      })
      .catch((err) => {});
  });
};

export const uploadImage = async (oneInventory, response, userToken, sessionId) => {
  let locationId = response.id;
  let coordinatesList = Object.values(oneInventory.polygons[0].coordinates);
  let responseCoords = response.coordinates;
  let completedUploadCount = 0;
  for (let i = 0; i < responseCoords.length; i++) {
    const oneResponseCoords = responseCoords[i];

    if (oneResponseCoords.status === 'complete') {
      completedUploadCount++;
      continue;
    }
    let inventoryObject = coordinatesList[oneResponseCoords.coordinateIndex];

    const bas64Image = await RNFS.readFile(inventoryObject.imageUrl, 'base64');

    let body = {
      imageFile: `data:image/png;base64,${bas64Image}`,
    };
    let headers = {
      'Content-Type': 'application/json',
      Authorization: `OAuth ${userToken}`,
      'x-session-id': sessionId,
    };
    try {
      const result = await axios({
        method: 'PUT',
        url: `${protocol}://${url}/treemapper/plantLocations/${locationId}/coordinates/${oneResponseCoords.id}`,
        data: body,
        headers: headers,
      });

      if (result.status === 200) {
        completedUploadCount++;
      }
    } catch (err) {
      console.error(
        `Error at: action/upload/uploadImage, PUT: ${locationId}/coordinates/${
          oneResponseCoords.id
        } -> ${JSON.stringify(err)}`,
      );
    }
  }
  return { allUploadCompleted: completedUploadCount === responseCoords.length };
};

export const createSpecies = (scientificSpecies, aliases) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const createSpeciesUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = createSpeciesUser.accessToken;
        // await RNFS.readFile(image, 'base64').then(async (base64) => {
        let body = {
          // imageFile: `data:image/jpeg;base64,${base64}`,
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

            if (status === 200) {
              resolve(data);
            }
          })
          .catch((err) => {
            console.error(err, 'create error');
            reject(err);
          });
      });
    });
  });
  // });
};

export const UpdateSpecies = (aliases, speciesId) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const UpdateSpeciesUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = UpdateSpeciesUser.accessToken;

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

            if (status === 200) {
              resolve(true);
            }
          })
          .catch((err) => {
            console.error(err, 'create error');
            reject(err);
          });
        // });
      });
    });
  });
};
export const UpdateSpeciesImage = (image, speciesId) => {
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

              if (status === 200) {
                resolve(true);
              }
            })
            .catch((err) => {
              console.error(err, 'create error');
              reject(err);
            });
        });
      });
    });
  });
};

export const SpeciesListData = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      realm.write(async () => {
        const SpeciesListDataUser = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = SpeciesListDataUser.accessToken;

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

            if (status === 200) {
              resolve(data);
            }
          })
          .catch((err) => {
            reject(err);
            console.error(err, 'error');
          });
      });
    });
  });
};

export const getPlantLocationDetails = (locationId, userToken) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'GET',
      url: `${protocol}://${url}/treemapper/plantLocations/${locationId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `OAuth ${userToken}`,
      },
    })
      .then((res) => {
        const { data, status } = res;
        if (status === 200) {
          resolve(data);
        }
      })
      .catch((err) => {
        reject(err);
        console.error(err, 'error');
      });
  });
};
