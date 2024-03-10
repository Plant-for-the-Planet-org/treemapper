module.exports = {
    root: true,
    env: {
          node: true,
          browser: true,
          es2021: true,
      },
    extends: [
    "plugin:react/recommended",
    "prettier",
    "eslint:recommended",
    "plugin:jest/recommended", 
    "plugin:@typescript-eslint/recommended"
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint','react'],
    rules: {
      'react/no-unescaped-entities': 0,
      'react-native/no-inline-styles': 0,
    },
    ignorePatterns: [
      '**/__mocks__/*.ts',
      'src/platform/polyfills.ts',
      'src/third-party',
      'ios',
      'android',
      'coverage',
      '*.lock',
      '.husky',
      'patches',
      'bskyweb',
      '*.html',
      'bskyweb',
      'src/locale/locales/_build/',
      'src/locale/locales/**/*.js',
    ],
    settings: {
      componentWrapperFunctions: ['observer'],
      "jest": {
        "version": "latest"
    }
    },
  }