import { APIConfig } from './Config';
import axios from 'axios';
import { getAllPendingInventory, statusToComplete } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory } from './Schemas';
import Realm from 'realm';
import Geolocation from '@react-native-community/geolocation';
import RNFS from 'react-native-fs';
import getSessionData from '../Utils/sessionId';

const { protocol, url } = APIConfig;

const uploadInventory = () => {
  return new Promise((resolve, reject) => {
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] })
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

export { uploadInventory };
