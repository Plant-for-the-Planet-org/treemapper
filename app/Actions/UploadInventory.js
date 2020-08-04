import { Config } from './Config';
import axios from 'axios';
import { getAllPendingInventory, statusToComplete } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory } from './Schemas'
import Realm from 'realm';
import Geolocation from '@react-native-community/geolocation';

const uploadInventory = () => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] })
            .then(realm => {
                realm.write(() => {
                    const User = realm.objectForPrimaryKey('User', 'id0001');
                    let userToken = User.accessToken;
                    try {
                        Geolocation.getCurrentPosition(position => {
                            let currentCoords = position.coords;
                            getAllPendingInventory().then(async (allPendingInventory) => {
                                let coordinates = []
                                let species = []
                                allPendingInventory = Object.values(allPendingInventory);
                                for (let i = 0; i < allPendingInventory.length; i++) {
                                    const oneInventory = allPendingInventory[i];
                                    let polygons = Object.values(oneInventory.polygons)
                                    const onePolygon = polygons[0];
                                    let coords = Object.values(onePolygon.coordinates);
                                    coordinates = coords.map(x => ([x.longitude, x.latitude]));
                                    if (oneInventory.tree_type == 'single') {
                                        species = [{ otherSpecies: String(oneInventory.specei_name), treeCount: 1 }]
                                    } else {
                                        species = Object.values(oneInventory.species).map(x => ({ otherSpecies: x.nameOfTree, treeCount: Number(x.treeCount) }))
                                    }
                                    let bodyTemplate = {
                                        captureMode: oneInventory.locate_tree,
                                        deviceLocation: {
                                            coordinates: [
                                                currentCoords.longitude,
                                                currentCoords.latitude,
                                            ],
                                            type: "Point"
                                        },
                                        geometry: {
                                            type: coordinates.length > 1 ? 'Polygon' : "Point",
                                            coordinates: coordinates.length > 1 ? [coordinates] : coordinates[0]
                                        },
                                        plantDate: new Date().toISOString(),
                                        plantProject: null,
                                        plantedSpecies: species
                                    }

                                    const { protocol, url } = Config
                                    await axios({
                                        method: 'POST',
                                        url: `${protocol}://${url}/treemapper/plantLocations`,
                                        data: bodyTemplate,
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `OAuth ${userToken}`
                                        },
                                    }).then((data) => {
                                        statusToComplete({ inventory_id: oneInventory.inventory_id })
                                        if (allPendingInventory.length - 1 == i) {
                                            resolve()
                                        }
                                    })
                                        .catch((err) => {
                                            alert('There is something wrong')
                                            reject()
                                        })
                                }
                            }).catch((err) => {
                            })
                        }, (err) => alert(err.message))
                    } catch (err) {
                        reject()
                        alert('Unable to retrive location')
                    }

                })
            }).catch((err) => {
            });

    });
}

export { uploadInventory }
