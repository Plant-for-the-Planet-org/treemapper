import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import i18next, { SUPPORTED_LANGUAGES, setAppLanguage } from 'src/locales'

const LanguageSettingsView = () => {
  const { i18n } = useTranslation()
  const [saving, setSaving] = useState<string | null>(null)
  const currentLang = i18n.language?.split('-')[0] || 'en'

  const onSelectLanguage = async (code: string) => {
    if (code === currentLang) return
    setSaving(code)
    try {
      await setAppLanguage(code)
    } finally {
      setSaving(null)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        label={i18next.t('label.language')}
        showBackIcon={true}
      />
      <View style={styles.content}>
        <Text style={styles.hint}>{i18next.t('label.select_language')}</Text>
        {SUPPORTED_LANGUAGES.map(({ code, name }) => {
          const isSelected = currentLang === code
          const isSaving = saving === code
          const renderRight = () => {
            if (isSaving) return <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} />
            if (isSelected) return <Ionicons name="checkmark-circle" size={24} color={Colors.NEW_PRIMARY} />
            return null
          }
          return (
            <Pressable
              key={code}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              onPress={() => onSelectLanguage(code)}
              disabled={!!saving}
            >
              <Text style={styles.languageName}>{name}</Text>
              {renderRight()}
            </Pressable>
          )
        })}
      </View>
    </SafeAreaView>
  )
}

export default LanguageSettingsView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  hint: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleFont(14),
    color: Colors.TEXT_COLOR,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: Colors.GRAY_BACKDROP,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rowPressed: {
    opacity: 0.8,
  },
  languageName: {
    fontFamily: Typography.FONT_FAMILY_MEDIUM,
    fontSize: scaleFont(16),
    color: Colors.TEXT_COLOR,
  },
})
