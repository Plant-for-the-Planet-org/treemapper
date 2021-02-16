import { APIConfig } from './Config';
import axios from 'axios';
import {
  getInventoryByStatus,
  changeInventoryStatusAndResponse,
  changeInventoryStatus,
} from '../repositories/inventory';
import Geolocation from '@react-native-community/geolocation';
import RNFS from 'react-native-fs';
import getSessionData from '../utils/sessionId';
import { updateCount, updateIsUploading } from './inventory';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';
import { bugsnag } from '../utils';
import { getUserToken } from '../repositories/user';

const { protocol, url } = APIConfig;

const changeStatusAndUpload = async (response, oneInventory, userToken, sessionData, dispatch) => {
  return new Promise((resolve, reject) => {
    try {
      if (oneInventory.locate_tree == 'off-site') {
        changeInventoryStatus(
          { inventory_id: oneInventory.inventory_id, status: 'complete' },
          dispatch,
        ).then(() => {
          dbLog.info({
            logType: LogTypes.DATA_SYNC,
            message: `Successfully synced off-site inventory with id ${oneInventory.inventory_id}`,
            referenceId: oneInventory.inventory_id,
          });
          resolve();
        });
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
          .then(async (isSucceed) => {
            if (isSucceed) {
              const result = await checkAndUploadImage(
                oneInventory,
                response,
                userToken,
                sessionData,
              );
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
              } else {
                reject();
              }
            }
          })
          .catch((err) => {
            reject(err);
            console.error(
              `Error at: /action/upload/changeInventoryStatusAndResponse, -> ${JSON.stringify(
                err,
              )}`,
            );
          });
      }
    } catch (err) {
      reject(err);
      console.error(`Error at: /action/upload/changeStatusAndUpload, -> ${JSON.stringify(err)}`);
    }
  });
};

export const uploadInventory = (dispatch) => {
  return new Promise((resolve, reject) => {
    getUserToken().then((userToken) => {
      try {
        // gets the current geo location coordinate of the user and passes the position forward
        Geolocation.getCurrentPosition(
          async (position) => {
            dbLog.info({
              logType: LogTypes.DATA_SYNC,
              message: 'Fetched user current coordinates.',
              logStack: JSON.stringify(position),
            });
            // stores the current coordinates of the user
            const currentCoords = position.coords;
            // get pending inventories from realm DB
            const pendingInventory = await getInventoryByStatus('pending');
            // get inventories whose images are pending tob be uploaded from realm DB
            const uploadingInventory = await getInventoryByStatus('uploading');
            // copies pending and uploading inventory
            let inventoryData = [...pendingInventory, ...uploadingInventory];
            let coordinates = [];
            let species = [];
            // updates the count of inventories that is going to be uploaded
            updateCount({ type: 'upload', count: inventoryData.length })(dispatch);
            // changes the status of isUploading to true, to show that data started to sync
            updateIsUploading(true)(dispatch);
            // loops through the inventory data to upload the data and then the images of the same synchronously
            for (let i = 0; i < inventoryData.length; i++) {
              const oneInventory = inventoryData[i];
              let polygons = oneInventory.polygons;
              const onePolygon = polygons[0];
              let coords = onePolygon.coordinates;
              coordinates = coords.map((x) => [x.longitude, x.latitude]);
              if (oneInventory.tree_type == 'single') {
                species =
                  oneInventory.species[0].id === 'unknown' ? null : oneInventory.species[0].id;
              } else {
                species = oneInventory.species.map((x) => ({
                  otherSpecies: x.nameOfTree,
                  treeCount: Number(x.treeCount),
                }));
              }
              // prepares the body which is to be passed to api
              let body = {
                type: oneInventory.tree_type,
                captureMode: oneInventory.locate_tree,
                deviceLocation: {
                  coordinates: [currentCoords.longitude, currentCoords.latitude],
                  type: 'Point',
                },
                geometry: {
                  type: coordinates.length > 1 ? 'Polygon' : 'Point',
                  coordinates: coordinates.length > 1 ? [coordinates] : coordinates[0],
                },
                plantDate: oneInventory.plantation_date.toISOString().split('T')[0],
                registrationDate: oneInventory.registration_date.toISOString().split('T')[0],
                plantProject: null,
                measurements: {
                  height: oneInventory.species_height,
                  width: oneInventory.species_diameter,
                },
              };
              if (species) {
                body.scientificSpecies = species;
              }
              if (oneInventory.tag_id) {
                body.tag = oneInventory.tag_id;
              }
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
                      dbLog.info({
                        logType: LogTypes.DATA_SYNC,
                        message:
                          'Successfully added plant location, POST - /treemapper/plantLocation',
                        referenceId: oneInventory.inventory_id,
                      });
                    } catch (err) {
                      if (inventoryData.length - 1 === i) {
                        updateIsUploading(false)(dispatch);
                        reject(err);
                      }
                      console.error(
                        `Error at: /action/upload, POST - /treemapper/plantLocations -> ${JSON.stringify(
                          err.response,
                        )}`,
                      );
                      dbLog.error({
                        logType: LogTypes.DATA_SYNC,
                        message:
                          'Error while add plant location, POST - /treemapper/plantLocations',
                        statusCode: err?.response?.status,
                        logStack: JSON.stringify(err.response),
                      });
                    }
                  }
                })
                .catch((err) => {
                  if (inventoryData.length - 1 === i) {
                    updateIsUploading(false)(dispatch);
                    reject(err);
                  }
                  console.error(
                    `Error at: /action/upload, getSessionData -> ${JSON.stringify(err.response)}`,
                  );
                  dbLog.error({
                    logType: LogTypes.DATA_SYNC,
                    message: 'Error while getting session data',
                    statusCode: err?.response?.status,
                    logStack: JSON.stringify(err.response),
                  });
                });
            }
          },
          (err) => {
            dbLog.error({
              logType: LogTypes.DATA_SYNC,
              message: 'Error while getting current coordinates',
              logStack: JSON.stringify(err),
            });
          },
        );
      } catch (err) {
        reject(err);
        alert('Unable to retrieve location');
      }
    });
  });
};

const checkAndUploadImage = async (oneInventory, response, userToken, sessionId) => {
  try {
    let locationId = response.id;
    let coordinatesList = oneInventory.polygons[0].coordinates;
    const responseCoords = response.coordinates;
    let completedUploadCount = 0;
    for (let i = 0; i < responseCoords.length; i++) {
      const oneResponseCoords = responseCoords[i];

      if (oneResponseCoords.status === 'complete') {
        completedUploadCount++;
        continue;
      }

      const inventoryObject = coordinatesList[oneResponseCoords.coordinateIndex];

      const isUploaded = await uploadImage(
        inventoryObject.imageUrl,
        userToken,
        sessionId,
        locationId,
        oneResponseCoords.id,
        oneInventory.inventory_id,
      );
      if (isUploaded) {
        completedUploadCount++;
      }
    }
    // returns boolean value of whether all the images were uploaded successfully or not by comparing
    // the length of coordinates of an inventory registration with the upload count of successfully completed upload
    return { allUploadCompleted: completedUploadCount === responseCoords.length };
  } catch (err) {
    console.error(`Error at /actions/upload/checkAndUploadImage, ${JSON.stringify(err)}`);
    return { allUploadCompleted: false };
  }
};

const uploadImage = async (
  imageUrl,
  userToken,
  sessionId,
  locationId,
  coordinateId,
  inventoryId,
) => {
  try {
    // fetches the image from device file system and stores it in base64 format which is used for uploading
    const base64Image = await RNFS.readFile(`${RNFS.DocumentDirectoryPath}/${imageUrl}`, 'base64');

    // attaches the image file to body of the request
    const body = {
      imageFile: `data:image/png;base64,${base64Image}`,
    };

    // defines the headers which is to be passed with the request
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `OAuth ${userToken}`,
      'x-session-id': sessionId,
    };
    try {
      // makes the PUT request to upload the image and stores the result of the same
      const result = await axios({
        method: 'PUT',
        url: `${protocol}://${url}/treemapper/plantLocations/${locationId}/coordinates/${coordinateId}`,
        data: body,
        headers: headers,
      });

      // if status is 200 then increments the completed upload count by 1 and logs the success of api request in DB
      if (result.status === 200) {
        dbLog.info({
          logType: LogTypes.DATA_SYNC,
          message: `Successfully uploaded image for inventory id: ${inventoryId} and coordinate id: ${coordinateId}`,
          logStack: JSON.stringify({
            inventoryId,
            locationId,
            coordinateId,
            imageUrl,
          }),
          referenceId: inventoryId,
        });
        return true;
      }
    } catch (err) {
      console.error(
        `Error at: action/upload/uploadImage, PUT: ${locationId}/coordinates/${coordinateId} -> ${JSON.stringify(
          err.response,
        )}`,
      );
      dbLog.error({
        logType: LogTypes.DATA_SYNC,
        message: `Error while uploading image for inventory id: ${inventoryId} and coordinate id: ${coordinateId}`,
        logStack: JSON.stringify(err.response),
        referenceId: inventoryId,
      });
      bugsnag.notify(err);
      return false;
    }
  } catch (err) {
    console.error(`Error at: action/upload/uploadImage, base64 image -> ${JSON.stringify(err)}`);
    dbLog.error({
      logType: LogTypes.DATA_SYNC,
      message: `Error while fetching base64 image from file system for id: ${inventoryId} and coordinate id: ${coordinateId}`,
      logStack: JSON.stringify(err),
      referenceId: inventoryId,
    });
    bugsnag.notify(err);
    return false;
  }
};

const getPlantLocationDetails = (locationId, userToken) => {
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
        dbLog.info({
          logType: LogTypes.DATA_SYNC,
          message: `Fetched planted location details, GET - /treemapper/plantLocations/${locationId}.`,
        });
      })
      .catch((err) => {
        reject(err);
        console.error(err, 'error');
        dbLog.error({
          logType: LogTypes.DATA_SYNC,
          message: `Failed to fetch planted location details, GET - /treemapper/plantLocations/${locationId}.`,
          logStack: JSON.stringify(err),
        });
      });
  });
};
