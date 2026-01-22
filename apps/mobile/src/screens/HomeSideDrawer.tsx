import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import SideBarList from 'src/components/sidebar/SideBarList'
import SidebarHeader from 'src/components/sidebar/SidebarHeader'
import SideBarFooter from 'src/components/sidebar/SideBarFooter'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { Colors, Typography } from 'src/utils/constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Ionicons } from '@expo/vector-icons'
import { SCALE_24 } from 'src/utils/constants/spacing'

const HomeSideDrawer = () => {
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const handleNotificationPress = () => {
    navigation.navigate('Notification')
  }

  const notificationIcon = (
    <>
      {process.env.EXPO_PUBLIC_APP_ENV === 'staging' && <View style={styles.stagingWrapper}><Text style={styles.stagingLabel}>Development</Text></View>}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleNotificationPress}
      >
        <View style={styles.notificationIconWrapper}>
          <Ionicons name={'notifications'} size={16} color="#fff" style={{ paddingTop: 2 }} />
        </View>
      </TouchableOpacity>
    </>

  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label={''} rightComponent={notificationIcon} />
      <SidebarHeader />
      <View style={styles.wrapper}>
        <SideBarList isLoggedIn={isLoggedIn} />
      </View>
      <SideBarFooter isLoggedIn={isLoggedIn} />
    </SafeAreaView>
  )
}

export default HomeSideDrawer

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  wrapper: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
    paddingBottom: 30
  },
  notificationButton: {
    marginRight: 20,
  },
  notificationIconWrapper: {
    width: SCALE_24,
    height: SCALE_24,
    borderRadius: 50,
    backgroundColor: '#007A49',
    justifyContent: 'center',
    alignItems: 'center',
  }, stagingWrapper: {
    flexDirection: "row",
    alignItems: 'center',
    position: 'absolute',
    left: '14%',
    backgroundColor: '#00BFFF',
    top: '20%',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  stagingLabel: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: 20
  }
})
