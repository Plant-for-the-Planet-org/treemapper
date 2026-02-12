import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next from 'i18next'
import { getLocales } from 'expo-localization'
import moment from 'moment/min/moment-with-locales'
import { initReactI18next } from 'react-i18next'

import delabels from './languages/de'
import enlabels from './languages/en'
import eslabels from './languages/es'
import brLabels from './languages/pt-BR'
import mglabels from './languages/mg'

const LANGUAGE_STORAGE_KEY = '@treemapper/preferred_language'

export const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'mg', name: 'Malagasy' },
] as const

const supportedCodes = new Set(SUPPORTED_LANGUAGES.map((l) => l.code))

/** Locales that moment.js has built-in; avoid setting others (e.g. mg) to prevent Metro require errors */
const MOMENT_SUPPORTED_LOCALES = new Set(['de', 'en', 'es', 'pt', 'pt-br'])

function setMomentLocale(code: string): void {
  const momentCode = code === 'pt' ? 'pt-br' : code
  if (MOMENT_SUPPORTED_LOCALES.has(momentCode)) {
    moment.locale(momentCode)
  }
  // For 'mg' (Malagasy) and any other unsupported locale, leave moment at current/default
}

function getDeviceLanguage(): string {
  const lang = getLocales()[0]?.languageCode
  if (!lang) return 'en'
  const normalized = lang.toLowerCase().split('-')[0]
  return supportedCodes.has(normalized) ? normalized : 'en'
}

let userLang = getDeviceLanguage()

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
    format: function (value, format) {
      if (value instanceof Date) return moment(value).format(format)
      return value
    },
  },
  lng: userLang,
  fallbackLng: 'en',
  resources: {
    de: { translation: { label: delabels } },
    en: { translation: { label: enlabels } },
    es: { translation: { label: eslabels } },
    pt: { translation: { label: brLabels } },
    mg: { translation: { label: mglabels } },
  },
})

i18next.changeLanguage(userLang)

export async function getStoredLanguage(): Promise<string | null> {
  return AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
}

export async function setAppLanguage(langCode: string): Promise<void> {
  const code = supportedCodes.has(langCode) ? langCode : 'en'
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code)
  await i18next.changeLanguage(code)
  setMomentLocale(code)
}

export async function applyStoredLanguage(): Promise<void> {
  const stored = await getStoredLanguage()
  if (stored && supportedCodes.has(stored)) {
    await i18next.changeLanguage(stored)
    setMomentLocale(stored)
  }
}

export default i18next
