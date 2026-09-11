import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import PlotList from 'src/components/monitoringPlot/PlotList'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import AddIcon from 'assets/images/svg/MoreOptionIcon.svg'
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import i18next from 'src/locales/index'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'

import ComingSoon from 'assets/images/svg/ComingSoon.svg'
import { RootState } from 'src/store'
import { useSelector } from 'react-redux'
import { useToast } from 'react-native-toast-notifications'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import RotatingView from 'src/components/common/RotatingView'

// Keep in step with the height of Header's container.
const HEADER_HEIGHT = 80

const PlotView = () => {
  const [popupVisible, setPopupVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const showPlotFeature = useSelector((state: RootState) => state.userState.showPlotFeature)
  const { refreshPlotsFromServer } = useMonitoringPlotManagement()
  const toast = useToast()
  const insets = useSafeAreaInsets()

  const plotData = useQuery<MonitoringPlot>(
    RealmSchema.MonitoringPlot,
    data => {
      return data.filtered("lastScreen != 'form'")
    },
  )

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const addGroups = () => {
    togglePopup()
    navigation.navigate('PlotGroup')
  }

  const togglePopup = () => {
    ctaHaptic()
    setPopupVisible(!popupVisible)
  }

  /**
   * Pull the server's plots into the device.
   *
   * On demand rather than on a timer or on open: it fetches every plot of every
   * project in full, which is a real request, and it can delete local copies of
   * plots that were removed on the dashboard. Both are things a user should ask
   * for and see the result of.
   */
  const handleRefresh = async () => {
    if (refreshing) return
    ctaHaptic()
    setRefreshing(true)
    const result = await refreshPlotsFromServer()
    setRefreshing(false)

    if (!result.ok) {
      toast.show(
        result.reason === 'offline'
          ? i18next.t('label.plot_refresh_needs_internet')
          : i18next.t('label.plot_refresh_failed'),
        { textStyle: { textAlign: 'center' } },
      )
      return
    }

    const changed = result.added + result.updated + result.removed
    if (changed === 0) {
      toast.show(i18next.t('label.plot_refresh_up_to_date'))
      return
    }
    // Say what actually happened, because one of these silently removes plots.
    const parts: string[] = []
    if (result.added) parts.push(`${result.added} ${i18next.t('label.plot_refresh_added')}`)
    if (result.updated) parts.push(`${result.updated} ${i18next.t('label.plot_refresh_updated')}`)
    if (result.removed) parts.push(`${result.removed} ${i18next.t('label.plot_refresh_removed')}`)
    toast.show(parts.join(' · '), { textStyle: { textAlign: 'center' } })
  }



  const renderIcon = () => {
    return <View style={styles.headerActions}>
      <Pressable
        onPress={handleRefresh}
        style={styles.rightContainer}
        accessibilityLabel={i18next.t('label.plot_refresh')}
      >
        {refreshing
          ? <RotatingView isClockwise><RefreshIcon width={18} height={18} /></RotatingView>
          : <RefreshIcon width={18} height={18} />}
      </Pressable>
      <Pressable onPress={togglePopup} style={styles.rightContainer}>
        <AddIcon width={16} height={16} fill={Colors.WHITE} />
      </Pressable>
    </View>
  }

  /**
   * Plain Modal rather than react-native-popover-view.
   *
   * The popover measures its anchor with measureInWindow before it draws
   * anything, and under the New Architecture that measurement comes back as an
   * empty rect. The popover then renders nothing while its own full screen
   * Modal is already on screen, which swallows every touch. iOS never fires
   * onRequestClose for an overFullScreen modal, so there is no way back out and
   * the app looks frozen. The menu is anchored by hand instead: no measuring,
   * nothing to fail.
   */
  const renderMenu = () => {
    return <Modal
      transparent
      visible={popupVisible}
      animationType="fade"
      onRequestClose={togglePopup}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.menuOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={togglePopup} />
        <View style={[styles.popOverWrapper, { top: insets.top + HEADER_HEIGHT - 12 }]}>
          <Pressable onPress={addGroups} style={styles.menuItem}>
            <Text style={styles.menuLabel}>{i18next.t('label.plot_group')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t('label.monitoring_plot_header')} showBackIcon={false} rightComponent={renderIcon()} />
      <View style={styles.wrapper}>
        <PlotList data={[...plotData]} />
      </View>
      {renderMenu()}
    </SafeAreaView>
  )
}

export default PlotView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  wrapper: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderRadius: 8
  },
  menuOverlay: {
    flex: 1,
  },
  popOverWrapper: {
    position: 'absolute',
    right: 20,
    minWidth: 120,
    borderWidth: 0.5,
    borderColor: Colors.PALE_WHITE,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.PALE_WHITE,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,

  }
})
