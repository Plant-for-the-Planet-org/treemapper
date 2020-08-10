import i18next from 'i18next';
// import { getLanguages } from 'react-native-i18n';
import * as RNLocalize from 'react-native-localize';

// Refer this for checking the codes and creating new folders https://developer.chrome.com/webstore/i18n
// Step 1 - Create index.js files for each language we want to have, in this file you can import all the json files (Step 4) and export them
// Step 2 - Import them with a unique title
// Step 3 - Add these titles under the resources object in the i18next.init function
// Step 4 - Create separate json files for various sections under the language folder ex. en/intro1.json
// Step 5 - Add the labels to be used in respective json files. The labels are the key and the content is the value in different language, so make sure for each file the key remains the same
// Step 6 - In React Native code import the main languages file and call the translate function - languages.t('label.labelname')

import delabels from './de';
import enlabels from './en';
import eslabels from './es';
import frlabels from './fr';
import ptBRlabels from './pt-BR';

// This will fetch the user's language
let userLang = undefined;
const lang = RNLocalize.getLocales()[0];
userLang = lang && lang.languageCode;
// getLanguages().then(languages => {
//   userLang = languages[0].split('-')[0]; // ['en-US' will become 'en']
//   i18next.changeLanguage(userLang);
// });

i18next.init({
  interpolation: {
    // React already does escaping
    escapeValue: false,
  },
  lng: userLang, // 'en' | 'es',
  fallbackLng: 'en', // If language detector fails
  resources: {
    de: {
      translation: {
        label: delabels,
      },
    },
    en: {
      translation: {
        label: enlabels,
      },
    },
    es: {
      translation: {
        label: eslabels,
      },
    },
    fr: {
      translation: {
        label: frlabels,
      },
    },
    pt: {
      translation: {
        label: ptBRlabels,
      },
    },
  },
});
i18next.changeLanguage(userLang);

export default i18next;
