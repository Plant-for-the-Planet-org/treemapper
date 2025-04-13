import React from "react";
import { ScrollView, YStack } from "tamagui";
import CreateNewSiteButton from "../../components/sites/CreateSiteButton";
import SiteCardList from "../../components/sites/SiteCard";

export default function SettingsIndexScreen() {
  return (
    <YStack>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <SiteCardList />
      </ScrollView>
      <CreateNewSiteButton />
    </YStack>
  );
}
