import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { usePostHog } from 'posthog-react-native'
import { RootState } from 'src/store'
import { markOnboardingSeen } from 'src/store/slice/appStateSlice'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Colors, Typography } from 'src/utils/constants'
import { AnalyticsEvents, captureAnalyticsEvent } from 'src/utils/analytics'
import CustomButton from 'src/components/common/CustomButton'
import LoginButton from 'src/components/sidebar/LoginButton'

type FinishAction = 'sign_in' | 'continue' | 'skip'

interface Slide {
  key: string
  // Placeholder art. Swap for an illustration per slide when design has one.
  icon: keyof typeof Ionicons.glyphMap
  title: string
  text: string
}

const SLIDES: Slide[] = [
  { key: 'map', icon: 'leaf', title: 'onboarding_map_title', text: 'onboarding_map_text' },
  { key: 'offline', icon: 'cloud-offline', title: 'onboarding_offline_title', text: 'onboarding_offline_text' },
  { key: 'grow', icon: 'trending-up', title: 'onboarding_grow_title', text: 'onboarding_grow_text' },
  { key: 'project', icon: 'people', title: 'onboarding_project_title', text: 'onboarding_project_text' },
]

const LAST = SLIDES.length - 1

/**
 * First-launch slides: what TreeMapper is, then a nudge to sign in for anyone
 * who already belongs to a project.
 *
 * RootNavigator decides whether this is the first screen (fresh installs
 * only). Every way out marks it seen and replaces the stack with Home, so
 * back never returns here.
 *
 * The LoginButton on the last slide finishes sign-in in an effect on the
 * shared Auth0 user, so this screen must stay mounted until isLoggedIn flips;
 * the effect below then closes it. The drawer's own LoginButton cannot be
 * mounted at the same time, since the drawer is only reachable from Home.
 */
const OnboardingView = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const posthog = usePostHog()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { width } = useWindowDimensions()
  const listRef = useRef<FlatList<Slide>>(null)
  const [index, setIndex] = useState(0)
  const finished = useRef(false)
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)

  const finish = useCallback(
    (action: FinishAction) => {
      if (finished.current) return
      finished.current = true
      captureAnalyticsEvent(posthog, AnalyticsEvents.ONBOARDING_FINISHED, {
        action,
        slide: index + 1,
      })
      dispatch(markOnboardingSeen())
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    },
    [dispatch, navigation, posthog, index],
  )

  // Close only on a sign-in made here, not because someone was already
  // signed in when the slides opened (possible while testing with
  // ALWAYS_SHOW_ONBOARDING in RootNavigator).
  const wasLoggedIn = useRef(isLoggedIn)
  useEffect(() => {
    if (isLoggedIn && !wasLoggedIn.current) finish('sign_in')
    wasLoggedIn.current = isLoggedIn
  }, [isLoggedIn, finish])

  const goTo = (next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true })
    setIndex(next)
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
  }

  const isLast = index === LAST

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        {!isLast && (
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => goTo(LAST)}>
            <Text style={styles.skip}>{t('label.onboarding_skip')}</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.art}>
              <Ionicons name={item.icon} size={88} color={Colors.NEW_PRIMARY} />
            </View>
            <Text style={styles.title}>{t(`label.${item.title}`)}</Text>
            <Text style={styles.text}>{t(`label.${item.text}`)}</Text>
          </View>
        )}
      />

      <View style={styles.dots} accessibilityRole="progressbar">
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        {isLast ? (
          <>
            <LoginButton containerStyle={styles.loginContainer} buttonStyle={styles.fullWidth} />
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => finish('continue')}
              style={styles.secondary}>
              <Text style={styles.secondaryLabel}>{t('label.onboarding_continue')}</Text>
            </Pressable>
          </>
        ) : (
          <CustomButton
            label={t('label.onboarding_next')}
            pressHandler={() => goTo(index + 1)}
            containerStyle={styles.nextButton}
            hideFadeIn
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default OnboardingView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  topBar: {
    height: 44,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_LIGHT,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  art: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.NEW_PRIMARY + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_24,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  text: {
    marginTop: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.FONT_SIZE_16 * 1.5,
    color: Colors.TEXT_LIGHT,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: Colors.GRAY_LIGHT,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.NEW_PRIMARY,
  },
  footer: {
    minHeight: 120,
    paddingHorizontal: 24,
    paddingBottom: 8,
    justifyContent: 'flex-start',
  },
  nextButton: {
    width: '100%',
    height: 56,
  },
  loginContainer: {
    height: 56,
    marginBottom: 0,
  },
  fullWidth: {
    width: '100%',
  },
  secondary: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  secondaryLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.NEW_PRIMARY,
  },
})
