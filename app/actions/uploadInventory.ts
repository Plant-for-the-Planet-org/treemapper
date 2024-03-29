import RNFS from 'react-native-fs';
import {
  addCdnUrl,
  changeInventoryStatus,
  changeInventoryStatusAndLocationId,
  getInventoryByStatus,
  updateInventory,
} from '../repositories/inventory';
import dbLog from '../repositories/logs';
import { bugsnag } from '../utils';
import { getFormattedMetadata } from '../utils/additionalData/functions';
import {
  getAuthenticatedRequest,
  postAuthenticatedRequest,
  putAuthenticatedRequest,
  putRequest,
} from '../utils/api';
import { LogTypes } from '../utils/constants';
import {
  DATA_UPLOAD_START,
  DECREMENT,
  INCREMENT,
  MULTI,
  OFF_SITE,
  ON_SITE,
  PENDING_DATA_UPLOAD,
  PENDING_IMAGE_UPLOAD,
  PENDING_SAMPLE_TREES_UPLOAD,
  PENDING_DATA_UPDATE,
  getPendingStatus,
  POINT,
  POLYGON,
  SINGLE,
  SYNCED,
} from '../utils/inventoryConstants';
import { updateCount, updateIsUploading } from './inventory';

const changeStatusAndUpload = async (response, oneInventory, dispatch) => {
  return new Promise((resolve, reject) => {
    try {
      if (oneInventory.locateTree === OFF_SITE) {
        changeInventoryStatusAndLocationId(
          {
            inventory_id: oneInventory.inventory_id,
            status: SYNCED,
            locationId: response.id,
            hid: response.hid,
            originalGeometry: response.originalGeometry
              ? JSON.stringify(response.originalGeometry)
              : '',
          },
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
            status: PENDING_IMAGE_UPLOAD,
            locationId: response.id,
            hid: response.hid,
            originalGeometry: response.originalGeometry
              ? JSON.stringify(response.originalGeometry)
              : '',
          },
          dispatch,
        )
          .then(async isSucceed => {
            if (isSucceed) {
              const result = await checkAndUploadImage(oneInventory, response);
              if (result.allUploadCompleted) {
                if (oneInventory.treeType === SINGLE) {
                  changeInventoryStatus(
                    {
                      inventory_id: oneInventory.inventory_id,
                      status: SYNCED,
                    },
                    dispatch,
                  )
                    .then(() => resolve())
                    .catch(err => {
                      dbLog.error({
                        logType: LogTypes.INVENTORY,
                        message: `Failed to change inventory status: ${SYNCED} with inventory id: ${oneInventory.inventory_id}.`,
                        logStack: JSON.stringify(err),
                      });
                      reject(err);
                    });
                } else {
                  await changeInventoryStatus(
                    {
                      inventory_id: oneInventory.inventory_id,
                      status: PENDING_SAMPLE_TREES_UPLOAD,
                    },
                    dispatch,
                  )
                    .then(async () => {
                      let inventory = {};
                      inventory = { ...oneInventory, locationId: response.id };
                      const sampleTreeUploadResult = await checkSampleTreesAndUpload(inventory);

                      if (sampleTreeUploadResult) {
                        changeInventoryStatus(
                          {
                            inventory_id: oneInventory.inventory_id,
                            status: SYNCED,
                          },
                          dispatch,
                        )
                          .then(() => resolve())
                          .catch(err => {
                            console.error('Error at: /action/upload/changeInventoryStatus', err);
                            dbLog.error({
                              logType: LogTypes.INVENTORY,
                              message: `Failed to change inventory status: ${SYNCED} with inventory id: ${oneInventory.inventory_id}.`,
                              logStack: JSON.stringify(err),
                            });
                            reject(err);
                          });
                      } else {
                        reject(new Error('Some sample tree upload are pending'));
                      }
                    })
                    .catch(err => {
                      dbLog.error({
                        logType: LogTypes.INVENTORY,
                        message: `Failed to change inventory status: ${PENDING_SAMPLE_TREES_UPLOAD} with inventory id: ${oneInventory.inventory_id}.`,
                        logStack: JSON.stringify(err),
                      });
                      reject(err);
                    });
                }
              } else {
                reject(new Error('Some image upload are pending'));
              }
            }
          })
          .catch(err => {
            reject(err);
            dbLog.error({
              logType: LogTypes.INVENTORY,
              message: `Failed to change inventory status: ${PENDING_IMAGE_UPLOAD} & location id: ${response.id} with inventory id: ${oneInventory.inventory_id}.`,
              logStack: JSON.stringify(err),
            });
          });
      }
    } catch (err) {
      reject(err);
      dbLog.error({
        logType: LogTypes.INVENTORY,
        message: 'Error at: /action/upload/changeStatusAndUpload',
        logStack: JSON.stringify(err),
      });
    }
  });
};

export const uploadInventory = async (dispatch: any) => {
  return new Promise((resolve, reject) => {
    const init = async () => {
      // get pending inventories from realm DB
      let inventoryData = await getInventoryByStatus(getPendingStatus());

      // used to copy the data so the reference to realm result is removed
      inventoryData = JSON.parse(JSON.stringify(inventoryData));

      // updates the count of inventories that is going to be uploaded
      updateCount({ type: 'upload', count: inventoryData.length })(dispatch);
      // changes the status of isUploading to true, to show that data started to sync
      if (inventoryData.length === 0) {
        updateIsUploading(false)(dispatch);
      } else {
        updateIsUploading(true)(dispatch);
      }
      // loops through the inventory data to upload the data and then the images of the same synchronously
      for (let i = 0; i < inventoryData.length; i++) {
        const oneInventory = inventoryData[i];

        let body = getBodyData(oneInventory);

        if (
          oneInventory.locationId !== null &&
          (oneInventory.status === PENDING_IMAGE_UPLOAD ||
            oneInventory.status === PENDING_SAMPLE_TREES_UPLOAD)
        ) {
          try {
            const response = await getPlantLocationDetails(oneInventory.locationId);

            if (oneInventory.status === PENDING_SAMPLE_TREES_UPLOAD) {
              let inventory = {};
              inventory = oneInventory;
              const sampleTreeUploadResult = await checkSampleTreesAndUpload(inventory);

              if (sampleTreeUploadResult) {
                changeInventoryStatus(
                  {
                    inventory_id: oneInventory.inventory_id,
                    status: SYNCED,
                  },
                  dispatch,
                ).catch(err => {
                  dbLog.error({
                    logType: LogTypes.INVENTORY,
                    message: `Failed to change inventory status: ${SYNCED} with inventory id: ${oneInventory.inventory_id}.`,
                    logStack: JSON.stringify(err),
                  });
                });
              } else {
                dbLog.error({
                  logType: LogTypes.INVENTORY,
                  message: `Some sample tree upload are pending with inventory id: ${oneInventory.inventory_id} and location id: ${oneInventory.locationId}.`,
                });
              }
            } else {
              await changeStatusAndUpload(response, oneInventory, dispatch);
            }

            if (inventoryData.length - 1 === i) {
              updateIsUploading(false)(dispatch);
              resolve();
            }
          } catch (err) {
            if (inventoryData.length - 1 === i) {
              updateIsUploading(false)(dispatch);
              reject(err);
            }
          }
        } else if (oneInventory.locationId && oneInventory.status === PENDING_DATA_UPDATE) {
          try {
            const { coordinates, coordinatesType } = getCoordinatesAndType(oneInventory);

            body = {
              geometry: {
                coordinates,
                type: coordinatesType,
              },
            };

            await putAuthenticatedRequest(
              `/treemapper/plantLocations/${oneInventory.locationId}`,
              body,
            );

            dbLog.info({
              logType: LogTypes.DATA_SYNC,
              message: `Successfully updated geometry of inventory ${oneInventory.inventory_id}`,
              referenceId: oneInventory.inventory_id,
            });

            changeInventoryStatus(
              {
                inventory_id: oneInventory.inventory_id,
                status: SYNCED,
              },
              dispatch,
            )
              .then(() => {
                if (inventoryData.length - 1 === i) {
                  updateIsUploading(false)(dispatch);
                  resolve(true);
                }
              })
              .catch(err => {
                dbLog.error({
                  logType: LogTypes.INVENTORY,
                  message: `Failed to change inventory status: ${SYNCED} with inventory id: ${oneInventory.inventory_id}.`,
                  logStack: JSON.stringify(err),
                });
                if (inventoryData.length - 1 === i) {
                  updateIsUploading(false)(dispatch);
                  reject(err);
                }
              });
          } catch (err) {
            if (inventoryData.length - 1 === i) {
              updateIsUploading(false)(dispatch);
              reject(err);
            }
          }
        } else {
          try {
            await changeInventoryStatus(
              {
                inventory_id: oneInventory.inventory_id,
                status: DATA_UPLOAD_START,
                count: INCREMENT,
              },
              dispatch,
            );
            const data = await postAuthenticatedRequest('/treemapper/plantLocations', body);

            dbLog.info({
              logType: LogTypes.DATA_SYNC,
              message: `Successfully added plant location for inventory id: ${oneInventory.inventory_id}, POST - /treemapper/plantLocation`,
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
                .catch(err => {
                  if (inventoryData.length - 1 === i) {
                    updateIsUploading(false)(dispatch);
                    reject(err);
                  }
                  console.error('Error at: /action/upload, changeStatusAndUpload', err);
                });
            } else {
              dbLog.error({
                logType: LogTypes.DATA_SYNC,
                message: `No data returned from server for inventory id: ${oneInventory.inventory_id}, POST - /treemapper/plantLocation`,
                referenceId: oneInventory.inventory_id,
              });
              if (inventoryData.length - 1 === i) {
                updateIsUploading(false)(dispatch);
                reject(new Error('No data returned while creating plant location'));
              }
            }
          } catch (err) {
            await changeInventoryStatus(
              {
                inventory_id: oneInventory.inventory_id,
                status: PENDING_DATA_UPLOAD,
                count: DECREMENT,
              },
              dispatch,
            );
            if (inventoryData.length - 1 === i) {
              updateIsUploading(false)(dispatch);
              reject(err);
            }
            console.error('Error at: /action/upload, POST - /treemapper/plantLocations', err);
            dbLog.error({
              logType: LogTypes.DATA_SYNC,
              message: 'Error while adding plant location, POST - /treemapper/plantLocations',
              statusCode: err?.response?.status,
              logStack: JSON.stringify(err?.response || err),
            });
          }
        }
      }
    };
    init();
  });
};

const getCoordinatesAndType = (inventory: any) => {
  let coords = inventory.polygons[0].coordinates;

  // stores the coordinates of the registered tree(s)
  let coordinates = coords.map(x => [x.longitude, x.latitude]);
  let coordinatesType = coordinates.length > 1 ? POLYGON : POINT;
  coordinates = coordinates.length > 1 ? [coordinates] : coordinates[0];
  return {
    coordinates,
    coordinatesType,
  };
};

const getBodyData = inventory => {
  let coords = inventory.polygons[0].coordinates;

  const { coordinates, coordinatesType } = getCoordinatesAndType(inventory);

  // stores the device coordinated of the registered tree(s)
  let deviceCoordinatesType = POINT;
  let deviceCoordinates = [coords[0].longitude, coords[0].latitude];

  const metadata = getFormattedMetadata(inventory.additionalDetails);

  metadata.app = JSON.parse(inventory.appMetadata);

  // prepares the body which is to be passed to api
  let body: any = {
    type: inventory.treeType,
    captureMode: inventory.locateTree,
    deviceLocation: {
      coordinates: deviceCoordinates,
      type: deviceCoordinatesType,
    },
    geometry: {
      coordinates,
      type: coordinatesType,
    },
    plantDate: new Date(inventory.plantation_date).toISOString().split('T')[0],
    registrationDate: new Date(inventory.registrationDate).toISOString().split('T')[0],
    metadata,
  };

  // if inventory type is scientific species then adds measurements and scientific species to body
  if (inventory.treeType === SINGLE) {
    let bodyData: any = {
      measurements: {
        height: inventory.specieHeight,
        width: inventory.specieDiameter,
      },
    };
    if (inventory.species[0].id !== 'unknown') {
      bodyData.scientificSpecies = inventory.species[0].id;
    }
    if (inventory.tagId) {
      bodyData.tag = inventory.tagId;
    }

    body = {
      ...body,
      ...bodyData,
    };
  } else {
    let plantedSpecies = inventory.species.map((x: any) => {
      let specie: any = {
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

    // adds sampleTreeCount in request body if tree type is multi
    body.sampleTreeCount = inventory.sampleTreesCount;
  }
  if (inventory.projectId) {
    body.plantProject = inventory.projectId;
  }

  return body;
};

const getSampleBodyData = (sampleTree: any, registrationDate: any, parentId: string) => {
  const metadata = getFormattedMetadata(sampleTree.additionalDetails);
  metadata.app = JSON.parse(sampleTree.appMetadata);

  // prepares the body which is to be passed to api
  let body: any = {
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
    scientificSpecies: sampleTree.specieId == 'unknown' ? null : sampleTree.specieId,
    measurements: {
      height: sampleTree.specieHeight,
      width: sampleTree.specieDiameter,
    },
    metadata,
  };

  if (sampleTree.tagId) {
    body.tag = sampleTree.tagId;
  }
  return body;
};

const checkSampleTreesAndUpload = async (inventory: any) => {
  if (
    inventory.treeType === MULTI &&
    inventory.locateTree === ON_SITE &&
    inventory.uploadedSampleTreesCount < inventory.sampleTreesCount
  ) {
    let uploadedCount = 0;
    for (const index in inventory.sampleTrees) {
      let sampleTree = inventory.sampleTrees[index];
      sampleTree = JSON.parse(JSON.stringify(sampleTree));

      if (sampleTree.status !== SYNCED) {
        let response: any;

        if (sampleTree.locationId && sampleTree.status === PENDING_IMAGE_UPLOAD) {
          try {
            response = await getPlantLocationDetails(sampleTree.locationId);
          } catch (err) {
            dbLog.error({
              logType: LogTypes.DATA_SYNC,
              message: `Error while getting plant location details with Sample Tree Location Id:${sampleTree.locationId}`,
              logStack: JSON.stringify(err?.response || err),
            });
            continue;
          }
        } else if (sampleTree.status === PENDING_DATA_UPLOAD) {
          let body = getSampleBodyData(
            sampleTree,
            inventory.registrationDate,
            inventory.locationId,
          );
          try {
            response = await postAuthenticatedRequest('/treemapper/plantLocations', body);
          } catch (err: any) {
            dbLog.error({
              logType: LogTypes.DATA_SYNC,
              message: `Error while creating Plant Location details for Sample Trees with Inventory Location Id: ${inventory.locationId}`,
              logStack: JSON.stringify(err?.response || err),
            });
            continue;
          }

          response = response?.data;
        }

        if (response && response.coordinates[0].status === 'pending' && sampleTree.imageUrl) {
          sampleTree.status = PENDING_IMAGE_UPLOAD;
          sampleTree.locationId = response.id;
          sampleTree.hid = response.hid;

          inventory.sampleTrees[index].status = PENDING_IMAGE_UPLOAD;
          inventory.sampleTrees[index].locationId = response.id;
          inventory.sampleTrees[index].hid = response.hid;

          await updateSampleTreeByIndex(inventory, sampleTree, index).catch(err => {
            dbLog.error({
              logType: LogTypes.DATA_SYNC,
              message: `Error while updating sample tree data for location id: ${response.id}`,
              logStack: JSON.stringify(err),
            });
            console.error('Error while updating sample tree data', err);
          });

          const uploadResult = await uploadImage(
            sampleTree.imageUrl,
            response.id,
            response.coordinates[0].id,
            inventory.inventory_id,
            true,
          );
          if (uploadResult) {
            sampleTree.status = SYNCED;
            sampleTree.cdnImageUrl = uploadResult;

            inventory.sampleTrees[index].status = SYNCED;
            inventory.sampleTrees[index].cdnImageUrl = uploadResult;

            await updateSampleTreeByIndex(inventory, sampleTree, index, true)
              .then(() => {
                uploadedCount += 1;
              })
              .catch(err => {
                console.error('Error while updating sample tree data', err);
              });
          } else {
            console.error('Error while uploading image');
          }
        } else if (response && response.coordinates[0].status === 'complete') {
          sampleTree.status = SYNCED;
          sampleTree.locationId = response.id;
          sampleTree.hid = response.hid;

          inventory.sampleTrees[index].status = SYNCED;
          inventory.sampleTrees[index].locationId = response.id;
          inventory.sampleTrees[index].hid = response.hid;

          await updateSampleTreeByIndex(inventory, sampleTree, index, true)
            .then(() => {
              uploadedCount += 1;
            })
            .catch(err => {
              console.error('Error while updating sample tree data', err);
            });
        }
      } else {
        uploadedCount += 1;
      }
    }
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

    let inventoryData: any = {
      sampleTrees,
    };

    if (incrementUploadedSampleTreeCount) {
      inventoryData.uploadedSampleTreesCount = inventory.uploadedSampleTreesCount + 1;
    }

    updateInventory({ inventory_id: inventory.inventory_id, inventoryData })
      .then(resolve)
      .catch(err => {
        dbLog.error({
          logType: LogTypes.DATA_SYNC,
          message: `Error while updating sample tree data by Index with Inventory id: ${inventory?.inventory_id}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
      });
  });
};

const checkAndUploadImage = async (oneInventory: any, response: any) => {
  try {
    let locationId = response.id;
    let coordinatesList = oneInventory.polygons[0].coordinates;
    const responseCoords = response.coordinates;
    let completedUploadCount = 0;
    for (const oneResponseCoords of responseCoords) {
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
        false,
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

export const uploadImage = async (imageUrl, locationId, coordinateId, inventoryId, isSampleTree) => {
  try {
    // fetches the image from device file system and stores it in base64 format which is used for uploading
    const base64Image = await RNFS.readFile(`${RNFS.DocumentDirectoryPath}/${imageUrl}`, 'base64');

    // attaches the image file to body of the request
    const body = {
      imageFile: `data:image/png;base64,${base64Image}`,
    };

    try {
      // makes the PUT request to upload the image and stores the result of the same
      const result = await putRequest(
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

        await addCdnUrl({
          inventoryID: inventoryId,
          coordinateIndex: result.data.coordinateIndex,
          cdnImageUrl: result.data.image,
          locationId,
          isSampleTree,
        });
        return result.data.image;
      }
      return false;
    } catch (err) {
      console.error(
        `Error at: action/upload/uploadImage, PUT: ${locationId}/coordinates/${coordinateId} -> ${JSON.stringify(
          err?.response,
        )}`,
      );
      dbLog.error({
        logType: LogTypes.DATA_SYNC,
        message: `Error while uploading image for inventory id: ${inventoryId} and coordinate id: ${coordinateId}`,
        logStack: JSON.stringify(err?.response || err),
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

export const getPlantLocationDetails = locationId => {
  return new Promise((resolve, reject) => {
    getAuthenticatedRequest(`/treemapper/plantLocations/${locationId}`)
      .then(res => {
        const { data, status } = res;
        if (status === 200) {
          resolve(data);
        }
        dbLog.info({
          logType: LogTypes.DATA_SYNC,
          message: `Fetched planted location details, GET - /treemapper/plantLocations/${locationId}.`,
        });
      })
      .catch(err => {
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
