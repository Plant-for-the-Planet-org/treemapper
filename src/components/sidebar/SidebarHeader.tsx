import {StyleSheet, Text, View} from 'react-native'
import React from 'react'

const SidebarHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}></View>
      <Text style={styles.userName}>Loren Ipsum</Text>
    </View>
  )
}

export default SidebarHeader

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:10,
    backgroundColor: '#ffffff',
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    backgroundColor: 'red',
    marginLeft: 20,
    borderRadius: 10,
  },
  userName: {
    marginLeft: 20,
  },
})
