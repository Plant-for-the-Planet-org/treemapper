module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "react-native/react-native": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "react-native",
        "prettier"
    ],
    "parser": "babel-eslint",
    "rules": {
      indent: ['error', 2, { SwitchCase: 1 }],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'linebreak-style': ['error', 'unix'],
      'no-undef': ['error'],
      'no-console': ['warn'],
      'no-unused-vars': ['warn'],
      'react/prop-types': ['off'],
      'react-native/no-unused-styles': ['warn'],
      'react-native/split-platform-components': ['warn'],
      'react-native/no-inline-styles': ['warn'],
      'react-native/no-color-literals': ['off'],
      'prettier/prettier': 'error',
    }
};