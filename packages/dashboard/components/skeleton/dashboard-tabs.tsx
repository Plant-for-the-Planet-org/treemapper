import type { TabsContentProps } from 'tamagui'

import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { isWeb, Tabs, Text, YStack } from 'tamagui'
import OverviewScreen from '../../features/overview/screen'

const TabsData = [
  {
    label: 'Overview',
    value: 'overview',
    // route: 'dashboard.overview',
    component: OverviewScreen,
  },
  {
    label: 'Species',
    value: 'species',
    route: 'dashboard.species',
    component: null,
  },
  {
    label: 'Teams',
    value: 'teams',
    route: 'dashboard.teams',
    component: null,
  },
  {
    label: 'Settings',
    value: 'settings',
    route: 'dashboard.settings',
    component: null,
  },
]

export function DashboardTabs() {
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
