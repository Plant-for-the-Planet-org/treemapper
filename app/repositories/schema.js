// schema for storing the coordinates of an inventory
const Coordinates = {
  name: 'Coordinates',
  properties: {
    latitude: 'float',
    longitude: 'float',
    imageUrl: 'string?',
  },
};

const Polygons = {
  name: 'Polygons',
  properties: {
    isPolygonComplete: 'bool?',
    coordinates: 'Coordinates[]',
  },
};

const InventorySpecies = {
  name: 'InventorySpecies',
  properties: {
    alias: 'string',
    treeCount: 'string',
    specieId: 'string?',
  },
};

const OfflineMaps = {
  name: 'OfflineMaps',
  primaryKey: 'mapID',
  properties: {
    mapId: 'string',
    size: 'int',
    name: 'string',
  },
};

const Inventory = {
  name: 'Inventory',
  primaryKey: 'inventoryId',
  properties: {
    inventoryId: 'string',
    plantationDate: 'string?',
    treeType: 'string?',
    status: 'string?',
    projectId: 'string?',
    donationType: 'string?',
    locationType: 'string?',
    lastScreen: 'string?',
    species: 'InventorySpecies[]',
    polygons: 'Polygons[]',
    specieName: 'string?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
    specieDiameter: 'float?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
    specieHeight: 'float?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
  },
};

const User = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'string?',
    accessToken: 'string?',
    idToken: 'string?',
    email: 'string?',
    firstName: 'string?',
    lastName: 'string?',
    country: 'string?',
    loggedInTimestamp: 'string?',
    image: 'string?',
  },
};

const UserSpecies = {
  name: 'UserSpecies',
  primaryKey: 'id',
  properties: {
    id: 'string',
    alias: 'string?',
    image: 'string?',
    scientificName: 'string',
    status: 'string?',
    specieId: 'string',
  },
};

export { Coordinates, Polygons, User, OfflineMaps, InventorySpecies, Inventory, UserSpecies };
