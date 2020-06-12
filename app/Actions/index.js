
import Realm from 'realm';
import { bugsnag } from '../Utils/index'
// SCHEMAS
const Coordinates = {
    name: 'Coordinates',
    properties: {
        latitude: 'float',
        longitude: 'float',
        imageUrl: 'string?',
        locationTitle: 'string',
        currentloclat: 'float',
        currentloclong: 'float',
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
            }).catch(bugsnag.notify);
    })
}

export const updatePlantingDate = ({ inventory_id, plantation_date }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    realm.create('Inventory', {
                        inventory_id: `${inventory_id}`,
                        plantation_date
                    }, 'modified')
                    resolve()
                })
            }).catch(bugsnag.notify);
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
                    resolve()
                })
            }).catch(bugsnag.notify);
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
                    resolve()
                })
            }).catch(bugsnag.notify);
    })
}

export const polygonUpdate = ({ inventory_id }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`)
                    inventory.polygons[0].isPolygonComplete = true;
                    resolve()
                })
            }).catch((err) => {
                reject(err)
                bugsnag.notify(err)
            });
    })
}
export const addCoordinates = ({ inventory_id, geoJSON, currentCoords }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let polygons = []
                    geoJSON.features.map(onePolygon => {
                        let onePolygonTemp = {}
                        onePolygonTemp.isPolygonComplete = onePolygon.properties.isPolygonComplete || false
                        let coordinates = []
                        onePolygon.geometry.coordinates.map((oneLatlong) => {
                            coordinates.push({
                                longitude: oneLatlong[0],
                                latitude: oneLatlong[1],
                                locationTitle: 'A',
                                currentloclat: currentCoords.latitude ? currentCoords.latitude : 0,
                                currentloclong: currentCoords.longitude ? currentCoords.longitude : 0
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
            }).catch((err) => {
                reject(err)
                bugsnag.notify(err)
            });
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
            }).catch(bugsnag.notify);
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
            }).catch(bugsnag.notify);
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
            }).catch(bugsnag.notify);
    })
}

export const insertImageAtIndexCoordinate = ({ inventory_id, imageUrl, index }) => {
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
                        coords[index].imageUrl = imageUrl
                        return { isPolygonComplete: onePolygon.isPolygonComplete, coordinates: coords }
                    })
                    inventory.polygons = polygonsTemp;
                    let coordLength = polygonsTemp[0].coordinates.length
                    console.log('inventory', index, polygonsTemp)
                    resolve(coordLength)
                })
            }).catch(bugsnag.notify);
    })
}

export const removeLastCoord = ({ inventory_id }) => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let inventory = realm.objectForPrimaryKey('Inventory', `${inventory_id}`)
                    let polygons = Object.values(JSON.parse(JSON.stringify(inventory.polygons)));
                    let coords = Object.values(polygons[polygons.length - 1].coordinates)
                    coords = coords.slice(0, coords.length - 1)
                    polygons[polygons.length - 1].coordinates = coords
                    inventory.polygons = polygons;
                    resolve()
                })
            }).catch(bugsnag.notify);

    })
}

export const clearAllInventory = () => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates] })
            .then(realm => {
                realm.write(() => {
                    let allInventory = realm.objects('Inventory').filtered('status == "incomplete"');
                    realm.delete(allInventory); // Delete Inventory\
                    resolve()
                })
            }).catch(bugsnag.notify);

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
            }).catch(bugsnag.notify);

    })
}


