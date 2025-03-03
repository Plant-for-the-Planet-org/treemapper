import React from 'react';
import { YStack, XStack } from 'tamagui'; // Import XStack for row layout
import { ContentSkeleton } from '../../components/skeleton/content';
import { DashboardTabs } from '../../components/skeleton/dashboard-tabs';
import { HeaderSkeleton } from '../../components/skeleton/header';
import ProjectDetails from '../../components/projects/projects';
import { ApiClient } from '../../../api/client';
import UserAvatar from '../../components/profile/ProfileAvatar';
import NotificationIcon from '../../components/overview/NotificationDashboard';

export default function DashboardIndexScreen() {
  ApiClient.initialize({
    baseUrl: 'http://192.168.1.3:3000', // Update this to your local IP
    headers: {
      'X-Custom-Header': 'value',
    },
  });

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop="$5" flexGrow={1}>
      <HeaderSkeleton headerText="Dashboard" />
      <NotificationIcon count={4} size={28} onPress={undefined} badgeStyle={undefined} icon={undefined} />
      <XStack
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        padding="$4"
      >
        <ProjectDetails />
        <UserAvatar />
      </XStack>
      <ContentSkeleton>
        <DashboardTabs />
      </ContentSkeleton>
    </YStack>
  );
}
