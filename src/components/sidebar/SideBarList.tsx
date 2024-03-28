import {StyleSheet, View, FlatList} from 'react-native'
import React from 'react'
import SideBarCard from './SideBarCard'

const data = [
  'Manage Species',
  'Manage Projects',
  'Additional Data',
  'Offline Maps',
  'Logout',
]

const SideBarList = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={({item}) => <SideBarCard label={item} />}
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
