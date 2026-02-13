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

interface Props {
  isLoggedIn: boolean
}

const SideBarList = (props: Props) => {
  const { isLoggedIn } = props
  const { t } = useTranslation()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const UserType = useSelector(
    (state: RootState) => state.userState.type
  )
  const v3Approved = useSelector(
    (state: RootState) => state.userState.v3Approved
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
      visible: v3Approved,
      key: 'manage_projects'
    },
    {
      label: t('label.additional_data'),
      screen: 'AdditionalData',
      icon: <AdditionalDataIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'additional_data'
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
    // {
    //   label: i18next.t('label.data_explorer'),
    //   screen: 'DataExplorer',
    //   icon: <DataExplorerIcon width={SCALE_24} height={SCALE_24} />,
    //   visible: v3Approved,
    //   key: 'data_explorer'
    // },
    // {
    //   label: 'New Features',
    //   screen: 'TreeMapperFeaturesScreen',
    //   icon: <Ionicons name={'leaf'} size={24} color="#007A49" />,
    //   visible: !v3Approved && UserType!=='',
    //   key: 'features'
    // },
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
      visible: (isLoggedIn && UserType !== 'tpo') || (isLoggedIn && v3Approved),
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
        renderItem={({ item }) => (
          <SideBarCard
            item={item}
            key={item.key}
            onPressFeedback={() => setShowFeedbackModal(true)}
          />
        )}
      />
      <FeedbackModal
        isVisible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
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
