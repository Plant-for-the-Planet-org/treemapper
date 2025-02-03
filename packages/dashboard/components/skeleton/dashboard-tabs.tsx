import type { TabsContentProps } from 'tamagui'
import { useRouter } from 'solito/router'
import React from 'react'
import { isWeb, Tabs, Text, YStack, Stack } from 'tamagui'
import OverviewScreen from '../../features/overview/screen'
import MembersScreen from '../../features/teams/members/screen'

const TabsData = [
  {
    label: 'Overview',
    value: 'overview',
    component: OverviewScreen,
  },
  {
    label: 'Species',
    value: 'species',
    route: '/dashboard/species',
    component: null,
  },
  {
    label: 'Teams',
    value: 'teams',
    // route: '/dashboard/teams',
    route: '/dashboard/teams/members',
    component: MembersScreen,
  },
  {
    label: 'Settings',
    value: 'settings',
    route: '/dashboard/settings',
    component: null,
  },
]

export function DashboardTabs() {
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
              paddingVertical="$2"
              paddingHorizontal="$3"
              marginHorizontal="$1"
              backgroundColor="transparent"
              borderRadius="$4"
              pressStyle={{
                backgroundColor: '$gray4',
                scale: 0.97,
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
