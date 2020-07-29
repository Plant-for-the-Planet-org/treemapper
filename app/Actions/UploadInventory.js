import { Config } from './Config';
import axios from 'axios';
import { getAllPendingInventory } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory } from './Schemas'
import Realm from 'realm';

const uploadInventory = () => {
    testFoo()
    return new Promise((resolve, reject) => {
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
    console.log('TEST FOO CALL')
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] })
        .then(realm => {
            realm.write(() => {
                const User = realm.objectForPrimaryKey('User', 'id0001');
                let userToken = User.accessToken;
                console.log('userTokenuserToken=', userToken)
                getAllPendingInventory().then((allPendingInventory) => {
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
                        console.log('coordinates=', coordinates)
                        let bodyTemplate = {
                            "captureMode": oneInventory.locate_tree,
                            "deviceLocation": {
                                "coordinates": [
                                    -90.66840648651123,
                                    18.682146549182555
                                ],
                                "type": "Point"
                            },
                            "geometry": {
                                "type": coordinates.length > 1 ? 'Polygon' : "Point",
                                "coordinates": coordinates.length > 1 ? [coordinates] : coordinates[0]
                            },
                            "plantDate": new Date().toISOString(),
                            "plantProject": null,
                            "plantedSpecies": species
                        }

                        console.log('BODY [0]=', bodyTemplate)
                        // return;
                        axios({
                            method: 'POST',
                            url: 'https://app-development.plant-for-the-planet.org/treemapper/plantLocations',
                            data: bodyTemplate,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `OAuth ${userToken}`
                            },
                        }).then((data) => {
                            console.log('RESPOSS=', data.data)
                        })
                            .catch((err) => {
                                console.log("ERROR=", err)
                                console.log("ERROR=", JSON.parse(JSON.stringify(err)))
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
