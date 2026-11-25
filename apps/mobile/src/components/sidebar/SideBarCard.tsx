import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import { SideDrawerItem } from 'src/types/interface/app.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch } from 'react-redux'
import { logoutAppUser, updateNewIntervention, updateUserLogin } from 'src/store/slice/appStateSlice'
import { resetUserDetails } from 'src/store/slice/userStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { resetProjectState } from 'src/store/slice/projectStateSlice'
import { SCALE_16 } from 'src/utils/constants/spacing'
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'

interface Props {
  item: SideDrawerItem
  onPressFeedback?: () => void
  onPressAnalyticsConsent?: () => void
  onPressRate?: () => void
}

const SideBarCard = (props: Props) => {
  const { logoutUser } = useAuthentication()
  const { label, screen, icon, visible, key, disable, description, switchValue, onSwitch } = props.item
  const isSwitch = typeof switchValue === 'boolean'
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const posthog = usePostHog()

  const handleNavigation = () => {
    if (disable) {
      return
    }
    // Track every enabled tap with the stable key (not the translated label)
    // so the breakdown never splits by language.
    captureAnalyticsEvent(posthog, AnalyticsEvents.MENU_ITEM_CLICKED, {
      item_key: key,
      target_screen: screen,
    })
    if (isSwitch) {
      onSwitch?.(!switchValue)
      return
    }
    let params = {}
    if (key === 'logout') {
      handleLogout()
      return
    }
    if (key === 'feedback') {
      props.onPressFeedback?.()
      return
    }
    if (key === 'analytics_consent') {
      props.onPressAnalyticsConsent?.()
      return
    }
    if (key === 'rate_app') {
      props.onPressRate?.()
      return
    }
    if (key === 'manage_species') {
      params = { manageSpecies: true }
    }
    navigation.navigate(screen, params)
  }

  const handleLogout = async () => {
    try {
      captureAnalyticsEvent(posthog, AnalyticsEvents.LOGOUT)
      await logoutUser()
      dispatch(resetProjectState())
      dispatch(updateUserLogin(false))
      dispatch(resetUserDetails())
      dispatch(logoutAppUser())
      dispatch(updateNewIntervention())
    } catch (error) {
      console.error("Error occurred while logout")
  }
}

if (!visible) {
  return null
}

return (
  <Pressable style={[styles.container, isSwitch && styles.containerAuto]} onPress={handleNavigation}>
    <View style={[styles.wrapper, isSwitch && styles.wrapperAuto, { opacity: disable ? 0.5 : 1, backgroundColor: disable ? Colors.BACKDROP_COLOR : 'white' }]}>
      <View style={styles.iconWrapper}>{icon}</View>
      <View style={styles.labelWrapper}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
      </View>
      {isSwitch ? (
        <View style={styles.switchWrapper}>
          <Switch
            style={styles.switch}
            value={switchValue}
            onValueChange={(value) => onSwitch?.(value)}
            trackColor={{ true: Colors.NEW_PRIMARY, false: Colors.GRAY_BACKDROP }}
            thumbColor={Colors.WHITE}
            ios_backgroundColor={Colors.GRAY_BACKDROP}
            accessibilityLabel={label}
          />
        </View>
      ) : (
        <View style={styles.arrowWrapper}>
          <CtaArrow  width={SCALE_16} height={SCALE_16}/>
        </View>
      )}
    </View>
  </Pressable>
)
}

export default SideBarCard

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(64),
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: Colors.GRAY_BACKDROP,           // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow offset (width, height)
    shadowOpacity: 0.25,           // Shadow opacity (0 to 1)
    shadowRadius: 3.84,    
    elevation: 2, // Elevation property for shadow
  },
  iconWrapper: {
    height: 25,
    width: 25,
    marginLeft: 10,
    borderRadius: 5,
  },
  labelWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  arrowWrapper: {
    marginRight: 10,
    height: 25,
    width: 25,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginLeft: 10,
  },
  // The switch row carries a description line, so it grows with its text
  // instead of being clipped by the fixed 64px row the other cards use.
  containerAuto: {
    height: undefined,
    minHeight: scaleSize(64),
    paddingVertical: scaleSize(6.4),
  },
  wrapperAuto: {
    height: undefined,
    minHeight: scaleSize(51),
    paddingVertical: 8,
  },
  // Same right inset as the arrow column, so the switch's right edge lines up
  // with the arrows on the rows below.
  switchWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  switch: Platform.select({
    // The stock iOS switch (51x31) is much bigger than the 16px arrows; scale it
    // down a little so the row reads as one list.
    ios: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginRight: -5 },
    // Android's switch carries its own horizontal padding; pull it flush.
    android: { marginRight: -6 },
    default: {},
  }),
  label: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 10
  },
})
