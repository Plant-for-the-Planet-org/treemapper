module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            'moti/skeleton': 'moti/skeleton/react-native-linear-gradient',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: [
          'transform-remove-console',
          'react-native-reanimated/plugin',
          [
            'module-resolver',
            {
              root: ['./'],
              alias: {
                'moti/skeleton': 'moti/skeleton/react-native-linear-gradient',
              },
            },
          ],
        ],
      },
    },
  };
};
