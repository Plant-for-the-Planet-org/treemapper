import React from "react";
import { YStack } from "tamagui";
import CreateNewSiteButton from "../../components/sites/CreateSiteButton";
import SiteCardList from "../../components/sites/SiteCard";

export default function SettingsIndexScreen() {
  return (
    <YStack flex={1} width="100%" height="100%" paddingBottom="$9">
      {/* Site list */}
      <SiteCardList />

      {/* Floating Button */}
      <CreateNewSiteButton />
    </YStack>
  );
}
