import type { TabsContentProps } from 'tamagui'

import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { isWeb, Tabs, Text, YStack } from 'tamagui'
import NotificationsScreen from '../../features/settings/notifications/screen'
import ProfileScreen from '../../features/settings/profile/screen'

const TabsData = [
  {
    label: 'Profile',
    value: 'profile',
    // route: 'dashboard.settings.profile',
    component: ProfileScreen,
  },
  {
    label: 'Appearance',
    value: 'appearance',
    route: 'dashboard.settings.appearance',
    component: null,
  },
  {
    label: 'Notifications',
    value: 'notifications',
    // route: 'dashboard.settings.notifications',
    component: NotificationsScreen,
  },
  {
    label: 'Integrations',
    value: 'integrations',
    route: 'dashboard.settings.integrations',
    component: null,
  },
]

export function SettingsTabs() {
  return (
    <YStack
      flexGrow={1}
      {...(isWeb && {
        position: 'unset' as any,
      })}>
      <HorizontalTabs />
    </YStack>
  )
}

const HorizontalTabs = () => {
  const { navigate } = useNavigation()

  return (
    <Tabs
      flex={1}
      flexDirection="column"
      orientation="horizontal"
      defaultValue={TabsData[0].value}>
      <Tabs.List
        padded
        padding="$2"
        radiused={false}
        flexDirection="row"
        overflow="scroll">
        {TabsData.map((t, k) => (
          <Tabs.Tab
            key={k}
            borderWidth={0}
            flexShrink={0}
            value={t.value}
            onPress={() => {
              if (t.route) navigate(t.route)
            }}>
            <Text fontFamily="$body">{t.label}</Text>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {TabsData.map((t, k) => (
        <TabsContent key={k} flexGrow={1} value={t.value}>
          {!!t.component && <t.component />}
        </TabsContent>
      ))}
    </Tabs>
  )
}

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="$gray3"
      key="tab3"
      padding="$2"
      alignItems="center"
      justifyContent="center"
      flex={1}
      {...props}>
      {props.children}
    </Tabs.Content>
  )
}
