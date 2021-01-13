// SCHEMAS
const Coordinates = {
  name: 'Coordinates',
  properties: {
    latitude: 'float',
    longitude: 'float',
    imageUrl: 'string?',
    currentloclat: 'float',
    currentloclong: 'float',
  },
};

const Polygons = {
  name: 'Polygons',
  properties: {
    isPolygonComplete: 'bool?',
    coordinates: 'Coordinates[]',
  },
};

const Species = {
  name: 'Species',
  properties: {
    aliases: 'string',
    treeCount: 'string',
    id: 'string?',
  },
};
const OfflineMaps = {
  name: 'OfflineMaps',
  primaryKey: 'name',
  properties: {
    areaName: 'string',
    size: 'int',
    name: 'string',
  },
};

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
    species_diameter: 'float?',
    species_height: 'float?' // <*IMPORTANT*> ONLY FOR SINGLE TREE
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
    firstname: 'string?',
    lastname: 'string?',
    country: 'string?'
  },
};

const AddSpecies = {
  name: 'AddSpecies',
  primaryKey: 'id',
  properties: {
    id: 'string',
    aliases: 'string?',
    image: 'string?',
    scientificName: 'string',
    status: 'string?',
    speciesId: 'string'
  }
};

export { Coordinates, Polygons, User, OfflineMaps, Species, Inventory, AddSpecies };
