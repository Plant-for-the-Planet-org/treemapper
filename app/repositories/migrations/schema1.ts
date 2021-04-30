// schema version
const schemaVersion = 1;

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

const ScientificSpecies = {
  name: 'ScientificSpecies',
  primaryKey: 'guid',
  properties: {
    guid: 'string',
    scientific_name: { type: 'string', indexed: true },
    isUserSpecies: { type: 'bool', default: false },
  },
};

const migration = (oldRealm: any, newRealm: any) => {
  if (oldRealm.schemaVersion < schemaVersion) {
    const oldUserObject = oldRealm.objects('User');
    const newUserObject = newRealm.objects('User');
    for (const index in oldUserObject) {
      newUserObject[index].firstName = oldUserObject[index].firstname;
      newUserObject[index].lastName = oldUserObject[index].lastname;
      newUserObject[index].isLogEnabled = oldUserObject[index].IsLogEnabled;
    }
  }
};

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
