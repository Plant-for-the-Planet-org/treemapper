module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Required for Tamagui
        [
          'transform-inline-environment-variables',
          {
            include: ['TAMAGUI_TARGET', 'EXPO_ROUTER_APP_ROOT'],
          },
        ],
      ],
    };
  };