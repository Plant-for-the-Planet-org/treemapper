module.exports = {
  root: true,
  extends: '@react-native-community',
  plugins: ['import'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['app'],
        alias: {
          _assets: './app/assets',
          _components: './app/components',
          _features: './app/features',
          _navigations: './app/navigations',
          _languages: './app/languages',
          _services: './app/services',
          _styles: './app/styles',
          _utils: './app/utils',
        },
      },
    },
  },
};