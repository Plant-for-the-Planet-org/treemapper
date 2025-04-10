import i18next from 'i18next'
import {getLocales} from 'expo-localization'
import moment from 'moment/min/moment-with-locales'
import {initReactI18next} from 'react-i18next'

import delabels from './languages/de'
import enlabels from './languages/en'
import eslabels from './languages/es'
import brLabels from './languages/pt-BR'

let userLang = undefined
const lang = getLocales()[0]
userLang = lang?.languageCode

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  interpolation: {
    // React already does escaping
    escapeValue: false,
    format: function (value, format) {
      if (value instanceof Date) return moment(value).format(format)
      return value
    },
  },
  lng: userLang,
  fallbackLng: 'en', // If language detector fails
  resources: {
    de: {translation: {label: delabels}},
    en: {translation: {label: enlabels}},
    es: {translation: {label: eslabels}},
    ptBR: {translation: {label: brLabels}},
  },
})

i18next.changeLanguage(userLang)

export default i18next
