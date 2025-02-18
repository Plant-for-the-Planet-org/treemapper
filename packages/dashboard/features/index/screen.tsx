import React from 'react';
import { YStack, XStack } from 'tamagui'; // Import XStack for row layout
import { ContentSkeleton } from '../../components/skeleton/content';
import { DashboardTabs } from '../../components/skeleton/dashboard-tabs';
import { HeaderSkeleton } from '../../components/skeleton/header';
import ProjectDetails from '../../components/projects/projects';
import { ApiClient } from '../../../api/client';
import UserAvatar from '../../components/profile/ProfileAvatar';

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
      <ProjectDetails />
      <UserAvatar />
      <ContentSkeleton>
        <DashboardTabs />
      </ContentSkeleton>
    </YStack>
  );
}
