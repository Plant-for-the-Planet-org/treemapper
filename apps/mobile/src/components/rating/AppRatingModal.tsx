import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'

interface Props {
  isVisible: boolean
  // The person is enjoying the app -> send them to rate.
  onEnjoying: () => void
  // The person is not enjoying it -> route to feedback instead of the store.
  onNotEnjoying: () => void
  // Closed without choosing (backdrop, back button, or the close icon).
  onDismiss: () => void
}

const AppRatingModal = ({ isVisible, onEnjoying, onNotEnjoying, onDismiss }: Props) => {
  const { t } = useTranslation()

  return (
    <Modal
      style={styles.modal}
      isVisible={isVisible}
      onBackdropPress={onDismiss}
      onBackButtonPress={onDismiss}
      useNativeDriverForBackdrop
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="star" size={20} color={Colors.WHITE} />
          </View>
          <Text style={styles.title}>{t('label.rating_prompt_title')}</Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={10}>
            <Ionicons name="close" size={24} color={Colors.TEXT_COLOR} />
          </TouchableOpacity>
        </View>

        <Text style={styles.text}>{t('label.rating_prompt_body')}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={onNotEnjoying}>
            <Text style={styles.buttonText}>{t('label.rating_prompt_not_really')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={onEnjoying}
          >
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
              {t('label.rating_prompt_love_it')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default AppRatingModal

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
  text: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    lineHeight: scaleFont(21),
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
  buttonPrimary: {
    backgroundColor: Colors.NEW_PRIMARY,
  },
  buttonText: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: Colors.WHITE,
  },
})
