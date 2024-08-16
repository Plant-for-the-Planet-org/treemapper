import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import i18next from 'src/locales/index'
import {Spacing, Typography, Colors} from 'src/utils/constants'
import {scaleSize} from 'src/utils/constants/mixins'
import LoginButton from './LoginButton'
import openWebView from 'src/utils/helpers/appHelper/openWebView'
import * as Application from 'expo-application'
interface Props {
  isLoggedIn: boolean
}

const SideBarFooter = (props: Props) => {
  const {isLoggedIn} = props
  const onPressImprint = () => {
    openWebView(`https://pp.eco/legal/${i18next.language}/imprint`);
  };
  const onPressPolicy = () => {
    openWebView(`https://pp.eco/legal/${i18next.language}/privacy`);
  };
  const onPressTerms = () => {
    openWebView(`https://pp.eco/legal/${i18next.language}/terms`);
  };
  return (
    <View style={[styles.versionContainer]}>
      {!isLoggedIn && <LoginButton />}
      <View key="version" style={styles.version}>
        <Text style={styles.itemText}>{Application.nativeApplicationVersion}</Text>
      </View>
      <View style={styles.termsContainer}>
        <TouchableOpacity key="privacy_policy" onPress={onPressPolicy}>
          <Text style={styles.itemText}>
            {i18next.t('label.privacy_policy')}
          </Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity key="imprint" onPress={onPressImprint}>
          <Text style={styles.itemText}>{i18next.t('label.imprint')}</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity key="terms_of_service" onPress={onPressTerms}>
          <Text style={styles.itemText}>
            {i18next.t('label.terms_of_service')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
export default SideBarFooter

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    paddingHorizontal: Spacing.SCALE_16,
    backgroundColor: Colors.WHITE,
  },
  header: {
    width: Spacing.SCALE_30,
    height: Spacing.SCALE_56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.SCALE_16,
    marginBottom: Spacing.SCALE_24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfoTextCon: {
    marginLeft: Spacing.SCALE_12,
  },
  username: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: 'black',
  },
  email: {
    marginTop: Spacing.SCALE_4,
    color: '#4F4F4F',
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  avatar: {
    width: Spacing.SCALE_50,
    height: Spacing.SCALE_50,
    borderRadius: 10,
  },
  pencil: {
    backgroundColor: Colors.PRIMARY + '20',
    padding: scaleSize(10),
    borderRadius: 500,
  },
  drawerItemContainer: {
    flex: 1,
    marginTop: scaleSize(24),
    paddingHorizontal: scaleSize(16),
    backgroundColor: '#E0E0E026',
  },
  drawerItem: {
    padding: scaleSize(12),
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerItemLabel: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: scaleSize(12),
  },
  drawerItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtn: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
  },
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
  },
  termsContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 15,
    alignSelf: 'center',
  },
  version: {paddingBottom: 10},
  iconCon: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 100,
    width: 24,
    height: 24,
  },
})
