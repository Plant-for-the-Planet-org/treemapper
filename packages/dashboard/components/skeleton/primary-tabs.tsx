import React from 'react'
import type { TabsContentProps } from 'tamagui'
import { H1, H5, isWeb, SizableText, Tabs, Text, YStack } from 'tamagui'

const TabsData = [
  { label: 'Overview', value: 'overview' },
  { label: 'Species', value: 'species' },
  { label: 'Teams', value: 'teams' },
  { label: 'Settings', value: 'settings' },
  // { label: 'Profile', value: 'profile' },
  // { label: 'Appearance', value: 'appearance' },
  // { label: 'Notifications', value: 'notifications' },
  // { label: 'Integrations', value: 'integrations' },
]

export function PrimaryTabs() {
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
  return (
    <Tabs
      defaultValue="tab1"
      orientation="horizontal"
      flex={1}
      flexDirection="column"
      backgroundColor="$gray2">
      <Tabs.List
        padded
        padding="$2"
        radiused={false}
        flexDirection="row"
        overflow="scroll">
        {TabsData.map((t, k) => (
          <Tabs.Tab key={k} borderWidth={0} flexShrink={0} value={t.value}>
            <Text fontFamily="$body">{t.label}</Text>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {TabsData.map((t, k) => (
        <TabsContent flexGrow={1} value={t.value}>
          <H1>{t.label}</H1>
        </TabsContent>
      ))}
    </Tabs>
  )
}

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="$gray2"
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
