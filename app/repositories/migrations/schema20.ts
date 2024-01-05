import { ENV_TYPE } from '../../environment';
import { InventoryType } from '../../types/inventory';

// schema version
const schemaVersion = 20;

// SCHEMAS
const Coordinates = {
  name: 'Coordinates',
  properties: {
    latitude: 'double',
    longitude: 'double',
    imageUrl: 'string?',
    cdnImageUrl: 'string?',
    currentloclat: 'double',
    currentloclong: 'double',
    isImageUploaded: 'bool?',
    coordinateID: 'string?',
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

const AdditionalDetail = {
  name: 'AdditionalDetail',
  properties: {
    key: 'string',
    value: 'string',
    // refer [dataTypes] from [additionalDataConstants]
    accessType: 'string',
  },
};

const remeasurementDates = {
  name: 'RemeasurementDates',
  properties: {
    sampleTreeId: 'string',
    created: 'date',
    lastMeasurement: 'date?',
    remeasureBy: 'date',
    nextMeasurement: 'date?',
  },
};

const PlantLocationHistory = {
  name: 'PlantLocationHistory',
  primaryKey: 'id',
  properties: {
    // id of this history
    id: 'string',
    eventName: 'string?',
    // date when this history was created
    eventDate: 'date',
    // URL of the image if picture was clicked
    imageUrl: 'string?',
    // CDN URL of the image if picture was clicked
    cdnImageUrl: 'string?',
    // diameter of selected species
    diameter: 'double?',
    // height of selected species
    height: 'double?',
    // stores the additional details for the registration
    additionalDetails: 'AdditionalDetail[]',
    // stores the app metadata. Needs to be stringified as it might contain nested array/objects
    appMetadata: 'string?',
    // status of the event or plant location history
    status: 'string?',
    // reason for the current status
    statusReason: 'string?',
    // status of data maintained for updating and uploading of the plant location history
    dataStatus: 'string?',
    // id of the plant location
    parentId: 'string?',
    // if the plant location history is for sample tree then add the sample tree index
    samplePlantLocationIndex: 'int?',
    //last navigation screen
    lastScreen: 'string?',
  },
};

// used to record the sample trees
const SampleTrees = {
  name: 'SampleTrees',
  properties: {
    // stores the latitude of the tree
    latitude: 'double',
    // stores the longitude of the tree
    longitude: 'double',
    // stores the latitude of the device when location was marked
    deviceLatitude: 'double',
    // stores the longitude of the device when location was marked
    deviceLongitude: 'double',
    // stores accuracy of location when the location was marked
    locationAccuracy: 'double?',
    // URL of the image if picture was clicked
    imageUrl: 'string?',
    // CDN URL of the image if picture was clicked
    cdnImageUrl: 'string?',
    // specie id for this sample tree
    specieId: 'string?',
    // specie name of specie id for this sample tree
    specieName: 'string?',
    // diameter of selected specie
    specieDiameter: 'double?',
    // height of selected specie
    specieHeight: 'double?',
    // tag id of the tree if the tree has one
    tagId: 'string?',
    // current status of the tree. Refer to inventoryConstants for different status
    status: { type: 'string', default: 'INCOMPLETE' },
    // stores the date when the tree was planted
    plantationDate: 'date?',
    // stores the location id when the data upload is successful
    locationId: 'string?',
    // stores the tree type which is always sample tree
    treeType: { type: 'string', default: 'sample' },
    // stores the additional details for the registration
    additionalDetails: 'AdditionalDetail[]',
    // stores the app metadata. Needs to be stringified as it might contain nested array/objects
    appMetadata: 'string?',
    // stores the hid when registration is uploaded successfully
    hid: 'string?',
    // stores the plant location version history
    plantLocationHistory: 'PlantLocationHistory[]',
    //store remeasurement related dates
    remeasurementDates: 'RemeasurementDates?',
  },
};

const Inventory = {
  name: 'Inventory',
  primaryKey: 'inventory_id',
  properties: {
    inventory_id: 'string',
    plantation_date: 'date?',
    treeType: 'string?',
    status: 'string?',
    projectId: 'string?',
    donationType: 'string?',
    locateTree: 'string?',
    lastScreen: 'string?',
    species: 'Species[]',
    polygons: 'Polygons[]',
    specieDiameter: 'double?',
    specieHeight: 'double?', // <*IMPORTANT*> ONLY FOR SINGLE TREE
    tagId: 'string?',
    registrationDate: 'date?',
    // stores the count of sample trees which are to be recorded
    sampleTreesCount: 'int?',
    // stores the sample trees having length equal to tree count
    sampleTrees: 'SampleTrees[]',
    // stores the number of sample trees which are already recorded
    completedSampleTreesCount: {
      type: 'int?',
      default: 0,
    },
    // stores the number of sample trees which are uploaded to server
    uploadedSampleTreesCount: {
      type: 'int?',
      default: 0,
    },
    // stores the location id of the plant location which is available
    // when the inventory data is uploaded
    locationId: 'string?',
    // stores the additional details for the registration
    additionalDetails: 'AdditionalDetail[]',
    // stores the app metadata. Needs to be stringified as it might contain nested array/objects
    appMetadata: 'string?',
    // stores the hid when registration is uploaded successfully
    hid: 'string?',
    // stores the original geoJSON of coordinates in string which was uploaded
    // for the first time for a registration
    originalGeometry: 'string?',
    // stores the plant location version history
    plantLocationHistory: 'PlantLocationHistory[]',
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
    userId: 'string?',
    userType: 'string?',
    refreshToken: 'string?',
    isSignUpRequired: 'bool?',
    type: 'string?',
    displayName: 'string?',
    // stores the expiry time of token in seconds
    expirationTime: 'int?',
    fetchNecessaryInventoryFlag: { type: 'int', default: InventoryType.NecessaryItems },
    fetchGivenMonthsInventoryFlag: 'int?',
    appEnvironment: 'string',
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
    aliases: { type: 'string', default: '' },
    image: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    isUpdated: { type: 'bool', default: true },
  },
};

const ProjectSites = {
  name: 'ProjectSites',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    description: 'string?',
    status: 'string?',
    geometry: 'string',
  },
};

// used to store all the available scientific species extracted from zip
const Projects = {
  name: 'Projects',
  primaryKey: 'id',
  properties: {
    id: 'string',
    slug: 'string',
    allowDonations: 'bool',
    countPlanted: 'int',
    countTarget: 'int',
    currency: 'string',
    image: 'string',
    country: 'string',
    name: 'string',
    treeCost: 'double?',
    sites: 'ProjectSites[]',
    // stores the geometry of the project
    geometry: 'string',
    frequency: { type: 'string', default: 'Default' }, //in number of days
    intensity: { type: 'int', default: 100 }, //percentage of sample to be remeasured
  },
};

// dropdown options for dropdown field
const DropdownOption = {
  name: 'DropdownOption',
  embedded: true,
  properties: {
    key: 'string',
    value: 'string',
  },
};

// Element Type - Dropdown
const Dropdown = {
  name: 'Dropdown',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parentId: {
      type: 'string',
      indexed: true,
    },
    defaultValue: 'string?',
    isRequired: {
      type: 'bool',
      default: false,
    },
    dropdownOptions: 'DropdownOption[]',
  },
};

// Element Type - Input
const Input = {
  name: 'Input',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parentId: {
      type: 'string',
      indexed: true,
    },
    defaultValue: 'string?',
    isRequired: {
      type: 'bool',
      default: false,
    },
    type: 'string',
    regexValidation: 'string?',
  },
};

// Element Type - YesNo
const YesNo = {
  name: 'YesNo',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parentId: {
      type: 'string',
      indexed: true,
    },
    defaultValue: {
      type: 'bool',
      default: false,
    },
    isRequired: {
      type: 'bool',
      default: false,
    },
  },
};

// Stores details of a single field which then is stores in form fields list
const Element = {
  name: 'Element',
  primaryKey: 'id',
  properties: {
    id: 'string',
    key: 'string',
    name: 'string',
    type: 'string',
    treeType: 'string[]',
    registrationType: 'string[]',
    // refer [dataTypes] from [additionalDataConstants]
    accessType: { type: 'string', default: 'private' },
  },
};

// Stores all the forms(multi steps) created by the user
const Form = {
  name: 'Form',
  primaryKey: 'id',
  properties: {
    id: 'string',
    order: 'int',
    // stores list of all the elements for a form
    elements: 'Element[]',
    title: 'string?',
    description: 'string?',
  },
};

// Stores all the metadata added by the user from Metadata UI
const Metadata = {
  name: 'Metadata',
  primaryKey: 'id',
  properties: {
    id: 'string',
    key: 'string',
    value: 'string',
    order: 'int',
    // refer [dataTypes] from [additionalDataConstants]
    accessType: { type: 'string', default: 'private' },
  },
};

// migration to delete all the SYNCED registrations
const migration = (oldRealm: any, newRealm: any) => {
  // checkAndMarkMissingData({ oldRealm, newRealm, schemaVersion, isMigration: true });
  // deleteSyncedAndMigrate(oldRealm, newRealm, schemaVersion);
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
    SampleTrees,
    Projects,
    DropdownOption,
    Dropdown,
    Input,
    YesNo,
    Element,
    Form,
    Metadata,
    AdditionalDetail,
    ProjectSites,
    PlantLocationHistory,
    remeasurementDates,
  ],
  schemaVersion,
  migration,
};
