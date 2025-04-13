module.exports = {
    presets: ['next/babel'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: '../../packages/dashboard/provider/tamagui.config.ts',
          importsWhitelist: ['constants.js', 'colors.js']
        }
      ]
    ]
  }