// defines the types of logs supported by the application
export const LogTypes = {
  // log type used for inventory feature
  INVENTORY: 'INVENTORY',
  // log type used for maps feature
  MAPS: 'MAPS',
  // log type for manage species features
  MANAGE_SPECIES: 'MANAGE_SPECIES',
  // log type used while performing sync
  DATA_SYNC: 'DATA_SYNC',
  // log type used for user based functionality
  USER: 'USER',
  // log type used for other functionality 
  OTHER: 'OTHER',
};

// defines the log levels
export const LogLevels = {
  // this is used when the expected behaviour is correct
  INFO: 'INFO',
  // this is used when behaviour of the app is correct but some precaution or suspicious activity needs to be attended
  WARN: 'WARN',
  // this is used when some error occurred and needs to be attended on priority
  ERROR: 'ERROR',
};
