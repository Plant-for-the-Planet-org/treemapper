import React from "react";
import { ScrollView, YStack } from "tamagui";

export function ContentSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <YStack flex={1}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {children}
      </ScrollView>
    </YStack>
  );
}
