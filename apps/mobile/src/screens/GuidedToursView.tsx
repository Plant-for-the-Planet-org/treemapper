import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import i18next from 'i18next'

import Header from 'src/components/common/Header'
import AlertModal from 'src/components/common/AlertModal'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import { SCALE_16 } from 'src/utils/constants/spacing'
import useTourCatalog, { TourCatalogEntry } from 'src/hooks/useTourCatalog'

/**
 * The "Show me how" menu. One drawer entry opens this, and every walkthrough
 * the app offers is a row here.
 *
 * The screen holds no knowledge of any individual tour: it renders whatever
 * `useTourCatalog` returns and calls the entry's own `begin`. Adding a tour
 * touches the catalogue, not this file.
 */
const GuidedToursView = () => {
  const tours = useTourCatalog()
  // Two pieces of state rather than one nullable: the modal fades out over a
  // few hundred ms, and clearing the entry on close would empty its heading
  // and message mid-animation.
  const [pendingTour, setPendingTour] = useState<TourCatalogEntry | null>(null)
  const [confirmVisible, setConfirmVisible] = useState(false)

  const askToStart = (tour: TourCatalogEntry) => {
    setPendingTour(tour)
    setConfirmVisible(true)
  }

  const confirmTour = () => {
    // Navigation happens inside `begin`, so the modal is dismissed first:
    // starting a tour with a modal still on screen leaves the first spotlight
    // measuring behind it.
    setConfirmVisible(false)
    pendingTour?.begin()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label={i18next.t('label.show_me_how')} showBackIcon />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>{i18next.t('label.tours_hint')}</Text>
        {tours.map(tour => {
          const blocked = Boolean(tour.blockedReason)
          return (
            <Pressable
              key={tour.key}
              style={({ pressed }) => [
                styles.row,
                blocked && styles.rowBlocked,
                pressed && !blocked && styles.rowPressed,
              ]}
              disabled={blocked}
              onPress={() => askToStart(tour)}>
              <View style={styles.iconWrapper}>
                <Ionicons name={tour.icon} size={18} color={Colors.WHITE} />
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.title}>{tour.title}</Text>
                {/* The reason replaces the summary rather than joining it: a
                    tour you cannot run does not need selling, it needs the one
                    thing that is missing. */}
                <Text style={blocked ? styles.blockedReason : styles.summary}>
                  {tour.blockedReason ?? tour.summary}
                </Text>
              </View>
              {!blocked && <CtaArrow width={SCALE_16} height={SCALE_16} />}
            </Pressable>
          )
        })}
      </ScrollView>
      <AlertModal
        visible={confirmVisible}
        heading={pendingTour?.confirmTitle ?? ''}
        message={pendingTour?.confirmMessage ?? ''}
        primaryBtnText={i18next.t('label.tour_start_alert_primary')}
        onPressPrimaryBtn={confirmTour}
        showSecondaryButton
        secondaryBtnText={i18next.t('label.tour_start_alert_secondary')}
        onPressSecondaryBtn={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  )
}

export default GuidedToursView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
    backgroundColor: Colors.WHITE,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: Colors.GRAY_BACKDROP,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rowPressed: {
    opacity: 0.8,
  },
  rowBlocked: {
    opacity: 0.55,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 50,
    backgroundColor: Colors.NEW_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: scaleFont(16),
    color: Colors.TEXT_COLOR,
  },
  summary: {
    marginTop: 2,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleFont(12),
    color: Colors.DARK_TEXT_COLOR,
    lineHeight: Typography.LINE_HEIGHT_17,
  },
  blockedReason: {
    marginTop: 2,
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    fontSize: scaleFont(12),
    color: Colors.TEXT_LIGHT,
    lineHeight: Typography.LINE_HEIGHT_17,
  },
})
