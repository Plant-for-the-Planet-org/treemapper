
import Realm from 'realm';

// SCHEMAS
// schema and start object 1588846833895.
const Coordinates = {
    name: 'Coordinates',
    properties: {
        latitude: 'float',
        longitude: 'float',
        imageUrl: 'string?',
        locationTitle: 'string'
    }
}
const Polygons = {
    name: 'Polygons',
    properties: {
        isPolygonComplete: 'bool',
        coordinates: 'Coordinates[]',
    }
}
const Species = {
    name: 'Species',
    properties: {
        nameOfTree: 'string',
        treeCount: 'string',
    }
}
const Inventory = {
    name: 'Inventory',
    primaryKey: 'inventory_id',
    properties: {
        inventory_id: 'string',
        plantation_date: 'string?',
        tree_type: 'string?',
        status: 'string?',
        project_id: 'string?',
        donation_type: 'string?',
        locate_tree: 'string?',
        last_screen: 'string?',
        species: 'Species[]',
        polygons: 'Polygons[]'
    }
};
//  GET All Inventories
Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
    .then(realm => {
        realm.write(() => {
            const Inventory = realm.objects('Inventory');
            console.log(JSON.parse(JSON.stringify(Inventory)), 'JSON.stringify(Inventory)')
        })
    })

export const initiateInventory = ({ treeType }) => {
    return new Promise((resolve, reject) => {

        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let inventoryID = `${new Date().getTime()}`
                    realm.create('Inventory', {
                        inventory_id: inventoryID,
                        tree_type: treeType,
                        status: 'incomplete',
                    })
                    resolve(inventoryID)
                })
            })
    })
}

export const addSpeciesAction = ({ inventory_id, species, plantation_date }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        species,
                        plantation_date
                    }, 'modified')
                    const Inventory = realm.objects('Inventory');
                    console.log(JSON.parse(JSON.stringify(Inventory)), 'JSON.stringify(Inventory)')
                    resolve()
                })
            })
    })
}

export const addLocateTree = ({ locate_tree, inventory_id }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        locate_tree
                    }, 'modified')
                    const Inventory = realm.objects('Inventory');
                    resolve()
                })
            })
    })
}

export const addCoordinates = ({ inventory_id, geoJSON }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let polygons = []
                    geoJSON.features.map(onePolygon => {
                        let onePolygonTemp = {}
                        onePolygonTemp.isPolygonComplete = onePolygon.properties.isPolygonComplete
                        let coordinates = []
                        onePolygon.geometry.coordinates.map((oneLatlong) => {
                            coordinates.push({
                                longitude: oneLatlong[1],
                                latitude: oneLatlong[0],
                                locationTitle: 'A'
                            })
                        })
                        onePolygonTemp.coordinates = coordinates;
                        polygons.push(onePolygonTemp)
                    })
                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        polygons: polygons
                    }, 'modified')

                    resolve()
                })
            })
    })
}



export const getAllInventory = () => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    const Inventory = realm.objects('Inventory');
                    console.log(JSON.parse(JSON.stringify(Inventory)), 'JSON.parse(JSON.stringify(Inventory))')
                    resolve(JSON.parse(JSON.stringify(Inventory)))
                })
            })
    })
}

export const getInventory = ({ inventoryID }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let inventory = realm.objectForPrimaryKey('Inventory', inventoryID)
                    resolve(JSON.parse(JSON.stringify(inventory)))
                })
            })
    })
}

export const statusToPending = ({ inventory_id }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        status: 'pending'
                    }, 'modified')
                    const Inventory = realm.objects('Inventory');
                    resolve()
                })
            })
    })
}


export const insertImageAtLastCoordinate = ({ inventory_id, imageUrl }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {

                    let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`)
                    // inventory = JSON.parse(JSON.stringify(inventory));
                    let polygons = Object.values(JSON.parse(JSON.stringify(inventory.polygons)));
                    let polygonsTemp = []
                    let coordinatesTemp = []

                    polygonsTemp = polygons.map((onePolygon, i) => {
                        let coords = Object.values(onePolygon.coordinates)
                        coords[coords.length - 1].imageUrl = imageUrl
                        return { isPolygonComplete: onePolygon.isPolygonComplete, coordinates: coords }
                    })
                    inventory.polygons = polygonsTemp;
                    console.log(polygonsTemp, 'TEMP')
                    // polygons.map(onePolygon => {
                    //     let coordinate = Object.values(onePolygon.coordinates)
                    //     coordinate.map((oneCoordinate, i) => {
                    //         if (i == coordinate.length - 1) {
                    //             coordinate.pop();
                    //             coordinate.push({ })
                    //         } else {
                    //             coordinatesTemp.push(oneCoordinate);
                    //         }

                    //     })
                    // })


                    // let coord = polygons[polygons.length - 1].coordinates[(polygons[polygons.length - 1].coordinates).length - 1]
                    // coord.imageUrl = imageUrl
                    // console.log(polygonsTemp, 'POLYGONS _______')

                    // realm.create('Inventory', {
                    //     inventory_id: `${inventory_id}`,
                    //     polygons: polygonsTemp
                    // }, 'modified')
                    // const Inventory = realm.objects('Inventory');
                    resolve()
                })
            })
    })
}


export const clearAllInventory = () => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let allInventory = realm.objects('Inventory').filtered('status == "incomplete"');
                    realm.delete(allInventory); // Deletes Inventory\
                    resolve()
                })
            })

    })
}
export const updateLastScreen = ({ last_screen, inventory_id }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {

                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        last_screen: last_screen
                    }, 'modified')
                    resolve()
                })
            })

    })
}


