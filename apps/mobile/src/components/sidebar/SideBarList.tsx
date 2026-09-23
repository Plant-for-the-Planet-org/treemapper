import { StyleSheet, View, FlatList } from 'react-native'
import React, { useState } from 'react'
import SideBarCard from './SideBarCard'
import FeedbackModal from './FeedbackModal'
import { SideDrawerItem } from 'src/types/interface/app.interface'
import ManageSpeciesIcon from 'assets/images/svg/ManageSpeciesIcon.svg'
import ManageProjectIcon from 'assets/images/svg/ManageProjectIcon.svg'
import OfflineMapIcon from 'assets/images/svg/OfflineMapIcon.svg'
import AdditionalDataIcon from 'assets/images/svg/AdditionalDataIcon.svg'
import LogoutIcon from 'assets/images/svg/LogoutIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { RootState } from 'src/store'
import { Ionicons } from '@expo/vector-icons'

import { SCALE_24 } from 'src/utils/constants/spacing'
import AlertModal from '../common/AlertModal'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useInterventionTour from 'src/hooks/useInterventionTour'

interface Props {
  isLoggedIn: boolean
}

const SideBarList = (props: Props) => {
  const { isLoggedIn } = props
  const { t } = useTranslation()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showTourConfirm, setShowTourConfirm] = useState(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { startSingleTreeTour } = useInterventionTour()

  // The first spotlight sits on the home screen (the project picker, or the
  // "+" button when a project is already chosen), so the drawer has to be off
  // screen before the tour starts or the step would measure a target that is
  // about to unmount.
  const beginTour = () => {
    setShowTourConfirm(false)
    navigation.popToTop()
    startSingleTreeTour()
  }
  const UserType = useSelector(
    (state: RootState) => state.userState.type
  )

  const data: SideDrawerItem[] = [
    {
      label: t('label.manage_species'),
      screen: 'ManageSpecies',
      icon: <ManageSpeciesIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'manage_species'
    },
    {
      label: t('label.manage_project'),
      screen: 'ManageProjects',
      icon: <ManageProjectIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'manage_projects'
    },
    {
      label: t('label.forms'),
      screen: 'Forms',
      icon: <AdditionalDataIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'forms'
    },
    {
      label: t('label.offline_maps'),
      screen: 'OfflineMap',
      icon: <OfflineMapIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'offline_map',
      disable: false
    },
    {
      label: 'Guide',
      screen: 'Guide',
      icon: <View style={styles.guideIconWrapper}><Ionicons name={'book'} size={16} color="#fff" style={{paddingTop: 2}} /></View>,
      visible: true,
      key: 'guide'
    },
    {
      label: t('label.show_me_how'),
      icon: <View style={styles.guideIconWrapper}><Ionicons name="footsteps" size={16} color="#fff" style={{ paddingTop: 2 }} /></View>,
      // Available signed out too. The whole flow works without an account --
      // the intervention is written to Realm and syncs later -- and the tour
      // drops its project step when there is no project picker to point at.
      visible: true,
      key: 'intervention_tour'
    },
    {
      label: t('label.activity_logs'),
      screen: 'ActivityLog',
      icon: <ManageProjectIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'activity_log'
    },
    {
      label: t('label.language'),
      screen: 'Language',
      icon: <View style={styles.guideIconWrapper}><Ionicons name="language" size={16} color="#fff" style={{paddingTop: 2}} /></View>,
      visible: true,
      key: 'language'
    },
    {
      label: t('label.feedback'),
      icon: <View style={styles.guideIconWrapper}><Ionicons name="chatbox-ellipses" size={16} color="#fff" style={{paddingTop: 2}} /></View>,
      visible: isLoggedIn,
      key: 'feedback'
    },
    {
      label: "Delete Account",
      screen: 'DeleteAccount',
      icon: <View style={styles.binIconWrapper}><BinIcon width={15} height={15} fill={'#fff'} /></View>,
      visible: true,
      key: 'delete'
    },
    {
      label: t('label.logout'),
      screen: 'ManageSpecies',
      icon: <LogoutIcon width={SCALE_24} height={SCALE_24} />,
      visible: isLoggedIn,
      key: 'logout'
    },
  ]
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SideBarCard
            item={item}
            key={item.key}
            onPressFeedback={() => setShowFeedbackModal(true)}
            onPressTour={() => setShowTourConfirm(true)}
          />
        )}
      />
      <FeedbackModal
        isVisible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
      <AlertModal
        visible={showTourConfirm}
        heading={t('label.tour_start_alert_title')}
        message={t('label.tour_start_alert_message')}
        primaryBtnText={t('label.tour_start_alert_primary')}
        onPressPrimaryBtn={beginTour}
        showSecondaryButton
        secondaryBtnText={t('label.tour_start_alert_secondary')}
        onPressSecondaryBtn={() => setShowTourConfirm(false)}
      />
      <View style={{ height: 30 }} />
    </View>
  )
}

export default SideBarList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 100,
  },
  binIconWrapper: {
    width: SCALE_24,
    height: SCALE_24,
    borderRadius: 50,
    backgroundColor: 'tomato',
    justifyContent: 'center',
    alignItems: 'center'
  },
  guideIconWrapper: {
    width: SCALE_24,
    height: SCALE_24,
    borderRadius: 50,
    backgroundColor: '#007A49',
    justifyContent: 'center',
    alignItems: 'center',
  }
})
