import type { TabsContentProps } from 'tamagui'

import { useRouter } from 'solito/navigation'
import React from 'react'
import { isWeb, Stack, Tabs, Text, YStack } from 'tamagui'
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
    route: '/dashboard/settings/appearance',
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
    route: '/dashboard/settings/integrations',
    component: null,
  },
]

export function SettingsTabs() {
  return (
    <YStack
      flex={1}
      {...(isWeb && {
        position: 'unset' as any,
      })}>
      <HorizontalTabs />
    </YStack>
  )
}

const HorizontalTabs = () => {
  const router = useRouter()
  return (
    <Tabs
      flex={1}
      flexDirection="column"
      orientation="horizontal"
      defaultValue={TabsData[0].value}>
      <Stack
        backgroundColor="$gray2"
        borderBottomWidth={1}
        borderColor="$gray5">
        <Tabs.List
          disablePassBorderRadius
          flexDirection="row"
          justifyContent="space-between"
          width="100%"
          paddingHorizontal="$4"
          paddingVertical="$2">
          {TabsData.map((tab, index) => (
            <Tabs.Tab
              key={index}
              flex={1}
              value={tab.value}
              paddingVertical="$0"
              paddingHorizontal="$1"
              marginHorizontal="$1"
              backgroundColor="transparent"
              borderRadius="$4"
              pressStyle={{
                backgroundColor: '$gray4',
                scale: 0.94,
              }}
              onPress={() => {
                if (tab.route) router.push(tab.route)
              }}>
              <Text
                fontFamily="$body"
                fontSize="$2"
                textAlign="center"
                color="$gray11">
                {tab.label}
              </Text>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Stack>

      {TabsData.map((tab, index) => (
        <TabsContent key={index} value={tab.value}>
          {tab.component && <tab.component />}
        </TabsContent>
      ))}
    </Tabs>
  )
}

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content backgroundColor="$gray1" padding="$4" flex={1} {...props}>
      {props.children}
    </Tabs.Content>
  )
}
