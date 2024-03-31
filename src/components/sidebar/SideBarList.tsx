import {StyleSheet, View, FlatList} from 'react-native'
import React from 'react'
import SideBarCard from './SideBarCard'
import {SideDrawerItem} from 'src/types/interface/app.interface'

import ManageSpeciesIcon from 'assets/images/svg/ManageSpeciesIcon.svg'
import ManageProjectIcon from 'assets/images/svg/ManageProjectIcon.svg'
import OfflineMapIcon from 'assets/images/svg/OfflineMapIcon.svg'
import AdditionalDataIcon from 'assets/images/svg/AdditionalDataIcon.svg'
import LogoutIcon from 'assets/images/svg/LogoutIcon.svg'

const data: SideDrawerItem[] = [
  {
    label: 'Manage Species',
    screen: 'ManageSpecies',
    icon: <ManageSpeciesIcon />,
  },
  {label: 'Manage Projects', screen: 'ManageSpecies', icon: <ManageProjectIcon/>},
  {label: 'Additional Data', screen: 'ManageSpecies', icon: <AdditionalDataIcon/>},
  {label: 'Offline Maps', screen: 'ManageSpecies', icon: <OfflineMapIcon/>},
  {label: 'Logout', screen: 'ManageSpecies', icon: <LogoutIcon/>},
]

const SideBarList = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={({item}) => <SideBarCard item={item} />}
      />
    </View>
  )
}

export default SideBarList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
