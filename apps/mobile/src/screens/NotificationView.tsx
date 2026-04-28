import { StyleSheet, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import NotificationList from 'src/components/notifications/NotificationList'

const NotificationView = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Notifications" />
      <View style={styles.content}>
        <NotificationList />
      </View>
    </SafeAreaView>
  )
}

export default NotificationView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR || '#F5F5F5',
  },
  content: {
    flex: 1,
  },
})
