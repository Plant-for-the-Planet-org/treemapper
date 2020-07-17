import { Config } from './Config';
import axios from 'axios';
import { getAllPendingInventory } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory } from './Schemas'
import Realm from 'realm';

const uploadInventory = () => {
    return new Promise((resolve, reject) => {
        testFoo()
        // checkLogin()
        const { protocol, url, debug_mode, locale, version } = Config;
        let API_URL = `${protocol}://${url}/${debug_mode}api/${version}/${locale}/plantLocations`;

    });
}

const checkLogin = () => {
    return new Promise((resolve, reject) => {
        const API_URL = `https://app-development.plant-for-the-planet.org/api/login_check`
        console.log(API_URL)

        axios({
            method: 'POST',
            url: API_URL,
            data: { _username: "info@plant-for-the-planet.org", _password: 's1mplePW' }
        }).then((data) => {
            console.log('RESPOSS=checkLogin', data)
        })
            .catch((err) => {
                console.log("ERROR=checkLogin", err)
            })
    })
}

const testFoo = () => {
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] })
        .then(realm => {
            realm.write(() => {
                const User = realm.objects('User');
                let userToken = User[0].idToken
                getAllPendingInventory().then((allPendingInventory) => {
                    let coordinates = []
                    let species = []
                    allPendingInventory = Object.values(allPendingInventory);
                    for (let i = 0; i < allPendingInventory.length; i++) {
                        const oneInventory = allPendingInventory[i];
                        let polygons = Object.values(oneInventory.polygons)
                        for (let j = 0; j < polygons.length; j++) {
                            const onePolygon = polygons[j];
                            let coords = Object.values(onePolygon.coordinates);
                            coordinates = coords.map(x => ([x.longitude, x.latitude]));
                        }
                        species = Object.values(oneInventory.species).map(x => ({ otherSpecies: x.nameOfTree, treeCount: Number(x.treeCount) }))
                        let bodyTemplate = {
                            plantProject: null,
                            deviceLocation: {
                                type: "Point",
                                coordinates: [
                                    -90.66840648651123,
                                    18.682146549182555
                                ]
                            },
                            geometry: {
                                type: coordinates.length > 1 ? 'Polygon' : "Point",
                                coordinates: coordinates.length > 1 ? [coordinates] : coordinates[0]
                            },
                            plantDate: new Date(Number(oneInventory.plantation_date)).toDateString(),
                            plantedSpecies: species,
                            captureMode: oneInventory.locate_tree
                        }

                        bodyTemplate = {
                            "plantProject": null,
                            "deviceLocation": {
                                "type": "Point",
                                "coordinates": [
                                    -90.66840648651123,
                                    18.682146549182555
                                ]
                            },
                            "geometry": {
                                "type": coordinates.length > 1 ? 'Polygon' : "Point",
                                "coordinates": coordinates.length > 1 ? coordinates : coordinates[0]
                            },
                            "plantDate": new Date().toISOString(),
                            "plantedSpecies": species,
                            "captureMode": oneInventory.locate_tree
                        }
                        console.log('coordinates=', coordinates)
                        console.log('species=', species)

                        axios({
                            method: 'POST',
                            url: 'https://app-development.plant-for-the-planet.org/api/v1.0/en/plantLocations',
                            data: bodyTemplate,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                        }).then((data) => {
                            console.log('RESPOSS=', data.data)
                        })
                            .catch((err) => {
                                console.log("ERROR=", err)
                            })

                    }

                }).catch((err) => {
                    console.log('ERROR =', err)
                })
            })
        }).catch((err) => {
            console.log(err)
        });
}

export { uploadInventory }
