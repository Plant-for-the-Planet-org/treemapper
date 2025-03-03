import React from "react";
import { ScrollView, YStack } from "tamagui";
import CreateNewSiteButton from "../../components/sites/CreateSiteButton";
import SiteCardList from "../../components/sites/SiteCard";
import SpeciesList from "../../components/species/SpeciesList";

export default function SpeciesScreen() {
  return (
    <YStack>
      <SpeciesList />
    </YStack>
  );
}
