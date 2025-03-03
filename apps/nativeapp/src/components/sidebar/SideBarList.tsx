import { StyleSheet, View, FlatList } from 'react-native'
import React from 'react'
import SideBarCard from './SideBarCard'
import { SideDrawerItem } from 'src/types/interface/app.interface'
import ManageSpeciesIcon from 'assets/images/svg/ManageSpeciesIcon.svg'
import ManageProjectIcon from 'assets/images/svg/ManageProjectIcon.svg'
import OfflineMapIcon from 'assets/images/svg/OfflineMapIcon.svg'
import AdditionalDataIcon from 'assets/images/svg/AdditionalDataIcon.svg'
import LogoutIcon from 'assets/images/svg/LogoutIcon.svg'
import DataExplorerIcon from 'assets/images/svg/DataExplorerIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import i18next from 'src/locales'
import { SCALE_24 } from 'src/utils/constants/spacing'

interface Props {
  isLoggedIn: boolean
}

const SideBarList = (props: Props) => {
  const { isLoggedIn } = props
  const UserType = useSelector(
    (state: RootState) => state.userState.type
  )
  const data: SideDrawerItem[] = [
    {
      label: i18next.t('label.manage_species'),
      screen: 'ManageSpecies',
      icon: <ManageSpeciesIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'manage_species'
    },
    {
      label: i18next.t('label.manage_project'),
      screen: 'ManageProjects',
      icon: <ManageProjectIcon width={SCALE_24} height={SCALE_24} />,
      visible: UserType === 'tpo',
      key: 'manage_projects'
    },
    {
      label: i18next.t('label.additional_data'),
      screen: 'AdditionalData',
      icon: <AdditionalDataIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'additional_data'
    },
    {
      label: i18next.t('label.offline_maps'),
      screen: 'OfflineMap',
      icon: <OfflineMapIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'offline_map',
      disable: false
    },
    {
      label: i18next.t('label.data_explorer'),
      screen: 'dashboard',
      icon: <DataExplorerIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'data_explorer'
    },
    {
      label: i18next.t('label.activity_logs'),
      screen: 'ActivityLog',
      icon: <ManageProjectIcon width={SCALE_24} height={SCALE_24} />,
      visible: true,
      key: 'activity_log'
    },
    {
      label: "Delete Account",
      screen: 'DeleteAccount',
      icon: <View style={styles.binIconWrapper}><BinIcon width={15} height={15} fill={'#fff'} /></View>,
      visible: isLoggedIn && UserType!=='tpo',
      key: 'delete'
    },
    {
      label: i18next.t('label.logout'),
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
        renderItem={({ item }) => <SideBarCard item={item} key={item.key} />}
      />
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
  }
})
