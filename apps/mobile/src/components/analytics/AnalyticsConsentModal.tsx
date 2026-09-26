import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import openWebView from 'src/utils/helpers/appHelper/openWebView'
import { AnalyticsConsent } from 'src/types/interface/slice.interface'

export const PRIVACY_TERMS_URL = 'https://www.plant-for-the-planet.org/privacy-terms/'

interface Props {
  isVisible: boolean
  consent: AnalyticsConsent
  // First launch has to be answered, so it has no close button and ignores
  // backdrop taps and the back button. From settings it can be dismissed.
  dismissible: boolean
  onChoose: (choice: 'granted' | 'denied') => void
  onClose?: () => void
}

const AnalyticsConsentModal = ({ isVisible, consent, dismissible, onChoose, onClose }: Props) => {
  const { t } = useTranslation()
  const close = dismissible ? onClose : undefined

  return (
    <Modal
      style={styles.modal}
      isVisible={isVisible}
      onBackdropPress={close}
      onBackButtonPress={close}
      useNativeDriverForBackdrop
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.WHITE} />
          </View>
          <Text style={styles.title}>{t('label.analytics_consent_title')}</Text>
          {dismissible && (
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={Colors.TEXT_COLOR} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.text}>{t('label.analytics_consent_body')}</Text>
          <Text style={[styles.text, styles.question]}>{t('label.analytics_consent_question')}</Text>
          <Text style={styles.note}>{t('label.analytics_consent_anonymous_note')}</Text>
          <Text style={styles.note}>{t('label.analytics_consent_change_note')}</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openWebView(PRIVACY_TERMS_URL)}
            accessibilityRole="link"
          >
            <Text style={styles.link}>{t('label.analytics_consent_privacy_link')}</Text>
            <Ionicons name="open-outline" size={14} color={Colors.NEW_PRIMARY} />
          </TouchableOpacity>
        </ScrollView>

        {consent !== 'unset' && (
          <Text style={styles.status}>
            {consent === 'granted'
              ? t('label.analytics_consent_status_granted')
              : t('label.analytics_consent_status_denied')}
          </Text>
        )}

        {/* Both answers get the same weight: neither is the "default" one. */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, consent === 'denied' && styles.buttonSelected]}
            onPress={() => onChoose('denied')}
          >
            <Text style={[styles.buttonText, consent === 'denied' && styles.buttonTextSelected]}>
              {t('label.analytics_consent_decline')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, consent === 'granted' && styles.buttonSelected]}
            onPress={() => onChoose('granted')}
          >
            <Text style={[styles.buttonText, consent === 'granted' && styles.buttonTextSelected]}>
              {t('label.analytics_consent_allow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default AnalyticsConsentModal

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.NEW_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
  },
  body: {
    flexGrow: 0,
  },
  text: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    lineHeight: scaleFont(21),
    marginBottom: 12,
  },
  question: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  note: {
    fontSize: scaleFont(13),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.GRAY_TEXT,
    lineHeight: scaleFont(19),
    marginBottom: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  link: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
    textDecorationLine: 'underline',
  },
  status: {
    fontSize: scaleFont(13),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.NEW_PRIMARY,
    backgroundColor: Colors.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    backgroundColor: Colors.NEW_PRIMARY,
  },
  buttonText: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: Colors.WHITE,
  },
})
