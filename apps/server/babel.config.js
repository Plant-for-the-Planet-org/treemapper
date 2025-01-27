module.exports = {
    presets: ['next/babel'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: '../../packages/ui/tamagui.config.ts',
          importsWhitelist: ['constants.js', 'colors.js']
        }
      ]
    ]
  }