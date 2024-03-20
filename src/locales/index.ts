import i18next from 'i18next';
import { getLocales } from 'expo-localization';
import moment from 'moment/min/moment-with-locales';
import DropDownPicker from 'react-native-dropdown-picker';


import delabels from './languages/de';
import enlabels from './languages/en';
import eslabels from './languages/es';
import frlabels from './languages/fr';
import ptBRlabels from './languages/pt-BR';

let userLang = undefined;
const lang = getLocales()[0];
userLang = lang && lang.languageCode;


i18next.init({
  compatibilityJSON: 'v3',
  interpolation: {
    // React already does escaping
    escapeValue: false,
    format: function (value, format) {
      if (value instanceof Date) return moment(value).format(format);
      return value;
    },
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
i18next.on('languageChanged', function (lng) {
  moment.locale(lng);
  DropDownPicker.addTranslation(lng.toUpperCase(), {
    PLACEHOLDER: i18next.t('label.dropdownpicker_placeholder', { lng: lng }),
    SEARCH_PLACEHOLDER: i18next.t('label.dropdownpicker_search_placeholder', { lng: lng }),
    SELECTED_ITEMS_COUNT_TEXT: i18next.t('label.dropdownpicker_selected_items_count', { lng: lng }),
    NOTHING_TO_SHOW: i18next.t('label.dropdownpicker_nothing_to_show', { lng: lng }),
  });
});
i18next.changeLanguage(userLang);

export default i18next;
