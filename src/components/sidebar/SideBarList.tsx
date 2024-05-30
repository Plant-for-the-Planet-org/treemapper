import {StyleSheet, View, FlatList} from 'react-native'
import React from 'react'
import SideBarCard from './SideBarCard'
import {SideDrawerItem} from 'src/types/interface/app.interface'
import ManageSpeciesIcon from 'assets/images/svg/ManageSpeciesIcon.svg'
import ManageProjectIcon from 'assets/images/svg/ManageProjectIcon.svg'
import OfflineMapIcon from 'assets/images/svg/OfflineMapIcon.svg'
import AdditionalDataIcon from 'assets/images/svg/AdditionalDataIcon.svg'
import LogoutIcon from 'assets/images/svg/LogoutIcon.svg'
import DataExpolrerIcon from 'assets/images/svg/DataExplorerIcon.svg'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import i18next from 'src/locales'

interface Props {
  isLogedIn: boolean
}

const SideBarList = (props: Props) => {
  const {isLogedIn} = props
  const UserType = useSelector(
    (state: RootState) => state.userState.type
  )
  const data: SideDrawerItem[] = [
    {
      label: i18next.t('label.manage_species'),
      screen: 'ManageSpecies',
      icon: <ManageSpeciesIcon />,
      visible: true,
      key: 'manage_species'
    },
    {
      label: i18next.t('label.manage_project'),
      screen: 'ManageProjects',
      icon: <ManageProjectIcon />,
      visible: UserType==='tpo',
      key: 'manage_projects'
    },
    {
      label: i18next.t('label.additional_data'),
      screen: 'AdditionalData',
      icon: <AdditionalDataIcon />,
      visible: true,
      key: 'additional_data'
    },
    {
      label: i18next.t('label.offline_maps'),
      screen: 'OfflineMap',
      icon: <OfflineMapIcon />,
      visible: true,
      key: 'offline_map',
      disable: true
    },
    {
      label: i18next.t('label.data_explorer'),
      screen: 'DataExplorer',
      icon: <DataExpolrerIcon />,
      visible: true,
      key: 'data_explorer'
    },
    {
      label: i18next.t('label.activity_logs'),
      screen: 'ActivityLog',
      icon: <ManageProjectIcon />,
      visible: true,
      key: 'activity_log'
    },
    {
      label: i18next.t('label.logout'),
      screen: 'ManageSpecies',
      icon: <LogoutIcon />,
      visible: isLogedIn,
      key: 'logout'
    },
  ]
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={({item}) => <SideBarCard item={item} key={item.key}/>}
      />
    </View>
  )
}

export default SideBarList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:10
  },
})
