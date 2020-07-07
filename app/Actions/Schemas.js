// SCHEMAS
const Coordinates = {
    name: 'Coordinates',
    properties: {
        latitude: 'float',
        longitude: 'float',
        imageUrl: 'string?',
        currentloclat: 'float',
        currentloclong: 'float',
    }
}

const Polygons = {
    name: 'Polygons',
    properties: {
        isPolygonComplete: 'bool?',
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
const OfflineMaps = {
    name: 'OfflineMaps',
    primaryKey: 'name',
    properties: {
        areaName: 'string',
        size: 'int',
        name: 'string'
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
        polygons: 'Polygons[]',
        specei_name: 'string?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
        specei_diameter: 'float?' // <*IMPORTANT*> ONLY FOR SINGLE TREE
    }
};

const User = {
    name: 'User',
    properties: {
        accessToken: 'string?',
        idToken: 'string?'
    }
}

export { Coordinates, Polygons, User, OfflineMaps ,Species, Inventory}