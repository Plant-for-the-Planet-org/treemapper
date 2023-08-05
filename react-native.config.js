module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./app/assets/fonts'],
  dependencies: {
    ...(process.env.NO_FLIPPER ? { 'react-native-flipper': { platforms: { ios: null } } } : {}),
  },
};
