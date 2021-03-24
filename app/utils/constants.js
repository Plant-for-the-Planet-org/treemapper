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

// multiplication factor to convert foot to meter
export const footToMeter = 0.3048;

// multiplication factor to convert inch to centimeter
export const inchToCm = 2.54;

// multiplication factor to convert meter to foot
export const meterToFoot = 1 / footToMeter;

// multiplication factor to convert centimeter to inch
export const cmToInch = 1 / inchToCm;

// min diameter value in centimeter
export const diameterMinCm = 0.1;

// max diameter value in centimeter
export const diameterMaxCm = 10000;

// min height value in meter
export const heightMinM = 0.01;

// max height value in meter
export const heightMaxM = 200;

// min diameter value in inch
export const diameterMinInch = 0.03937;

// max diameter value in inch
export const diameterMaxInch = 3937.0079;

// min height value in foot
export const heightMinFoot = 0.0328;

// max height value in foot
export const heightMaxFoot = 656.1679;

// countries which does not follow International System of Units for measurements
export const nonISUCountries = ['US', 'LR', 'MM'];
