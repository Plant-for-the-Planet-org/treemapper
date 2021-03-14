import {
  getInventoryByStatus,
  changeInventoryStatusAndLocationId,
  changeInventoryStatus,
  updateInventory,
} from '../repositories/inventory';
import RNFS from 'react-native-fs';
import { updateCount, updateIsUploading } from './inventory';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';
import { bugsnag } from '../utils';
import { permission } from '../utils/permissions';
import {
  postAuthenticatedRequest,
  getAuthenticatedRequest,
  putAuthenticatedRequest,
} from '../utils/api';
import {
  OFF_SITE,
  ON_SITE,
  PENDING_DATA_UPLOAD,
  PENDING_IMAGE_UPLOAD,
  POINT,
  POLYGON,
  SINGLE,
  SYNCED,
  MULTI,
} from '../utils/inventoryConstants';

const changeStatusAndUpload = async (response, oneInventory, dispatch) => {
  console.log('changeStatusAndUpload=>>>', response);
  return new Promise((resolve, reject) => {
    try {
      if (oneInventory.locate_tree === OFF_SITE) {
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
        changeInventoryStatusAndLocationId(
          {
            inventory_id: oneInventory.inventory_id,
            status: 'uploading',
            locationId: response.id,
          },
          dispatch,
        )
          .then(async (isSucceed) => {
            if (isSucceed) {
              const result = await checkAndUploadImage(oneInventory, response);
              if (result.allUploadCompleted) {
                console.log('result.allUploadCompleted', result.allUploadCompleted);
                let inventory = {};
                inventory = oneInventory;
                const sampleTreeUploadResult = await checkSampleTreesAndUpload(inventory);
                if (sampleTreeUploadResult) {
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
              } else {
                reject();
              }
            }
          })
          .catch((err) => {
            reject(err);
            console.error(
              `Error at: /action/upload/changeInventoryStatusAndLocationId, -> ${JSON.stringify(
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
    permission()
      .then(async () => {
        // get pending inventories from realm DB
        const pendingInventory = await getInventoryByStatus('pending');
        // get inventories whose images are pending tob be uploaded from realm DB
        const uploadingInventory = await getInventoryByStatus('uploading');
        // copies pending and uploading inventory
        let inventoryData = [...pendingInventory, ...uploadingInventory];
        // updates the count of inventories that is going to be uploaded
        updateCount({ type: 'upload', count: inventoryData.length })(dispatch);
        // changes the status of isUploading to true, to show that data started to sync
        updateIsUploading(true)(dispatch);
        // loops through the inventory data to upload the data and then the images of the same synchronously
        for (let i = 0; i < inventoryData.length; i++) {
          const oneInventory = inventoryData[i];

          let body = getBodyData(oneInventory);

          console.log('body=>>>', body);

          if (oneInventory.locationId !== null && oneInventory.status === 'uploading') {
            try {
              const response = await getPlantLocationDetails(oneInventory.locationId);
              await changeStatusAndUpload(response, oneInventory, dispatch);

              if (inventoryData.length - 1 === i) {
                updateIsUploading(false)(dispatch);
                resolve();
              }
            } catch (err) {
              if (inventoryData.length - 1 === i) {
                updateIsUploading(false)(dispatch);
                reject();
              }
              bugsnag.notify(err);
              console.error(err);
            }
          } else {
            try {
              const data = await postAuthenticatedRequest('/treemapper/plantLocations', body);

              dbLog.info({
                logType: LogTypes.DATA_SYNC,
                message: 'Successfully added plant location, POST - /treemapper/plantLocation',
                referenceId: oneInventory.inventory_id,
              });

              if (data && data.data) {
                await changeStatusAndUpload(data.data, oneInventory, dispatch)
                  .then(async () => {
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
                      `Error at: /action/upload, changeStatusAndUpload -> ${JSON.stringify(err)}`,
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
                  err.response,
                )}`,
              );
              dbLog.error({
                logType: LogTypes.DATA_SYNC,
                message: 'Error while add plant location, POST - /treemapper/plantLocations',
                statusCode: err?.response?.status,
                logStack: JSON.stringify(err.response),
              });
            }
          }
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
        return err;
      });
  });
};

const getBodyData = (inventory) => {
  let coords = inventory.polygons[0].coordinates;

  console.log('\n\n\n');
  console.log('coords', coords);
  console.log('\n\n\n');

  // stores the coordinates of the registered tree(s)
  let coordinates = coords.map((x) => [x.longitude, x.latitude]);
  let coordinatesType = coordinates.length > 1 ? POLYGON : POINT;
  coordinates = coordinates.length > 1 ? [coordinates] : coordinates[0];

  // stores the device coordinated of the registered tree(s)
  // let deviceCoordinates = coords.map((x) => [x.currentloclong, x.currentloclat]);
  let deviceCoordinatesType = POINT;
  let deviceCoordinates = [coords[0].longitude, coords[0].latitude];

  console.log('\n\n\n');
  console.log('deviceCoordinates', deviceCoordinates);
  console.log('\n\n\n');

  // prepares the body which is to be passed to api
  let body = {
    type: inventory.treeType,
    captureMode: inventory.locate_tree,
    deviceLocation: {
      coordinates: deviceCoordinates,
      type: deviceCoordinatesType,
    },
    geometry: {
      coordinates,
      type: coordinatesType,
    },
    plantDate: inventory.plantation_date.toISOString().split('T')[0],
    registrationDate: inventory.registration_date.toISOString().split('T')[0],
    plantProject: null,
  };

  // if inventory type is scientific species then adds measurements and scientific species to body
  if (inventory.treeType === SINGLE) {
    let bodyData = {
      measurements: {
        height: inventory.species_height,
        width: inventory.species_diameter,
      },
    };
    if (inventory.species[0].id !== 'unknown') {
      bodyData.scientificSpecies = inventory.species[0].id;
    }
    if (inventory.tag_id) {
      bodyData.tag = inventory.tag_id;
    }

    body = {
      ...body,
      ...bodyData,
    };
  } else {
    let plantedSpecies = inventory.species.map((x) => {
      let specie = {
        treeCount: Number(x.treeCount),
      };
      if (x.id === 'unknown') {
        specie.otherSpecies = 'Unknown';
      } else {
        specie.scientificSpecies = x.id;
      }
      return specie;
    });
    body.plantedSpecies = plantedSpecies;
  }
  return body;
};

const getSampleBodyData = (sampleTree, registrationDate, parentId) => {
  // prepares the body which is to be passed to api
  let body = {
    type: sampleTree.treeType,
    captureMode: ON_SITE,
    deviceLocation: {
      coordinates: [sampleTree.deviceLongitude, sampleTree.deviceLatitude],
      type: POINT,
    },
    geometry: {
      coordinates: [sampleTree.longitude, sampleTree.latitude],
      type: POINT,
    },
    plantDate: new Date(sampleTree.plantationDate).toISOString().split('T')[0],
    registrationDate: new Date(registrationDate).toISOString().split('T')[0],
    parent: parentId,
    scientificSpecies: sampleTree.specieId,
    measurements: {
      height: sampleTree.specieHeight,
      width: sampleTree.specieDiameter,
    },
  };

  if (sampleTree.tagId) {
    body.tag = sampleTree.tagId;
  }
  return body;
};

const checkSampleTreesAndUpload = async (inventory) => {
  if (
    inventory.treeType === MULTI &&
    inventory.locate_tree === ON_SITE &&
    inventory.uploadedSampleTreesCount < inventory.sampleTreesCount
  ) {
    let uploadedCount = 0;
    for (const index in inventory.sampleTrees) {
      let sampleTree = inventory.sampleTrees[index];
      sampleTree = JSON.parse(JSON.stringify(sampleTree));

      if (sampleTree.status !== SYNCED) {
        let response;
        console.log('\n\n\n');
        console.log('not synced =>>>>>>>>>>>>', { ...sampleTree }, typeof sampleTree);

        if (sampleTree.locationId && sampleTree.status === PENDING_IMAGE_UPLOAD) {
          response = await getPlantLocationDetails(sampleTree.locationId);
        } else if (sampleTree.status === PENDING_DATA_UPLOAD) {
          let body = getSampleBodyData(
            sampleTree,
            inventory.registration_date,
            inventory.locationId,
          );
          console.log('body data', body);
          response = await postAuthenticatedRequest('/treemapper/plantLocations', body);

          response = response.data;
        }

        console.log('response =>', response);

        if (response && response.coordinates[0].status === 'pending' && sampleTree.imageUrl) {
          console.log('\n\n\n');
          console.log('pending =>>>>>>>>>>>>');
          sampleTree.status = PENDING_IMAGE_UPLOAD;
          sampleTree.locationId = response.id;
          // let updatedSampleTree = {
          //   ...sampleTree,
          //   status: PENDING_IMAGE_UPLOAD,
          //   locationId: response.id,
          // };

          console.log('abjfajk', sampleTree);

          await updateSampleTreeByIndex(inventory, sampleTree, index).catch((err) => {
            console.error('Error while updating sample tree data', err);
          });

          console.log('sample image', sampleTree.imageUrl, sampleTree);

          const uploadResult = await uploadImage(
            sampleTree.imageUrl,
            response.id,
            response.coordinates[0].id,
            inventory.inventory_id,
          );

          // const uploadResult = null;

          if (uploadResult) {
            console.log('uploaded image');
            sampleTree.status = SYNCED;
            // updatedSampleTree = {
            //   ...updatedSampleTree,
            //   status: SYNCED,
            // };

            await updateSampleTreeByIndex(inventory, sampleTree, index, true)
              .then(() => {
                uploadedCount += 1;
              })
              .catch((err) => {
                console.error('Error while updating sample tree data', err);
              });
          } else {
            console.error('Error while uploading image');
          }
        } else if (
          response &&
          (response.coordinates[0].status === 'complete' || !sampleTree.imageUrl)
        ) {
          console.log('image upload complete');
          sampleTree.status = SYNCED;
          sampleTree.locationId = response.id;
          // let updatedSampleTree = {
          //   ...sampleTree,
          //   status: SYNCED,
          //   locationId: response.id,
          // };

          await updateSampleTreeByIndex(inventory, sampleTree, index, true)
            .then(() => {
              uploadedCount += 1;
            })
            .catch((err) => {
              console.error('Error while updating sample tree data', err);
            });
        }
      } else {
        console.log('already uploaded');
        uploadedCount += 1;
      }
      console.log('for uploadedCount', uploadedCount);
    }
    console.log('for completed uploadedCount', uploadedCount, inventory.sampleTreesCount);
    return uploadedCount === inventory.sampleTreesCount;
  } else {
    return true;
  }
};

const updateSampleTreeByIndex = (
  inventory,
  sampleTree,
  index,
  incrementUploadedSampleTreeCount = false,
) => {
  return new Promise((resolve, reject) => {
    let sampleTrees = [...inventory.sampleTrees];
    sampleTrees[index] = {
      ...sampleTree,
    };

    let inventoryData = {
      sampleTrees,
    };

    if (incrementUploadedSampleTreeCount) {
      inventoryData.uploadedSampleTreesCount = inventory.uploadedSampleTreesCount + 1;
    }

    updateInventory({ inventory_id: inventory.inventory_id, inventoryData })
      .then(resolve)
      .catch(reject);
  });
};

const checkAndUploadImage = async (oneInventory, response) => {
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

const uploadImage = async (imageUrl, locationId, coordinateId, inventoryId) => {
  console.log('image url', imageUrl);
  try {
    // fetches the image from device file system and stores it in base64 format which is used for uploading
    const base64Image = await RNFS.readFile(`${RNFS.DocumentDirectoryPath}/${imageUrl}`, 'base64');

    // attaches the image file to body of the request
    const body = {
      imageFile: `data:image/png;base64,${base64Image}`,
    };

    try {
      // makes the PUT request to upload the image and stores the result of the same
      const result = await putAuthenticatedRequest(
        `/treemapper/plantLocations/${locationId}/coordinates/${coordinateId}`,
        body,
      );

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

const getPlantLocationDetails = (locationId) => {
  return new Promise((resolve, reject) => {
    getAuthenticatedRequest(`/treemapper/plantLocations/${locationId}`)
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
