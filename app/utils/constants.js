// defines the types of logs supported by the application
export default LogTypes = {
  // log type used in single tree feature
  SINGLE_TREE: 'SINGLE_TREE',
  // log type used in multiple trees feature
  MULTIPLE_TREES: 'MULTIPLE_TREES',
  // log type used download maps feature
  DOWNLOAD_MAPS: 'DOWNLOAD_MAPS',
  // log type for manage species features
  MANAGE_SPECIES: 'MANAGE_SPECIES',
  // log type used while performing sync
  DATA_SYNC: 'DATA_SYNC',
  // log type used for user based functionality
  USER: 'USER',
};

// defines the log levels
export default LogLevels = {
  // this is used when the behaviour is correct
  INFO: 'INFO',
  // this is used when behaviour of the app is correct but some precaution or suspicious activity needs to be attended
  WARN: 'WARN',
  // this is used when some error occurred and needs to be attended on priority
  ERROR: 'ERROR',
};
