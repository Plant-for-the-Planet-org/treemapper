import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'
// import ProjectDropdown from 'src/components/dataExplore/ProjectDropDown'
// import ProjectDropdown from 'dashboard/pages/dashboardHeader/DashboardHeaderNative'
import ProjectDropdown from '../components/dataExplore/ProjectDropDown'

import { useSelector } from 'react-redux'
import { RootState } from '../store'
import Header from '../components/common/Header'
import NotificationProfileBar from '../components/dataExplore/NotificationProfileBar'
import HorizontalTabs, { TabData } from '../components/dataExplore/HorizontalTabs'
import Overview from '../components/dataExplore/Overview'
import { Ionicons } from '@expo/vector-icons'
import SitesList from '../components/dataExplore/SiteList'
import TeamMemberHome from '../components/dataExplore/TeamMemberHome'





const DataExplorerView = () => {
  const [selectedProject, setSelectedProject] = useState('Project 1');
  const [notificationCount, setNotificationCount] = useState(5);
  const [selectedTab, setSelectedTab] = useState<TabData | null>();

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Navigate to notifications screen
    // navigation.navigate('Notifications');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
    // Navigate to profile screen
    // navigation.navigate('Profile');
  };

  const handleDownloadPress = () => {
    console.log('Download pressed');
    // Handle download functionality
  };


  // Sample tabs data
  const tabsData: TabData[] = [
    {
      id: 1,
      title: 'Overview',
      icon: 'home-outline',
      component: 'OverviewComponent',
    },
    {
      id: 2,
      title: 'Sites',
      icon: 'analytics-outline',
      component: 'AnalyticsComponent',
    },
    {
      id: 3,
      title: 'Team',
      icon: 'document-text-outline',
      component: 'Team',
    },
    {
      id: 4,
      title: 'Settings',
      icon: 'settings-outline',
      component: 'SettingsComponent',
    },
    {
      id: 5,
      title: 'Users',
      icon: 'people-outline',
      component: 'UsersComponent',
    },
    {
      id: 6,
      title: 'Notifications',
      icon: 'notifications-outline',
      component: 'NotificationsComponent',
    },
  ];

  const handleTabChange = (tabData: TabData, index: number) => {
    setSelectedTab(tabData);
    console.log('Selected tab:', tabData, 'Index:', index);

    // Here you can handle your content rendering logic
    // For example, update state, navigate, or trigger other actions
  };

  const renderContent = () => {
    if (!selectedTab) return null;

    // This is where you would render your actual components
    // based on the selected tab
    switch (selectedTab.component) {
      case 'OverviewComponent':
        return <Overview />
      case 'AnalyticsComponent':
        return <SitesList />
      case 'Team':
        return <TeamMemberHome />
      case 'SettingsComponent':
        return null
      case 'UsersComponent':
        return null
      case 'NotificationsComponent':
        return null
      default:
        return null
    }
  };


  const appToken = useSelector((state: RootState) => state.appState.accessToken)
  return (
    <SafeAreaView>
      <Header label='Dashboard' height={50} bgColor='#efefef' />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.leftSection}>
            <ProjectDropdown token={`${appToken}`} />
          </View>
          <View style={styles.rightSection}>
            <NotificationProfileBar
              notificationCount={notificationCount}
              onNotificationPress={handleNotificationPress}
              onProfilePress={handleProfilePress}
              style={styles.notificationProfileBar}
            />
          </View>
        </View>
        <HorizontalTabs
          tabs={tabsData}
          onTabChange={handleTabChange}
          style={styles.tabsContainer}
          initialSelectedIndex={0}
        />

        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  )
}

export default DataExplorerView

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    width: '100%',
    height: '100%'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tabsContainer: {
    marginTop: 10
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  notificationProfileBar: {}
})