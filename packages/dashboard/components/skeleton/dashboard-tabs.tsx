import type { TabsContentProps } from 'tamagui'
import { useRouter } from 'solito/navigation'
import OverviewScreen from '../../pages/overview/screen'
import MembersScreen from '../../pages/teams/members/screen'
import SettingsIndexScreen from '../../pages/settings/screen'
import SiteScreen from '../../pages/sites/screen'
import SpeciesScreen from '../../pages/species/screen'

import React, { useState } from 'react'
import {
  isWeb,
  Tabs,
  Text,
  YStack,
  Stack,
  ScrollView,
  XStack,
  AnimatePresence,
} from 'tamagui'

// Improved type safety with TypeScript
interface TabItem {
  label: string
  value: string
  route?: string
  component: (() => React.ReactNode) | null
  icon?: React.ReactNode // Optional icon support
  badge?: number // Optional badge support
}

const TabsData: TabItem[] = [
  {
    label: 'Overview',
    value: 'overview',
    component: OverviewScreen,
  },
  {
    label: 'Teams',
    value: 'teams',
    component: MembersScreen,
  },
  {
    label: 'Sites',
    value: 'sites',
    component: SiteScreen,
  },
  {
    label: 'Species',
    value: 'species',
    component: SpeciesScreen,
  },
  {
    label: 'Settings',
    value: 'settings',
    component: SettingsIndexScreen,
  },
]

export function DashboardTabs() {
  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      {...(isWeb && {
        position: 'unset' as any,
      })}
    >
      <HorizontalTabs />
    </YStack>
  )
}

const HorizontalTabs = () => {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  return (
    <Tabs
      flex={1}
      flexDirection="column"
      orientation="horizontal"
      defaultValue={TabsData[0].value}
    >
      <Stack>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          <Tabs.List
            disablePassBorderRadius
            flexDirection="row"
            paddingHorizontal="$4"
            paddingBottom="$2"
            gap="$2"
          >
            {TabsData.map((tab, index) => (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                paddingVertical="$2.5"
                paddingHorizontal="$4"
                backgroundColor={index === activeIndex ? "#007A49" : "$backgroundTransparent"}
                borderRadius="$6"
                animation="quick"
                pressStyle={{
                  backgroundColor: '$gray4',
                  scale: 0.97,
                }}
                hoverStyle={{
                  backgroundColor: '$gray3',
                }}
                focusStyle={{
                  backgroundColor: '$gray3',
                  borderColor: '$blue8',
                  borderWidth: 2,
                }}
                onPress={() => {
                  setActiveIndex(index)
                  if (tab.route) router.push(tab.route)
                }}
              >
                <XStack gap="$2" alignItems="center">
                  {tab.icon && <XStack>{tab.icon}</XStack>}
                  <Text
                    fontFamily="$body"
                    fontSize="$3"
                    fontWeight={'400'}
                    textAlign="center"
                    color={index === activeIndex ? 'white' : '$gray11'}
                  >
                    {tab.label}
                  </Text>
                </XStack>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollView>
      </Stack>

      <AnimatePresence>
        {TabsData.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            animation="quick"
            enterStyle={{ opacity: 0, scale: 0.95 }}
            exitStyle={{ opacity: 0, scale: 0.95 }}
          >
            {tab.component && <tab.component />}
          </TabsContent>
        ))}
      </AnimatePresence>
    </Tabs>
  )
}

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="$gray1"
      padding="$4"
      flex={1}
      animation="quick"
      {...props}
    >
      {props.children}
    </Tabs.Content>
  )
}