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

        // getAllPendingInventory().then((allPendingInventory) => {

        //     let coordinates = []
        //     let species = []
        //     allPendingInventory = Object.values(allPendingInventory);
        //     for (let i = 0; i < allPendingInventory.length; i++) {
        //         const oneInventory = allPendingInventory[i];
        //         let polygons = Object.values(oneInventory.polygons)
        //         for (let j = 0; j < polygons.length; j++) {
        //             const onePolygon = polygons[j];
        //             let coords = Object.values(onePolygon.coordinates);
        //             coordinates = coords.map(x => ([x.longitude, x.latitude]));
        //         }
        //         species = Object.values(oneInventory.species).map(x => ({ otherSpecies: x.nameOfTree, treeCount: Number(x.treeCount) }))
        //         let bodyTemplate = {
        //             "plantProject": null,
        //             "deviceLocation": {
        //                 "type": "Point",
        //                 "coordinates": [
        //                     -90.66840648651123,
        //                     18.682146549182555
        //                 ]
        //             },
        //             "geometry": {
        //                 "type": coordinates.length > 1 ? 'point' : "polygon",
        //                 "coordinates": coordinates
        //             },
        //             "plantDate": new Date(Number(oneInventory.plantation_date)).toDateString(),
        //             "plantedSpecies": species,
        //             "captureMode": oneInventory.locate_tree
        //         }
        //         axios({
        //             method: 'POST',
        //             url: 'https://app-development.plant-for-the-planet.org/api/v1.0/en/plantLocations',
        //             data: {
        //                 "plantProject": null,
        //                 "deviceLocation": {
        //                     "type": "Point",
        //                     "coordinates": [
        //                         -90.66840648651123,
        //                         18.682146549182555
        //                     ]
        //                 },
        //                 "geometry": {
        //                     "type": "Point",
        //                     "coordinates": [
        //                         -90.66840648651123,
        //                         18.682146549182555
        //                     ]
        //                 },
        //                 "plantDate": "2020-02-13",
        //                 "plantedSpecies": [
        //                     {
        //                         "otherSpecies": "Apples",
        //                         "treeCount": 50
        //                     }
        //                 ],
        //                 "captureMode": "on-site"
        //             },
        //             headers: {
        //                 'cache-control': 'no-cache',
        //                 Connection: 'keep-alive',
        //                 Cookie: '__cfduid=d4d7ecbc9fd14dc7ed4b61d7650eb0dcf1594809705',
        //                 'Content-Length': '508',
        //                 'Accept-Encoding': 'gzip, deflate',
        //                 Host: 'app-development.plant-for-the-planet.org',
        //                 'Postman-Token': '7ca7e838-2987-4e12-87e4-8a624372fee0,dcb6f696-09e1-40c3-84f5-1ef982facbf6',
        //                 'Cache-Control': 'no-cache',
        //                 Accept: '*/*',
        //                 'User-Agent': 'PostmanRuntime/7.20.1',
        //                 Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE1OTQ4MDk3MzMsImV4cCI6MTU5NDgxMzMzMywicm9sZXMiOlsiUk9MRV9UUkVFRE9OT1IiLCJST0xFX1RQTyIsIlJPTEVfQkFDS0VORCIsIlJPTEVfUkVDT1ZFUlkiLCJST0xFX1VTRVIiXSwidXNlcm5hbWUiOiJpbmZvQHBsYW50LWZvci10aGUtcGxhbmV0Lm9yZyJ9.RhhxHjGuoyBnknHfGHpagZk3VGIf_ZszvNjB_mzuezAiIpIFWAEsYetTCiAIfvTxPPwwCzD_hALlO9uigOAbUyY3TXf9YAH7ZGSrIDG7vvriaMqD3w9eNGQQUjIMcszPqe1uZ6UZcweVxu8zA9gL3KxgIgGoTcPWh3--v-vJsuZEN0nsdx6kuWhRu7TQrxKhxMtKlPVvVLwZ7ZHUGr3NPIQDg_AoeoZUkAjDQepae7W4ncjZ1MmT2XpJiyoe_m5xA44SOqpC3w8vsQtAqul9TgdPmBmx34eZzznQ16JgeAHSsEmzgy0S-g9FajGSqW9I8RspleSAmI39Vlv7zFDDtnBAlCL2xb7sxwJctgXuUGSYLfuX4gV90NadO_zlldQOd6UqfAsw7YSkRgfiJusgj39apoEo0xyfW2F5L6o23ROeXxo53wHttzkp544YE_WUJ23Jh2Bi3ifRaeu6CfNO_kIs2CbgflD3o0nZuddRDAdV1A9f1kDOOmUkANAp0bT5LiUecLnoYq1oxsAEE9GSISX6dj4UaDYKsp_cnmD-waKEy10MsQxlegiQddYs-auWu_lT3UWLUtREY9Ifbt35oOOHGIDocGUjGlWxDLjTxmWeKdYykooZib2-GfUOoEKNymaPaRW21HHD9Z5JsAsZKu1THeS9P2PLmQ8ZY67mt4g',
        //                 'Content-Type': 'application/json'
        //             },
        //         }).then((data) => {
        //             console.log('RESPOSS=', data.data)
        //         })
        //             .catch((err) => {
        //                 console.log("ERROR=", err)
        //             })

        //     }

        // }).catch((err) => {
        //     console.log('ERROR =', err)
        // })
        // console.log('asdasdas')
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
                                Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1qZ3hNREZFT0RZNFFUQkRNelF5TVRNMFJVVTVRelJGTkRORFFVRkdNRVZCUmpnM05FUTJOZyJ9.eyJnaXZlbl9uYW1lIjoiTVVIQU1NQUQiLCJmYW1pbHlfbmFtZSI6Ik5BU0lSIiwibmlja25hbWUiOiJuYXNpcjAzMDgyNDA5MjI5IiwibmFtZSI6Ik1VSEFNTUFEIE5BU0lSIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdoQVNaUXRxdGNXVUpvVWxTd1VpSzFhQTBhNHh3QmZoMDMtMUdOai1BIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoiMjAyMC0wNy0xNVQwNjo1OTo0OC41ODNaIiwiZW1haWwiOiJuYXNpcjAzMDgyNDA5MjI5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL2FjY291bnRzLnBsYW50LWZvci10aGUtcGxhbmV0Lm9yZy8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNTIxOTQwODY5NTE2NTg3NjExNCIsImF1ZCI6IkxpRXFFZWY2NDFQenY4Y0JHbjZpOUp0OWpybnlMSkV0IiwiaWF0IjoxNTk0OTA4OTkxLCJleHAiOjE1OTQ5NDQ5OTF9.bvTXVT8s6dv_q45ejnqG-7wX0k5XSpQllE9VUpvI2bdAu2uLQKfdgw3UrAVUCH6D_nXqX4iGgyjsEgOw8WANSQsB6dBSpZoiCmiwSmJIJe4rX27ZpJXYrISgyqZi35JXZ1BQjw8QRejnA_I1C3n8OV-mj24awSBf65IsY6Y4877M8-PPVTmft5Lj1FderQhyDDWA6MyopvEU0dshJ4v9lZ78e9lUGCpWBsa2jqrW0oB3Zqf5A-8ErkDPTMtwHJGASfIjhM8ic-zY_F04T2OzSaF28kQkqBLcTnPTTA5s4sbjRrjHSg1YmxcChRi15fzADO-CM-T3X2m1VGfYSwVcOg`,
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
