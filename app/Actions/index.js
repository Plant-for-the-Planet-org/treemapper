
import Realm from 'realm';

// SCHEMAS
// schema and start object 1588846833895.
const Coordinates = {
    name: 'Coordinates',
    properties: {
        latitude: 'string',
        longitude: 'string',
        imageUrl: 'string',
        locationTitle: 'string'
    }
}
const Polygons = {
    name: 'Polygons',
    properties: {
        isPolygonComplete: 'string',
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
                        onePolygonTemp.isPolygonComplete = String(onePolygon.properties.isPolygonComplete)
                        let coordinates = []
                        onePolygon.geometry.coordinates.map((oneLatlong) => {
                            coordinates.push({
                                longitude: String(oneLatlong[1]),
                                latitude: String(oneLatlong[0]),
                                imageUrl: '',
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
                    inventory = JSON.parse(JSON.stringify(inventory));
                    let polygons = Object.values(inventory.polygons)
                    Object.values(polygons[polygons.length - 1].coordinates)[Object.values(polygons[polygons.length - 1].coordinates).length - 1].imageUrl = imageUrl
                    polygons.map(x => {
                        x.coordinates = Object.values(x.coordinates)
                    })
                    console.log(polygons,'POLYGONS _______')
                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        polygons: polygons
                    }, 'modified')
                    const Inventory = realm.objects('Inventory');
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