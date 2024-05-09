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
      label: 'Manage Species',
      screen: 'ManageSpecies',
      icon: <ManageSpeciesIcon />,
      visible: true,
      key: 'manage_species'
    },
    {
      label: 'Manage Projects',
      screen: 'ManageProjects',
      icon: <ManageProjectIcon />,
      visible: UserType==='tpo',
      key: 'manage_projects'
    },
    {
      label: 'Additional Data',
      screen: 'AdditionalData',
      icon: <AdditionalDataIcon />,
      visible: true,
      key: 'additional_data'
    },
    {
      label: 'Offline Maps',
      screen: 'OfflineMap',
      icon: <OfflineMapIcon />,
      visible: true,
      key: 'offline_map'
    },
    {
      label: 'Data Explorer',
      screen: 'DataExplorer',
      icon: <DataExpolrerIcon />,
      visible: true,
      key: 'data_explorer'
    },
    {
      label: 'Activity Log',
      screen: 'ActivityLog',
      icon: <DataExpolrerIcon />,
      visible: true,
      key: 'activity_log'
    },
    {
      label: 'Logout',
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
