import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography, Colors } from 'src/utils/constants'
import LoginButton from './LoginButton'
import openWebView from 'src/utils/helpers/appHelper/openWebView'
import * as Application from 'expo-application'
interface Props {
  isLoggedIn: boolean
}

const SideBarFooter = (props: Props) => {
  const { isLoggedIn } = props
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'en'
  const onPressImprint = () => {
    openWebView(`https://pp.eco/legal/${lang}/imprint`)
  }
  const onPressPolicy = () => {
    openWebView(`https://pp.eco/legal/${lang}/privacy`)
  }
  const onPressTerms = () => {
    openWebView(`https://pp.eco/legal/${lang}/terms`)
  }
  return (
    <View style={[styles.versionContainer]}>
      {!isLoggedIn && <LoginButton />}
      <View style={styles.termsContainer}>
        <View key="version">
          <Text style={styles.itemText}>
            v{Application.nativeApplicationVersion}
          </Text>
        </View>
        <View style={styles.dot} />
        <TouchableOpacity key="privacy_policy" onPress={onPressPolicy}>
          <Text style={styles.itemText}>
            {t('label.privacy_policy')}
          </Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity key="imprint" onPress={onPressImprint}>
          <Text style={styles.itemText}>{t('label.imprint')}</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity key="terms_of_service" onPress={onPressTerms}>
          <Text style={styles.itemText}>
            {t('label.terms_of_service')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
export default SideBarFooter

const styles = StyleSheet.create({
  itemText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_10,
    lineHeight: Typography.LINE_HEIGHT_16,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 100,
    backgroundColor: Colors.TEXT_COLOR,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    backgroundColor: Colors.BACKDROP_COLOR
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 15,
    alignSelf: 'center',
    width: '100%'
  },
  version: { paddingBottom: 10 },
})
