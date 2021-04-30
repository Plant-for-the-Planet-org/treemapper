// schema version
const schemaVersion = 3;

// SCHEMAS
const Coordinates = {
  name: 'Coordinates',
  properties: {
    latitude: 'float',
    longitude: 'float',
    imageUrl: 'string?',
    currentloclat: 'float',
    currentloclong: 'float',
    isImageUploaded: 'bool?',
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
    treeCount: 'int',
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
    plantation_date: 'date?',
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
    species_height: 'float?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
    response: 'string?',
    tag_id: 'string?',
    registration_date: 'date?',
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
    image: 'string?',
    country: 'string?',
    isLogEnabled: 'bool?',
    tpoId: 'string?',
    refreshToken: 'string?',
    isSignUpRequired: 'bool?',
    type: 'string?',
    displayName: 'string?',
  },
};

//  used to store the logs of a feature or a flow
const ActivityLogs = {
  name: 'ActivityLogs',
  primaryKey: 'id',
  properties: {
    // id of the log
    id: 'string',
    // id of the feature or flow this log is linked to. (optional)
    referenceId: 'string?',
    // defines the type of log. Refer to constants - LogTypes
    logType: 'string',
    // defines the log level. Refer constants - LogLevels
    logLevel: 'string',
    // time at which the log was created or modified
    timestamp: 'date',
    // text which is to be logged
    message: 'string',
    // version of tree mapper app
    appVersion: 'string',
    // status code for api request (optional)
    statusCode: 'string?',
    // used to show extra details if available (optional)
    logStack: 'string?',
  },
};

// used to store all the available scientific species extracted from zip
const ScientificSpecies = {
  name: 'ScientificSpecies',
  primaryKey: 'guid',
  properties: {
    // stores the guid of scientific specie
    guid: 'string',
    // stores the name of scientific specie and indexed for better search
    scientificName: { type: 'string', indexed: true },
    // used to check if this specie is preferred by user or not. Default to [false]
    isUserSpecies: { type: 'bool', default: false },
    // used to check whether this specie is synced to server or not. Defaults to [false]
    // This property is used with [isUserSpecies]
    isUploaded: { type: 'bool', default: false },
    // stores the specieId which is uploaded on server
    specieId: 'string?',
  },
};

const migration = () => {};

export default {
  schema: [
    Coordinates,
    Polygons,
    User,
    OfflineMaps,
    Species,
    Inventory,
    ScientificSpecies,
    ActivityLogs,
  ],
  schemaVersion,
  migration,
};
